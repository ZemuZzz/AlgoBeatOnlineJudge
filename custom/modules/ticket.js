// 工单系统:6 大类工单(题目/比赛/文章/用户/举报/综合),用户创建+管理员处理
let Ticket = syzoj.model('ticket');
let TicketReply = syzoj.model('ticket-reply');
let TicketAttachment = syzoj.model('ticket-attachment');
let User = syzoj.model('user');
let Problem = syzoj.model('problem');
let Contest = syzoj.model('contest');
let Article = syzoj.model('article');

let path = require('path');
let fs = require('fs');
let crypto = require('crypto');

const TICKET_UPLOAD_DIR = '/app/custom-uploads/tickets';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES_PER_TICKET = 10;

// 确保目录存在
try { fs.mkdirSync(TICKET_UPLOAD_DIR, { recursive: true }); } catch (e) {}

// ============ 6 大类工单元数据 ============
const TICKET_CATEGORIES = {
  problem: {
    label: '题目工单',
    color: 'blue',
    relation: 'problem',
    relation_required: true,
    subtypes: [
      { value: 'general', label: '题目综合' },
      { value: 'text_polish', label: '文本修缮' },
      { value: 'tag_diff', label: '改进标签、难度' }
    ]
  },
  contest: {
    label: '比赛工单',
    color: 'green',
    relation: 'contest',
    relation_required: true,
    subtypes: [
      { value: 'public_apply', label: '申请公开赛' }
    ]
  },
  article: {
    label: '文章工单',
    color: 'teal',
    relation: 'article',
    relation_required: true,
    subtypes: [
      { value: 'recommend_apply', label: '申请题解相关' },
      { value: 'recommend_revoke', label: '撤销题解相关' }
    ]
  },
  user: {
    label: '用户工单',
    color: 'orange',
    relation: 'user',
    relation_required: false, // 默认关联自己
    subtypes: [
      { value: 'appeal', label: '用户申诉' },
      { value: 'privilege_change', label: '申请权限变更' },
      { value: 'unban', label: '申请解除封禁' }
    ]
  },
  report: {
    label: '举报工单',
    color: 'red',
    relation: 'user',
    relation_required: true,
    extra_required: ['report_reason'],
    subtypes: [
      { value: 'user_report', label: '举报用户' }
    ]
  },
  general: {
    label: '综合问题',
    color: 'grey',
    relation: null,
    relation_required: false,
    subtypes: [
      { value: 'bug_suggest', label: '建议或 bug 反馈' },
      { value: 'academic', label: '学术建议' },
      { value: 'general_inquiry', label: '一般咨询' }
    ]
  }
};

const TICKET_STATUS = {
  pending: { label: '待处理', color: 'yellow', icon: 'wait' },
  in_progress: { label: '处理中', color: 'blue', icon: 'spinner' },
  resolved: { label: '已处理', color: 'green', icon: 'check circle' },
  rejected: { label: '已驳回', color: 'red', icon: 'times circle' },
  closed: { label: '已关闭', color: 'grey', icon: 'lock' }
};

// 暴露到全局
syzoj.TICKET_CATEGORIES = TICKET_CATEGORIES;
syzoj.TICKET_STATUS = TICKET_STATUS;

// ============ 工具函数 ============

function isTicketAdmin(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (user.privileges && user.privileges.includes('manage_problem')) return true;
  return false;
}

function canViewTicket(user, ticket) {
  if (!user) return false;
  if (user.id === ticket.creator_id) return true;
  if (isTicketAdmin(user)) return true;
  return false;
}

async function validateRelation(category, relationId) {
  let cfg = TICKET_CATEGORIES[category];
  if (!cfg) return '未知工单类别';
  if (!cfg.relation_required) return null;

  if (!relationId) return '请填写关联对象。';
  let id = parseInt(relationId);
  if (!id || isNaN(id) || id <= 0) return '关联对象 ID 无效。';

  if (cfg.relation === 'problem') {
    let p = await Problem.findById(id);
    if (!p) return '关联的题目不存在。';
  } else if (cfg.relation === 'contest') {
    let c = await Contest.findById(id);
    if (!c) return '关联的比赛不存在。';
  } else if (cfg.relation === 'article') {
    let a = await Article.findById(id);
    if (!a) return '关联的文章不存在。';
  } else if (cfg.relation === 'user') {
    let u = await User.findById(id);
    if (!u) return '关联的用户不存在。';
  }
  return null;
}

async function getRecentCreatedCount(userId) {
  let cutoff = parseInt((new Date()).getTime() / 1000) - 24 * 3600;
  return await Ticket.count({
    where: 'creator_id = ' + userId + ' AND created_at >= ' + cutoff
  });
}

// ============ 1. 工单列表 ============
app.get('/tickets', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请先登录后再查看工单。',
        { '登录': syzoj.utils.makeUrl(['login'], { url: req.originalUrl }) });
    }

    let isAdmin = isTicketAdmin(res.locals.user);
    let filter = req.query.filter || (isAdmin ? 'all' : 'mine');
    let categoryFilter = req.query.category || '';
    let statusFilter = req.query.status || '';

    let qb = Ticket.createQueryBuilder('t');

    if (!isAdmin) {
      qb = qb.where('t.creator_id = :uid', { uid: res.locals.user.id });
    } else if (filter === 'mine') {
      qb = qb.where('t.creator_id = :uid', { uid: res.locals.user.id });
    } else if (filter === 'assigned') {
      qb = qb.where('t.assignee_id = :uid', { uid: res.locals.user.id });
    } else if (filter === 'unassigned') {
      qb = qb.where('t.assignee_id IS NULL').andWhere('t.status = :s', { s: 'pending' });
    } else {
      qb = qb.where('1 = 1');
    }

    if (categoryFilter && TICKET_CATEGORIES[categoryFilter]) {
      qb = qb.andWhere('t.category = :cat', { cat: categoryFilter });
    }
    if (statusFilter && TICKET_STATUS[statusFilter]) {
      qb = qb.andWhere('t.status = :st', { st: statusFilter });
    }

    qb = qb.orderBy('t.updated_at', 'DESC');

    let total = await qb.getCount();
    let pageSize = 20;
    let paginate = syzoj.utils.paginate(total, req.query.page, pageSize);
    let tickets = [];
    if (total > 0) {
      tickets = await qb
        .limit(paginate.perPage)
        .offset(Math.max(0, (paginate.currPage - 1) * paginate.perPage))
        .getMany();
    }

    let creatorIds = [...new Set(tickets.map(t => t.creator_id))];
    let creatorMap = {};
    if (creatorIds.length > 0) {
      let users = await User.createQueryBuilder()
        .where('id IN (:...ids)', { ids: creatorIds })
        .getMany();
      for (let u of users) creatorMap[u.id] = u;
    }

    let assigneeIds = [...new Set(tickets.map(t => t.assignee_id).filter(x => x))];
    let assigneeMap = {};
    if (assigneeIds.length > 0) {
      let users = await User.createQueryBuilder()
        .where('id IN (:...ids)', { ids: assigneeIds })
        .getMany();
      for (let u of users) assigneeMap[u.id] = u;
    }

    res.render('tickets', {
      tickets: tickets,
      paginate: paginate,
      filter: filter,
      categoryFilter: categoryFilter,
      statusFilter: statusFilter,
      isAdmin: isAdmin,
      categories: TICKET_CATEGORIES,
      statusMeta: TICKET_STATUS,
      creatorMap: creatorMap,
      assigneeMap: assigneeMap
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 2. 创建工单(GET 显示选类型/填表单 + POST 提交) ============
app.get('/ticket/new', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请先登录后再创建工单。',
        { '登录': syzoj.utils.makeUrl(['login'], { url: req.originalUrl }) });
    }

    let recent = await getRecentCreatedCount(res.locals.user.id);
    if (recent >= 5 && !isTicketAdmin(res.locals.user)) {
      throw new ErrorMessage('您 24 小时内已创建 ' + recent + ' 个工单,达到上限(5 个)。请稍后再试。');
    }

    let category = req.query.category || '';
    let subtype = req.query.subtype || '';
    let prefilledRelation = req.query.relation_id || '';

    let step = 'select_type';
    if (category && TICKET_CATEGORIES[category]) {
      let cfg = TICKET_CATEGORIES[category];
      let subtypeOK = subtype && cfg.subtypes.find(s => s.value === subtype);
      if (subtypeOK) {
        step = 'fill_form';
      }
    }

    res.render('ticket_new', {
      step: step,
      category: category,
      subtype: subtype,
      prefilledRelation: prefilledRelation,
      categories: TICKET_CATEGORIES,
      recentCount: recent
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

app.post('/ticket/new', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');

    let recent = await getRecentCreatedCount(res.locals.user.id);
    if (recent >= 5 && !isTicketAdmin(res.locals.user)) {
      throw new ErrorMessage('您 24 小时内已创建 ' + recent + ' 个工单,达到上限(5 个)。');
    }

    let category = (req.body.category || '').trim();
    let subtype = (req.body.subtype || '').trim();
    let title = (req.body.title || '').trim();
    let description = (req.body.description || '').trim();
    let relationId = (req.body.relation_id || '').trim();

    let cfg = TICKET_CATEGORIES[category];
    if (!cfg) throw new ErrorMessage('未知工单类别。');
    if (!cfg.subtypes.find(s => s.value === subtype)) {
      throw new ErrorMessage('未知工单子类型。');
    }
    if (title.length < 5) throw new ErrorMessage('标题不能少于 5 个字符。');
    if (title.length > 200) throw new ErrorMessage('标题不能超过 200 字符。');

    let actualRelationId = relationId;
    if (cfg.relation === 'user' && category === 'user' && !relationId) {
      actualRelationId = res.locals.user.id.toString();
    }
    if (cfg.relation_required) {
      let err = await validateRelation(category, actualRelationId);
      if (err) throw new ErrorMessage(err);
    }

    let extra = {};
    if (cfg.extra_required) {
      for (let field of cfg.extra_required) {
        let v = (req.body[field] || '').trim();
        if (!v) throw new ErrorMessage('请填写「' + field + '」字段。');
        extra[field] = v;
      }
    }

    let now = parseInt((new Date()).getTime() / 1000);
    let ticket = await Ticket.create();
    ticket.category = category;
    ticket.subtype = subtype;
    ticket.title = title;
    ticket.description = description;
    ticket.creator_id = res.locals.user.id;
    ticket.assignee_id = null;
    ticket.status = 'pending';
    ticket.relation_type = cfg.relation;
    ticket.relation_id = actualRelationId ? parseInt(actualRelationId) : null;
    ticket.extra_data = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;
    ticket.is_public = false;
    ticket.created_at = now;
    ticket.updated_at = now;
    await ticket.save();

    res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 3. 工单详情 ============
app.get('/ticket/:id', async (req, res) => {
  try {
    if (!res.locals.user) {
      throw new ErrorMessage('请先登录。',
        { '登录': syzoj.utils.makeUrl(['login'], { url: req.originalUrl }) });
    }

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');

    if (!canViewTicket(res.locals.user, ticket)) {
      throw new ErrorMessage('您没有权限查看此工单。');
    }

    let isAdmin = isTicketAdmin(res.locals.user);
    let isCreator = res.locals.user.id === ticket.creator_id;

    let creator = await User.findById(ticket.creator_id);
    let assignee = ticket.assignee_id ? await User.findById(ticket.assignee_id) : null;
    let relationInfo = null;
    if (ticket.relation_type && ticket.relation_id) {
      try {
        if (ticket.relation_type === 'problem') {
          let p = await Problem.findById(ticket.relation_id);
          if (p) relationInfo = { type: 'problem', id: p.id, name: '#' + p.id + '. ' + p.title, url: syzoj.utils.makeUrl(['problem', p.id]) };
        } else if (ticket.relation_type === 'contest') {
          let c = await Contest.findById(ticket.relation_id);
          if (c) relationInfo = { type: 'contest', id: c.id, name: c.title, url: syzoj.utils.makeUrl(['contest', c.id]) };
        } else if (ticket.relation_type === 'article') {
          let a = await Article.findById(ticket.relation_id);
          if (a) relationInfo = { type: 'article', id: a.id, name: a.title, url: syzoj.utils.makeUrl(['article', a.id]) };
        } else if (ticket.relation_type === 'user') {
          let u = await User.findById(ticket.relation_id);
          if (u) relationInfo = { type: 'user', id: u.id, name: u.username, url: syzoj.utils.makeUrl(['user', u.id]) };
        }
      } catch (e) {}
    }

    let extraData = {};
    try { if (ticket.extra_data) extraData = JSON.parse(ticket.extra_data); } catch (e) {}

    let replies = await TicketReply.createQueryBuilder()
      .where('ticket_id = :id', { id: ticket.id })
      .orderBy('created_at', 'ASC')
      .getMany();

    if (!isAdmin) {
      replies = replies.filter(r => !r.is_internal);
    }

    let replyUserIds = [...new Set(replies.map(r => r.user_id))];
    let replyUserMap = {};
    if (replyUserIds.length > 0) {
      let users = await User.createQueryBuilder()
        .where('id IN (:...ids)', { ids: replyUserIds })
        .getMany();
      for (let u of users) replyUserMap[u.id] = u;
    }

    let descRendered = await syzoj.utils.markdown(ticket.description || '');
    for (let r of replies) {
      r.contentRendered = await syzoj.utils.markdown(r.content || '');
    }

    // 加载附件
    let attachments = await TicketAttachment.createQueryBuilder()
      .where('ticket_id = :id', { id: ticket.id })
      .orderBy('created_at', 'ASC')
      .getMany();

    let canReply = false;
    if (isCreator && !['closed', 'rejected', 'resolved'].includes(ticket.status)) canReply = true;
    if (isAdmin && ticket.assignee_id === res.locals.user.id) canReply = true;

    let canChangeStatus = isAdmin;
    let canWithdraw = isCreator && !['closed', 'rejected', 'resolved'].includes(ticket.status);

    res.render('ticket', {
      ticket: ticket,
      creator: creator,
      assignee: assignee,
      relationInfo: relationInfo,
      extraData: extraData,
      replies: replies,
      replyUserMap: replyUserMap,
      descRendered: descRendered,
      categories: TICKET_CATEGORIES,
      statusMeta: TICKET_STATUS,
      isAdmin: isAdmin,
      isCreator: isCreator,
      canReply: canReply,
      canChangeStatus: canChangeStatus,
      canWithdraw: canWithdraw,
      attachments: attachments,
      MAX_ATTACHMENT_FILES: MAX_FILES_PER_TICKET,
      MAX_ATTACHMENT_SIZE_MB: 20
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 4. 添加回复 ============
app.post('/ticket/:id/reply', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');
    if (!canViewTicket(res.locals.user, ticket)) {
      throw new ErrorMessage('您没有权限回复此工单。');
    }

    let isAdmin = isTicketAdmin(res.locals.user);
    let isCreator = res.locals.user.id === ticket.creator_id;

    if (['closed', 'rejected', 'resolved'].includes(ticket.status)) {
      throw new ErrorMessage('此工单已结案,不能再回复。');
    }

    if (isAdmin && !isCreator && ticket.assignee_id !== res.locals.user.id) {
      throw new ErrorMessage('请先认领此工单后再回复。');
    }

    let content = (req.body.content || '').trim();
    let isInternal = (req.body.is_internal === 'on' || req.body.is_internal === 'true');
    if (!isAdmin) isInternal = false;

    if (!content) throw new ErrorMessage('回复内容不能为空。');
    if (content.length > 50000) throw new ErrorMessage('回复内容过长。');

    let now = parseInt((new Date()).getTime() / 1000);
    let reply = await TicketReply.create();
    reply.ticket_id = ticket.id;
    reply.user_id = res.locals.user.id;
    reply.content = content;
    reply.is_internal = isInternal;
    reply.is_status_change = false;
    reply.created_at = now;
    await reply.save();

    ticket.updated_at = now;
    if (isAdmin && !isCreator && ticket.status === 'pending') {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 5. admin 改状态 ============
app.post('/ticket/:id/status', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    if (!isTicketAdmin(res.locals.user)) throw new ErrorMessage('您没有此操作权限。');

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');

    let newStatus = (req.body.status || '').trim();
    if (!TICKET_STATUS[newStatus]) throw new ErrorMessage('未知状态值。');

    if (ticket.assignee_id !== res.locals.user.id) {
      throw new ErrorMessage('请先认领此工单后再改状态。');
    }

    let oldStatus = ticket.status;
    if (oldStatus === newStatus) {
      return res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
    }

    let now = parseInt((new Date()).getTime() / 1000);
    ticket.status = newStatus;
    ticket.updated_at = now;
    await ticket.save();

    let sysReply = await TicketReply.create();
    sysReply.ticket_id = ticket.id;
    sysReply.user_id = res.locals.user.id;
    sysReply.content = '工单状态由「' + (TICKET_STATUS[oldStatus] ? TICKET_STATUS[oldStatus].label : oldStatus) +
                       '」变更为「' + TICKET_STATUS[newStatus].label + '」。';
    sysReply.is_internal = false;
    sysReply.is_status_change = true;
    sysReply.created_at = now;
    await sysReply.save();

    res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 6. admin 认领 ============
app.post('/ticket/:id/assign', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    if (!isTicketAdmin(res.locals.user)) throw new ErrorMessage('您没有此操作权限。');

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');

    let now = parseInt((new Date()).getTime() / 1000);
    let oldAssigneeId = ticket.assignee_id;
    ticket.assignee_id = res.locals.user.id;
    ticket.updated_at = now;
    if (ticket.status === 'pending') ticket.status = 'in_progress';
    await ticket.save();

    let sysReply = await TicketReply.create();
    sysReply.ticket_id = ticket.id;
    sysReply.user_id = res.locals.user.id;
    if (oldAssigneeId && oldAssigneeId !== res.locals.user.id) {
      let prev = await User.findById(oldAssigneeId);
      sysReply.content = '工单已由 ' + (prev ? prev.username : '上一个处理人') + ' 转交给 ' + res.locals.user.username + ' 处理。';
    } else {
      sysReply.content = res.locals.user.username + ' 已认领此工单。';
    }
    sysReply.is_internal = false;
    sysReply.is_status_change = true;
    sysReply.created_at = now;
    await sysReply.save();

    res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 7. 用户撤回工单 ============
app.post('/ticket/:id/withdraw', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');

    if (ticket.creator_id !== res.locals.user.id) {
      throw new ErrorMessage('您不是此工单的创建者。');
    }

    if (['closed', 'rejected', 'resolved'].includes(ticket.status)) {
      throw new ErrorMessage('此工单已结案,无需撤回。');
    }

    let now = parseInt((new Date()).getTime() / 1000);
    ticket.status = 'closed';
    ticket.updated_at = now;
    await ticket.save();

    let sysReply = await TicketReply.create();
    sysReply.ticket_id = ticket.id;
    sysReply.user_id = res.locals.user.id;
    sysReply.content = '工单创建者已撤回此工单。';
    sysReply.is_internal = false;
    sysReply.is_status_change = true;
    sysReply.created_at = now;
    await sysReply.save();

    res.redirect(syzoj.utils.makeUrl(['ticket', ticket.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 8. admin 删除工单 ============
app.post('/ticket/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');
    if (!res.locals.user.is_admin) throw new ErrorMessage('仅超级管理员可删除工单。');

    let id = parseInt(req.params.id);
    let ticket = await Ticket.findById(id);
    if (!ticket) throw new ErrorMessage('无此工单。');

    // 删附件文件
    let atts = await TicketAttachment.createQueryBuilder()
      .where('ticket_id = :id', { id: ticket.id })
      .getMany();
    for (let a of atts) {
      try { fs.unlinkSync(path.join(TICKET_UPLOAD_DIR, a.filename)); } catch(e) {}
    }
    // 删附件记录
    await TicketAttachment.createQueryBuilder()
      .delete()
      .where('ticket_id = :id', { id: ticket.id })
      .execute();

    // 删回复
    await TicketReply.createQueryBuilder()
      .delete()
      .where('ticket_id = :id', { id: ticket.id })
      .execute();

    await ticket.destroy();

    res.redirect(syzoj.utils.makeUrl(['tickets']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 9. 关联对象搜索 API ============
app.get('/api/ticket-relation-search', async (req, res) => {
  try {
    if (!res.locals.user) {
      return res.json({ results: [] });
    }

    let type = req.query.type || '';
    let q = (req.query.q || '').trim();
    if (!q || q.length < 1) return res.json({ results: [] });

    let results = [];
    if (type === 'problem') {
      let qid = parseInt(q);
      if (qid && qid > 0) {
        let p = await Problem.findById(qid);
        if (p && p.is_public) results.push({ id: p.id, name: '#' + p.id + '. ' + p.title });
      }
      if (results.length === 0 && q.length >= 2) {
        let list = await Problem.createQueryBuilder()
          .where('is_public = :pub', { pub: true })
          .andWhere('title LIKE :q', { q: '%' + q + '%' })
          .limit(10)
          .getMany();
        for (let p of list) results.push({ id: p.id, name: '#' + p.id + '. ' + p.title });
      }
    } else if (type === 'contest') {
      let qid = parseInt(q);
      if (qid && qid > 0) {
        let c = await Contest.findById(qid);
        if (c) results.push({ id: c.id, name: c.title });
      }
      if (results.length === 0 && q.length >= 2) {
        let list = await Contest.createQueryBuilder()
          .where('title LIKE :q', { q: '%' + q + '%' })
          .limit(10)
          .getMany();
        for (let c of list) results.push({ id: c.id, name: c.title });
      }
    } else if (type === 'article') {
      let qid = parseInt(q);
      if (qid && qid > 0) {
        let a = await Article.findById(qid);
        if (a) results.push({ id: a.id, name: a.title });
      }
      if (results.length === 0 && q.length >= 2) {
        let list = await Article.createQueryBuilder()
          .where('title LIKE :q', { q: '%' + q + '%' })
          .limit(10)
          .getMany();
        for (let a of list) results.push({ id: a.id, name: a.title });
      }
    } else if (type === 'user') {
      let qid = parseInt(q);
      if (qid && qid > 0) {
        let u = await User.findById(qid);
        if (u) results.push({ id: u.id, name: u.username + ' (UID ' + u.id + ')' });
      }
      if (results.length === 0 && q.length >= 1) {
        let list = await User.createQueryBuilder()
          .where('username LIKE :q', { q: '%' + q + '%' })
          .limit(10)
          .getMany();
        for (let u of list) results.push({ id: u.id, name: u.username + ' (UID ' + u.id + ')' });
      }
    }

    res.set('Cache-Control', 'no-store');
    res.json({ results: results });
  } catch (e) {
    syzoj.log(e);
    res.json({ results: [] });
  }
});

// ============ 10. 上传附件(用 SYZOJ 自带的 app.multer) ============
app.post('/ticket/:id/upload', app.multer.array('attachments', MAX_FILES_PER_TICKET), async (req, res) => {
  let savedFiles = [];
  try {
    if (!res.locals.user) {
      if (req.files) for (let f of req.files) { try { fs.unlinkSync(f.path); } catch(e){} }
      return res.status(401).json({ ok: false, message: '请先登录。' });
    }

    let ticketId = parseInt(req.params.id);
    let ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      if (req.files) for (let f of req.files) { try { fs.unlinkSync(f.path); } catch(e){} }
      return res.status(404).json({ ok: false, message: '工单不存在。' });
    }

    if (!canViewTicket(res.locals.user, ticket)) {
      if (req.files) for (let f of req.files) { try { fs.unlinkSync(f.path); } catch(e){} }
      return res.status(403).json({ ok: false, message: '无权限。' });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ ok: false, message: '未上传文件。' });
    }

    // 校验单文件大小
    for (let f of req.files) {
      if (f.size > MAX_FILE_SIZE) {
        for (let f2 of req.files) { try { fs.unlinkSync(f2.path); } catch(e){} }
        return res.json({ ok: false, message: '文件「' + f.originalname + '」超过 ' + (MAX_FILE_SIZE / 1024 / 1024) + ' MB 限制。' });
      }
    }

    let existing = await TicketAttachment.count({ where: 'ticket_id = ' + ticketId });
    if (existing + req.files.length > MAX_FILES_PER_TICKET) {
      for (let f of req.files) { try { fs.unlinkSync(f.path); } catch(e){} }
      return res.json({ ok: false, message: '此工单附件总数将超过 ' + MAX_FILES_PER_TICKET + ' 个。' });
    }

    let now = parseInt((new Date()).getTime() / 1000);
    let savedIds = [];
    for (let f of req.files) {
      let ext = path.extname(f.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, '');
      let randomName = crypto.randomBytes(16).toString('hex');
      let finalName = randomName + (ext || '');
      let finalPath = path.join(TICKET_UPLOAD_DIR, finalName);

      try {
        fs.renameSync(f.path, finalPath);
      } catch (e) {
        // 跨文件系统:先 copy 后 unlink
        fs.copyFileSync(f.path, finalPath);
        try { fs.unlinkSync(f.path); } catch(err){}
      }
      savedFiles.push(finalPath);

      let att = await TicketAttachment.create();
      att.ticket_id = ticketId;
      att.reply_id = req.body.reply_id ? parseInt(req.body.reply_id) : null;
      att.uploader_id = res.locals.user.id;
      att.filename = finalName;
      att.original_name = f.originalname;
      att.file_size = f.size;
      att.mime_type = f.mimetype || null;
      att.created_at = now;
      await att.save();
      savedIds.push(att.id);
    }

    ticket.updated_at = now;
    await ticket.save();

    res.json({ ok: true, attachment_ids: savedIds });
  } catch (e) {
    syzoj.log(e);
    for (let p of savedFiles) { try { fs.unlinkSync(p); } catch(err){} }
    if (req.files) for (let f of req.files) { try { fs.unlinkSync(f.path); } catch(err){} }
    res.status(500).json({ ok: false, message: e.message || '上传失败' });
  }
});

// ============ 11. 下载附件 ============
app.get('/ticket-attachment/:id', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');

    let id = parseInt(req.params.id);
    let att = await TicketAttachment.findById(id);
    if (!att) throw new ErrorMessage('附件不存在。');

    let ticket = await Ticket.findById(att.ticket_id);
    if (!ticket) throw new ErrorMessage('关联工单不存在。');
    if (!canViewTicket(res.locals.user, ticket)) {
      throw new ErrorMessage('您没有权限下载此附件。');
    }

    let filePath = path.join(TICKET_UPLOAD_DIR, att.filename);
    if (!fs.existsSync(filePath)) {
      throw new ErrorMessage('附件文件已丢失。');
    }

    let isImage = att.mime_type && att.mime_type.startsWith('image/');
    if (isImage) {
      res.setHeader('Content-Type', att.mime_type);
      res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(att.original_name) + '"');
    } else {
      res.setHeader('Content-Type', att.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(att.original_name) + '"');
    }
    res.setHeader('Content-Length', att.file_size);
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});

// ============ 12. 删除附件 ============
app.post('/ticket-attachment/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请先登录。');

    let id = parseInt(req.params.id);
    let att = await TicketAttachment.findById(id);
    if (!att) throw new ErrorMessage('附件不存在。');

    let ticket = await Ticket.findById(att.ticket_id);
    if (!ticket) throw new ErrorMessage('关联工单不存在。');

    let canDelete = (att.uploader_id === res.locals.user.id) || isTicketAdmin(res.locals.user);
    if (!canDelete) throw new ErrorMessage('您没有权限删除此附件。');

    let filePath = path.join(TICKET_UPLOAD_DIR, att.filename);
    try { fs.unlinkSync(filePath); } catch(e) {}
    await att.destroy();

    res.redirect(syzoj.utils.makeUrl(['ticket', att.ticket_id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', { err: e });
  }
});