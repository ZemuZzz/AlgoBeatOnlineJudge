let PrivateMessage = syzoj.model('private-message');
let UserMessageSetting = syzoj.model('user-message-setting');
let User = syzoj.model('user');

// ---------- 工具函数 ----------

// 检查能否给某用户发消息
async function canSendTo(sender, receiver) {
  if (!sender) return { ok: false, reason: '请登录后继续。' };
  if (!receiver) return { ok: false, reason: '收件人不存在。' };
  if (sender.id === receiver.id) return { ok: false, reason: '不能给自己发送站内信。' };

  // 检查发送方是否已验证邮箱(管理员豁免)
  if (!sender.is_admin) {
    if (!await syzoj.utils.isEmailVerified(sender.id)) {
      return { ok: false, reason: '请先验证邮箱后再发送站内信。' };
    }
  }

  // 管理员可以无视屏蔽设置
  if (sender.is_admin) return { ok: true };
  // 检查接收方屏蔽设置
  let setting = await UserMessageSetting.findOne({ where: { user_id: receiver.id } });
  if (setting && setting.disable_messages) {
    return { ok: false, reason: '该用户已关闭站内信。' };
  }
  return { ok: true };
}

// 给某用户(可能不存在)创建/更新设置记录
async function getOrCreateSetting(userId) {
  let s = await UserMessageSetting.findOne({ where: { user_id: userId } });
  if (!s) {
    s = await UserMessageSetting.create();
    s.user_id = userId;
    s.disable_messages = false;
  }
  return s;
}

// 当前未读数
async function countUnread(userId) {
  return await PrivateMessage.count({
    receiver_id: userId,
    is_read: false,
    receiver_deleted: false
  });
}

// ---------- 路由 ----------

// ============ 收件箱(按对话方分组) ============
app.get('/messages', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }
    let myId = res.locals.user.id;

    // 用 SQL 直接聚合"按对方分组"的最新消息+未读数
    // 使用 createQueryBuilder 的 raw query 能力
    // 思路:对每条消息计算 partner_id = (sender_id == myId ? receiver_id : sender_id),按 partner_id 分组取最新
    let qb = PrivateMessage.createQueryBuilder('m')
      .select('CASE WHEN m.sender_id = :myId THEN m.receiver_id ELSE m.sender_id END', 'partner_id')
      .addSelect('MAX(m.public_time)', 'last_time')
      .addSelect('SUM(CASE WHEN m.receiver_id = :myId AND m.is_read = 0 AND m.receiver_deleted = 0 THEN 1 ELSE 0 END)', 'unread')
      .where('(m.sender_id = :myId AND m.sender_deleted = 0) OR (m.receiver_id = :myId AND m.receiver_deleted = 0)', { myId: myId })
      .setParameter('myId', myId)
      .groupBy('partner_id')
      .orderBy('last_time', 'DESC');

    let raws = await qb.getRawMany();

    // 加载每个对话方的用户信息 + 最后一条消息内容
    let conversations = [];
    for (let r of raws) {
      let partnerId = parseInt(r.partner_id);
      if (!partnerId) continue;
      let partner = await User.findById(partnerId);
      if (!partner) continue;

      // 最后一条消息(可见的:发送者删除则发送方看不到,接收者删除则接收方看不到)
      let lastMsg = await PrivateMessage.findOne({
        where: [
          { sender_id: myId, receiver_id: partnerId, sender_deleted: false },
          { sender_id: partnerId, receiver_id: myId, receiver_deleted: false }
        ],
        order: { public_time: 'DESC' }
      });

      conversations.push({
        partner: partner,
        last_message: lastMsg,
        last_time: parseInt(r.last_time),
        unread: parseInt(r.unread) || 0
      });
    }
    res.render('messages_inbox', {
      conversations: conversations
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 与某用户的对话历史 ============
app.get('/messages/with/:uid', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }
    let myId = res.locals.user.id;
    let partnerId = parseInt(req.params.uid);
    if (!partnerId || partnerId === myId) {
      throw new ErrorMessage('无效的对话对象。');
    }

    let partner = await User.findById(partnerId);
    if (!partner) throw new ErrorMessage('对方用户不存在。');

    // 查询双方互发的所有消息
    let qb = PrivateMessage.createQueryBuilder('m')
      .where(
        '((m.sender_id = :myId AND m.receiver_id = :partnerId AND m.sender_deleted = 0)' +
        ' OR (m.sender_id = :partnerId AND m.receiver_id = :myId AND m.receiver_deleted = 0))',
        { myId: myId, partnerId: partnerId }
      )
      .orderBy('m.public_time', 'ASC');

    let messages = await qb.getMany();

    // 给前端用的简化字段
    for (let m of messages) {
      m.is_self = (m.sender_id === myId);
      m.contentRendered = await syzoj.utils.markdown(m.content || '');
    }

    // 把所有未读消息标记为已读
    let unreadIds = messages.filter(m => !m.is_self && !m.is_read).map(m => m.id);
    if (unreadIds.length > 0) {
      await PrivateMessage.createQueryBuilder()
        .update()
        .set({ is_read: true })
        .where('id IN (:...ids)', { ids: unreadIds })
        .execute();
    }
    // 检查能否回复(对方是否屏蔽)
    let canReply = await canSendTo(res.locals.user, partner);

    res.render('messages_conversation', {
      partner: partner,
      messages: messages,
      canReply: canReply.ok,
      cannotReplyReason: canReply.ok ? null : canReply.reason
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 发送消息给某用户 ============
app.post('/messages/with/:uid/send', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。');
    }
    let myId = res.locals.user.id;
    let partnerId = parseInt(req.params.uid);
    let partner = await User.findById(partnerId);

    let check = await canSendTo(res.locals.user, partner);
    if (!check.ok) throw new ErrorMessage(check.reason);

    let content = (req.body.content || '').trim();
    if (!content) throw new ErrorMessage('消息内容不能为空。');
    if (content.length > 5000) throw new ErrorMessage('消息内容过长(最多 5000 字)。');

    let msg = await PrivateMessage.create({
      sender_id: myId,
      receiver_id: partnerId,
      content: content,
      public_time: parseInt((new Date()).getTime() / 1000),
      is_read: false,
      sender_deleted: false,
      receiver_deleted: false
    });
    await msg.save();

    res.redirect(syzoj.utils.makeUrl(['messages', 'with', partnerId]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 发起新对话页 ============
app.get('/messages/new', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }

    // 支持 ?to=xxx 预填收件人(uid 或 username)
    let prefill = (req.query.to || '').trim();

    res.render('messages_new', {
      prefill: prefill
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// 处理"发起新对话"表单提交:解析收件人 -> 重定向到 send 路由
app.post('/messages/new', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');

    let to = (req.body.to || '').trim();
    if (!to) throw new ErrorMessage('请填写收件人。');

    // 先尝试按 uid 查
    let receiver = null;
    if (/^\d+$/.test(to)) {
      receiver = await User.findById(parseInt(to));
    }
    if (!receiver) {
      receiver = await User.findOne({ where: { username: to } });
    }
    if (!receiver) throw new ErrorMessage('找不到该用户。请检查 UID 或用户名是否正确。');

    let check = await canSendTo(res.locals.user, receiver);
    if (!check.ok) throw new ErrorMessage(check.reason);

    let content = (req.body.content || '').trim();
    if (!content) throw new ErrorMessage('消息内容不能为空。');
    if (content.length > 5000) throw new ErrorMessage('消息内容过长(最多 5000 字)。');

    let msg = await PrivateMessage.create({
      sender_id: res.locals.user.id,
      receiver_id: receiver.id,
      content: content,
      public_time: parseInt((new Date()).getTime() / 1000),
      is_read: false,
      sender_deleted: false,
      receiver_deleted: false
    });
    await msg.save();

    res.redirect(syzoj.utils.makeUrl(['messages', 'with', receiver.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 用户搜索 API(给前端 autocomplete 用) ============
app.get('/api/search-user', async (req, res) => {
  try {
    if (!res.locals.user) return res.json({ results: [] });
    let q = (req.query.q || '').trim();
    if (!q) return res.json({ results: [] });

    let users = [];
    // 按 uid 精确
    if (/^\d+$/.test(q)) {
      let u = await User.findById(parseInt(q));
      if (u && u.id !== res.locals.user.id) users.push(u);
    }
    // 按 username 模糊查询(取前 10 条)
    let qb = User.createQueryBuilder()
      .where('username LIKE :name', { name: `%${q}%` })
      .andWhere('id != :myId', { myId: res.locals.user.id })
      .limit(10);
    let byName = await qb.getMany();
    for (let u of byName) {
      if (!users.find(x => x.id === u.id)) users.push(u);
    }

    res.json({
      results: users.slice(0, 10).map(u => ({
        id: u.id,
        username: u.username
      }))
    });
  } catch (e) {
    syzoj.log(e);
    res.json({ results: [] });
  }
});

// ============ 删除单条消息(软删) ============
app.post('/messages/:mid/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    let myId = res.locals.user.id;
    let mid = parseInt(req.params.mid);
    let msg = await PrivateMessage.findById(mid);
    if (!msg) throw new ErrorMessage('无此消息。');

    if (msg.sender_id === myId) {
      msg.sender_deleted = true;
    } else if (msg.receiver_id === myId) {
      msg.receiver_deleted = true;
    } else {
      throw new ErrorMessage('您没有权限删除此消息。');
    }

    // 双方都删了就真删
    if (msg.sender_deleted && msg.receiver_deleted) {
      await msg.destroy();
    } else {
      await msg.save();
    }

    let partnerId = (msg.sender_id === myId) ? msg.receiver_id : msg.sender_id;
    res.redirect(syzoj.utils.makeUrl(['messages', 'with', partnerId]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 删除整个对话历史(对自己软删) ============
app.post('/messages/with/:uid/delete-all', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    let myId = res.locals.user.id;
    let partnerId = parseInt(req.params.uid);

    // 我发出的:sender_deleted = true
    await PrivateMessage.createQueryBuilder()
      .update()
      .set({ sender_deleted: true })
      .where('sender_id = :myId AND receiver_id = :partnerId', { myId, partnerId })
      .execute();

    // 我收到的:receiver_deleted = true
    await PrivateMessage.createQueryBuilder()
      .update()
      .set({ receiver_deleted: true })
      .where('sender_id = :partnerId AND receiver_id = :myId', { myId, partnerId })
      .execute();

    res.redirect(syzoj.utils.makeUrl(['messages']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 标记某对话所有消息为已读 ============
app.post('/messages/with/:uid/mark-read', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    let myId = res.locals.user.id;
    let partnerId = parseInt(req.params.uid);

    await PrivateMessage.createQueryBuilder()
      .update()
      .set({ is_read: true })
      .where('sender_id = :partnerId AND receiver_id = :myId AND is_read = 0',
             { partnerId, myId })
      .execute();

    res.redirect(syzoj.utils.makeUrl(['messages', 'with', partnerId]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ API:未读数 ============
app.get('/api/messages/unread-count', async (req, res) => {
  try {
    if (!res.locals.user) return res.json({ count: 0 });
    let n = await countUnread(res.locals.user.id);
    res.set('Cache-Control', 'no-store');
    res.json({ count: n });
  } catch (e) {
    syzoj.log(e);
    res.json({ count: 0 });
  }
});

// ============ 设置页 GET ============
app.get('/messages/settings', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }
    let s = await getOrCreateSetting(res.locals.user.id);
    res.render('messages_settings', {
      setting: s
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 设置页 POST ============
app.post('/messages/settings', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');
    let s = await getOrCreateSetting(res.locals.user.id);
    s.disable_messages = req.body.disable_messages === 'on' || req.body.disable_messages === 'true';
    s.update_time = parseInt((new Date()).getTime() / 1000);
    await s.save();
    res.redirect(syzoj.utils.makeUrl(['messages', 'settings']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
