// 替换 SYZOJ 自带的 /ranklist 路由,支持按 Hit 值排序
// 文件名以 _ 开头确保字母排序在 SYZOJ 自带的 user.js 之前先加载
let User = syzoj.model('user');
let UserHitScore = syzoj.model('user-hit-score');

app.get('/ranklist', async (req, res) => {
  try {
    let sort = req.query.sort || 'rating';
    let order = req.query.order || 'desc';

    // 支持的排序字段:rating / ac_num / id / username / hit
    let sortByHit = (sort === 'hit');

    if (!sortByHit && !['ac_num', 'rating', 'id', 'username'].includes(sort)) {
      throw new ErrorMessage('错误的排序参数。');
    }
    if (!['asc', 'desc'].includes(order)) {
      throw new ErrorMessage('错误的排序参数。');
    }

    let pageSize = syzoj.config.page.ranklist;
    let total = await User.countForPagination({ is_show: true });
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);

    let ranklist;
    if (sortByHit) {
      // 按 Hit 值排序: LEFT JOIN user_hit_score 表
      let qb = User.createQueryBuilder('u')
        .leftJoin('user_hit_score', 'h', 'h.user_id = u.id')
        .where('u.is_show = TRUE')
        .addSelect('COALESCE(h.total, 0)', 'hit_total')
        .orderBy('hit_total', order.toUpperCase())
        .addOrderBy('u.id', 'ASC')
        .limit(paginate.perPage)
        .offset((paginate.currPage - 1) * paginate.perPage);

      // 获取原始结果(包含我们附加的 hit_total 列)
      let raws = await qb.getRawAndEntities();
      ranklist = raws.entities;
      // 把 hit 值绑到 user 对象上,模板要用
      for (let i = 0; i < ranklist.length; i++) {
        ranklist[i].__hitTotal = parseInt(raws.raw[i].hit_total) || 0;
      }
    } else {
      ranklist = await User.queryPage(paginate, { is_show: true }, { [sort]: order.toUpperCase() });
    }

    await ranklist.forEachAsync(async function(x) { return x.renderInformation(); });

    res.render('ranklist', {
      ranklist: ranklist,
      paginate: paginate,
      curSort: sort,
      curOrder: order === 'asc'
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});
