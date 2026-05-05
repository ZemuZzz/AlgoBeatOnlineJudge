# AlgoBeat Online Judge

基于 [SYZOJ](https://github.com/syzoj/syzoj) 二次开发的在线评测平台，在原版基础上新增了 **Hit 值评分系统**、**用户名颜色分档**、**邮箱验证**、**题解 / 评论 / 站内信 / 公告 / 个人剪贴板**等多项社区互动模块。

> **当前版本**：v1.3.4 · 🎯 Hit 值系统完整上线

## ✨ 主要特性

### 🎯 Hit 值评分系统

平台用一套加权公式（满分 400）刻画每位用户的综合活跃度：

| 维度 | 满分 | 主要因素 |
|---|---|---|
| 基础信用分 | 100 | 邮箱验证、信息完善、注册时长、参赛门槛 |
| 社区贡献分 | 100 | 通过审核的题解数、出题数 |
| 比赛参与分 | 100 | 参赛活跃度（30 天半衰减） |
| 题目练习分 | 100 | AC 题目数、知识点覆盖（14 天半衰减） |

- 每天凌晨自动重算 + 管理员可手动触发即时重算
- 90 天历史记录保留，用户主页绘制 4 维度近 30 天**趋势折线图**
- 用户主页 Hit 值卡片，可一键隐藏（不影响后台计算）
- 帮助页 [`/help/hit-value`](#) 详细说明算法

### 🎨 用户名颜色分档

| Hit 值 | 颜色 | 称号 |
|---|---|---|
| 0–99 | 灰 | 萌新 |
| 100–199 | 蓝 | 业余 |
| 200–279 | 绿 | 进阶 |
| 280–349 | 橙 | 高手 |
| 350–400 | 红 | 大神 |
| — | 紫 | 站点管理者（独立判定，覆盖 Hit 值） |

颜色全站统一渲染，包括 SYZOJ 自带页面（讨论 / 排名 / 文章 / 提交记录等）+ Vue 动态组件（提交列表）。

### 📊 排名页双 Tab

`/ranklist` 顶部支持切换 **Rating 排名** 与 **Hit 值排名**，互不干扰。

### 📑 标签库浏览

顶部「标签」入口，按颜色分类展示站内全部标签（题目来源 / 算法大类 / 算法细目 / 题目类型 / 题目难度），点击直达该标签筛选页。

### 📝 题解系统

- 题目页「题解」按钮（位于「讨论」右侧）
- 用户可投稿题解，支持 Markdown
- 投稿默认进入审核状态，仅作者本人和审核者可见
- 审核者可在 `/admin/solutions` 集中处理（通过 / 拒绝 / 改判）
- 投稿者可主动撤回
- 已通过题解下方有评论区，作者可关闭单篇评论
- 审核者可按题禁止/恢复题解投稿（已通过的题解保持可见）

### 📢 站内公告系统

- 管理员可发布站内公告（信息 / 警告 / 重要 三个级别）
- 用户访问首页自动弹窗展示生效公告
- 「不再弹出」选项（按浏览器记录）
- 多条公告依次弹出

### 💬 站内信

- 一对一私信，支持 Markdown
- 右上角信封图标显示未读数，进入对话自动标已读
- 按用户名或 UID 搜索收件人
- 用户可关闭来自他人的私信（管理员除外）
- 消息可单条删除或清空整段对话历史（软删，不影响对方副本）

### 📋 个人剪贴板

- 保存代码模板、常用片段（单条上限 100 KB）
- 三种可见性：私有 / 公开 / 分享链接（可设过期时间）
- 分享链接可随时重新生成（旧链接立即失效）

### 📧 邮箱验证

- 通过 SMTP（默认 Zoho）发送验证邮件
- 24 小时有效期 + 60 秒发送冷却
- 未验证用户不能投稿题解、发送站内信（管理员豁免）
- 个人资料页可主动发起验证

### 🛠 站点定制与体验改进

- 容器全部 `TZ=Asia/Shanghai`
- 修复 RabbitMQ healthcheck 超时启动失败
- 修复 cgroup v2 系统下 judge runner 启动失败
- 主页左上角自定义 logo + 文字
- 自定义 favicon + 页脚（含 ICP 备案号、版本号、GitHub 链接）
- gravatar 头像源切换至更稳定镜像

## 🚀 快速部署

### 系统要求

- Linux 服务器（推荐 Ubuntu 22.04+）
- Docker 20.10+ 和 Docker Compose v2
- **必须使用 cgroup v1**（judge runner 依赖 simple-sandbox，不兼容 cgroup v2）

如果你的系统默认是 cgroup v2，编辑 `/etc/default/grub`，在 `GRUB_CMDLINE_LINUX` 追加 `systemd.unified_cgroup_hierarchy=0`，然后 `update-grub && reboot`。

### 部署步骤

#### 1. 克隆本仓库

```bash
git clone git@github.com:ZemuZzz/AlgoBeatOnlineJudge.git
cd AlgoBeatOnlineJudge
```

#### 2. 生成密钥配置

```bash
cp env-app.example env-app
vim env-app
```

把里面 `请替换为...` 类占位用 `openssl rand -hex 32` 生成的随机值替换。
如启用邮箱验证，同时填写 SMTP 五项配置（详见 `env-app.example`）。

#### 3. 安装 nodemailer 依赖（用于邮箱验证）

```bash
mkdir -p custom/node_modules
docker run --rm -v $(pwd)/custom:/work -w /work node:14 npm install nodemailer@6.9.7
```

#### 4. 启动服务

```bash
docker compose up -d
```

首次启动会拉取镜像并初始化数据库，约需 1-2 分钟。

#### 5. 创建初始管理员

注册账号后，进数据库设为管理员：

```bash
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj \
  -e "UPDATE \`user\` SET is_admin = 1 WHERE username = '你的用户名';"
```

#### 6. 初始化业务数据表

```bash
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj <<'EOF'
-- 题解
CREATE TABLE IF NOT EXISTS `problem_solution` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(80) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL,
  `problem_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL,
  `reject_reason` VARCHAR(255) DEFAULT NULL,
  `allow_comment` BOOLEAN DEFAULT TRUE,
  `comments_num` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_problem_id` (`problem_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_problem_status` (`problem_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 题解评论
CREATE TABLE IF NOT EXISTS `problem_solution_comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` TEXT DEFAULT NULL,
  `solution_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `public_time` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_solution_id` (`solution_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 题解提交开关
CREATE TABLE IF NOT EXISTS `problem_solution_setting` (
  `problem_id` INT NOT NULL,
  `disable_submission` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL,
  `updated_by` INT DEFAULT NULL,
  PRIMARY KEY (`problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 站内公告
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(120) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL,
  `level` VARCHAR(20) DEFAULT 'info',
  `start_time` INT DEFAULT NULL,
  `end_time` INT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_active_time` (`is_active`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 私信
CREATE TABLE IF NOT EXISTS `private_message` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sender_id` INT DEFAULT NULL,
  `receiver_id` INT DEFAULT NULL,
  `content` TEXT DEFAULT NULL,
  `public_time` INT DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `sender_deleted` BOOLEAN DEFAULT FALSE,
  `receiver_deleted` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_pair` (`sender_id`, `receiver_id`),
  KEY `idx_unread` (`receiver_id`, `is_read`, `receiver_deleted`),
  KEY `idx_time` (`public_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户私信设置
CREATE TABLE IF NOT EXISTS `user_message_setting` (
  `user_id` INT NOT NULL,
  `disable_messages` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 个人剪贴板
CREATE TABLE IF NOT EXISTS `clipboard_item` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `title` VARCHAR(120) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL,
  `visibility` VARCHAR(20) DEFAULT 'private',
  `share_token` VARCHAR(40) DEFAULT NULL,
  `share_expires` INT DEFAULT NULL,
  `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_visibility` (`visibility`),
  UNIQUE KEY `uniq_share_token` (`share_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 邮箱验证
CREATE TABLE IF NOT EXISTS `email_verification_token` (
  `token` VARCHAR(64) NOT NULL,
  `user_id` INT NOT NULL,
  `email` VARCHAR(120) DEFAULT NULL,
  `purpose` VARCHAR(20) DEFAULT 'register',
  `created_at` INT DEFAULT NULL,
  `expires_at` INT DEFAULT NULL,
  `used` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_email_status` (
  `user_id` INT NOT NULL,
  `is_email_verified` BOOLEAN DEFAULT FALSE,
  `verified_at` INT DEFAULT NULL,
  `last_send_at` INT DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hit 值缓存
CREATE TABLE IF NOT EXISTS `user_hit_score` (
  `user_id` INT NOT NULL,
  `total` INT DEFAULT 0,
  `basic_score` INT DEFAULT 0,
  `contribution_score` INT DEFAULT 0,
  `contest_score` INT DEFAULT 0,
  `practice_score` INT DEFAULT 0,
  `last_calc_at` INT DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_total` (`total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hit 值历史
CREATE TABLE IF NOT EXISTS `user_hit_score_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `total` INT DEFAULT 0,
  `basic_score` INT DEFAULT 0,
  `contribution_score` INT DEFAULT 0,
  `contest_score` INT DEFAULT 0,
  `practice_score` INT DEFAULT 0,
  `recorded_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hit 卡片显示设置
CREATE TABLE IF NOT EXISTS `user_hit_setting` (
  `user_id` INT NOT NULL,
  `hide_hit` BOOLEAN DEFAULT FALSE,
  `update_time` INT DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
EOF
```

#### 7. 访问站点

默认监听端口 `4567`：`http://你的服务器IP:4567`
如需修改端口，编辑 `docker-compose.yml` 中 web 服务的 `ports`。

## 📁 仓库结构

```
.
├── docker-compose.yml              # 主部署配置
├── env-app.example                 # 密钥模板
├── env                             # 项目级环境变量
├── .gitignore
├── README.md
└── custom/                         # 所有自定义代码与资源
    ├── header.ejs                  # 顶部导航 + 全局 JS 注入(用户名颜色)
    ├── username_tiers.css          # 用户名颜色档样式
    ├── web.json                    # 站点配置(标题、gravatar 等)
    ├── favicon.png / logo.png
    ├── views/
    │   ├── tags.ejs                # 标签分类页
    │   ├── footer.ejs / index.ejs / problem.ejs
    │   ├── solutions.ejs / solution.ejs / solution_edit.ejs / admin_solutions.ejs
    │   ├── admin_announcements.ejs / admin_announcement_edit.ejs
    │   ├── messages_inbox.ejs / messages_conversation.ejs / messages_new.ejs / messages_settings.ejs
    │   ├── clipboard_list.ejs / clipboard_view.ejs / clipboard_edit.ejs
    │   ├── email_verify_pending.ejs / email_verify_result.ejs / user_edit.ejs
    │   ├── help_hit_value.ejs      # Hit 值帮助页
    │   ├── user.ejs                # 含 Hit 卡片 + 趋势图
    │   ├── ranklist.ejs            # 双 Tab(Rating/Hit)
    │   ├── submissions_item.ejs    # Vue 组件,接入 Hit 颜色
    │   ├── article.ejs / discussion.ejs / contest_ranklist.ejs / statistics.ejs
    ├── modules/
    │   ├── _username_cache.js      # 管理员 id 全局缓存(60s 刷新)
    │   ├── _username_renderer.js   # renderUsername helper
    │   ├── _user_privilege_loader.js  # 注入 user.privileges + 未读数等
    │   ├── _ranklist.js            # 双 Tab 排名路由(替换 SYZOJ 自带)
    │   ├── __hit_score_engine.js   # Hit 值计算引擎 + 历史 API
    │   ├── tags.js / solution.js / announcement.js / message.js / clipboard.js
    │   └── email_verification.js
    ├── models-built/               # 编译后的数据模型
    │   ├── problem-solution.js / problem-solution-comment.js / problem-solution-setting.js
    │   ├── announcement.js
    │   ├── private-message.js / user-message-setting.js
    │   ├── clipboard-item.js
    │   ├── email-verification-token.js / user-email-status.js
    │   ├── user-hit-score.js / user-hit-score-history.js / user-hit-setting.js
    └── models/                     # ts 占位文件(与 models-built 一一对应)
```

## 🔧 常用维护命令

```bash
# 启动 / 重启 / 停止
docker compose up -d              # 启动或应用配置变更
docker compose restart web        # 仅重启 web(改 EJS/JS 后用)
docker compose down               # 停止所有服务(数据保留)

# 查看状态和日志
docker ps
docker logs --tail 100 algobeat-web-1
docker logs -f algobeat-web-1     # 实时跟随
docker logs algobeat-web-1 | grep "hit-engine"  # 查看 Hit 引擎日志

# 进容器调试
docker exec -it algobeat-web-1 bash
docker exec -it algobeat-mariadb-1 mariadb -u root syzoj

# 手动触发 Hit 值重算(也可在管理员菜单中点按钮)
# 不需要命令,登录 admin 账号 → 用户名下拉 → "重算 Hit 值"
```

## 📦 版本历史

完整版本说明详见 [Releases](https://github.com/ZemuZzz/AlgoBeatOnlineJudge/releases)。

- **v1.3.4**：Hit 值系统完整收官 — 颜色档全店生效（含 Vue 组件）、近 30 天趋势折线图、`/ranklist` 双 Tab
- **v1.3.3**：Hit 值计算引擎 + 用户主页卡片 + 隐藏开关 + 帮助页
- **v1.3.2**：邮箱验证（Zoho SMTP）+ 用户名颜色档基础（紫色管理员）
- **v1.3.1**：题解评论区、公告系统、站内信、个人剪贴板、题解提交开关
- **v1.2.1**：首版正式发布（标签库、题解系统、审核流程）

## 📜 许可

本项目继承 SYZOJ 的 [MIT License](https://github.com/syzoj/syzoj/blob/master/LICENSE)。

## 🙏 致谢

- 原版 [SYZOJ](https://github.com/syzoj/syzoj) 提供了完整的 OJ 基础架构
- ZemuZzz 主导了所有定制功能的设计与实现
- 以及所有为 Algo Beat Contest 出题组 / 开发组贡献的成员

---

Powered by SYZOJ. Modified by **Zemu (UnratedCheater)**.