// [v1.7.0] 给 /user/:id* 路由注入 follow 关系到 res.locals
// 利用 module 加载顺序:文件名以 _ 开头优先加载,因此 middleware 在 SYZOJ 自带路由之前注册

app.use(async (req, res, next) => {
  try {
    let m = req.path.match(/^\/user\/(\d+)(\/.*)?$/);
    if (m) {
      let targetId = parseInt(m[1]);
      if (targetId && syzoj.utils.countFollowing && syzoj.utils.countFollowers) {
        res.locals.followStats = {
          following: await syzoj.utils.countFollowing(targetId),
          followers: await syzoj.utils.countFollowers(targetId)
        };
        if (res.locals.user && syzoj.utils.getFollowRelation) {
          res.locals.followRelation = await syzoj.utils.getFollowRelation(res.locals.user.id, targetId);
        } else {
          res.locals.followRelation = { iFollow: false, theyFollow: false, mutual: false };
        }
      }
    }
  } catch (e) {
    syzoj.log('[user-follow-loader] ' + e.message);
  }
  next();
});

