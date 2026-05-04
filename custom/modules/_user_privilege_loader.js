// 给每个请求注入用户辅助信息到模板:
// 1. user.privileges - 权限数组(让 EJS 同步判断权限)
// 2. res.locals.pendingSolutionsCount - 待审核题解数(仅审核者)
//
// 文件名以 _ 开头确保字母排序最前,在所有路由之前注册
let UserPrivilege = syzoj.model('user_privilege');
let ProblemSolution = syzoj.model('problem-solution');

app.use(async (req, res, next) => {
  try {
    if (res.locals.user && !res.locals.user.privileges) {
      let records = await UserPrivilege.find({ where: { user_id: res.locals.user.id } });
      res.locals.user.privileges = records.map(r => r.privilege);
    }
  } catch (e) {
    if (res.locals.user) res.locals.user.privileges = [];
  }

  try {
    res.locals.pendingSolutionsCount = 0;
    let user = res.locals.user;
    if (user) {
      let canReview = user.is_admin || (user.privileges && user.privileges.includes('manage_problem'));
      if (canReview) {
        res.locals.pendingSolutionsCount = await ProblemSolution.count({ status: 'pending' });
      }
    }
  } catch (e) {
    res.locals.pendingSolutionsCount = 0;
  }

  next();
});
