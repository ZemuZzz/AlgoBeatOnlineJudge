// 用户名牌子(tag) 系统
let UserTag = syzoj.model('user-tag');
let User = syzoj.model('user');

syzoj.userTags = new Map();

function hasAdminRole(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (user.privileges && (
    user.privileges.includes('manage_problem') ||
    user.privileges.includes('manage_problem_tag') ||
    user.privileges.includes('manage_user')
  )) return true;
  return false;
}

function calcUserTier(userId, isAdminFlag) {
  if (isAdminFlag) return 'admin';
  if (syzoj.adminUserIds && syzoj.adminUserIds.has(userId)) return 'admin';
  if (syzoj.userHitScores && syzoj.userHitScores.has(userId)) {
    let s = syzoj.userHitScores.get(userId);
    let h = s.total || 0;
    if (h >= 350) return 'red';
    if (h >= 280) return 'orange';
    if (h >= 200) return 'green';
    if (h >= 100) return 'blue';
    return 'gray';
  }
  return 'default';
}

async function refreshUserTagsCache() {
  try {
    // 拿所有未禁用的记录(包括 is_visible=false 的,用于判断"显式存在")
    let allRows = await UserTag.createQueryBuilder()
      .where('is_disabled = FALSE')
      .getMany();

    // existsForUid: 数据库里"显式"有该用户记录的 user_id 集合
    let existsForUid = new Set(allRows.map(r => r.user_id));

    let newCache = new Map();

    // 只把 is_visible=true 且 tag_text 非空的记录加入缓存
    for (let r of allRows) {
      if (r.is_visible && r.tag_text && r.tag_text.length > 0) {
        let tier = calcUserTier(r.user_id, false);
        newCache.set(r.user_id, { text: r.tag_text, tier: tier });
      }
    }

    // admin fallback: adminUserIds 里且数据库中"完全没有显式记录"的用户 → "管理员"
    // 数据库里有记录的 admin(无论 is_visible 是 true 还是 false)都尊重数据库
    if (syzoj.adminUserIds && syzoj.adminUserIds.size > 0) {
      for (let uid of syzoj.adminUserIds) {
        if (!existsForUid.has(uid) && !newCache.has(uid)) {
          newCache.set(uid, { text: '管理员', tier: 'admin' });
        }
      }
    }

    syzoj.userTags = newCache;
    syzoj.log('[user-tag-cache] Refreshed: ' + newCache.size + ' user tags');
  } catch (e) {
    syzoj.log('[user-tag-cache] refresh failed: ' + e.message);
  }
}

setTimeout(refreshUserTagsCache, 8 * 1000);
setInterval(refreshUserTagsCache, 60 * 1000);

async function getUserTagState(user) {
  if (!user) return { hasPermission: false, isAutoFromAdmin: false, record: null };

  let record = await UserTag.findOne({ where: { user_id: user.id } });

  if (record && record.is_disabled) {
    return { hasPermission: false, isAutoFromAdmin: false, record: record, isDisabled: true };
  }

  let isAdmin = hasAdminRole(user);
  if (isAdmin) {
    return { hasPermission: true, isAutoFromAdmin: true, record: record };
  }
  if (record && !record.is_disabled) {
    return { hasPermission: true, isAutoFromAdmin: false, record: record };
  }
  return { hasPermission: false, isAutoFromAdmin: false, record: null };
}

syzoj.utils.getUserTagState = getUserTagState;
syzoj.utils.refreshUserTagsCache = refreshUserTagsCache;

app.post('/api/my-tag', async (req, res) => {
  try {
    if (!res.locals.user) {
      return res.status(401).json({ ok: false, message: '请先登录。' });
    }

    let state = await getUserTagState(res.locals.user);
    if (!state.hasPermission) {
      return res.status(403).json({ ok: false, message: '您没有 tag 权限。' });
    }

    let tagText = (req.body.tag_text || '').trim();
    if (tagText.length > 12) {
      return res.json({ ok: false, message: 'tag 文字不能超过 12 字符。' });
    }
    let isVisible = (req.body.is_visible === 'true' || req.body.is_visible === 'on' || req.body.is_visible === true);

    let now = parseInt((new Date()).getTime() / 1000);
    let record = state.record;
    if (!record) {
      record = await UserTag.create();
      record.user_id = res.locals.user.id;
      record.granted_by = null;
      record.granted_at = now;
      record.is_disabled = false;
    }
    record.tag_text = tagText;
    record.is_visible = isVisible;
    record.updated_at = now;
    await record.save();

    await refreshUserTagsCache();
    res.json({ ok: true });
  } catch (e) {
    syzoj.log(e);
    res.status(500).json({ ok: false, message: e.message || '保存失败' });
  }
});

app.get('/admin/user-tags', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) {
      throw new ErrorMessage('仅超级管理员可访问。');
    }

    let records = await UserTag.createQueryBuilder()
      .orderBy('user_id', 'ASC')
      .getMany();

    let userIds = [...new Set(records.map(r => r.user_id))];
    let granterIds = [...new Set(records.map(r => r.granted_by).filter(x => x))];
    let disablerIds = [...new Set(records.map(r => r.disabled_by).filter(x => x))];
    let allIds = [...new Set([...userIds, ...granterIds, ...disablerIds])];

    let userMap = {};
    if (allIds.length > 0) {
      let users = await User.createQueryBuilder()
        .where('id IN (:...ids)', { ids: allIds })
        .getMany();
      for (let u of users) userMap[u.id] = u;
    }

    res.render('admin_user_tags', {
      records: records,
      userMap: userMap
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

app.post('/admin/user-tags/grant', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) {
      throw new ErrorMessage('仅超级管理员可操作。');
    }

    let username = (req.body.username || '').trim();
    let uidQuery = (req.body.user_id || '').trim();

    let target = null;
    if (uidQuery) {
      target = await User.findById(parseInt(uidQuery));
    } else if (username) {
      target = await User.fromName(username);
    }
    if (!target) throw new ErrorMessage('找不到目标用户。');

    let existing = await UserTag.findOne({ where: { user_id: target.id } });
    let now = parseInt((new Date()).getTime() / 1000);

    if (existing) {
      if (existing.is_disabled) {
        existing.is_disabled = false;
        existing.disabled_by = null;
        existing.disabled_at = null;
        existing.disabled_reason = null;
        existing.granted_by = res.locals.user.id;
        existing.granted_at = now;
        existing.updated_at = now;
        await existing.save();
      } else {
        throw new ErrorMessage('该用户已有 tag 权限,无需重复授权。');
      }
    } else {
      let r = await UserTag.create();
      r.user_id = target.id;
      r.tag_text = '';
      r.is_visible = true;
      r.granted_by = res.locals.user.id;
      r.granted_at = now;
      r.is_disabled = false;
      r.updated_at = now;
      await r.save();
    }

    await refreshUserTagsCache();
    res.redirect(syzoj.utils.makeUrl(['admin', 'user-tags']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

app.post('/admin/user-tags/:uid/disable', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) {
      throw new ErrorMessage('仅超级管理员可操作。');
    }

    let uid = parseInt(req.params.uid);
    let target = await User.findById(uid);
    if (!target) throw new ErrorMessage('用户不存在。');

    if (uid === res.locals.user.id) {
      throw new ErrorMessage('不能禁用自己的 tag 权限。');
    }
    if (target.is_admin) {
      throw new ErrorMessage('不能禁用其他超级管理员的 tag 权限。');
    }

    let now = parseInt((new Date()).getTime() / 1000);
    let record = await UserTag.findOne({ where: { user_id: uid } });
    if (!record) {
      record = await UserTag.create();
      record.user_id = uid;
      record.tag_text = '';
      record.is_visible = false;
      record.granted_by = null;
      record.granted_at = null;
    }
    record.is_disabled = true;
    record.disabled_by = res.locals.user.id;
    record.disabled_at = now;
    record.disabled_reason = (req.body.reason || '').trim().slice(0, 255) || null;
    record.updated_at = now;
    await record.save();

    await refreshUserTagsCache();
    res.redirect(syzoj.utils.makeUrl(['admin', 'user-tags']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

app.post('/admin/user-tags/:uid/enable', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) {
      throw new ErrorMessage('仅超级管理员可操作。');
    }

    let uid = parseInt(req.params.uid);
    let record = await UserTag.findOne({ where: { user_id: uid } });
    if (!record) throw new ErrorMessage('找不到该记录。');

    let now = parseInt((new Date()).getTime() / 1000);
    record.is_disabled = false;
    record.disabled_by = null;
    record.disabled_at = null;
    record.disabled_reason = null;
    record.updated_at = now;
    await record.save();

    await refreshUserTagsCache();
    res.redirect(syzoj.utils.makeUrl(['admin', 'user-tags']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
