// 用户名渲染 helper:
// 1. 提供 syzoj.utils.renderUsername(user) 同步 helper,模板里调用
// 2. 颜色判定:
//    - is_admin (SYZOJ 自带超级管理员)
//    - 在 syzoj.adminUserIds 集合中(由 _username_cache.js 维护)
//    → 紫色;其他默认色
//
// 文件名以 _ 开头确保字母排序最前
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

// 同步 helper:用于 EJS 模板中
syzoj.utils.renderUsername = function(user, options) {
  options = options || {};

  if (!user) {
    return '<span class="username-tier-unknown">(未知用户)</span>';
  }

  // 计算 tier
  let tier = 'default';
  if (user.is_admin) {
    tier = 'admin';
  } else if (syzoj.adminUserIds && syzoj.adminUserIds.has(user.id)) {
    tier = 'admin';
  }
  // TODO: 第三批接入 Hit 值后,在这里按 user.hit_value 分档(覆盖 default)

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