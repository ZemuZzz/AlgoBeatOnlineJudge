// 提交记录的管理员动作:取消评测 / 判定作弊
// 文件名以 _ 开头,确保字母序较早加载
let JudgeState = syzoj.model('judge_state');
let JudgeStateAdminAction = syzoj.model('judge-state-admin-action');
let User = syzoj.model('user');

// 全局缓存:被标记过的 judge_id 集合(给 Vue 组件用)
syzoj.cheatedJudgeIds = new Set();
syzoj.cancelledJudgeIds = new Set();

async function refreshAdminActionCache() {
  try {
    let rows = await JudgeStateAdminAction.find({});
    let cheated = new Set();
    let cancelled = new Set();
    for (let r of rows) {
      if (r.action_type === 'cheated') cheated.add(r.judge_id);
      else if (r.action_type === 'cancelled') cancelled.add(r.judge_id);
    }
    syzoj.cheatedJudgeIds = cheated;
    syzoj.cancelledJudgeIds = cancelled;
  } catch (e) {
    syzoj.log('[judge-admin-action] cache refresh failed: ' + e.message);
  }
}
// 启动延后加载,然后每分钟刷新
setTimeout(refreshAdminActionCache, 30 * 1000);
setInterval(refreshAdminActionCache, 60 * 1000);

// 权限检查
function canManageJudgeAction(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (user.privileges && user.privileges.includes('manage_problem')) return true;
  return false;
}

// 该用户对该题是否还有"未被标记的 AC 提交"
async function hasOtherValidAcceptedSubmission(userId, problemId, excludeJudgeId) {
  // 找该用户对该题的所有 AC 提交,排除当前要标记的这一条,排除已经被标记的
  let qb = JudgeState.createQueryBuilder('js')
    .leftJoin('judge_state_admin_action', 'a', 'a.judge_id = js.id')
    .where('js.user_id = :uid', { uid: userId })
    .andWhere('js.problem_id = :pid', { pid: problemId })
    .andWhere('js.status = :st', { st: 'Accepted' })
    .andWhere('js.id <> :ex', { ex: excludeJudgeId })
    .andWhere('a.judge_id IS NULL'); // 没被标记
  let cnt = await qb.getCount();
  return cnt > 0;
}

// ============ 判定作弊 / 取消评测 ============
app.post('/submission/:id/admin-action', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    if (!canManageJudgeAction(res.locals.user)) {
      throw new ErrorMessage('您没有权限进行此操作。');
    }

    let id = parseInt(req.params.id);
    let actionType = (req.body.action_type || '').trim();
    let reason = (req.body.reason || '').trim();

    if (!['cancelled', 'cheated'].includes(actionType)) {
      throw new ErrorMessage('无效的操作类型。');
    }

    let judge = await JudgeState.findById(id);
    if (!judge) throw new ErrorMessage('无此提交记录。');

    // 检查是否已经被标记过
    let existing = await JudgeStateAdminAction.findOne({ where: { judge_id: id } });
    if (existing) {
      throw new ErrorMessage('该提交已被标记为「' + (existing.action_type === 'cancelled' ? '取消评测' : '作弊') + '」。请先撤销当前标记。');
    }

    let now = parseInt((new Date()).getTime() / 1000);
    let wasAccepted = (judge.status === 'Accepted');

    // 写入 admin_action 表
    let action = await JudgeStateAdminAction.create();
    action.judge_id = id;
    action.action_type = actionType;
    action.operator_id = res.locals.user.id;
    action.operator_time = now;
    action.reason = reason || null;
    action.was_accepted = wasAccepted;
    action.affected_problem_id = judge.problem_id;
    action.affected_user_id = judge.user_id;
    await action.save();

    // 同步调整 ac_num:仅当原本是 AC 且该用户对该题没有其他有效 AC 时
    if (wasAccepted) {
      let hasOther = await hasOtherValidAcceptedSubmission(judge.user_id, judge.problem_id, id);
      if (!hasOther) {
        let user = await User.findById(judge.user_id);
        if (user && user.ac_num > 0) {
          user.ac_num = user.ac_num - 1;
          await user.save();
        }
      }
    }

    // 立刻刷新缓存
    await refreshAdminActionCache();

    res.redirect(syzoj.utils.makeUrl(['submission', id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 撤销标记 ============
app.post('/submission/:id/admin-action/revoke', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    if (!canManageJudgeAction(res.locals.user)) {
      throw new ErrorMessage('您没有权限进行此操作。');
    }

    let id = parseInt(req.params.id);
    let action = await JudgeStateAdminAction.findOne({ where: { judge_id: id } });
    if (!action) throw new ErrorMessage('该提交并未被标记。');

    let judge = await JudgeState.findById(id);
    if (!judge) throw new ErrorMessage('无此提交记录。');

    // 如果当初是 AC 提交且因标记减过 ac_num,现在恢复
    if (action.was_accepted && action.affected_user_id && action.affected_problem_id) {
      // 检查恢复后该用户对该题是否会有 AC(就是"撤销当前标记"以外没有其他 AC,且当前提交还是 AC 状态)
      let hasOther = await hasOtherValidAcceptedSubmission(action.affected_user_id, action.affected_problem_id, id);
      if (!hasOther && judge.status === 'Accepted') {
        let user = await User.findById(action.affected_user_id);
        if (user) {
          user.ac_num = (user.ac_num || 0) + 1;
          await user.save();
        }
      }
    }

    await action.destroy();
    await refreshAdminActionCache();

    res.redirect(syzoj.utils.makeUrl(['submission', id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// 暴露给其他模块用的工具:批量查询某些 judge_id 是否被标记
syzoj.utils.getJudgeAdminActions = async function(judgeIds) {
  if (!judgeIds || judgeIds.length === 0) return {};
  let rows = await JudgeStateAdminAction.createQueryBuilder()
    .where('judge_id IN (:...ids)', { ids: judgeIds })
    .getMany();
  let map = {};
  for (let r of rows) {
    map[r.judge_id] = {
      action_type: r.action_type,
      operator_id: r.operator_id,
      operator_time: r.operator_time,
      reason: r.reason
    };
  }
  return map;
};
