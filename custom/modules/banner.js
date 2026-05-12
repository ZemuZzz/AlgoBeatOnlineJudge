let HomepageBanner = syzoj.model('homepage-banner');
let User = syzoj.model('user');
let fs = require('fs');
let path = require('path');
let crypto = require('crypto');

const BANNER_UPLOAD_DIR = '/app/static/self/banner';
const MAX_BANNER_SIZE = 5 * 1024 * 1024;  // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

try { fs.mkdirSync(BANNER_UPLOAD_DIR, { recursive: true }); } catch (e) {}

// ============ 校验工具 ============
function sanitizeLinkUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url) return null;
  // 只允许 http://, https://, 或相对路径 /
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url.substring(0, 500);
  }
  return null;
}

function isAdmin(user) {
  return user && user.is_admin;
}

// ============ 公开 API:活跃 banner 列表 ============
app.get('/api/active-banners', async (req, res) => {
  try {
    let conn = require('typeorm').getConnection();
    let now = Math.floor(Date.now() / 1000);
    let rows = await conn.query(
      `SELECT id, title, image_path, link_url, sort_order
       FROM homepage_banner
       WHERE is_active = 1
         AND (start_time IS NULL OR start_time <= ?)
         AND (end_time IS NULL OR end_time >= ?)
       ORDER BY sort_order DESC, id DESC
       LIMIT 20`, [now, now]
    );
    res.json({ banners: rows });
  } catch (e) {
    syzoj.log('[banner] api failed: ' + e.message);
    res.json({ banners: [] });
  }
});

// ============ admin: banner 管理列表 ============
app.get('/admin/banners', async (req, res) => {
  try {
    if (!isAdmin(res.locals.user)) throw new ErrorMessage('您没有权限。');
    let banners = await HomepageBanner.queryAll(HomepageBanner.createQueryBuilder()
      .orderBy('sort_order', 'DESC')
      .addOrderBy('id', 'DESC'));
    for (let b of banners) {
      if (b.created_by) b.creator = await User.findById(b.created_by);
    }
    res.render('admin_banners', { banners: banners });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ admin: 上传新 banner ============
app.post('/admin/banner/new', app.multer.single('image'), async (req, res) => {
  try {
    if (!isAdmin(res.locals.user)) throw new ErrorMessage('您没有权限。');
    if (!req.file) throw new ErrorMessage('请上传图片文件。');
    if (req.file.size > MAX_BANNER_SIZE) throw new ErrorMessage('图片不能超过 5MB。');
    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      throw new ErrorMessage('仅支持 JPG / PNG / WebP / GIF 格式。');
    }

    let title = (req.body.title || '').trim().substring(0, 100);
    if (!title) title = '未命名 Banner';
    let linkUrl = sanitizeLinkUrl(req.body.link_url);
    let sortOrder = parseInt(req.body.sort_order || 0) || 0;

    // 生成 uuid 文件名
    let ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) ext = '.jpg';
    let filename = crypto.randomBytes(16).toString('hex') + ext;
    let targetPath = path.join(BANNER_UPLOAD_DIR, filename);

    // multer 默认存到 tmp,移动到目标目录
    fs.copyFileSync(req.file.path, targetPath);
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    let banner = await HomepageBanner.create();
    banner.title = title;
    banner.image_path = '/self/banner/' + filename;
    banner.link_url = linkUrl;
    banner.sort_order = sortOrder;
    banner.is_active = 1;
    banner.created_by = res.locals.user.id;
    banner.created_at = Math.floor(Date.now() / 1000);
    await banner.save();

    res.redirect(syzoj.utils.makeUrl(['admin', 'banners']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ admin: 编辑 banner(标题/链接/排序/启用) ============
app.post('/admin/banner/:id/edit', async (req, res) => {
  try {
    if (!isAdmin(res.locals.user)) throw new ErrorMessage('您没有权限。');
    let id = parseInt(req.params.id);
    let banner = await HomepageBanner.findById(id);
    if (!banner) throw new ErrorMessage('Banner 不存在。');

    let title = (req.body.title || '').trim().substring(0, 100);
    if (title) banner.title = title;
    let linkUrl = sanitizeLinkUrl(req.body.link_url);
    banner.link_url = linkUrl;  // null 也允许(清空跳转)
    banner.sort_order = parseInt(req.body.sort_order || 0) || 0;
    banner.is_active = (req.body.is_active === 'on' || req.body.is_active === 'true' || req.body.is_active === '1') ? 1 : 0;
    await banner.save();

    res.redirect(syzoj.utils.makeUrl(['admin', 'banners']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ admin: 删除 banner(同时删图片文件) ============
app.post('/admin/banner/:id/delete', async (req, res) => {
  try {
    if (!isAdmin(res.locals.user)) throw new ErrorMessage('您没有权限。');
    let id = parseInt(req.params.id);
    let banner = await HomepageBanner.findById(id);
    if (!banner) throw new ErrorMessage('Banner 不存在。');

    // 删图片文件
    if (banner.image_path && banner.image_path.startsWith('/self/banner/')) {
      let fileName = banner.image_path.replace('/self/banner/', '');
      let filePath = path.join(BANNER_UPLOAD_DIR, fileName);
      try { fs.unlinkSync(filePath); } catch (e) { syzoj.log('[banner] delete file failed: ' + e.message); }
    }

    await banner.destroy();
    res.redirect(syzoj.utils.makeUrl(['admin', 'banners']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
