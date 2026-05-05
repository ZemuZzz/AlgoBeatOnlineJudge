// 在 /submission/:id 路由之前拦截,预加载 admin action 数据到 res.locals
// 文件名以 _ 开头确保在 SYZOJ 自带 submission.js 之前注册中间件
let JudgeStateAdminAction = syzoj.model('judge-state-admin-action');
let User = syzoj.model('user');

app.use('/submission/:id', async (req, res, next) => {
  try {
    let id = parseInt(req.params.id);
    if (!id || isNaN(id)) return next();

    // 仅对 GET 请求做数据预加载(POST 是我们自己的 admin-action 路由不需要)
    if (req.method !== 'GET') return next();

    // 检查全局缓存,如果该 id 没被标记直接放过
    let cached = false;
    if (syzoj.cheatedJudgeIds && syzoj.cheatedJudgeIds.has(id)) cached = true;
    if (syzoj.cancelledJudgeIds && syzoj.cancelledJudgeIds.has(id)) cached = true;
    if (!cached) {
      res.locals.judgeAdminAction = null;
      return next();
    }

    // 被标记了,查详细信息
    let action = await JudgeStateAdminAction.findOne({ where: { judge_id: id } });
    if (!action) {
      res.locals.judgeAdminAction = null;
      return next();
    }

    let operator = await User.findById(action.operator_id);
    res.locals.judgeAdminAction = {
      action_type: action.action_type,
      operator_username: operator ? operator.username : '未知',
      operator_id: action.operator_id,
      operator_time: action.operator_time,
      reason: action.reason
    };
    next();
  } catch (e) {
    syzoj.log('[judge-admin-action-loader] error: ' + e.message);
    res.locals.judgeAdminAction = null;
    next();
  }
});
