# AlgoBeat Online Judge

基于 [SYZOJ](https://github.com/syzoj/syzoj) 二次开发的在线评测平台，在原版基础上新增了**工单系统**、**Hit 值评分系统**、**用户名颜色分档**、**邮箱验证**、**题解 / 评论 / 站内信 / 公告 / 个人剪贴板**等多项社区互动模块。

> **当前版本**：v1.4.0 · 🎫 工单系统全面上线 · 🛠 提交记录可被管理员标记作弊或取消

## ✨ 主要特性

### 🎫 工单系统（v1.4.0 全新）

参照洛谷工单设计，完整覆盖 6 大类别 + 多个子类型：

| 大类 | 子类型 |
|---|---|
| 题目工单 | 题目综合 / 文本修缮 / 改进标签、难度 |
| 比赛工单 | 申请公开赛 |
| 文章工单 | 申请题解相关 / 撤销题解相关 |
| 用户工单 | 用户申诉 / 申请权限变更 / 申请解除封禁 |
| 举报工单 | 举报用户（强制要求填写举报原因） |
| 综合问题 | 建议或 bug 反馈 / 学术建议 / 一般咨询 |

**工单流程**：用户创建 → admin 认领 → admin 回复处理 → 标记为已处理 / 已驳回 / 已关闭。
**附件支持**：单文件 20 MB，每工单最多 10 个附件，支持任意文件类型；图片自动缩略图。
**隐私**：用户仅看自己的工单；admin 看全部；admin 可写"内部备注"工单创建者看不到。
**频率限制**：每用户每 24 小时最多 5 个工单。

### 🛡️ 作弊判定 / 取消评测（v1.4.0 全新）

管理员可在任意提交记录详情页**标记**该提交为「作弊」或「已取消」：
- 标记后该提交在站内显示对应红/灰标签
- 如果原本是 AC，user.ac_num 自动减 1（仅在该用户对该题没有其他有效 AC 时）
- 该提交从用户 Hit 值计算中剔除
- **可撤销**：撤销后 ac_num 同步恢复

### 🗑️ 比赛删除（v1.4.0 全新）

管理员或比赛创建者可在比赛编辑页底部"危险操作"区永久删除比赛，级联清理报名记录与排行榜数据。

### 🎯 Hit 值评分系统

平台用一套加权公式（满分 400）刻画每位用户的综合活跃度：

| 维度 | 满分 | 主要因素 |
|---|---|---|
| 基础信用分 | 100 | 邮箱验证、信息完善、注册时长、参赛门槛 |
| 社区贡献分 | 100 | 通过审核的题解数、出题数 |
| 比赛参与分 | 100 | 参赛活跃度（30 天半衰减） |
| 题目练习分 | 100 | AC 题目数、知识点覆盖（14 天半衰减） |

每天凌晨自动重算 + 管理员可手动触发即时重算。用户主页 Hit 值卡片支持隐藏。
帮助页 [`/help/hit-value`](#) 详细说明算法。

### 🎨 用户名颜色分档

| Hit 值 | 颜色 | 称号 |
|---|---|---|
| 0–99 | 灰 | 萌新 |
| 100–199 | 蓝 | 业余 |
| 200–279 | 绿 | 进阶 |
| 280–349 | 橙 | 高手 |
| 350–400 | 红 | 大神 |
| — | 紫 | 站点管理者 |

颜色全站统一渲染，包括 SYZOJ 自带页面（讨论 / 排名 / 文章 / 提交记录 / 单条提交详情）+ Vue 动态组件。

### 📊 排名页双 Tab

`/ranklist` 顶部支持切换 **Rating 排名** 与 **Hit 值排名**。

### 📈 Hit 值历史趋势

用户主页绘制 4 维度近 30 天趋势折线图，使用 Chart.js。历史数据保留 90 天。

### 📑 标签库浏览

顶部「标签」入口，按颜色分类展示站内全部标签。

### 📝 题解系统

- 用户可投稿题解，支持 Markdown
- 投稿默认进入审核状态
- 审核者可在 `/admin/solutions` 集中处理
- 审核者可按题禁止/恢复题解投稿

### 📢 站内公告系统

- 三个级别（信息 / 警告 / 重要）
- 用户访问首页自动弹窗
- 「不再弹出」选项（按浏览器记录）

### 💬 站内信

- 一对一私信，支持 Markdown
- 右上角信封图标显示未读数
- 用户可关闭来自他人的私信

### 📋 个人剪贴板

- 保存代码模板（单条 100 KB 上限）
- 三种可见性：私有 / 公开 / 分享链接

### 📧 邮箱验证

- 通过 SMTP（默认 Zoho）发送验证邮件
- 24 小时有效期 + 60 秒发送冷却
- 未验证用户不能投稿题解、发送站内信

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

```bash
# 1. 克隆仓库
git clone git@github.com:ZemuZzz/AlgoBeatOnlineJudge.git
cd AlgoBeatOnlineJudge

# 2. 生成密钥配置
cp env-app.example env-app
vim env-app
# 把里面的 "请替换为..." 占位用 openssl rand -hex 32 替换;
# 如启用邮箱验证,同时填写 SMTP 五项配置

# 3. 安装 nodemailer 依赖(用于邮箱验证)
mkdir -p custom/node_modules
docker run --rm -v $(pwd)/custom:/work -w /work node:14 npm install nodemailer@6.9.7

# 4. 创建附件存储目录
mkdir -p custom/uploads/tickets

# 5. 启动服务
docker compose up -d

# 6. 创建管理员账号(注册账号后)
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj \
  -e "UPDATE \`user\` SET is_admin = 1 WHERE username = '你的用户名';"

# 7. 初始化业务数据表
# 见下方 SQL 初始化脚本
```

### SQL 初始化脚本

```bash
docker exec -i algobeat-mariadb-1 mariadb -u root syzoj <<'EOF'
-- 题解
CREATE TABLE IF NOT EXISTS `problem_solution` (
  `id` INT NOT NULL AUTO_INCREMENT, `title` VARCHAR(80) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL, `problem_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL, `status` VARCHAR(20) DEFAULT 'pending',
  `public_time` INT DEFAULT NULL, `update_time` INT DEFAULT NULL,
  `reject_reason` VARCHAR(255) DEFAULT NULL, `allow_comment` BOOLEAN DEFAULT TRUE,
  `comments_num` INT DEFAULT 0, PRIMARY KEY (`id`),
  KEY `idx_problem_id` (`problem_id`), KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`), KEY `idx_problem_status` (`problem_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 题解评论
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

-- 公告
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` INT NOT NULL AUTO_INCREMENT, `title` VARCHAR(120) DEFAULT NULL,
  `content` MEDIUMTEXT DEFAULT NULL, `level` VARCHAR(20) DEFAULT 'info',
  `start_time` INT DEFAULT NULL, `end_time` INT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE, `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`id`),
  KEY `idx_active_time` (`is_active`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 站内信
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

-- 剪贴板
CREATE TABLE IF NOT EXISTS `clipboard_item` (
  `id` INT NOT NULL AUTO_INCREMENT, `user_id` INT DEFAULT NULL,
  `title` VARCHAR(120) DEFAULT NULL, `content` MEDIUMTEXT DEFAULT NULL,
  `visibility` VARCHAR(20) DEFAULT 'private', `share_token` VARCHAR(40) DEFAULT NULL,
  `share_expires` INT DEFAULT NULL, `public_time` INT DEFAULT NULL,
  `update_time` INT DEFAULT NULL, PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`), KEY `idx_visibility` (`visibility`),
  UNIQUE KEY `uniq_share_token` (`share_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 邮箱验证
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

-- Hit 值
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

-- 提交记录管理员标记
CREATE TABLE IF NOT EXISTS `judge_state_admin_action` (
  `judge_id` INT NOT NULL, `action_type` VARCHAR(20) NOT NULL,
  `operator_id` INT NOT NULL, `operator_time` INT NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL, `was_accepted` BOOLEAN DEFAULT FALSE,
  `affected_problem_id` INT DEFAULT NULL, `affected_user_id` INT DEFAULT NULL,
  PRIMARY KEY (`judge_id`),
  KEY `idx_user_action` (`affected_user_id`, `action_type`),
  KEY `idx_problem_user` (`affected_problem_id`, `affected_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工单系统
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
EOF
```

### 启动后访问

默认监听端口 `4567`：`http://你的服务器IP:4567`

## 📁 仓库结构

```
.
├── docker-compose.yml              # 主部署配置
├── env-app.example                 # 密钥模板
├── env                             # 项目级环境变量
├── .gitignore
├── README.md
└── custom/                         # 所有自定义代码与资源
    ├── header.ejs                  # 顶部导航 + 全局 JS 注入
    ├── username_tiers.css          # 用户名颜色档样式
    ├── web.json                    # 站点配置
    ├── favicon.png / logo.png
    ├── uploads/tickets/            # 工单附件存储(运行时生成)
    ├── views/                      # 页面模板
    ├── modules/                    # 路由模块
    ├── models-built/               # 编译后的数据模型
    └── models/                     # ts 占位文件
```

## 🔧 常用维护命令

```bash
# 启动 / 重启 / 停止
docker compose up -d              # 启动或应用配置变更
docker compose up -d --force-recreate web   # 改了挂载后强制重建
docker compose restart web        # 仅重启 web(改 EJS/JS 后用)

# 查看状态和日志
docker logs --tail 100 algobeat-web-1
docker logs -f algobeat-web-1     # 实时跟随

# 进容器调试
docker exec -it algobeat-web-1 bash
docker exec -it algobeat-mariadb-1 mariadb -u root syzoj
```

## 📦 版本历史

完整版本说明详见 [Releases](https://github.com/ZemuZzz/AlgoBeatOnlineJudge/releases)。

- **v1.4.0**：工单系统（6 大类 + 附件上传）+ 比赛删除 + 提交记录作弊/取消标记 + 关闭投稿确认框 bug 修复
- **v1.3.4**：Hit 值系统完整收官 — 颜色档全店生效、近 30 天趋势折线图、`/ranklist` 双 Tab
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