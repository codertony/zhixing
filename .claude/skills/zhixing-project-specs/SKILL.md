# ZhiXing 知行平台项目特定规范

## 项目上下文

- **项目名称**：知行 (ZhiXing) 智能研发认知操作平台
- **英文品牌**：ZhiXing CogniAction OS
- **核心理念**：知行合一 —— 从静态知识检索到动态智能体执行的闭环
- **核心愿景**："让意图即交付，让架构即护栏"
- **开发模式**：AI-Native、规范驱动开发（SDD）、流工程（Flow Engineering）

## 四层架构体系

| 层级 | 名称 | 职责 |
|------|------|------|
| L4 | 交互平面 | IDE 插件、CLI 智能体、Web 控制台、VSM 仪表盘 |
| L3 | 控制平面 | Spec 编译器、技能竞技场、PromptOps、架构看护 Agent |
| L2 | 认知平面 | 统一认知分层（UCS）、决策谱系引擎、模型路由网关 |
| L1 | 数据与行动平面 | 影子执行层、MCP Server 集群、数据底座 |

## 技术栈约束

- **前端**：React 18 + TypeScript + Zustand + Tailwind CSS + Vite
- **后端**：Node.js 20 + Fastify + GraphQL + REST
- **数据库**：PostgreSQL（主）、Redis（缓存）、Qdrant（向量）、Neo4j（图）、InfluxDB（时序）
- **AI/ML**：LiteLLM 路由网关、OpenAI Embeddings、Microsoft GraphRAG、Anthropic MCP SDK
- **DevOps**：Docker + Kubernetes + GitHub Actions + Prometheus + Grafana + Turborepo

## 容器工具规范（本地开发）

**本地开发强制使用 Podman**，不使用 Docker 或远程云 K8s 服务。

| 场景 | 工具 | 说明 |
|------|------|------|
| 本地开发 | **Podman** | 本地容器运行时，rootless 更安全 |
| 本地编排 | **podman-compose** | 本地多容器管理 |
| 容器构建 | **podman build** | 替代 docker build |
| 镜像管理 | **podman** | 本地镜像管理 |
| 生产部署 | Docker / K8s | 由运维团队配置，不在本地开发使用 |

### Podman 安装

```bash
# macOS
brew install podman podman-compose
podman machine init
podman machine start

# Linux (Ubuntu/Debian)
sudo apt-get install podman podman-compose

# Linux (Fedora/RHEL)
sudo dnf install podman podman-compose

# Windows
# 使用 Podman Desktop: https://podman-desktop.io/
```

### 常用 Podman 命令

```bash
# 容器生命周期
podman ps              # 查看运行中的容器
podman ps -a           # 查看所有容器
podman start <name>   # 启动容器
podman stop <name>    # 停止容器
podman rm <name>      # 删除容器

# 镜像管理
podman images          # 查看本地镜像
podman pull <image>   # 拉取镜像
podman rmi <image>    # 删除镜像

# 日志和调试
podman logs -f <name> # 查看容器日志
podman exec -it <name> sh  # 进入容器

# 使用 podman-compose
cd scripts
podman-compose up -d          # 启动所有服务
podman-compose down           # 停止所有服务
podman-compose logs -f        # 查看日志
podman-compose pull           # 更新镜像
```

### Docker 兼容模式（可选）

```bash
# ~/.bashrc 或 ~/.zshrc
alias docker=podman
alias docker-compose=podman-compose
```

## Monorepo 工作区结构

```
zhixing/
├── apps/
│   ├── api/                 # Fastify 后端 API
│   ├── web/                 # React + Vite 前端
│   └── cli/                 # CLI 智能体
├── packages/
│   ├── db/                  # Drizzle ORM + 数据库配置
│   ├── shared/              # 共享类型和工具
│   ├── eslint-config/       # 共享 ESLint 配置
│   ├── gitlab-client/       # GitLab API 客户端
│   └── mcp-server/          # MCP Server 实现
├── openspec/                # OpenSpec 规范管理
├── .claude/                 # Claude Code 配置
├── scripts/                 # 开发脚本
├── package.json             # 根工作区配置
├── turbo.json               # Turborepo 配置
└── pnpm-workspace.yaml      # pnpm 工作空间
```

## 关键开发命令

```bash
# 开发环境初始化
./scripts/init.sh

# 安装依赖（根目录）
pnpm install

# 开发模式（所有应用）
pnpm dev

# 单独应用开发
pnpm --filter @zhixing/api dev
pnpm --filter @zhixing/web dev
pnpm --filter @zhixing/cli dev

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck

# 测试
pnpm test
pnpm test:coverage

# 数据库操作
pnpm --filter @zhixing/db migrate
pnpm --filter @zhixing/db generate

# 构建
pnpm build

# OpenSpec 命令
openspec list
openspec status
openspec new change <name>
```

## 包命名规范

- 应用包：`@zhixing/<name>`（如 `@zhixing/api`）
- 共享包：`@zhixing/<name>`（如 `@zhixing/db`）

## 环境配置管理

**必需的环境文件**：
```
.env.example           # 环境变量模板（提交到仓库）
.env.local             # 本地开发环境（不提交）
```

**环境变量分类**：
| 类别 | 前缀 | 示例 |
|------|------|------|
| 数据库 | `DB_` | `DB_URL`, `DB_POOL_SIZE` |
| API | `API_` | `API_PORT`, `API_HOST` |
| AI/ML | `AI_` | `AI_LITELLM_URL`, `AI_OPENAI_KEY` |
| 缓存 | `REDIS_` | `REDIS_URL` |
| 向量库 | `QDRANT_` | `QDRANT_URL` |
| GitLab | `GITLAB_` | `GITLAB_TOKEN`, `GITLAB_URL` |

## MCP Server 开发规范

### MCP Server 目录结构

```
packages/mcp-server/
├── src/
│   ├── index.ts            # Server 入口
│   ├── tools/              # Tool 实现
│   ├── resources/          # Resource 实现
│   └── prompts/            # Prompt 模板
├── tests/
├── package.json
└── tsconfig.json
```

### Tool 开发模板

```typescript
// packages/mcp-server/src/tools/gitlab/search-projects.ts
import { Tool } from '@modelcontextprotocol/sdk';

export const searchProjectsTool: Tool = {
  name: 'gitlab_search_projects',
  description: '搜索 GitLab 项目',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      limit: { type: 'number', default: 20 }
    },
    required: ['query']
  },
  async handler(args) {
    // 实现逻辑
  }
};
```

### MCP Server 测试规范

- 每个 Tool 必须有单元测试
- 使用 Mock 测试外部 API 调用
- 测试覆盖率 >= 80%

## CLI 智能体开发规范

### CLI 目录结构

```
apps/cli/
├── src/
│   ├── index.ts            # CLI 入口
│   ├── commands/           # 命令实现
│   ├── utils/              # 工具函数
│   └── types/              # 类型定义
├── tests/
├── package.json
└── bin/
    └── zhixing             # 可执行文件
```

### 命令开发模板

```typescript
// apps/cli/src/commands/sync.ts
import { Command } from 'commander';

export const syncCommand = new Command('sync')
  .description('同步 Spec 到下游系统')
  .option('-e, --env <env>', '目标环境', 'development')
  .action(async (options) => {
    // 实现逻辑
  });
```

## 质量门禁详细规范

### 代码质量门禁

| 检查项 | 工具 | 阈值 | 失败处理 |
|--------|------|------|----------|
| TypeScript 编译 | `tsc --noEmit` | 0 错误 | 阻塞提交 |
| ESLint | `eslint .` | 0 错误 | 阻塞提交 |
| Prettier 格式化 | `prettier --check` | 100% 符合 | 自动修复 |
| 单元测试覆盖率 | `vitest --coverage` | >= 80% | 阻塞提交 |
| 集成测试 | `vitest run` | 100% 通过 | 阻塞提交 |

### 架构合规门禁

| 检查项 | 方法 | 失败处理 |
|--------|------|----------|
| 无循环依赖 | `madge --circular` | 阻塞提交 |
| 跨层调用合规 | 自定义规则 | 警告 |
| API 契约兼容 | OpenAPI 对比 | 阻塞提交 |

### OpenSpec 合规门禁

| 阶段 | 检查内容 | 通过标准 |
|------|----------|----------|
| proposal | 需求完整性 | 包含背景、目标、范围 |
| specs | 规格清晰度 | 每个 spec 有验收标准 |
| design | 设计合理性 | 技术方案评审通过 |
| tasks | 任务可执行性 | 每个 task 有 verification |
| apply | 实现一致性 | 代码与 specs 匹配 |
| verify | 验证完整性 | passes: true 且测试通过 |

## MCP 工具权限

允许使用：`gitlab-mcp`（代码仓库）, `chrome-devtools-mcp`（浏览器自动化测试）

安全约束：所有操作记录审计日志；敏感数据查询自动脱敏
