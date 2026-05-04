let ClipboardItem = syzoj.model('clipboard-item');
let User = syzoj.model('user');

const MAX_CONTENT_BYTES = 100 * 1024; // 100KB

// 生成 32 位随机 token(用 crypto 模块,无需新装包)
function genShareToken() {
  let crypto = require('crypto');
  return crypto.randomBytes(20).toString('hex');
}

// ============ 我的剪贴板列表 ============
app.get('/clipboard', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }
    let myId = res.locals.user.id;

    let pageSize = 20;
    let where = { user_id: myId };
    let total = await ClipboardItem.count(where);
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let items = await ClipboardItem.queryPage(paginate, where, {
      update_time: 'DESC'
    });

    res.render('clipboard_list', {
      items: items,
      paginate: paginate,
      total: total,
      isOwn: true,
      pageOwner: res.locals.user
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 看某用户的公开剪贴板 ============
app.get('/clipboard/user/:uid', async (req, res) => {
  try {
    let uid = parseInt(req.params.uid);
    let owner = await User.findById(uid);
    if (!owner) throw new ErrorMessage('用户不存在。');

    let isOwn = res.locals.user && res.locals.user.id === uid;

    let where;
    if (isOwn) {
      where = { user_id: uid };
    } else {
      where = { user_id: uid, visibility: 'public' };
    }

    let pageSize = 20;
    let total = await ClipboardItem.count(where);
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let items = await ClipboardItem.queryPage(paginate, where, {
      update_time: 'DESC'
    });

    res.render('clipboard_list', {
      items: items,
      paginate: paginate,
      total: total,
      isOwn: isOwn,
      pageOwner: owner
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 看某条剪贴板 ============
app.get('/clipboard/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let item = await ClipboardItem.findById(id);
    if (!item) throw new ErrorMessage('该剪贴板不存在。');

    let isOwn = res.locals.user && res.locals.user.id === item.user_id;

    if (!isOwn) {
      // 非作者本人:仅 public 可见
      if (item.visibility !== 'public') {
        throw new ErrorMessage('您没有权限查看此剪贴板。');
      }
    }

    let owner = await User.findById(item.user_id);
    item.contentRendered = await syzoj.utils.markdown(item.content || '');

    // 给前端用的分享 URL(只在作者本人页面显示)
    let shareUrl = null;
    if (isOwn && item.visibility === 'link' && item.share_token) {
      shareUrl = syzoj.utils.makeUrl(['clipboard', 'share', item.share_token]);
    }

    res.render('clipboard_view', {
      item: item,
      owner: owner,
      isOwn: isOwn,
      shareUrl: shareUrl
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 通过分享 token 访问 ============
app.get('/clipboard/share/:token', async (req, res) => {
  try {
    let token = String(req.params.token || '').trim();
    if (!token) throw new ErrorMessage('分享链接无效。');

    let item = await ClipboardItem.findOne({ where: { share_token: token } });
    if (!item) throw new ErrorMessage('分享链接无效或已被作者撤销。');

    if (!item.isShareLinkValid()) {
      throw new ErrorMessage('此分享链接已过期或已被撤销。');
    }

    let owner = await User.findById(item.user_id);
    item.contentRendered = await syzoj.utils.markdown(item.content || '');

    res.render('clipboard_view', {
      item: item,
      owner: owner,
      isOwn: false,
      shareUrl: null,
      viaShareLink: true
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 编辑/新建 GET ============
app.get('/clipboard/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
    }

    let id = parseInt(req.params.id);
    let item;
    if (id === 0) {
      item = await ClipboardItem.create();
      item.id = 0;
      item.user_id = res.locals.user.id;
      item.title = '';
      item.content = '';
      item.visibility = 'private';
      item.share_expires = null;
    } else {
      item = await ClipboardItem.findById(id);
      if (!item) throw new ErrorMessage('剪贴板不存在。');
      if (!item.isOwnedBy(res.locals.user)) {
        throw new ErrorMessage('您没有权限编辑此剪贴板。');
      }
    }

    res.render('clipboard_edit', { item: item });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 编辑/新建 POST ============
app.post('/clipboard/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');

    let id = parseInt(req.params.id);
    let item;
    if (id === 0) {
      item = await ClipboardItem.create();
      item.user_id = res.locals.user.id;
      item.public_time = parseInt((new Date()).getTime() / 1000);
    } else {
      item = await ClipboardItem.findById(id);
      if (!item) throw new ErrorMessage('剪贴板不存在。');
      if (!item.isOwnedBy(res.locals.user)) {
        throw new ErrorMessage('您没有权限编辑此剪贴板。');
      }
    }

    let title = (req.body.title || '').trim();
    let content = req.body.content || '';
    let visibility = req.body.visibility || 'private';

    if (!['private', 'public', 'link'].includes(visibility)) visibility = 'private';
    if (!title) throw new ErrorMessage('标题不能为空。');
    if (title.length > 120) throw new ErrorMessage('标题过长(最多 120 字)。');

    let bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > MAX_CONTENT_BYTES) {
      throw new ErrorMessage('内容过大(' + (bytes / 1024).toFixed(1) + ' KB),单条上限为 100 KB。');
    }

    item.title = title;
    item.content = content;
    item.visibility = visibility;
    item.update_time = parseInt((new Date()).getTime() / 1000);

    // 处理"分享链接"模式
    if (visibility === 'link') {
      // 没有 token 就生成一个
      if (!item.share_token) item.share_token = genShareToken();

      // 处理过期时间(从前端传 days 数字,0 或留空表示永不过期)
      let days = parseInt(req.body.share_days || '0');
      if (days < 0) days = 0;
      if (days > 0) {
        item.share_expires = parseInt((new Date()).getTime() / 1000) + days * 24 * 3600;
      } else {
        item.share_expires = null;
      }
    } else {
      // 切换到 private 或 public,清掉 share token
      item.share_token = null;
      item.share_expires = null;
    }

    await item.save();

    res.redirect(syzoj.utils.makeUrl(['clipboard', item.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 重新生成分享链接 ============
app.post('/clipboard/:id/regenerate-link', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');

    let id = parseInt(req.params.id);
    let item = await ClipboardItem.findById(id);
    if (!item) throw new ErrorMessage('剪贴板不存在。');
    if (!item.isOwnedBy(res.locals.user)) {
      throw new ErrorMessage('您没有权限。');
    }
    if (item.visibility !== 'link') {
      throw new ErrorMessage('当前剪贴板不是分享链接模式。');
    }

    item.share_token = genShareToken();
    item.update_time = parseInt((new Date()).getTime() / 1000);
    await item.save();

    res.redirect(syzoj.utils.makeUrl(['clipboard', item.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 删除 ============
app.post('/clipboard/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。');

    let id = parseInt(req.params.id);
    let item = await ClipboardItem.findById(id);
    if (!item) throw new ErrorMessage('剪贴板不存在。');
    if (!item.isOwnedBy(res.locals.user)) {
      throw new ErrorMessage('您没有权限。');
    }

    await item.destroy();

    res.redirect(syzoj.utils.makeUrl(['clipboard']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
