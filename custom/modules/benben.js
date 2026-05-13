let BenbenPost = syzoj.model('benben-post');
let BenbenImage = syzoj.model('benben-image');
let UserFollow = syzoj.model('user-follow');
let User = syzoj.model('user');
let fs = require('fs');
let path = require('path');
let crypto = require('crypto');

const BENBEN_UPLOAD_DIR = '/app/static/self/benben';
const MAX_BENBEN_LENGTH = 500;
const MAX_IMAGES = 9;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

try { fs.mkdirSync(BENBEN_UPLOAD_DIR, { recursive: true }); } catch (e) {}

// ============ 工具:能否查看所有犇犇(admin + manage_user) ============
function canSeeAllBenben(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (user.privileges && user.privileges.includes('manage_user')) return true;
  return false;
}

// ============ 工具:能否删除某条犇犇 ============
function canDeleteBenben(viewer, post) {
  if (!viewer) return false;
  if (viewer.id === post.user_id) return true;
  if (canSeeAllBenben(viewer)) return true;
  return false;
}

// ============ 工具:@ 提及解析 ============
// 提取文本中的 @username,返回 [{name, userId}, ...]
async function parseMentions(text) {
  if (!text) return [];
  let regex = /@([a-zA-Z0-9_\u4e00-\u9fa5\-]{1,32})/g;
  let names = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  let mentions = [];
  for (let name of names) {
    let u = await User.findOne({ where: { username: name } });
    if (u) mentions.push({ name: name, userId: u.id });
  }
  return mentions;
}
syzoj.utils.parseMentions = parseMentions;

// ============ 工具:渲染犇犇内容(把 @xxx 转链接) ============
// mentionMap: {username: userId},如果没提供则 @xxx 渲染为纯文本
function renderBenbenContent(text, mentionMap) {
  if (!text) return '';
  let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // @ 提及转链接
  escaped = escaped.replace(/@([a-zA-Z0-9_\u4e00-\u9fa5\-]{1,32})/g, function(match, name) {
    if (mentionMap && mentionMap[name]) {
      return '<a href="/user/' + mentionMap[name] + '" class="benben-mention">@' + name + '</a>';
    }
    // 无匹配用户,纯文本显示
    return '<span class="benben-mention" style="color:#aaa">@' + name + '</span>';
  });
  // 换行
  escaped = escaped.replace(/\n/g, '<br>');
  return escaped;
}
syzoj.utils.renderBenbenContent = renderBenbenContent;

// ============ 工具:加载犇犇的关联数据(作者、图片、回复数等) ============
async function enrichPost(post) {
  post.user = await User.findById(post.user_id);
  let conn = require('typeorm').getConnection();
  let imgs = await conn.query('SELECT id, filename, original_name FROM benben_image WHERE post_id = ? ORDER BY id ASC', [post.id]);
  post.images = imgs.map(i => ({
    id: i.id,
    url: '/self/benben/' + i.filename,
    original_name: i.original_name
  }));
  // 预解析 @ 提及映射
  let mentions = await parseMentions(post.content);
  let mentionMap = {};
  for (let m of mentions) mentionMap[m.name] = m.userId;
  post.contentRendered = renderBenbenContent(post.content, mentionMap);
  // 回复数(仅算未删除的)
  if (!post.reply_to) {
    let cntRows = await conn.query(
      'SELECT COUNT(*) AS cnt FROM benben_post WHERE reply_to = ? AND is_deleted = 0',
      [post.id]
    );
    post.replyCount = parseInt(cntRows[0].cnt) || 0;
  }
  return post;
}

// ============ POST /benben/new:发布 ============
app.post('/benben/new', app.multer.array('images', MAX_IMAGES), async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let content = (req.body.content || '').trim();
    if (!content) throw new ErrorMessage('内容不能为空。');
    if (content.length > MAX_BENBEN_LENGTH) throw new ErrorMessage('内容超过 ' + MAX_BENBEN_LENGTH + ' 字。');

    let replyTo = parseInt(req.body.reply_to) || null;
    if (replyTo) {
      let parent = await BenbenPost.findById(replyTo);
      if (!parent || parent.is_deleted) throw new ErrorMessage('被回复的犇犇不存在或已删除。');
      // 不允许嵌套:如果父级已经是回复,把 reply_to 改为父级的 reply_to(回到原创)
      if (parent.reply_to) replyTo = parent.reply_to;
    }

    // 创建犇犇
    let post = await BenbenPost.create();
    post.user_id = res.locals.user.id;
    post.content = content;
    post.reply_to = replyTo;
    post.is_deleted = 0;
    post.created_at = parseInt((new Date()).getTime() / 1000);
    await post.save();

    // 处理图片上传(仅原创犇犇支持,回复不传图)
    if (!replyTo && req.files && req.files.length > 0) {
      for (let i = 0; i < Math.min(req.files.length, MAX_IMAGES); i++) {
        let file = req.files[i];
        if (file.size > MAX_IMAGE_SIZE) {
          try { fs.unlinkSync(file.path); } catch (e) {}
          continue;
        }
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          try { fs.unlinkSync(file.path); } catch (e) {}
          continue;
        }
        let ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) ext = '.jpg';
        let filename = crypto.randomBytes(16).toString('hex') + ext;
        let targetPath = path.join(BENBEN_UPLOAD_DIR, filename);
        try {
          fs.copyFileSync(file.path, targetPath);
          fs.unlinkSync(file.path);
        } catch (e) {
          syzoj.log('[benben] image copy failed: ' + e.message);
          continue;
        }
        let img = await BenbenImage.create();
        img.post_id = post.id;
        img.filename = filename;
        img.original_name = (file.originalname || '').substring(0, 255);
        img.uploader_id = res.locals.user.id;
        img.file_size = file.size;
        img.created_at = post.created_at;
        await img.save();
      }
    }

    // @ 提及触发通知
    try {
      let mentions = await parseMentions(content);
      for (let m of mentions) {
        if (m.userId === res.locals.user.id) continue;
        await syzoj.utils.createNotification({
          recipientId: m.userId,
          type: 'benben_mention',
          title: res.locals.user.username + ' 在犇犇里提到了你',
          content: content.length > 100 ? content.substring(0, 100) + '...' : content,
          sourceUrl: syzoj.utils.makeUrl(['benben', post.id]),
          sourceId: post.id,
          actorId: res.locals.user.id
        });
      }
    } catch (e) { syzoj.log('[benben] @ mention notify failed: ' + e.message); }

    // 如果是回复,通知被回复者
    if (replyTo) {
      try {
        let parent = await BenbenPost.findById(replyTo);
        if (parent && parent.user_id !== res.locals.user.id) {
          await syzoj.utils.createNotification({
            recipientId: parent.user_id,
            type: 'benben_reply',
            title: res.locals.user.username + ' 回复了你的犇犇',
            content: content.length > 100 ? content.substring(0, 100) + '...' : content,
            sourceUrl: syzoj.utils.makeUrl(['benben', replyTo]),
            sourceId: replyTo,
            actorId: res.locals.user.id
          });
        }
      } catch (e) { syzoj.log('[benben] reply notify failed: ' + e.message); }
    }

    res.redirect(req.body.return_url || '/');
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ POST /benben/:id/delete:删除(软删除) ============
app.post('/benben/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    let id = parseInt(req.params.id);
    let post = await BenbenPost.findById(id);
    if (!post) throw new ErrorMessage('犇犇不存在。');
    if (!canDeleteBenben(res.locals.user, post)) throw new ErrorMessage('您没有权限删除。');
    post.is_deleted = 1;
    await post.save();
    res.redirect(req.body.return_url || '/');
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ GET /benben/:id:单条犇犇详情(含回复) ============
app.get('/benben/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let post = await BenbenPost.findById(id);
    if (!post || post.is_deleted) throw new ErrorMessage('犇犇不存在或已被删除。');

    // 权限:作者本人 + 关注作者者 + admin/manage_user 才能看
    let viewer = res.locals.user;
    let canSee = false;
    if (viewer && viewer.id === post.user_id) canSee = true;
    else if (canSeeAllBenben(viewer)) canSee = true;
    else if (viewer) {
      let follow = await UserFollow.findOne({ where: { follower_id: viewer.id, followee_id: post.user_id } });
      if (follow) canSee = true;
    }
    if (!canSee) throw new ErrorMessage('您没有权限查看此犇犇。');

    await enrichPost(post);

    // 加载回复列表
    let conn = require('typeorm').getConnection();
    let replyRows = await conn.query(
      'SELECT id FROM benben_post WHERE reply_to = ? AND is_deleted = 0 ORDER BY created_at ASC',
      [post.id]
    );
    let replies = [];
    for (let r of replyRows) {
      let rp = await BenbenPost.findById(r.id);
      if (rp) {
        await enrichPost(rp);
        replies.push(rp);
      }
    }
    post.replies = replies;

    res.render('benben_detail', {
      post: post,
      canDelete: canDeleteBenben(viewer, post)
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ GET /api/benben/feed:信息流 API ============
// query: tab=following|mine|all, page, pageSize
app.get('/api/benben/feed', async (req, res) => {
  try {
    if (!res.locals.user) {
      return res.json({ posts: [], total: 0 });
    }
    let tab = req.query.tab || 'following';
    let pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    let page = Math.max(parseInt(req.query.page) || 1, 1);
    let offset = (page - 1) * pageSize;
    let conn = require('typeorm').getConnection();
    let viewerId = res.locals.user.id;
    let posts = [];
    let total = 0;

    if (tab === 'mine') {
      // 我发布的(仅原创,不含回复)
      let cntRows = await conn.query(
        'SELECT COUNT(*) AS cnt FROM benben_post WHERE user_id = ? AND reply_to IS NULL AND is_deleted = 0',
        [viewerId]
      );
      total = parseInt(cntRows[0].cnt) || 0;
      let rows = await conn.query(
        'SELECT id FROM benben_post WHERE user_id = ? AND reply_to IS NULL AND is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [viewerId, pageSize, offset]
      );
      for (let r of rows) {
        let p = await BenbenPost.findById(r.id);
        if (p) { await enrichPost(p); posts.push(p); }
      }
    } else if (tab === 'all' && canSeeAllBenben(res.locals.user)) {
      // admin 全部犇犇
      let cntRows = await conn.query(
        'SELECT COUNT(*) AS cnt FROM benben_post WHERE reply_to IS NULL AND is_deleted = 0'
      );
      total = parseInt(cntRows[0].cnt) || 0;
      let rows = await conn.query(
        'SELECT id FROM benben_post WHERE reply_to IS NULL AND is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset]
      );
      for (let r of rows) {
        let p = await BenbenPost.findById(r.id);
        if (p) { await enrichPost(p); posts.push(p); }
      }
    } else {
      // 我关注的人 + 我自己
      let cntRows = await conn.query(`
        SELECT COUNT(*) AS cnt FROM benben_post p
        WHERE p.is_deleted = 0 AND p.reply_to IS NULL
          AND (p.user_id = ?
            OR p.user_id IN (SELECT followee_id FROM user_follow WHERE follower_id = ?))
      `, [viewerId, viewerId]);
      total = parseInt(cntRows[0].cnt) || 0;
      let rows = await conn.query(`
        SELECT id FROM benben_post p
        WHERE p.is_deleted = 0 AND p.reply_to IS NULL
          AND (p.user_id = ?
            OR p.user_id IN (SELECT followee_id FROM user_follow WHERE follower_id = ?))
        ORDER BY created_at DESC LIMIT ? OFFSET ?
      `, [viewerId, viewerId, pageSize, offset]);
      for (let r of rows) {
        let p = await BenbenPost.findById(r.id);
        if (p) { await enrichPost(p); posts.push(p); }
      }
    }

    // 返回 JSON
    res.json({
      total: total,
      page: page,
      pageSize: pageSize,
      posts: posts.map(p => ({
        id: p.id,
        content: p.content,
        contentRendered: p.contentRendered,
        created_at: p.created_at,
        createdAtStr: syzoj.utils.formatDate(p.created_at),
        replyCount: p.replyCount || 0,
        user: p.user ? {
          id: p.user.id,
          username: p.user.username,
          usernameHtml: syzoj.utils.renderUsername(p.user),
          avatar: syzoj.utils.gravatar(p.user.email, 48)
        } : null,
        images: p.images || []
      }))
    });
  } catch (e) {
    syzoj.log(e);
    res.json({ posts: [], error: e.message });
  }
});

