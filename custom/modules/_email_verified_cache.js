// 全局缓存:已验证邮箱的 user_id 集合
let UserEmailStatus = syzoj.model('user-email-status');

syzoj.verifiedUserIds = new Set();

async function refreshVerifiedCache() {
  try {
    // 用 raw SQL 绕过 typeorm boolean 在 mariadb 上的怪行为
    let conn = require('typeorm').getConnection();
    let rows = await conn.query('SELECT user_id FROM user_email_status WHERE is_email_verified = 1');
    let s = new Set();
    for (let r of rows) s.add(r.user_id);
    syzoj.verifiedUserIds = s;
    syzoj.log('[email-verified-cache] Refreshed: ' + s.size + ' verified users');
  } catch (e) {
    syzoj.log('[email-verified-cache] refresh failed: ' + e.message);
  }
}

setTimeout(refreshVerifiedCache, 5 * 1000);
setInterval(refreshVerifiedCache, 60 * 1000);

syzoj.utils.refreshVerifiedCache = refreshVerifiedCache;
