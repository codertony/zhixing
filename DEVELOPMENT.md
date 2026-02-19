# 知行平台开发指南

## 环境要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

## 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填写必要的配置
# 必需配置：
# - OPENAI_API_KEY (用于 Embedding)
# - GITLAB_TOKEN (用于代码拉取)
```

### 2. 启动基础设施服务

```bash
# 使用脚本一键启动
bash scripts/dev-start.sh

# 或手动启动
docker-compose up -d
```

这将启动：
- PostgreSQL (端口: 5432)
- Qdrant (端口: 6333)
- Redis (端口: 6379)

### 3. 安装依赖并执行迁移

```bash
# 安装所有依赖
pnpm install

# 执行数据库迁移
pnpm db:migrate
```

### 4. 启动开发服务器

#### 方式一：同时启动所有服务

```bash
pnpm dev
```

#### 方式二：单独启动特定服务

```bash
# 仅启动 API 服务
pnpm dev:api

# 仅启动 Web 前端
pnpm dev:web

# 仅启动 MCP Server
pnpm dev:mcp
```

服务启动后：
- API 服务: http://localhost:3001
- Web UI: http://localhost:3000
- MCP Server HTTP: http://localhost:3002

## 项目结构

```
zhixing/
├── apps/
│   ├── api/           # Fastify API 服务
│   ├── web/           # React Web UI
│   └── cli/           # zhixing CLI 工具
├── packages/
│   ├── db/            # 数据库 Schema 和连接
│   ├── mcp-server/    # 认知层 MCP Server
│   ├── gitlab-client/ # GitLab API 客户端
│   ├── shared/        # 共享工具函数
│   ├── eslint-config/ # ESLint 配置
│   └── typescript-config/ # TypeScript 配置
├── docker-compose.yml # 本地基础设施
└── package.json       # 根目录配置
```

## 常用命令

### 基础设施管理

```bash
# 启动基础设施
pnpm infra:up

# 停止基础设施
pnpm infra:down

# 查看日志
pnpm infra:logs
```

### 数据库操作

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 打开 Drizzle Studio
pnpm --filter @zhixing/db db:studio
```

### 代码质量

```bash
# 运行所有 lint
pnpm lint

# 格式化代码
pnpm format

# 类型检查
pnpm turbo run typecheck
```

## 开发工作流

### 添加新功能

1. 在 `apps/api/src/routes/` 添加 API 路由
2. 在 `apps/web/src/pages/` 添加对应页面
3. 在 `packages/db/src/schema/` 更新数据库 Schema（如需要）
4. 运行迁移：`pnpm db:migrate`
5. 测试 API 和 UI

### 测试 MCP Server

```bash
# 启动 MCP Server
pnpm dev:mcp

# 在另一个终端测试工具调用
npx @anthropic-ai/mcp-cli call search_code --param '{"query": "test", "projectId": "1"}'
```

### 测试 CLI

```bash
# 链接本地 CLI
pnpm --filter @zhixing/cli link --global

# 测试命令
zhixing init
zhixing ask "订单模块在哪里"
zhixing skill list
```

## 故障排除

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep zhixing-postgres

# 检查连接
pg_isready -h localhost -p 5432 -U zhixing
```

### Qdrant 连接失败

```bash
# 检查 Qdrant 是否运行
curl http://localhost:6333/healthz

# 查看 Qdrant 日志
docker logs zhixing-qdrant
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000
lsof -i :3001
lsof -i :3002

# 停止基础设施并重新启动
pnpm infra:down
pnpm infra:up
```

## API 文档

启动 API 服务后访问：
- OpenAPI 文档: http://localhost:3001/documentation
- 健康检查: http://localhost:3001/health

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | ✅ |
| `QDRANT_URL` | Qdrant REST API 地址 | ✅ |
| `OPENAI_API_KEY` | OpenAI API Key | ✅ |
| `OPENAI_BASE_URL` | OpenAI 代理地址 | ❌ |
| `GITLAB_TOKEN` | GitLab Access Token | ✅ |
| `GITLAB_URL` | GitLab 服务器地址 | ✅ |
| `PORT` | API 服务端口 | ❌ (默认: 3001) |
| `NODE_ENV` | 运行环境 | ❌ (默认: development) |

## 贡献指南

1. 创建功能分支: `git checkout -b feature/your-feature`
2. 提交更改: `git commit -m "feat: your feature"`
3. 推送分支: `git push origin feature/your-feature`
4. 创建 Pull Request

## 更多信息

- [项目 README](./README.md)
- [架构设计文档](./openspec/changes/zhixing-mvp-architecture/design.md)
- [API 规范](./openspec/changes/zhixing-mvp-architecture/specs/)
