// 给每个请求注入用户辅助信息到模板:
// 1. user.privileges - 权限数组
// 2. res.locals.pendingSolutionsCount - 待审核题解数(仅审核者)
// 3. res.locals.unreadMessagesCount - 未读站内信数
// 4. user.is_email_verified - 邮箱是否已验证
let UserPrivilege = syzoj.model('user_privilege');
let ProblemSolution = syzoj.model('problem-solution');
let PrivateMessage = syzoj.model('private-message');
let UserEmailStatus = syzoj.model('user-email-status');

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

  try {
    res.locals.unreadMessagesCount = 0;
    if (res.locals.user) {
      res.locals.unreadMessagesCount = await PrivateMessage.count({
        receiver_id: res.locals.user.id,
        is_read: false,
        receiver_deleted: false
      });
    }
  } catch (e) {
    res.locals.unreadMessagesCount = 0;
  }

  try {
    if (res.locals.user) {
      let status = await UserEmailStatus.findOne({ where: { user_id: res.locals.user.id } });
      res.locals.user.is_email_verified = !!(status && status.is_email_verified);
    }
  } catch (e) {
    if (res.locals.user) res.locals.user.is_email_verified = false;
  }

  next();
});