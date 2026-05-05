// 用户名渲染 helper:
// 1. 提供 syzoj.utils.renderUsername(user) 同步 helper,模板里调用
// 2. 颜色判定优先级:
//    管理权限(is_admin 或 syzoj.adminUserIds 命中) → 紫色 admin
//    否则按 Hit 值分档:
//      0-99 gray / 100-199 blue / 200-279 green / 280-349 orange / 350-400 red
//    Hit 值缓存数据来自 syzoj.userHitScores Map(由 __hit_score_engine.js 维护)
//    如果 Hit 数据未加载,fallback 为 default(深灰)
//
// 文件名以 _ 开头确保字母排序最前
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

// 根据 Hit 值返回 tier 名
function tierFromHit(hit) {
  if (hit >= 350) return 'red';
  if (hit >= 280) return 'orange';
  if (hit >= 200) return 'green';
  if (hit >= 100) return 'blue';
  return 'gray';
}

// 同步 helper:用于 EJS 模板中
syzoj.utils.renderUsername = function(user, options) {
  options = options || {};

  if (!user) {
    return '<span class="username-tier-unknown">(未知用户)</span>';
  }

  // 计算 tier
  let tier = 'default';

  // 优先级 1: 管理权限 → 紫色,覆盖一切
  if (user.is_admin) {
    tier = 'admin';
  } else if (syzoj.adminUserIds && syzoj.adminUserIds.has(user.id)) {
    tier = 'admin';
  } else if (syzoj.userHitScores && syzoj.userHitScores.has(user.id)) {
    // 优先级 2: 按 Hit 值分档
    let scoreData = syzoj.userHitScores.get(user.id);
    tier = tierFromHit(scoreData.total || 0);
  }
  // 优先级 3: 没有 Hit 值数据(可能是新注册的用户、引擎还没算到) → default 深灰

  let url = '/user/' + user.id;
  let username = escapeHtml(user.username || '');
  let nameplate = user.nameplate || '';

  if (options.noLink) {
    return '<span class="username-tier-' + tier + '">' + username + '</span>' + nameplate;
  }

  return '<a href="' + url + '" class="username-tier-' + tier + '">' +
         username + '</a>' + nameplate;
};

// 同步 helper:只输出纯文本用户名(用于 <title> 等场合)
syzoj.utils.plainUsername = function(user) {
  if (!user) return '(未知用户)';
  return user.username || '';
};