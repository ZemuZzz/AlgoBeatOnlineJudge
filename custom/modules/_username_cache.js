// 全局缓存:有任意管理权限的用户 id 集合
// 每 60 秒自动刷新一次
let UserPrivilege = syzoj.model('user_privilege');

const MGMT_PRIVS = ['manage_problem', 'manage_problem_tag', 'manage_user'];
const REFRESH_INTERVAL_MS = 60 * 1000;

// 全局 Set,放在 syzoj 上方便其他模块访问
syzoj.adminUserIds = new Set();

async function refreshAdminUserIds() {
  try {
    let records = await UserPrivilege.createQueryBuilder()
      .where('privilege IN (:...privs)', { privs: MGMT_PRIVS })
      .getMany();

    let newSet = new Set();
    for (let r of records) {
      newSet.add(r.user_id);
    }
    syzoj.adminUserIds = newSet;
    syzoj.log('[admin-cache] Refreshed: ' + newSet.size + ' privileged users');
  } catch (e) {
    syzoj.log('[admin-cache] Refresh failed: ' + e.message);
  }
}

// 启动时立即加载一次
refreshAdminUserIds();

// 周期性刷新
setInterval(refreshAdminUserIds, REFRESH_INTERVAL_MS);

// 暴露手动触发刷新的接口(以后可在管理后台改完权限后调用)
syzoj.refreshAdminUserIds = refreshAdminUserIds;
