# 知行 (ZhiXing) 智能研发认知操作平台

<p align="center">
  <strong>知行合一 —— 从静态知识检索到动态智能体执行的闭环</strong>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#项目架构">项目架构</a> •
  <a href="#开发指南">开发指南</a> •
  <a href="#api文档">API文档</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

---

## 项目简介

**知行 (ZhiXing) CogniAction OS** 是一个 AI 原生的研发认知操作平台，核心理念是"让意图即交付，让架构即护栏"。平台采用四层架构体系，实现从静态知识检索到动态智能体执行的闭环。

### 核心特性

- **🧠 认知平面 (L2)**: 统一认知分层 (UCS)、决策谱系引擎、模型路由网关
- **🎛️ 控制平面 (L3)**: Spec 编译器、技能竞技场、PromptOps、架构看护 Agent
- **📊 数据与行动平面 (L1)**: 影子执行层、MCP Server 集群、数据底座
- **💻 交互平面 (L4)**: IDE 插件、CLI 智能体、Web 控制台、VSM 仪表盘

---

## 快速开始

### 环境要求

- **Node.js**: 20.0.0 或更高版本
- **pnpm**: 9.0.0 或更高版本 (`npm install -g pnpm`)
- **容器运行时**: Docker 或 Podman（用于本地数据库）
  - Docker: 20.0.0+ [下载](https://www.docker.com/products/docker-desktop)
  - Podman: 4.0.0+ + podman-compose [安装指南](https://podman.io/getting-started/installation)
- **Git**: 2.30.0 或更高版本

### 平台特定启动指南

#### Windows (PowerShell - 推荐)

```powershell
# 1. 进入项目目录
cd ZhiXing

# 2. 运行初始化脚本（自动检测并启动所需服务）
.\init.ps1

# 3. 配置环境变量（必需：设置 OPENAI_API_KEY）
notepad .env.local

# 4. 启动所有服务
pnpm dev
```

#### Windows (Git Bash / MSYS2)

```bash
# 1. 进入项目目录
cd ZhiXing

# 2. 运行初始化脚本
./init.sh

# 3. 配置环境变量
vim .env.local

# 4. 启动所有服务
pnpm dev
```

#### Linux / macOS / WSL

```bash
# 1. 克隆项目
git clone <repository-url>
cd ZhiXing

# 2. 初始化开发环境（自动检测并启动所需服务）
./init.sh

# 3. 配置环境变量（编辑 .env.local，填写必要的 API 密钥）
vim .env.local

# 4. 启动所有服务
pnpm dev
```

#### 使用增强版启动脚本（支持服务健康检测）

```bash
# Bash 环境（Linux/macOS/Git Bash）
./scripts/dev-start.sh

# 此脚本会自动：
# - 检测服务是否已启动
# - 启动缺失的 Docker/Podman 服务
# - 检查 Node.js 和 pnpm 环境
# - 安装项目依赖
# - 执行数据库迁移
# - 显示服务状态
```

### 手动启动步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填写必要的 API 密钥

# 3. 启动基础设施（PostgreSQL、Qdrant、Redis）
# 使用 Docker
docker-compose up -d
# 或使用 Podman
podman-compose up -d

# 4. 执行数据库迁移
pnpm db:migrate

# 5. 启动所有服务
pnpm dev
```

### 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| Web 控制台 | http://localhost:3001 | React 前端界面 |
| API 服务 | http://localhost:3000 | Fastify API |
| MCP API | http://localhost:3002 | MCP Server HTTP API |
| PostgreSQL | localhost:5432 | 主数据库 |
| Qdrant | http://localhost:6333 | 向量数据库 |
| Redis | localhost:6379 | 缓存服务 |

---

## 项目架构

### 技术栈

- **前端**: React 18 + TypeScript + Zustand + Tailwind CSS + Vite
- **后端**: Node.js 20 + Fastify + GraphQL + REST
- **数据库**: PostgreSQL（主）、Redis（缓存）、Qdrant（向量）
- **AI/ML**: LiteLLM 路由网关、OpenAI Embeddings、MCP SDK
- **DevOps**: Docker + Kubernetes + GitHub Actions + Turborepo

### Monorepo 结构

```
zhixing/
├── apps/                      # 应用程序
│   ├── api/                   # Fastify API 服务
│   ├── web/                   # React Web 控制台
│   └── cli/                   # 命令行工具
│
├── packages/                  # 共享包
│   ├── db/                    # 数据库 Schema (Drizzle ORM)
│   ├── shared/                # 共享工具函数和服务
│   ├── gitlab-client/         # GitLab API 客户端
│   └── mcp-server/            # MCP Server 实现
│
├── scripts/                   # 自动化脚本
├── docs/                      # 文档
├── docker-compose.yml         # 基础设施编排
└── turbo.json                 # Turborepo 配置
```

---

## 开发指南

### 常用命令

```bash
# 启动所有服务
pnpm dev

# 单独启动服务
pnpm dev:api      # 仅启动 API
pnpm dev:web      # 仅启动 Web
pnpm dev:mcp      # 仅启动 MCP Server

# 数据库操作
pnpm db:migrate   # 执行迁移
pnpm db:generate  # 生成迁移文件
pnpm db:studio    # 打开 Drizzle Studio

# 测试
pnpm test         # 运行所有测试
pnpm test:watch   # 监听模式
pnpm test:coverage # 生成覆盖率报告

# 代码检查
pnpm lint         # ESLint 检查
pnpm format       # Prettier 格式化
pnpm typecheck    # TypeScript 类型检查

# 基础设施
pnpm infra:up     # 启动基础设施服务
pnpm infra:down   # 停止基础设施服务
pnpm infra:logs   # 查看容器日志
```

### 服务管理工具

```bash
# 查看所有服务状态
./scripts/service-manager.sh status

# 查看服务启动记录
./scripts/service-manager.sh log

# 检查特定服务健康状态
./scripts/service-manager.sh health postgres

# 启动/停止/重启服务
./scripts/service-manager.sh start api
./scripts/service-manager.sh stop api
./scripts/service-manager.sh restart api
```

### 环境变量配置

复制 `.env.example` 为 `.env.local` 并配置以下关键变量：

```bash
# 数据库（Docker 自动配置）
DATABASE_URL="postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing"
QDRANT_URL="http://localhost:6333"

# 大模型 API（必需）
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY="your-openai-api-key-here"

# GitLab 集成（可选）
GITLAB_URL="https://gitlab.example.com"
GITLAB_TOKEN="your-gitlab-token-here"
```

---

## API 文档

### REST API

- **Health Check**: `GET /health`
- **Specs 管理**: `GET/POST /api/specs/*`
- **项目管理**: `GET/POST /api/projects/*`
- **分发管理**: `GET/POST /api/distribution/*`
- **合规检查**: `GET/POST /api/compliance/*`
- **技能管理**: `GET/POST /api/skills/*`

### MCP Server

MCP Server 支持 STDIO 和 HTTP 两种模式：

```bash
# STDIO 模式（默认）
pnpm --filter @zhixing/mcp-server start

# HTTP 模式
ENABLE_HTTP_API=true pnpm --filter @zhixing/mcp-server dev
```

---

## 测试

项目采用 Vitest 测试框架，测试文件组织：

```
packages/<name>/src/**/*.test.ts    # 单元测试
apps/<name>/src/**/*.test.ts        # 应用测试
e2e/**/*.test.ts                    # E2E 测试
```

运行测试：

```bash
# 所有测试
pnpm test

# 特定包测试
pnpm test packages/shared

# 覆盖率报告
pnpm test:coverage

# UI 模式
pnpm test:ui
```

---

## 贡献指南

### 开发工作流

1. **创建变更**: 使用 `/opsx:new <change-name>` 创建新的变更
2. **实现功能**: 使用 `/opsx:apply` 按任务逐步实现
3. **测试验证**: 使用 `/opsx:verify` 验证实现完整性
4. **归档变更**: 使用 `/opsx:archive` 归档已完成的变更

### 代码规范

- **TypeScript**: 严格模式，无隐式 any
- **测试覆盖**: 核心模块 >= 80%，工具函数 >= 90%
- **代码风格**: ESLint + Prettier，提交前自动格式化
- **Git 提交**: 使用 [Conventional Commits](https://www.conventionalcommits.org/)

### 提交信息规范

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链

---

## 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 查看服务状态
./scripts/service-manager.sh status

# 停止占用端口的进程
./scripts/service-manager.sh stop <service-name>
```

#### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose ps

# 查看日志
docker-compose logs postgres

# 重启服务
docker-compose restart postgres
```

#### 3. 依赖安装失败

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 4. 权限问题（Linux/Mac）

```bash
# 添加执行权限
chmod +x init.sh scripts/*.sh
```

#### 5. PowerShell 执行策略限制（Windows）

```powershell
# 以管理员身份运行 PowerShell，执行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新运行脚本
.\init.ps1
```

#### 6. 数据库迁移失败

```bash
# 检查 PostgreSQL 是否正常运行
docker-compose ps
# 或
podman ps | grep postgres

# 检查数据库连接字符串
# 确认 .env.local 中的 DATABASE_URL 配置正确

# 手动执行迁移
cd packages/db
npx drizzle-kit up:pg
cd ../..
```

#### 7. 环境变量未加载

```bash
# 确保 .env.local 文件存在
cp .env.example .env.local

# 编辑并配置必要的 API 密钥
# 特别需要设置 OPENAI_API_KEY
```

#### 8. pnpm 命令未找到

```powershell
# Windows: 安装 pnpm
npm install -g pnpm

# 如果已安装但未识别，刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```

---

## 文档

- [架构设计文档](README.markdown) - 详细架构设计
- [CLAUDE.md](CLAUDE.md) - AI Agent 行为规范
- [OpenSpec 工作流](openspec/workflow.md) - 规范驱动开发流程

---

## 许可证

[MIT License](LICENSE)

---

<p align="center">
  <strong>让意图即交付，让架构即护栏</strong>
</p>
