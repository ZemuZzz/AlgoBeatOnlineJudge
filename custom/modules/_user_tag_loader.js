// 在 /user/:id/edit 路由前预加载 tag 状态到 res.locals(模板内不能 await)
let UserTag = syzoj.model('user-tag');

app.use('/user/:id/edit', async (req, res, next) => {
  try {
    if (req.method !== 'GET') return next();
    if (!res.locals.user) return next();

    let editedId = parseInt(req.params.id);
    if (!editedId || isNaN(editedId)) return next();

    // 仅本人才查 tag 状态(管理员代编辑别人时不显示这个段,避免越权)
    if (editedId !== res.locals.user.id) {
      res.locals.myTagState = null;
      res.locals.myTagIsCheater = false;
      return next();
    }

    let state = await syzoj.utils.getUserTagState(res.locals.user);
    let isCheater = !!(syzoj.cheaterUserIds &&
                       syzoj.cheaterUserIds.has(res.locals.user.id) &&
                       !res.locals.user.is_admin);

    res.locals.myTagState = state;
    res.locals.myTagIsCheater = isCheater;
    next();
  } catch (e) {
    syzoj.log('[user-tag-loader] error: ' + e.message);
    res.locals.myTagState = null;
    res.locals.myTagIsCheater = false;
    next();
  }
});
