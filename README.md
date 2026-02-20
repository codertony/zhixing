# 知行 (ZhiXing) · 智能研发认知操作平台

**ZhiXing CogniAction OS** - AI-Native 研发认知操作系统

---

## 项目简介

知行平台是面向 AI 原生时代的智能研发认知操作系统，实现从"静态知识检索"到"动态智能体执行"的闭环。平台基于"知行合一"理念，将企业研发规范转化为可执行的数字资产。

### 核心理念

- **知 (Cognition)** - 统一认知分层架构 (UCS)，解决上下文贫困问题
- **行 (Action)** - MCP 协议驱动的智能体执行引擎
- **合一 (Unity)** - 规范即源码 (Spec-as-Source)，确保 AI 创造力在规范内发挥

---

## 技术架构

### 四层架构体系

```
┌─────────────────────────────────────────────────────────────┐
│ L4: 交互平面 (Interaction Plane)                              │
│    - IDE 插件、CLI 智能体、Web 控制台、VSM 仪表盘              │
├─────────────────────────────────────────────────────────────┤
│ L3: 控制平面 (Control Plane)                                  │
│    - Spec 编译器、技能竞技场、PromptOps、架构看护 Agent        │
├─────────────────────────────────────────────────────────────┤
│ L2: 认知平面 (Cognitive Plane)                                │
│    - UCS 统一认知分层、决策谱系引擎、模型路由网关              │
├─────────────────────────────────────────────────────────────┤
│ L1: 数据与行动平面 (Data & Action Plane)                      │
│    - 影子执行层、MCP Server 集群、数据底座                     │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **前端**: React 18 + TypeScript + Zustand + Tailwind CSS + Vite
- **后端**: Node.js 20 + Fastify + GraphQL + REST
- **数据库**: PostgreSQL (主) + Redis (缓存) + Qdrant (向量) + Neo4j (图)
- **AI/ML**: LiteLLM 路由网关 + OpenAI Embeddings + Microsoft GraphRAG + MCP SDK
- **DevOps**: Docker + Kubernetes + GitHub Actions + Prometheus + Grafana

---

## 项目结构

```
zhixing/
├── apps/                       # 应用程序
│   ├── api/                   # Fastify REST API 服务
│   ├── web/                   # React 前端应用
│   └── cli/                   # CLI 智能体工具
├── packages/                   # 共享包
│   ├── db/                    # 数据库 Schema 和迁移
│   ├── shared/                # 共享工具类和类型
│   ├── gitlab-client/         # GitLab API 客户端
│   └── mcp-server/            # MCP 协议服务
├── docs/                       # 项目文档
└── openspec/                   # OpenSpec 变更管理
```

---

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Podman (本地开发使用，禁止直接使用 Docker)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有应用
pnpm dev

# 单独启动某个应用
pnpm --filter @zhixing/api dev
pnpm --filter @zhixing/web dev
pnpm --filter @zhixing/cli dev
```

### 数据库操作

```bash
# 执行数据库迁移
pnpm --filter @zhixing/db migrate

# 生成迁移文件
pnpm --filter @zhixing/db generate
```

### 代码检查

```bash
# ESLint 检查
pnpm lint

# 自动修复
pnpm lint:fix

# TypeScript 类型检查
pnpm typecheck
```

### 测试

```bash
# 运行所有测试
pnpm test

# 覆盖率报告
pnpm test:coverage
```

### 构建

```bash
pnpm build
```

---

## OpenSpec 工作流

本项目采用 OpenSpec 规范驱动开发流程：

| 命令 | 用途 |
|------|------|
| `/opsx:explore` | 需求探索 |
| `/opsx:new <name>` | 创建变更 |
| `/opsx:ff <name>` | 快速生成所有 artifacts |
| `/opsx:continue` | 继续变更 |
| `/opsx:apply` | 实现任务 |
| `/opsx:verify` | 验证实现 |
| `/opsx:sync` | 同步规格 |
| `/opsx:archive` | 归档变更 |

---

## 开发规范

### Skill-First 执行铁律

在任何操作前，即使只有 1% 概率某个 Skill 适用，也必须调用它。

### 增量进度原则

- 一次一个任务
- 测试驱动开发 (TDD)
- 频繁提交 (每完成一个任务立即 commit)
- 错误重试 (最多 3 次)

### 质量门禁

- TypeScript 编译无错误
- ESLint 检查通过
- 单元测试覆盖率 >= 80%
- 集成测试通过

---

## 文档

- [CLAUDE.md](./CLAUDE.md) - Claude Code 行为规范
- [product.md](./product.md) - 产品定义文档
- [openspec/workflow.md](./openspec/workflow.md) - OpenSpec 工作流文档

---

## License

MIT License
