# AlgoBeat Online Judge

基于 [SYZOJ](https://github.com/syzoj/syzoj) 二次开发的中文 OJ 评测 + 社区平台。在原版基础上重构 UI 框架,新增了完整的**社区互动**、**通知中心**、**关注/犇犇社交**、**工单**、**Hit 值评分**、**用户名牌子**、**邮箱验证**、**剪贴板 Markdown 编辑器**等数十个模块。

> **当前版本**:v1.7.1 · 📋 剪贴板 Markdown 实时预览编辑器 · 全本地化静态资源

近期主要里程碑(完整历史见 [#版本历史](#-版本历史)):

- **v1.7.1** · 剪贴板编辑器升级 - 左右分屏 + 实时预览 + 代码高亮 + KaTeX
- **v1.7.0** · 关注/粉丝系统 + 犇犇板块 + @ 提及通知
- **v1.6.0** · 通知中心 + 左侧 Sidebar UI 重构 + Banner 轮播系统
- **v1.5.x** · 用户名牌子 + 作弊者标签 + 提交记录管理员标记

## ✨ 主要特性

### 🎨 整体 UI(v1.6.0 重构)

参考洛谷的两栏布局,告别 SYZOJ 原版的顶部横向菜单:

- **顶部 topbar**(50px 高):logo + 站名 + 通知铃铛 + 站内信 + 用户头像
- **左侧 sidebar**(220px 宽):垂直导航(首页/题库/比赛/评测/排名/讨论/标签/工单/帮助)
- **折叠按钮**:点 ☰ 收起到 56px,localStorage 持久化偏好
- **FOUC 防护**:HTML 顶部内联 script 抢先应用折叠状态,无闪烁
- **Contest 页**:topbar 左侧固定「返回比赛」按钮
- **admin 菜单**:仍在用户头像 dropdown(后台/题解审核/公告管理/牌子管理/Banner 管理/重算 Hit/重启服务)

> ⚠️ 设计取舍:v1.6.0 取消了移动端响应式,站点固定按 1200px 桌面宽度渲染。手机用户横向滚动查看 - 我们认为这比强行压缩页面更好。

### 🔔 通知中心(v1.6.0)

完全独立于站内信的通知系统:

- 列表页 `/notifications` 支持全部/未读切换、单条已读、全部已读、删除
- header 铃铛 + **未读数 badge**
- 触发场景:
  - 题解审核**通过** / **拒绝** → 通知作者
  - 工单**公开回复**(非内部备注) → 通知工单创建者
  - 工单**状态变更** → 通知工单创建者
  - 题解评论 → 通知题解作者
  - 题解/犇犇里 @ 提及 → 通知被提及者
  - 犇犇被回复 → 通知作者
- 内置去重逻辑:`actor === recipient` 自动跳过

提供全局 API `syzoj.utils.createNotification(opts)` 给其他模块使用。

### 👥 关注/粉丝系统(v1.7.0)

单向关注模型(像微博/Twitter,无需对方同意):

- 用户主页头部「**关注 N | 粉丝 M**」(可点击进入完整列表)
- 关注按钮三态:
  - **+ 关注**(蓝)→ 没关注过
  - **✓ 已关注**(灰)→ 单向关注
  - **↔ 互相关注**(绿)→ 互关
- 列表页 `/user/<id>/following` 和 `/user/<id>/followers`
- 取关需要 confirm;不能关注自己;无关注上限
- 关注事件**不**通知被关注者(保持安静)

中间件 `_user_follow_loader.js` 在 `/user/:id*` 路由前自动注入 `res.locals.followStats` + `followRelation`。

### 💬 犇犇板块(v1.7.0)

类微博的短文社交,深度集成关注/通知系统:

- **发布**:500 字以内文字 + 最多 **9 张图**(JPG/PNG/WebP/GIF 各 5MB);`Ctrl+Enter` 快速发送
- **回复**:单层结构,嵌套自动 fold 回原创
- **可见性规则**:
  - 作者本人 + **关注作者者** + admin/manage_user 权限者可见
  - **取关后立即不可见**(查询时实时判断)
- **删除**:软删除(`is_deleted=1`),回复保留;作者本人 + admin/manage_user 可删
- **信息流 tabs**:我关注的 / 我发布的 / 全部(管理 - 仅 admin)
- 文字内 `@username` 自动转链接,触发被提及通知
- 用户名渲染跟全站一致(颜色 + 牌子 tag)
- 首页公告下方集成 AJAX feed

### 📋 个人剪贴板(v1.7.1 升级)

代码模板 / 笔记 / 题解草稿的私人空间,Markdown 实时预览:

- **左右分屏编辑器**:左侧 Markdown 编辑 + 右侧实时预览
- **代码高亮**:highlight.js(支持 C/C++/Python/JS/Go 等主流语言)
- **数学公式**:KaTeX($E = mc^2$、行内公式、块级公式、矩阵)
- 滚动同步、字数 / 行数实时统计
- 三种可见性:
  - **私有**:仅自己可见
  - **公开**:出现在用户公开列表
  - **分享链接**:凭 token 访问,可设过期时间(0 = 永久)
- 单条内容 100 KB 上限
- **全本地化**:markdown-it + highlight.js + KaTeX 库**全部下载到自家服务器**(`/self/lib/`),不依赖任何 CDN

### 🏷️ 用户名牌子系统(v1.5.0)

参考洛谷设计的荣誉徽章:

- **管理员自动获得**:拥有 is_admin 或 manage_problem/manage_problem_tag/manage_user 任一权限的用户**自动**获得 tag 权限,默认显示「管理员」
- **手动授权**:超级管理员可在 `/admin/user-tags` 管理界面授予普通用户 tag 权限
- **个性化设置**:用户可在 `/edit` 自定义 tag 文字(最多 12 字符)和展示开关
- **颜色一致**:tag 颜色与用户名颜色档完全一致(管理员紫、Hit 值红/橙/绿/蓝/灰)
- **管理权限取消后** tag 权限保留;**超级管理员**可撤销任意非超管用户的 tag 权限
- **审计完整**:所有授权/撤销操作记录授权超管 ID + 时间戳

### 🛡️ 作弊者标签(v1.5.0)

惩罚维度上的"标签",跟荣誉 tag 是两个独立系统:

- 任何用户**至少有一条 `judge_state_admin_action.action_type='cheated'` 记录**时,自动:
  - 用户名颜色变为**棕色 + 删除线**(覆盖所有 tier)
  - 强制显示「作弊者」棕色 tag(覆盖任何荣誉 tag)
- **作弊判定撤销后**自动恢复(60 秒内缓存刷新)
- **管理员豁免**:管理员被标记 cheated 时无任何视觉变化
- **荣誉 tag 不消失**:即使被授权用户被标 cheater,他在 /edit 仍可设置 tag,作弊状态被撤销后立即恢复

### 🎫 工单系统(v1.4.0)

参照洛谷工单设计,覆盖 6 大类别:

| 大类 | 子类型 |
|---|---|
| 题目工单 | 题目综合 / 文本修缮 / 改进标签、难度 |
| 比赛工单 | 申请公开赛 |
| 文章工单 | 申请题解相关 / 撤销题解相关 |
| 用户工单 | 用户申诉 / 申请权限变更 / 申请解除封禁 |
| 举报工单 | 举报用户(强制要求填写举报原因) |
| 综合问题 | 建议或 bug 反馈 / 学术建议 / 一般咨询 |

支持附件上传(单文件 20MB,每工单最多 10 个附件,任意类型),支持 admin 内部备注、用户撤回、5 状态流转、24h 5 个工单频率限制。**回复 / 状态变更触发通知中心通知。**

### 🛡️ 提交记录管理员标记(v1.4.0)

管理员可在任意提交详情页**标记**为「作弊」或「已取消」,自动:

- 同步 ac_num 增减
- 排除 Hit 值计算
- 触发用户名牌子的"作弊者"识别
- 完全可撤销(撤销时反向修正)

v1.5.1 加入「重新评测」按钮,可对单条提交重测。

### 🎯 Hit 值评分系统(v1.3.x)

平台用一套加权公式(满分 400)刻画每位用户的综合活跃度:

| 维度 | 满分 | 主要因素 |
|---|---|---|
| 基础信用分 | 100 | 邮箱验证、信息完善、注册时长、参赛门槛 |
| 社区贡献分 | 100 | 通过审核的题解数、出题数 |
| 比赛参与分 | 100 | 参赛活跃度(30 天半衰减) |
| 题目练习分 | 100 | AC 题目数、知识点覆盖(14 天半衰减) |

每天凌晨自动重算 + 管理员可手动触发即时重算。用户主页 Hit 值卡片支持隐藏。

### 🎨 用户名颜色分档(v1.3.2)

| Hit 值 | 颜色 | 称号 |
|---|---|---|
| 0–99 | 灰 | 萌新 |
| 100–199 | 蓝 | 业余 |
| 200–279 | 绿 | 进阶 |
| 280–349 | 橙 | 高手 |
| 350–400 | 红 | 大神 |
| — | 紫 | 站点管理者 |
| — | 棕(删除线) | 作弊者 |

颜色全站统一渲染,包括 SYZOJ 自带页面 + Vue 动态组件。

### 🖼️ 首页改版(v1.6.0)

参考洛谷的"门户化"首页:

- 顶部:**Banner 轮播**(左 2/3 宽) + 右侧栏「近期比赛」+「一言」
- 公告区(底部左 2/3 宽,带样式分级)
- 公告下方:**犇犇 feed widget**(发布表单 + tabs + AJAX 列表)
- 右侧栏:搜索题目 + 友情链接

### 🎯 Banner 轮播 + 后台管理(v1.6.0)

`/admin/banners` 完整管理界面:

- 上传图片:JPG / PNG / WebP / GIF 各 5MB
- 配置:标题、可选**跳转链接**、排序、启用开关、生效时间段
- 留空跳转链接则点击不跳转
- 首页轮播:多张图 5 秒/张自动播放、鼠标 hover 暂停、左右箭头切换、底部圆点定位
- 图片存储:`/app/static/self/banner`(host bind-mount 到 `./custom/uploads/banner`)

### 📊 排名页双 Tab

`/ranklist` 顶部支持切换 **Rating 排名** 与 **Hit 值排名**,左侧均显示用户头像(v1.5.0 新增)。

### 📈 Hit 值历史趋势

用户主页绘制 4 维度近 30 天趋势折线图,使用 Chart.js。历史数据保留 90 天。

### 📑 标签库浏览

顶部「标签」入口,按颜色分类展示站内全部标签。

### 📝 题解系统(v1.2.1 起,v1.6.0 补充审核员显示)

- 用户可投稿题解,支持 Markdown
- 投稿默认进入审核状态
- 审核者可在 `/admin/solutions` 集中处理
- 审核者可按题禁止/恢复题解投稿
- **审核员信息公开化**(v1.6.0):
  - 题解详情页:显示「**审核员**: xxx · 审核时间」
  - 管理员审核列表:增加「**处理人**」列
- 题解评论支持 @ 提及(v1.7.0)
- 评论自动通知题解作者(v1.7.0)

### 📢 站内公告系统

- 三个级别(信息 / 警告 / 重要)
- 用户访问首页自动弹窗
- 「不再弹出」选项(按浏览器 localStorage 记录)

### 💬 站内信(v1.3.1)

- 一对一私信,支持 Markdown
- 右上角信封图标显示未读数
- 用户可关闭来自他人的私信

### 📧 邮箱验证(v1.3.2)

- 通过 SMTP(默认 Zoho)发送验证邮件
- 24 小时有效期 + 60 秒发送冷却
- 未验证用户不能投稿题解、发送站内信

### 🛠 站点定制与体验改进

- 容器全部 `TZ=Asia/Shanghai`
- 修复 RabbitMQ healthcheck 超时启动失败
- 修复 cgroup v2 系统下 judge runner 启动失败
- 主页左上角自定义 logo + 文字
- 自定义 favicon + 页脚(含 ICP 备案号、版本号、GitHub 链接)
- gravatar 头像源切换至更稳定镜像
- **静态资源全本地化**(v1.7.1):markdown-it + highlight.js + KaTeX 直接挂载在 `/self/lib/`

## 🚀 快速部署

### 系统要求

- Linux 服务器(推荐 Ubuntu 22.04+)
- Docker 20.10+ 和 Docker Compose v2
- **必须使用 cgroup v1**(judge runner 依赖 simple-sandbox,不兼容 cgroup v2)

如果你的系统默认是 cgroup v2,编辑 `/etc/default/grub`,在 `GRUB_CMDLINE_LINUX` 追加 `systemd.unified_cgroup_hierarchy=0`,然后 `update-grub && reboot`。

### 部署步骤

```bash
# 1. 克隆仓库
git clone git@github.com:ZemuZzz/AlgoBeatOnlineJudge.git
cd AlgoBeatOnlineJudge

# 2. 生成密钥配置
cp env-app.example env-app
vim env-app

# 3. 安装 nodemailer 依赖(用于邮箱验证)
mkdir -p custom/node_modules
docker run --rm -v $(pwd)/custom:/work -w /work node:14 npm install nodemailer@6.9.7

# 4. 创建运行时上传目录
mkdir -p custom/uploads/tickets
mkdir -p custom/uploads/banner
mkdir -p custom/uploads/benben

# 5. 下载本地化静态库(v1.7.1)
mkdir -p custom/static-libs/fonts
cd /tmp
# markdown-it
curl -L -o md.tgz https://registry.npmmirror.com/markdown-it/-/markdown-it-14.1.0.tgz
tar xzf md.tgz && cp package/dist/markdown-it.min.js ../custom/static-libs/markdown-it.min.js && rm -rf package md.tgz
# highlight.js
curl -L -o hl.tgz https://registry.npmmirror.com/@highlightjs/cdn-assets/-/cdn-assets-11.10.0.tgz
tar xzf hl.tgz
cp package/highlight.min.js ../custom/static-libs/highlight.min.js
cp package/styles/atom-one-light.min.css ../custom/static-libs/highlight-atom-one-light.min.css
rm -rf package hl.tgz
# katex
curl -L -o katex.tgz https://registry.npmmirror.com/katex/-/katex-0.16.11.tgz
tar xzf katex.tgz
cp package/dist/katex.min.js ../custom/static-libs/katex.min.js
cp package/dist/katex.min.css ../custom/static-libs/katex.min.css
cp package/dist/contrib/auto-render.min.js ../custom/static-libs/katex-auto-render.min.js
cp -r package/dist/fonts/* ../custom/static-libs/fonts/
rm -rf package katex.tgz
cd -

# 6. 启动服务
docker compose up -d

# 7. 创建管理员账号(注册账号后)
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj \
  -e "UPDATE \`user\` SET is_admin = 1 WHERE username = '你的用户名';"

# 8. 初始化业务数据表(见下方 SQL 脚本)
```

### SQL 初始化脚本

```bash
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj <<'EOF'
-- ============ v1.2.x: 题解 / 评论 / 投稿开关 ============
CREATE TABLE IF NOT EXISTS `problem_solution` (
  `id` INT NOT NULL AUTO_INCREMENT, `title` VARCHAR(80) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL, `problem_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL, `status` VARCHAR(20) DEFAULT 'pending',
  `public_time` INT DEFAULT NULL, `update_time` INT DEFAULT NULL,
  `reject_reason` VARCHAR(255) DEFAULT NULL, `allow_comment` BOOLEAN DEFAULT TRUE,
  `comments_num` INT DEFAULT 0,
  `reviewer_id` INT DEFAULT NULL, `reviewed_at` INT DEFAULT NULL,  -- v1.6.0 新增
  PRIMARY KEY (`id`),
  KEY `idx_problem_id` (`problem_id`), KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`), KEY `idx_problem_status` (`problem_id`, `status`),
  KEY `idx_reviewer` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `problem_solution_comment` (
  `id` INT NOT NULL AUTO_INCREMENT, `content` TEXT DEFAULT NULL,
  `solution_id` INT DEFAULT NULL, `user_id` INT DEFAULT NULL,
  `public_time` INT DEFAULT NULL, PRIMARY KEY (`id`),
  KEY `idx_solution_id` (`solution_id`), KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `problem_solution_setting` (
  `problem_id` INT NOT NULL, `disable_submission` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL, `updated_by` INT DEFAULT NULL,
  PRIMARY KEY (`problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ v1.3.x: 公告 / 站内信 / 剪贴板 / 邮箱验证 / Hit 值 ============
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` INT NOT NULL AUTO_INCREMENT, `title` VARCHAR(120) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL, `level` VARCHAR(20) DEFAULT 'info',
  `start_time` INT DEFAULT NULL, `end_time` INT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE, `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`id`),
  KEY `idx_active_time` (`is_active`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `private_message` (
  `id` INT NOT NULL AUTO_INCREMENT, `sender_id` INT DEFAULT NULL,
  `receiver_id` INT DEFAULT NULL, `content` TEXT DEFAULT NULL,
  `public_time` INT DEFAULT NULL, `is_read` BOOLEAN DEFAULT FALSE,
  `sender_deleted` BOOLEAN DEFAULT FALSE, `receiver_deleted` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`), KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`), KEY `idx_pair` (`sender_id`, `receiver_id`),
  KEY `idx_unread` (`receiver_id`, `is_read`, `receiver_deleted`),
  KEY `idx_time` (`public_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_message_setting` (
  `user_id` INT NOT NULL, `disable_messages` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `clipboard_item` (
  `id` INT NOT NULL AUTO_INCREMENT, `user_id` INT DEFAULT NULL,
  `title` VARCHAR(120) DEFAULT NULL, `content` MEDIUMTEXT DEFAULT NULL,
  `visibility` VARCHAR(20) DEFAULT 'private', `share_token` VARCHAR(40) DEFAULT NULL,
  `share_expires` INT DEFAULT NULL, `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_visibility` (`visibility`),
  UNIQUE KEY `uniq_share_token` (`share_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `email_verification_token` (
  `token` VARCHAR(64) NOT NULL, `user_id` INT NOT NULL,
  `email` VARCHAR(120) DEFAULT NULL, `purpose` VARCHAR(20) DEFAULT 'register',
  `created_at` INT DEFAULT NULL, `expires_at` INT DEFAULT NULL,
  `used` BOOLEAN DEFAULT FALSE, PRIMARY KEY (`token`),
  KEY `idx_user_id` (`user_id`), KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_email_status` (
  `user_id` INT NOT NULL, `is_email_verified` BOOLEAN DEFAULT FALSE,
  `verified_at` INT DEFAULT NULL, `last_send_at` INT DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_hit_score` (
  `user_id` INT NOT NULL, `total` INT DEFAULT 0,
  `basic_score` INT DEFAULT 0, `contribution_score` INT DEFAULT 0,
  `contest_score` INT DEFAULT 0, `practice_score` INT DEFAULT 0,
  `last_calc_at` INT DEFAULT NULL, PRIMARY KEY (`user_id`),
  KEY `idx_total` (`total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_hit_score_history` (
  `id` INT NOT NULL AUTO_INCREMENT, `user_id` INT NOT NULL,
  `total` INT DEFAULT 0, `basic_score` INT DEFAULT 0,
  `contribution_score` INT DEFAULT 0, `contest_score` INT DEFAULT 0,
  `practice_score` INT DEFAULT 0, `recorded_at` INT NOT NULL,
  PRIMARY KEY (`id`), KEY `idx_user_time` (`user_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_hit_setting` (
  `user_id` INT NOT NULL, `hide_hit` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ v1.4.x: 工单 / 提交记录管理员标记 ============
CREATE TABLE IF NOT EXISTS `judge_state_admin_action` (
  `judge_id` INT NOT NULL, `action_type` VARCHAR(20) NOT NULL,
  `operator_id` INT NOT NULL, `operator_time` INT NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL, `was_accepted` BOOLEAN DEFAULT FALSE,
  `affected_problem_id` INT DEFAULT NULL, `affected_user_id` INT DEFAULT NULL,
  PRIMARY KEY (`judge_id`),
  KEY `idx_user_action` (`affected_user_id`, `action_type`),
  KEY `idx_problem_user` (`affected_problem_id`, `affected_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket` (
  `id` INT NOT NULL AUTO_INCREMENT, `category` VARCHAR(20) NOT NULL,
  `subtype` VARCHAR(60) NOT NULL, `title` VARCHAR(200) NOT NULL,
  `description` MEDIUMTEXT, `creator_id` INT NOT NULL,
  `assignee_id` INT DEFAULT NULL, `status` VARCHAR(20) DEFAULT 'pending',
  `relation_type` VARCHAR(20) DEFAULT NULL, `relation_id` INT DEFAULT NULL,
  `extra_data` TEXT, `is_public` BOOLEAN DEFAULT FALSE,
  `created_at` INT NOT NULL, `updated_at` INT NOT NULL,
  PRIMARY KEY (`id`), KEY `idx_creator` (`creator_id`),
  KEY `idx_status` (`status`), KEY `idx_category` (`category`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_relation` (`relation_type`, `relation_id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket_reply` (
  `id` INT NOT NULL AUTO_INCREMENT, `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL, `content` MEDIUMTEXT NOT NULL,
  `is_internal` BOOLEAN DEFAULT FALSE, `is_status_change` BOOLEAN DEFAULT FALSE,
  `created_at` INT NOT NULL, PRIMARY KEY (`id`),
  KEY `idx_ticket` (`ticket_id`), KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ticket_attachment` (
  `id` INT NOT NULL AUTO_INCREMENT, `ticket_id` INT NOT NULL,
  `reply_id` INT DEFAULT NULL, `uploader_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL, `original_name` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL, `mime_type` VARCHAR(120),
  `created_at` INT NOT NULL, PRIMARY KEY (`id`),
  KEY `idx_ticket` (`ticket_id`), KEY `idx_reply` (`reply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ v1.5.x: 用户名牌子 ============
CREATE TABLE IF NOT EXISTS `user_tag` (
  `user_id` INT NOT NULL,
  `tag_text` VARCHAR(12) DEFAULT '',
  `is_visible` BOOLEAN DEFAULT TRUE,
  `granted_by` INT DEFAULT NULL, `granted_at` INT DEFAULT NULL,
  `is_disabled` BOOLEAN DEFAULT FALSE,
  `disabled_by` INT DEFAULT NULL, `disabled_at` INT DEFAULT NULL,
  `disabled_reason` VARCHAR(255) DEFAULT NULL,
  `updated_at` INT DEFAULT NULL, PRIMARY KEY (`user_id`),
  KEY `idx_disabled` (`is_disabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ v1.6.0: 通知中心 + Banner ============
CREATE TABLE IF NOT EXISTS `notification` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recipient_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `source_url` VARCHAR(500),
  `source_id` INT,
  `actor_id` INT,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` INT NOT NULL,
  `read_at` INT,
  PRIMARY KEY (`id`),
  KEY `idx_recipient_unread` (`recipient_id`, `is_read`),
  KEY `idx_recipient_created` (`recipient_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `homepage_banner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `link_url` VARCHAR(500),
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `start_time` INT, `end_time` INT,
  `created_by` INT, `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_active_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ v1.7.0: 关注/粉丝 + 犇犇 ============
CREATE TABLE IF NOT EXISTS `user_follow` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `follower_id` INT NOT NULL,
  `followee_id` INT NOT NULL,
  `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_follow` (`follower_id`, `followee_id`),
  KEY `idx_followee` (`followee_id`),
  KEY `idx_follower` (`follower_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `benben_post` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `reply_to` INT,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_reply_to` (`reply_to`),
  KEY `idx_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `benben_image` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255),
  `uploader_id` INT NOT NULL,
  `file_size` INT,
  `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
EOF
```

### 启动后访问

默认监听端口 `4567`:`http://你的服务器IP:4567`

## 📁 仓库结构

```
.
├── docker-compose.yml              # 主部署配置
├── env-app.example                 # 密钥模板
├── env                             # 项目级环境变量
├── .gitignore
├── README.md
└── custom/                         # 所有自定义代码与资源
├── header.ejs                  # 顶部 topbar + sidebar 渲染入口
├── sidebar.css / sidebar.js    # v1.6.0 sidebar 布局 + 折叠逻辑
├── mobile.css                  # v1.6.0 (空文件,移动端适配已取消)
├── username_tiers.css          # 用户名颜色档 + tag 样式
├── web.json                    # 站点配置
├── favicon.png / logo.png
├── static-libs/                # v1.7.1 本地化 npm 包
│   ├── markdown-it.min.js
│   ├── highlight.min.js + .css
│   ├── katex.min.js + .css + auto-render
│   └── fonts/                  # KaTeX 字体
├── uploads/                    # 运行时上传
│   ├── tickets/                # v1.4.0 工单附件
│   ├── banner/                 # v1.6.0 banner 图片
│   └── benben/                 # v1.7.0 犇犇图片
├── views/                      # 页面模板(EJS)
├── modules/                    # 路由模块(JS)
│   ├── _user_privilege_loader.js  # 中间件:注入 privileges 到 res.locals
│   ├── _user_follow_loader.js     # v1.7.0 注入 follow 状态
│   ├── _user_tag_loader.js        # 注入 tag 状态
│   ├── _username_cache.js         # 全局用户名缓存(60s 刷新)
│   ├── _username_renderer.js      # 全局 syzoj.utils.renderUsername
│   ├── _user_tag.js               # tag 后台路由
│   ├── __hit_score_engine.js      # Hit 值计算引擎
│   ├── ticket.js                  # 工单系统
│   ├── notification.js            # v1.6.0 通知中心
│   ├── banner.js                  # v1.6.0 banner 后台
│   ├── user_follow.js             # v1.7.0 关注/粉丝
│   ├── benben.js                  # v1.7.0 犇犇板块
│   ├── solution.js                # 题解系统
│   ├── message.js                 # 站内信
│   └── clipboard.js               # 个人剪贴板
├── models-built/                  # 编译后的 typeorm model(.js)
└── models/                        # ts 占位文件(用于 SYZOJ readdirSync 注册)## 🔧 常用维护命令
```

```bash
# 启动 / 重启 / 停止
docker compose up -d                       # 启动或应用配置变更
docker compose up -d --force-recreate web  # 改了挂载后强制重建
docker compose restart web                 # 仅重启 web(改 EJS/JS 后用)

# 查看状态和日志
docker logs --tail 100 algobeat-web-1
docker logs -f algobeat-web-1              # 实时跟随

# 进容器调试
docker exec -it algobeat-web-1 bash
docker exec -it algobeat-mariadb-1 mariadb -u root syzoj
```

## 📦 版本历史

完整版本说明详见 [Releases](https://github.com/ZemuZzz/AlgoBeatOnlineJudge/releases)。

- **v1.7.1**:剪贴板 Markdown 编辑器升级·左侧编辑右侧实时预览·代码高亮·KaTeX 公式·查看页同步渲染·所有库本地化(自 host /self/lib/)
- **v1.7.0**:关注/粉丝系统(含互关标识)·犇犇板块(多图发布 + 回复 + @ 提及)·@ 提及通知(题解评论/犇犇)·题解评论通知作者·首页集成犇犇 feed
- **v1.6.0**:通知中心(铃铛 + 未读数 + 多触发器)·左侧 sidebar(洛谷风格)UI 重构·FOUC 防护·首页 banner 轮播系统(含 admin 后台)·首页重新设计·题解审核员显示
- **v1.5.1**:单条提交操作完整化·重新评测按钮·作弊判定的完整后果(榜单清零 + 沉底 + Hit 值剔除作弊比赛)·取消评测严格实现·全局 success.ejs 模板
- **v1.5.0**:用户名牌子系统·作弊者标签·排行榜头像·修复 admin-cache 漏 super admin bug
- **v1.4.0**:工单系统(6 大类 + 附件上传)·比赛删除·提交记录作弊/取消标记·关闭投稿确认框 bug 修复
- **v1.3.4**:Hit 值系统完整收官·颜色档全店生效·近 30 天趋势折线图·`/ranklist` 双 Tab
- **v1.3.3**:Hit 值计算引擎·用户主页卡片·隐藏开关·帮助页
- **v1.3.2**:邮箱验证(Zoho SMTP)·用户名颜色档基础(紫色管理员)
- **v1.3.1**:题解评论区·公告系统·站内信·个人剪贴板·题解提交开关
- **v1.2.1**:首版正式发布(标签库、题解系统、审核流程)

## 📜 许可

本项目放弃继承 SYZOJ 的 [MIT License](https://github.com/syzoj/syzoj/blob/master/LICENSE)，目前使用 APL 2.0 开源协议。

## 🙏 致谢

- 原版 [SYZOJ](https://github.com/syzoj/syzoj) 提供了完整的 OJ 基础架构
- ZemuZzz 主导了所有定制功能的设计与实现
- 以及所有为 Algo Beat Contest 出题组 / 开发组贡献的成员

---

Powered by SYZOJ. Modified by **Zemu (UnratedCheater)**.
