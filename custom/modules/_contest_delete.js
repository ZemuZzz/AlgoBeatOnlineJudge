// 比赛删除路由(SYZOJ 原生没有提供此功能)
// 文件名以 _ 开头确保字母序较早加载
let Contest = syzoj.model('contest');
let ContestPlayer = syzoj.model('contest_player');
let ContestRanklist = syzoj.model('contest_ranklist');

// 权限:管理员 OR 比赛创建者(holder_id) OR 拥有 manage_problem 的用户
async function canDeleteContest(user, contest) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (contest.holder_id === user.id) return true;
  if (user.privileges && user.privileges.includes('manage_problem')) return true;
  return false;
}

app.post('/contest/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');

    let id = parseInt(req.params.id);
    let contest = await Contest.findById(id);
    if (!contest) throw new ErrorMessage('无此比赛。');

    if (!await canDeleteContest(res.locals.user, contest)) {
      throw new ErrorMessage('您没有权限删除此比赛。');
    }

    // 级联清理
    // 1. 删除该比赛的所有玩家记录
    try {
      await ContestPlayer.createQueryBuilder()
        .delete()
        .where('contest_id = :id', { id: id })
        .execute();
    } catch (e) {
      syzoj.log('[contest-delete] Failed to clean contest_player: ' + e.message);
    }

    // 2. 删除排行榜数据(如果有 ranklist_id)
    if (contest.ranklist_id) {
      try {
        let ranklist = await ContestRanklist.findById(contest.ranklist_id);
        if (ranklist) await ranklist.destroy();
      } catch (e) {
        syzoj.log('[contest-delete] Failed to delete ranklist: ' + e.message);
      }
    }

    // 3. 注意:rating_history 不清理(用户的历史 rating 变化记录保留)

    // 4. 删除比赛本身
    await contest.destroy();

    res.redirect(syzoj.utils.makeUrl(['contests']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
