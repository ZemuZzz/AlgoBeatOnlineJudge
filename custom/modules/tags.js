let ProblemTag = syzoj.model('problem_tag');
let ProblemTagMap = syzoj.model('problem_tag_map');

// 标签列表页：展示所有标签 + 每个标签下的题目数
app.get('/tags', async (req, res) => {
  try {
    // 取出所有标签
    let tags = await ProblemTag.find({});

    // 为每个标签查询关联的题目数量
    // 注意：这里只统计了 problem_tag_map 中的关联数，
    // 不区分 public/private，简单实现先这样
    for (let tag of tags) {
      tag.problemCount = await ProblemTagMap.count({ tag_id: tag.id });
    }

    // 按颜色和名字排序，让同色的标签聚在一起，视觉更整齐
    tags.sort((a, b) => {
      if (a.color !== b.color) {
        return (a.color || '') > (b.color || '') ? 1 : -1;
      }
      return (a.name || '') > (b.name || '') ? 1 : -1;
    });

    res.render('tags', {
      tags: tags
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
