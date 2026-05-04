# AlgoBeat Online Judge

基于 [SYZOJ](https://github.com/syzoj/syzoj) 二次开发的在线评测平台。

## ✨ 主要新特性

### 📑 标签库浏览

顶部导航新增「标签」入口，点击后将展示站内全部标签与每个标签下的题目数，点击其中任一标签直达该标签筛选页。

### 📝 题解系统
- 题目页新增「题解」按钮（位于「讨论」右侧）；
- **用户**可为任意题目投稿题解，支持 Markdown；
- 投稿默认进入审核状态，仅作者本人和可审核者（即 SYZOJ 中拥有“题目管理”权限的用户）可见；
- **审核者**（管理员或拥有 `manage_problem` 题目管理 权限的用户）可在 `/admin/solutions` 集中审核；
  - 审核状态支持通过 / 拒绝（带原因）/ 改判 / 撤回；
- 投稿者可主动撤回自己的题解。

### 🛠 其它细节优化
- 容器内均设置了 `TZ=Asia/Shanghai`，修复了原版时间不符合中国大陆习惯的问题；
- 修复 RabbitMQ healthcheck 超时过短导致的启动问题；
- 主页左上角支持 logo + 文字组合显示；
- 浏览器标签页 favicon 可自定义。

## 🚀 快速部署

### 系统要求

- Linux 服务器（推荐 Ubuntu 22.04+）
- Docker 20.10+ 和 Docker Compose v2

特别的，本项目中 **必须使用 cgroup v1**（judge runner 依赖 simple-sandbox，不兼容 cgroup v2）。

如果你的系统默认是 cgroup v2，编辑 `/etc/default/grub`，在 `GRUB_CMDLINE_LINUX` 追加 `systemd.unified_cgroup_hierarchy=0`，然后 `update-grub && reboot`。

### 部署步骤

1. **克隆本仓库**

```bash
   git clone git@github.com:ZemuZzz/AlgoBeatOnlineJudge.git
   cd AlgoBeatOnlineJudge
```

2. **生成密钥配置**

```bash
   cp env-app.example env-app
   # 请用随机字符串替换 env-app 里的三处占位
   sed -i "s|请替换为 64 位随机字符串|$(openssl rand -hex 32)|" env-app
   sed -i "0,/$(openssl rand -hex 32)/{s|$(openssl rand -hex 32)|$(openssl rand -hex 32)|}" env-app
   # 上面 sed 命令简化版：直接手工编辑也行
   vim env-app
```

   *或者更简单，直接手动编辑 `env-app`，把每个 `请替换为...` 替换成 `openssl rand -hex 32` 输出。*

3. **启动服务**

```bash
   docker compose up -d
```

   首次启动会拉取镜像并初始化数据库，约需 1-2 分钟。

4. **创建初始管理员**

   在您已注册一个用户后，由于 SYZOJ 对于数据安全的特性，唯一修改系统管理员的方法就是进入数据库：

```bash
   docker exec -i algobeat-mariadb-1 mariadb -u root syzoj \
     -e "UPDATE \`user\` SET is_admin = 1 WHERE username = '你的用户名';"
```

5. **创建题解功能所需的数据表**

```bash
   docker exec -i algobeat-mariadb-1 mariadb -u root syzoj <<'EOF'
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
     PRIMARY KEY (`id`),
     KEY `idx_problem_id` (`problem_id`),
     KEY `idx_user_id` (`user_id`),
     KEY `idx_status` (`status`),
     KEY `idx_problem_status` (`problem_id`, `status`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   EOF
```

6. **访问站点**

   默认监听端口为 `4567`，即 `http://你的服务器IP:4567`；

   如需修改端口，编辑 `docker-compose.yml` 中 web 服务的 `ports` 配置。

## 📁 仓库结构

```
.
├── docker-compose.yml              # 主部署配置
├── env-app.example                 # 密钥模板(按说明改名为 env-app)
├── env                             # 项目级环境变量(可选)
├── .gitignore
├── README.md
└── custom/                         # 所有自定义代码与资源
    ├── header.ejs                  # 改造的顶部导航(含标签/审核入口)
    ├── favicon.png                 # 站点图标
    ├── logo.png                    # 顶部 logo
    ├── views/                      # 自定义 EJS 模板
    │   ├── tags.ejs                # 标签列表页
    │   ├── solutions.ejs           # 题目下题解列表
    │   ├── solution.ejs            # 题解详情
    │   ├── solution_edit.ejs       # 题解编辑
    │   ├── admin_solutions.ejs     # 题解审核后台
    │   ├── footer.ejs              # 自定义页脚
    │   └── problem.ejs             # 加题解按钮
    ├── modules/                    # 自定义路由
    │   ├── _user_privilege_loader.js   # 给模板注入 user.privileges
    │   ├── tags.js                     # 标签列表路由
    │   └── solution.js                 # 题解全部路由
    ├── models-built/               # 编译后的数据模型
    │   └── problem-solution.js
    └── models/                     # 模型占位文件
        └── problem-solution.ts
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

## 📜 许可

本项目继承 SYZOJ 的 [Apache License 2.0](https://github.com/syzoj/syzoj/blob/master/LICENSE)。

## 🙏 致谢

- 原版 [SYZOJ](https://github.com/syzoj/syzoj) 提供了完整的 OJ 基础架构
- ZemuZzz 参与了所有本仓库构建的更新与流程
- 以及所有为 Algo Beat Contest 出题组 / 开发组 贡献的出题人 / 开发者们！

---

Powered by SYZOJ. Modified by **Zemu (UnratedCheater)**.
