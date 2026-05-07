// 全局缓存:每个比赛中有作弊提交的用户集合
// 结构:Map<contestId(number), Set<userId(number)>>
syzoj.contestCheaterMap = new Map();

async function refreshContestCheaterCache() {
  try {
    // 用 raw SQL 绕过 typeorm 怪行为
    let conn = require('typeorm').getConnection();
    let rows = await conn.query(`
      SELECT DISTINCT js.user_id, js.type_info AS contest_id
      FROM judge_state js
      JOIN judge_state_admin_action a ON a.judge_id = js.id
      WHERE a.action_type = 'cheated' AND js.type = 1
    `);
    let map = new Map();
    for (let r of rows) {
      let cid = parseInt(r.contest_id);
      let uid = parseInt(r.user_id);
      if (!map.has(cid)) map.set(cid, new Set());
      map.get(cid).add(uid);
    }
    syzoj.contestCheaterMap = map;
    syzoj.log('[contest-cheater-cache] Refreshed: ' + map.size + ' contests with cheaters');
  } catch (e) {
    syzoj.log('[contest-cheater-cache] refresh failed: ' + e.message);
  }
}

// 启动 8 秒后首次加载,然后每分钟刷新
setTimeout(refreshContestCheaterCache, 8 * 1000);
setInterval(refreshContestCheaterCache, 60 * 1000);

// 暴露手动触发(标记作弊后立即调用)
syzoj.utils.refreshContestCheaterCache = refreshContestCheaterCache;
