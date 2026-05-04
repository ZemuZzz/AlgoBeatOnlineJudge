// 给每个请求注入 user.privileges 数组，让 EJS 模板能同步判断权限
// 必须在所有路由之前注册,所以文件名以 _ 开头确保字母排序最前
let UserPrivilege = syzoj.model('user_privilege');

app.use(async (req, res, next) => {
  try {
    if (res.locals.user && !res.locals.user.privileges) {
      // 查询该用户的所有权限
      let records = await UserPrivilege.find({ where: { user_id: res.locals.user.id } });
      res.locals.user.privileges = records.map(r => r.privilege);
    }
  } catch (e) {
    // 出错了不影响主流程,只是模板里会读到空数组
    if (res.locals.user) res.locals.user.privileges = [];
  }
  next();
});
