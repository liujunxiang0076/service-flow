# ServiceFlow

## 🚀 现代化服务管理和编排工具

基于 Tauri 2.0 和 React 19 构建的跨平台桌面应用

---

## 📖 项目简介

ServiceFlow 是一个功能强大的服务管理和编排工具，专为管理多个相互依赖的服务或任务而设计。它提供了直观的用户界面来启动、停止和监控服务，并支持实时健康检查和日志管理。

### ✨ 主要功能

- 📦 **服务分组管理** - 将相关服务组织成组，支持组级别的启动和停止
- ⚙️ **依赖管理** - 自动处理服务间的依赖关系，按正确顺序启动和停止
- 🔍 **健康检查** - 支持 TCP 和 HTTP 健康检查，实时监控服务状态
- 📝 **日志管理** - 集中管理和查看所有服务的日志输出，支持实时终端显示
- 🌐 **远程控制** - 内置 WebSocket 服务器，支持远程访问和控制
- 🚀 **自动启动** - 支持配置服务自动启动
- 🎨 **现代化界面** - 深色主题，基于 Radix UI 和 Tailwind CSS

### 🛠️ 技术栈

#### 后端

- Rust - 高性能系统编程语言
- Tauri 2.0 - 轻量级桌面应用框架
- Tokio - 异步运行时
- Axum - Web 框架
- SQLx - 数据库操作

#### 前端

- React 19 - 现代化 JavaScript 库
- TypeScript - 类型安全的 JavaScript 超集
- Radix UI - 可访问的 UI 组件库
- Tailwind CSS - 实用优先的 CSS 框架
- Xterm.js - 终端模拟器
- Vite - 新一代前端构建工具

---

## 📋 系统要求

### 运行要求

- **操作系统**: Windows 10/11 (64-bit)
- **内存**: 至少 4GB RAM
- **磁盘空间**: 至少 100MB 可用空间

### 开发要求

- **Rust**: 1.70+
- **Node.js**: 18+
- **pnpm**: 8+ (推荐使用 pnpm)
- **操作系统**: Windows 10/11

---

## 🚀 快速开始

### 方式一：运行预编译版本

1. 从 [Releases](../../releases) 页面下载最新的 `service-flow.exe`
2. 确保同目录下存在 `config.json` 配置文件（参考配置示例）
3. 双击 `service-flow.exe` 启动应用程序

### 方式二：从源代码运行

#### 1. 克隆仓库

```bash
git clone https://github.com/your-username/service-flow.git
cd service-flow
```

#### 2. 安装 Rust

访问 [rustup.rs](https://rustup.rs/) 安装 Rust 工具链

```bash
# 验证安装
rustc --version
cargo --version
```

#### 3. 安装 Node.js 和 pnpm

```bash
# 安装 Node.js (从 https://nodejs.org/ 下载)

# 安装 pnpm
npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

#### 4. 安装前端依赖

```bash
pnpm install
```

#### 5. 安装 Tauri CLI (可选，用于开发)

```bash
# 安装 Tauri CLI
cargo install tauri-cli
```

---

## 💻 开发指南

### 启动开发服务器

在项目根目录下运行：

```bash
# 方式一：使用 pnpm (推荐)
pnpm run tauri:dev

# 方式二：使用 Cargo
cargo tauri dev
```

这将同时启动：

- Vite 开发服务器 (<http://localhost:5173>)
- Tauri 应用程序窗口（热重载）

### 仅运行前端开发服务器

```bash
pnpm run dev
```

然后在浏览器访问 <http://localhost:5173>

### 构建生产版本

```bash
# 方式一：使用 pnpm (推荐)
pnpm run tauri:build

# 方式二：使用 Cargo
cargo tauri build
```

构建产物位置：

- 可执行文件: `src-tauri/target/release/service-flow.exe`
- 安装程序: `src-tauri/target/release/bundle/`

### 仅构建前端

```bash
pnpm run build
```

构建输出位于 `dist/` 目录

---

## ⚙️ 配置文件说明

配置文件 `config.json` 位于应用程序根目录，采用 JSON 格式。

### 全局设置

```json
{
  "settings": {
    "serverPort": 8899,    // WebSocket 服务器端口
    "autoStart": true      // 应用启动时是否自动启动所有服务
  }
}
```

**参数说明：**

- `serverPort`: WebSocket 服务器监听端口，用于远程控制和实时日志推送
- `autoStart`: 设置为 `true` 时，应用程序启动后会自动启动所有配置为自动启动的服务

### 服务组配置

服务组用于将相关服务组织在一起，方便批量管理。

```json
{
  "groups": [
    {
      "id": "group-1",      // 组 ID（必须唯一）
      "name": "服务组1",     // 组显示名称
      "delay": 0,           // 组启动延迟（毫秒）
      "tasks": []           // 任务列表
    }
  ]
}
```

**参数说明：**

- `id`: 组的唯一标识符
- `name`: 组的显示名称
- `delay`: 启动该组时的延迟时间（毫秒），用于错开启动时间
- `tasks`: 该组包含的任务列表

### 任务（服务）配置

每个任务代表一个要管理的服务或进程。

```json
{
  "id": "redis-server",                    // 任务 ID（必须唯一）
  "name": "Redis 服务器",                   // 任务显示名称
  "type": "cmd",                           // 任务类型（目前仅支持 cmd）
  "path": "C:\\Redis\\redis-server.exe",   // 可执行文件完整路径
  "workDir": "C:\\Redis\\",                // 工作目录
  "args": "redis.conf",                    // 命令行参数
  "autoStart": true,                       // 是否自动启动
  "dependencies": [],                      // 依赖的任务 ID 列表
  "healthCheck": {                         // 健康检查配置（可选）
    "type": "tcp",                        // 健康检查类型：tcp 或 http
    "host": "localhost",                  // TCP 检查的主机地址
    "port": 6379,                         // TCP 检查的端口
    "interval": 10,                       // 检查间隔（秒）
    "timeout": 5                          // 超时时间（秒）
  }
}
```

**参数说明：**

- `id`: 任务的唯一标识符，用于依赖关系引用
- `name`: 任务的显示名称
- `type`: 任务类型，目前仅支持 `cmd`（命令行程序）
- `path`: 可执行文件的完整路径（Windows 路径需要使用双反斜杠 `\\`）
- `workDir`: 程序的工作目录
- `args`: 传递给程序的命令行参数
- `autoStart`: 是否在应用启动时自动启动该任务
- `dependencies`: 依赖的任务 ID 数组，启动时会先启动依赖的任务
- `healthCheck`: 健康检查配置（可选）

### 健康检查配置

**TCP 健康检查**（适用于 Redis、MySQL 等服务）

```json
"healthCheck": {
  "type": "tcp",
  "host": "localhost",
  "port": 6379,
  "interval": 10,
  "timeout": 5
}
```

**HTTP 健康检查**（适用于 Web 服务器、API 服务等）

```json
"healthCheck": {
  "type": "http",
  "url": "http://localhost:8080",
  "interval": 10,
  "timeout": 5
}
```

---

## 📚 使用指南

### 基本操作

1. **启动应用程序**
   - 双击 `service-flow.exe` 启动
   - 或在命令行运行：`./service-flow.exe`

2. **查看服务状态**
   - 主界面以表格形式显示所有服务
   - 状态指示器：🟢 运行中 | 🔴 已停止 | 🟡 健康检查失败

3. **启动单个服务**
   - 点击服务行的「启动」按钮
   - 如果有依赖项，会自动按顺序启动

4. **停止单个服务**
   - 点击服务行的「停止」按钮
   - 会先停止依赖于该服务的其他服务

5. **查看日志**
   - 点击服务行的「日志」按钮
   - 在终端窗口中实时查看服务输出

### 服务组操作

- **启动整组服务**：点击组标题栏的「启动组」按钮
- **停止整组服务**：点击组标题栏的「停止组」按钮
- **折叠/展开组**：点击组标题栏进行折叠或展开

### 依赖管理

ServiceFlow 会自动处理服务间的依赖关系：

- **启动时**：按依赖顺序启动，先启动被依赖的服务
- **停止时**：按依赖顺序反向停止，先停止依赖其他服务的服务
- **健康检查**：依赖的服务通过健康检查后才会启动下一个服务

### 健康检查

- 健康检查状态实时显示在服务列表中
- 🟢 绿色：服务健康
- 🔴 红色：服务不健康或未响应
- ⚪ 灰色：未配置健康检查

### 远程控制（WebSocket）

ServiceFlow 内置 WebSocket 服务器，支持：

- 实时推送服务状态变化
- 远程启动/停止服务
- 实时日志流推送
- 健康检查状态通知

默认端口：`8899`（可在 `config.json` 中修改）

---

## 📝 配置示例

以下是一个完整的 `config.json` 配置文件示例：

```json
{
  "settings": {
    "serverPort": 8899,
    "autoStart": true
  },
  "groups": [
    {
      "id": "backend-services",
      "name": "后端服务组",
      "delay": 0,
      "tasks": [
        {
          "id": "redis",
          "name": "Redis 缓存服务",
          "type": "cmd",
          "path": "D:\\Redis\\redis-server.exe",
          "workDir": "D:\\Redis\\",
          "args": "redis.conf",
          "autoStart": true,
          "dependencies": [],
          "healthCheck": {
            "type": "tcp",
            "host": "localhost",
            "port": 6379,
            "interval": 10,
            "timeout": 5
          }
        },
        {
          "id": "mysql",
          "name": "MySQL 数据库",
          "type": "cmd",
          "path": "D:\\MySQL\\bin\\mysqld.exe",
          "workDir": "D:\\MySQL\\",
          "args": "--defaults-file=my.ini",
          "autoStart": true,
          "dependencies": [],
          "healthCheck": {
            "type": "tcp",
            "host": "localhost",
            "port": 3306,
            "interval": 10,
            "timeout": 5
          }
        },
        {
          "id": "api-server",
          "name": "API 服务器",
          "type": "cmd",
          "path": "D:\\MyApp\\api-server.exe",
          "workDir": "D:\\MyApp\\",
          "args": "--port 8080",
          "autoStart": true,
          "dependencies": ["redis", "mysql"],
          "healthCheck": {
            "type": "http",
            "url": "http://localhost:8080/health",
            "interval": 10,
            "timeout": 5
          }
        }
      ]
    },
    {
      "id": "frontend-services",
      "name": "前端服务组",
      "delay": 1000,
      "tasks": [
        {
          "id": "nginx",
          "name": "Nginx Web 服务器",
          "type": "cmd",
          "path": "D:\\nginx\\nginx.exe",
          "workDir": "D:\\nginx\\",
          "args": "",
          "autoStart": false,
          "dependencies": ["api-server"],
          "healthCheck": {
            "type": "http",
            "url": "http://localhost:80",
            "interval": 15,
            "timeout": 5
          }
        }
      ]
    }
  ]
}
```

---

## 📁 项目结构

```text
service-flow/
├── src-tauri/                    # Tauri 后端项目
│   ├── src/                      # Rust 源代码
│   │   ├── main.rs              # 入口文件
│   │   ├── app.rs               # 应用主逻辑
│   │   ├── config.rs            # 配置管理
│   │   ├── database.rs          # 数据库操作
│   │   ├── healthcheck.rs       # 健康检查
│   │   ├── orchestrator.rs      # 服务编排
│   │   ├── process.rs           # 进程管理
│   │   └── web.rs               # Web 服务
│   ├── target/                   # Rust 构建输出
│   ├── Cargo.toml               # Rust 依赖配置
│   └── tauri.conf.json          # Tauri 配置文件
│
├── src/                          # React 19 前端项目
│   ├── app/                     # Next.js 风格的应用路由
│   │   ├── applications/        # 应用管理页面
│   │   ├── dependencies/        # 依赖管理页面
│   │   ├── groups/              # 服务组页面
│   │   ├── health/              # 健康检查页面
│   │   ├── login/               # 登录页面
│   │   ├── services/            # 服务管理页面
│   │   ├── settings/            # 设置页面
│   │   ├── layout.tsx           # 根布局组件
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   │   ├── ui/                  # Radix UI 组件封装
│   │   │   ├── button.tsx       # 按钮组件
│   │   │   ├── card.tsx         # 卡片组件
│   │   │   ├── dialog.tsx       # 对话框组件
│   │   │   └── ...
│   │   ├── dependency-graph.tsx # 依赖图组件
│   │   ├── service-table.tsx    # 服务表格组件
│   │   └── ...
│   ├── hooks/                   # 自定义 Hooks
│   ├── lib/                     # 工具函数和库
│   ├── styles/                  # 样式文件
│   ├── types/                   # TypeScript 类型定义
│   ├── App.tsx                  # 根组件
│   └── main.tsx                 # 入口文件
│
├── doc/                          # 项目文档
│   └── plan.md                  # 项目计划
│
├── config.json                   # 应用配置文件
├── package.json                  # Node.js 依赖配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── README.md                     # 项目说明文档
```

---

## ❓ 常见问题

### Q: 应用程序无法启动

**可能原因：**

- 缺少运行时依赖（Visual C++ Redistributable）
- 配置文件格式错误
- 端口被占用

**解决方案：**

1. 安装 [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
2. 验证 `config.json` 格式是否正确（可使用 JSON 校验工具）
3. 检查 WebSocket 端口是否被占用（默认 8899）

### Q: 服务启动失败

**可能原因：**

- 可执行文件路径不正确
- 工作目录不存在
- 依赖服务未启动
- 权限不足

**解决方案：**

1. 检查配置文件中的 `path` 和 `workDir` 是否正确
2. 确保使用双反斜杠 `\\` 分隔 Windows 路径
3. 查看日志输出获取详细错误信息
4. 以管理员身份运行应用程序

### Q: 健康检查一直显示失败

**可能原因：**

- 服务实际未正常启动
- 健康检查配置不正确
- 防火墙阻止连接
- 服务启动时间较长

**解决方案：**

1. 手动测试服务端口是否可访问
2. 检查健康检查的 `host`、`port` 或 `url` 配置
3. 增加 `timeout` 时间
4. 检查 Windows 防火墙设置

### Q: 如何查看服务的日志输出？

点击服务行的「日志」按钮，会打开一个终端窗口显示该服务的实时输出。日志会持续显示，直到关闭终端窗口。

### Q: 如何配置服务的依赖关系？

在任务配置中使用 `dependencies` 数组，填入依赖的任务 ID。例如：

```json
{
  "id": "api-server",
  "dependencies": ["redis", "mysql"]
}
```

这样启动 `api-server` 时会先启动 `redis` 和 `mysql`。

### Q: 开发模式下前端修改不生效？

确保：

1. Vite 开发服务器正在运行（端口 5173）
2. 已保存文件修改
3. 浏览器没有缓存问题（尝试硬刷新 Ctrl+Shift+R）

---

## 🔧 调试技巧

### 查看 Rust 后端日志

在开发模式下，Rust 后端日志会输出到终端：

```bash
cd src-tauri
cargo tauri dev
```

### 查看前端控制台

在 Tauri 应用窗口中按 `F12` 打开开发者工具。

### 启用详细日志

设置环境变量启用详细日志：

```bash
$env:RUST_LOG="debug"
cargo tauri dev
```

---

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📮 联系方式

- 项目主页：[GitHub Repository](https://github.com/your-username/service-flow)
- 问题反馈：[Issues](https://github.com/your-username/service-flow/issues)

---

## 🎯 路线图

- [ ] 支持 Linux 和 macOS
- [ ] 支持更多健康检查类型（数据库连接检查等）
- [ ] 服务性能监控（CPU、内存使用率）
- [ ] 配置文件热重载
- [ ] 服务日志搜索和过滤
- [ ] 多语言支持（i18n）
- [ ] 可视化配置编辑器

---

Made with ❤️ by ServiceFlow Team

© 2024 ServiceFlow. All rights reserved.
