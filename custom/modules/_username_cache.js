// 全局缓存:有任意管理权限或 is_admin 的用户 id 集合
// 每 60 秒自动刷新一次
let UserPrivilege = syzoj.model('user_privilege');
let User = syzoj.model('user');
const MGMT_PRIVS = ['manage_problem', 'manage_problem_tag', 'manage_user'];
const REFRESH_INTERVAL_MS = 60 * 1000;

syzoj.adminUserIds = new Set();

async function refreshAdminUserIds() {
  try {
    let newSet = new Set();

    // 1. 查 user_privilege 表里有 MGMT_PRIVS 的用户
    let privRecords = await UserPrivilege.createQueryBuilder()
      .where('privilege IN (:...privs)', { privs: MGMT_PRIVS })
      .getMany();
    for (let r of privRecords) newSet.add(r.user_id);

    // 2. 用 raw SQL 查 super admin(绕过 typeorm boolean quirk)
    let conn = require('typeorm').getConnection();
    let superAdmins = await conn.query('SELECT id FROM user WHERE is_admin = 1');
    for (let u of superAdmins) newSet.add(u.id);

    syzoj.adminUserIds = newSet;
    syzoj.log('[admin-cache] Refreshed: ' + newSet.size + ' privileged users');
  } catch (e) {
    syzoj.log('[admin-cache] Refresh failed: ' + e.message);
  }
}

refreshAdminUserIds();
setInterval(refreshAdminUserIds, REFRESH_INTERVAL_MS);
syzoj.refreshAdminUserIds = refreshAdminUserIds;
