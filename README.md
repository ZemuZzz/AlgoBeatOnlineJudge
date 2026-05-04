# AlgoBeat Online Judge

基于 [SYZOJ](https://github.com/syzoj/syzoj) 二次开发的在线评测平台，新增了**标签库**、**题解系统**、**站内信**、**公告系统**、**个人剪贴板**等社区互动模块。

> **当前版本**：v1.3.1

## ✨ 主要特性

### 📑 标签库浏览

顶部导航新增「标签」入口，按颜色分类展示站内全部标签（题目来源 / 算法大类 / 算法细目 / 题目类型 / 题目难度），点击任一标签直达该标签筛选页。

### 📝 题解系统

- 题目页新增「题解」按钮（位于「讨论」右侧）
- **用户**可为任意题目投稿题解，支持 Markdown 渲染
- 投稿默认进入审核状态，仅作者本人和审核者可见
- **审核者**（管理员或拥有 `manage_problem` 权限的用户）可在 `/admin/solutions` 集中处理：通过 / 拒绝（带原因）/ 改判
- **投稿者**可主动撤回自己的题解
- 每篇已通过的题解下方有**评论区**，作者可关闭单篇题解的评论
- 审核者可按题**禁止/恢复题解投稿**（已通过的题解保持可见）

### 📢 公告系统

- 管理员可在后台创建/管理站内公告（信息 / 警告 / 重要 三个级别）
- 用户访问首页时以**站内 UI 弹窗**自动展示当前生效公告
- 弹窗支持「不再弹出」选项（按浏览器记录，公告生效期内仅弹一次）
- 多条公告依次弹出，关闭一条弹下一条

### 💬 站内信

- 用户之间可一对一发送私信，支持 Markdown
- 右上角信封图标显示未读数，进入对话自动标已读
- 支持按用户名或 UID 搜索收件人
- 用户可在设置中**关闭所有他人的私信**（管理员除外）
- 消息可单条删除或清空整段对话历史（软删，不影响对方副本）

### 📋 个人剪贴板

- 用户可保存常用的文本片段、代码模板等（单条上限 100 KB）
- 三种可见性：
  - **私有**：仅自己可见
  - **公开**：出现在 `/clipboard/user/<uid>` 页面，所有人可访问
  - **分享链接**：生成随机 token 链接，可指定过期时间（最长 365 天，0 = 永不过期）
- 分享链接可随时重新生成（旧链接立即失效）

### 🛠 站点定制与体验改进

- 容器全部设置 `TZ=Asia/Shanghai`，时间显示符合中国大陆习惯
- 修复 RabbitMQ healthcheck 超时过短导致的启动失败问题
- 修复 cgroup v2 系统下 judge runner 启动失败的问题
- 主页左上角支持 logo + 文字组合显示
- 浏览器标签页 favicon 可自定义
- 自定义页脚（修改者署名 + 备案号 + 版本号）
- gravatar 头像源切换至更稳定的镜像

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

把里面三处 `请替换为 64 位随机字符串` 用 `openssl rand -hex 32` 生成的不同随机值替换。

#### 3. 启动服务

```bash
docker compose up -d
```

首次启动会拉取镜像并初始化数据库，约需 1-2 分钟。

#### 4. 创建初始管理员

注册一个用户后，进数据库设为管理员：

```bash
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj \
  -e "UPDATE \`user\` SET is_admin = 1 WHERE username = '你的用户名';"
```

#### 5. 初始化业务数据表

本项目所有自定义功能依赖以下数据表（首次部署一次性执行）：

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
EOF
```

#### 6. 访问站点

默认监听端口为 `4567`：`http://你的服务器IP:4567`

如需修改端口，编辑 `docker-compose.yml` 中 web 服务的 `ports` 配置。

## 📁 仓库结构

```
.
├── docker-compose.yml              # 主部署配置
├── env-app.example                 # 密钥模板（按说明改名为 env-app）
├── env                             # 项目级环境变量（可选）
├── .gitignore
├── README.md
└── custom/                         # 所有自定义代码与资源
    ├── header.ejs                  # 改造的顶部导航
    ├── web.json                    # 站点配置（标题、gravatar 源等）
    ├── favicon.png                 # 浏览器标签图标
    ├── logo.png                    # 顶部 logo
    ├── views/                      # 自定义 EJS 模板
    │   ├── tags.ejs                    # 标签分类页
    │   ├── footer.ejs                  # 自定义页脚
    │   ├── index.ejs                   # 首页（含弹窗与提醒）
    │   ├── problem.ejs                 # 题目页（加题解按钮）
    │   ├── solutions.ejs               # 题目下题解列表
    │   ├── solution.ejs                # 题解详情（含评论区）
    │   ├── solution_edit.ejs           # 题解编辑
    │   ├── admin_solutions.ejs         # 题解审核后台
    │   ├── admin_announcements.ejs     # 公告管理后台
    │   ├── admin_announcement_edit.ejs # 公告编辑
    │   ├── messages_inbox.ejs          # 站内信收件箱
    │   ├── messages_conversation.ejs   # 对话详情
    │   ├── messages_new.ejs            # 发起新对话
    │   ├── messages_settings.ejs       # 站内信设置
    │   ├── clipboard_list.ejs          # 剪贴板列表
    │   ├── clipboard_view.ejs          # 剪贴板详情
    │   └── clipboard_edit.ejs          # 剪贴板编辑
    ├── modules/                    # 自定义路由
    │   ├── _user_privilege_loader.js   # 注入 user.privileges + 未读数等
    │   ├── tags.js                     # 标签列表路由
    │   ├── solution.js                 # 题解全部路由
    │   ├── announcement.js             # 公告路由
    │   ├── message.js                  # 站内信路由
    │   └── clipboard.js                # 剪贴板路由
    ├── models-built/               # 编译后的数据模型
    │   ├── problem-solution.js
    │   ├── problem-solution-comment.js
    │   ├── problem-solution-setting.js
    │   ├── announcement.js
    │   ├── private-message.js
    │   ├── user-message-setting.js
    │   └── clipboard-item.js
    └── models/                     # 模型占位文件（与 models-built 一一对应的 .ts 占位）
```

## 🔧 常用维护命令

```bash
# 启动 / 重启 / 停止
docker compose up -d              # 启动或应用配置变更
docker compose restart web        # 仅重启 web（改 EJS/JS 后用）
docker compose down               # 停止所有服务（数据保留）

# 查看状态和日志
docker ps
docker logs --tail 100 algobeat-web-1
docker logs -f algobeat-web-1     # 实时跟随

# 进容器调试
docker exec -it algobeat-web-1 bash
docker exec -it algobeat-mariadb-1 mariadb -u root syzoj
```

## 📦 版本历史

完整版本说明详见 [Releases](https://github.com/ZemuZzz/AlgoBeatOnlineJudge/releases)。

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