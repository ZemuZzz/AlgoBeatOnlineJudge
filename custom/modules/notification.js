let Notification = syzoj.model('notification');
let User = syzoj.model('user');

// ============ 通用 API:创建通知 ============
// 暴露给所有触发点(题解审核 / 工单 / @ 提及 / 评论回复等)统一调用
async function createNotification(opts) {
  try {
    // 校验
    if (!opts.recipientId || !opts.type || !opts.title) {
      syzoj.log('[notification] createNotification: missing required fields');
      return null;
    }
    // 不给自己发通知(actor === recipient 时跳过)
    if (opts.actorId && opts.actorId === opts.recipientId) {
      return null;
    }
    let n = await Notification.create({
      recipient_id: opts.recipientId,
      type: opts.type,
      title: opts.title.substring(0, 255),
      content: opts.content || null,
      source_url: opts.sourceUrl ? opts.sourceUrl.substring(0, 500) : null,
      source_id: opts.sourceId || null,
      actor_id: opts.actorId || null,
      is_read: 0,
      created_at: parseInt((new Date()).getTime() / 1000)
    });
    await n.save();
    return n;
  } catch (e) {
    syzoj.log('[notification] create failed: ' + e.message);
    return null;
  }
}

syzoj.utils.createNotification = createNotification;

// ============ 通用 API:统计未读数 ============
async function countUnread(userId) {
  if (!userId) return 0;
  try {
    let conn = require('typeorm').getConnection();
    let rows = await conn.query(
      'SELECT COUNT(*) AS cnt FROM notification WHERE recipient_id = ? AND is_read = 0',
      [userId]
    );
    return parseInt(rows[0].cnt) || 0;
  } catch (e) {
    syzoj.log('[notification] countUnread failed: ' + e.message);
    return 0;
  }
}

syzoj.utils.countUnreadNotifications = countUnread;

// ============ 列表页 GET /notifications ============
app.get('/notifications', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请先登录。', { '登录': syzoj.utils.makeUrl(['login']) });
    }
    let userId = res.locals.user.id;
    let filter = req.query.filter || 'all'; // all / unread
    let where = (filter === 'unread')
      ? { recipient_id: userId, is_read: 0 }
      : { recipient_id: userId };

    let pageSize = 20;
    let total = await Notification.count(where);
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let notifications = await Notification.queryPage(paginate, where, {
      created_at: 'DESC'
    });
    // 加载发起者信息
    for (let n of notifications) {
      if (n.actor_id) {
        n.actor = await User.findById(n.actor_id);
      }
    }
    let unreadCount = await countUnread(userId);

    res.render('notifications', {
      notifications: notifications,
      paginate: paginate,
      filter: filter,
      unreadCount: unreadCount,
      totalCount: total
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ POST /notification/:id/read 标记单条已读 ============
app.post('/notification/:id/read', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let id = parseInt(req.params.id);
    let n = await Notification.findById(id);
    if (!n) throw new ErrorMessage('通知不存在。');
    if (n.recipient_id !== res.locals.user.id) {
      throw new ErrorMessage('您没有权限操作此通知。');
    }
    if (!n.is_read) {
      n.is_read = 1;
      n.read_at = parseInt((new Date()).getTime() / 1000);
      await n.save();
    }
    // 直接跳转到 source_url(如果有),否则回 /notifications
    res.redirect(n.source_url || syzoj.utils.makeUrl(['notifications']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ POST /notifications/read-all 全部已读 ============
app.post('/notifications/read-all', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let conn = require('typeorm').getConnection();
    let now = parseInt((new Date()).getTime() / 1000);
    await conn.query(
      'UPDATE notification SET is_read = 1, read_at = ? WHERE recipient_id = ? AND is_read = 0',
      [now, res.locals.user.id]
    );
    res.render('success', {
      title: '操作成功',
      message: '已将所有通知标记为已读',
      details: null,
      nextUrls: {
        '返回通知中心': syzoj.utils.makeUrl(['notifications'])
      }
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ POST /notification/:id/delete 删除单条 ============
app.post('/notification/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let id = parseInt(req.params.id);
    let n = await Notification.findById(id);
    if (!n) throw new ErrorMessage('通知不存在。');
    if (n.recipient_id !== res.locals.user.id) {
      throw new ErrorMessage('您没有权限操作此通知。');
    }
    await n.destroy();
    res.redirect(syzoj.utils.makeUrl(['notifications']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

