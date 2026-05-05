// 用户名渲染 helper:
// 优先级:
//   1. 管理身份(is_admin/有管理权限) → admin 紫色 + 自定义 tag(若设置)
//   2. 普通用户 + 有 cheated 记录 → cheater 棕色 + 强制"作弊者" tag
//   3. 普通用户 + 按 Hit 值分档(gray/blue/green/orange/red)
//   4. 普通用户 + 无 Hit 数据 → default 深灰
//
// 文件名以 _ 开头确保字母排序最前

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

function tierFromHit(hit) {
  if (hit >= 350) return 'red';
  if (hit >= 280) return 'orange';
  if (hit >= 200) return 'green';
  if (hit >= 100) return 'blue';
  return 'gray';
}

// 判定用户名 tier(同步,使用全局缓存)
// 返回 admin/cheater/red/orange/green/blue/gray/default
function calcTier(user) {
  if (!user) return 'default';

  // 1. 管理员优先(is_admin 或在 adminUserIds 缓存中) → 不受 cheater 影响
  if (user.is_admin) return 'admin';
  if (syzoj.adminUserIds && syzoj.adminUserIds.has(user.id)) return 'admin';

  // 2. 非管理员 + 被标记 cheater → 棕色
  if (syzoj.cheaterUserIds && syzoj.cheaterUserIds.has(user.id)) return 'cheater';

  // 3. 按 Hit 值分档
  if (syzoj.userHitScores && syzoj.userHitScores.has(user.id)) {
    let s = syzoj.userHitScores.get(user.id);
    return tierFromHit(s.total || 0);
  }

  // 4. 默认
  return 'default';
}

// 渲染 tag HTML
// 优先级:
//   1. 非 admin 且为 cheater → "作弊者"棕色 tag(强制覆盖)
//   2. 在 syzoj.userTags 缓存中且 text 非空 → 用户自定义 tag
//   3. 否则不显示 tag
function renderTagHtml(user, tier) {
  if (!user) return '';

  // 非 admin 的 cheater → 强制作弊者 tag
  if (tier === 'cheater') {
    return ' <span class="user-name-tag tag-tier-cheater">作弊者</span>';
  }

  if (!syzoj.userTags || !syzoj.userTags.has(user.id)) return '';
  let t = syzoj.userTags.get(user.id);
  if (!t || !t.text) return '';
  return ' <span class="user-name-tag tag-tier-' + (t.tier || 'default') +
    '">' + escapeHtml(t.text) + '</span>';
}

syzoj.utils.renderUsername = function(user, options) {
  options = options || {};

  if (!user) {
    return '<span class="username-tier-unknown">(未知用户)</span>';
  }

  let tier = calcTier(user);
  let url = '/user/' + user.id;
  let username = escapeHtml(user.username || '');
  let nameplate = user.nameplate || '';
  let tagHtml = options.noTag ? '' : renderTagHtml(user, tier);

  if (options.noLink) {
    return '<span class="username-tier-' + tier + '">' + username + '</span>' + tagHtml + nameplate;
  }

  return '<a href="' + url + '" class="username-tier-' + tier + '">' +
         username + '</a>' + tagHtml + nameplate;
};

// 暴露 calcTier(给其他模块用,比如 user_edit 模板要判断 tier)
syzoj.utils.calcUserTier = calcTier;

syzoj.utils.plainUsername = function(user) {
  if (!user) return '(未知用户)';
  return user.username || '';
};