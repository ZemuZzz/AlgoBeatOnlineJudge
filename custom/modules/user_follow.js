let UserFollow = syzoj.model('user-follow');
let User = syzoj.model('user');

// ============ 通用工具:获取关系状态 ============
async function getFollowRelation(viewerId, targetId) {
  if (!viewerId || viewerId === targetId) {
    return { iFollow: false, theyFollow: false, mutual: false };
  }
  let conn = require('typeorm').getConnection();
  let rows = await conn.query(
    `SELECT follower_id, followee_id FROM user_follow
     WHERE (follower_id = ? AND followee_id = ?)
        OR (follower_id = ? AND followee_id = ?)`,
    [viewerId, targetId, targetId, viewerId]
  );
  let iFollow = false, theyFollow = false;
  for (let r of rows) {
    if (r.follower_id === viewerId && r.followee_id === targetId) iFollow = true;
    if (r.follower_id === targetId && r.followee_id === viewerId) theyFollow = true;
  }
  return { iFollow, theyFollow, mutual: iFollow && theyFollow };
}

syzoj.utils.getFollowRelation = getFollowRelation;

// ============ 通用工具:计数 ============
async function countFollowing(userId) {
  return await UserFollow.count({ follower_id: userId });
}
async function countFollowers(userId) {
  return await UserFollow.count({ followee_id: userId });
}
syzoj.utils.countFollowing = countFollowing;
syzoj.utils.countFollowers = countFollowers;

// ============ POST /user/:id/follow:关注 ============
app.post('/user/:id/follow', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let targetId = parseInt(req.params.id);
    if (!targetId) throw new ErrorMessage('参数错误。');
    if (targetId === res.locals.user.id) throw new ErrorMessage('不能关注自己。');

    let target = await User.findById(targetId);
    if (!target) throw new ErrorMessage('用户不存在。');

    let existing = await UserFollow.findOne({
      where: { follower_id: res.locals.user.id, followee_id: targetId }
    });
    if (existing) {
      // 已关注 → 不重复创建,直接跳转
      return res.redirect(req.body.return_url || syzoj.utils.makeUrl(['user', targetId]));
    }

    let f = await UserFollow.create();
    f.follower_id = res.locals.user.id;
    f.followee_id = targetId;
    f.created_at = parseInt((new Date()).getTime() / 1000);
    await f.save();

    res.redirect(req.body.return_url || syzoj.utils.makeUrl(['user', targetId]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ POST /user/:id/unfollow:取关 ============
app.post('/user/:id/unfollow', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let targetId = parseInt(req.params.id);
    if (!targetId) throw new ErrorMessage('参数错误。');

    let existing = await UserFollow.findOne({
      where: { follower_id: res.locals.user.id, followee_id: targetId }
    });
    if (existing) {
      await existing.destroy();
    }

    res.redirect(req.body.return_url || syzoj.utils.makeUrl(['user', targetId]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ GET /user/:id/following:某用户关注的人列表 ============
app.get('/user/:id/following', async (req, res) => {
  try {
    let uid = parseInt(req.params.id);
    let target = await User.findById(uid);
    if (!target) throw new ErrorMessage('用户不存在。');

    let pageSize = 30;
    let total = await UserFollow.count({ follower_id: uid });
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let rows = await UserFollow.queryPage(paginate, { follower_id: uid }, { created_at: 'DESC' });
    let users = [];
    for (let r of rows) {
      let u = await User.findById(r.followee_id);
      if (u) {
        u.followedAt = r.created_at;
        users.push(u);
      }
    }
    res.render('user_following', {
      show_user: target,
      users: users,
      total: total,
      paginate: paginate,
      listType: 'following'
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ GET /user/:id/followers:某用户的粉丝列表 ============
app.get('/user/:id/followers', async (req, res) => {
  try {
    let uid = parseInt(req.params.id);
    let target = await User.findById(uid);
    if (!target) throw new ErrorMessage('用户不存在。');

    let pageSize = 30;
    let total = await UserFollow.count({ followee_id: uid });
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let rows = await UserFollow.queryPage(paginate, { followee_id: uid }, { created_at: 'DESC' });
    let users = [];
    for (let r of rows) {
      let u = await User.findById(r.follower_id);
      if (u) {
        u.followedAt = r.created_at;
        users.push(u);
      }
    }
    res.render('user_following', {
      show_user: target,
      users: users,
      total: total,
      paginate: paginate,
      listType: 'followers'
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

