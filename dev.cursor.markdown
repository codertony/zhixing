# 知行 (ZhiXing) · AI 原生智能研发平台

**ZhiXing CogniAction OS - AI-Native Development Platform**

[![monorepo](https://img.shields.io/badge/monorepo-turborepo-blue)](https://turbo.build)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> 让意图即交付,让架构即护栏 - **Intent is Delivery, Architecture is Guardrails**

---

## 📋 目录

- [项目概览](#项目概览)
- [Monorepo 架构设计](#monorepo-架构设计)
- [目录结构](#目录结构)
- [核心设计原则](#核心设计原则)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [AI 协作指南](#ai-协作指南)

---

## 项目概览

知行平台是企业级 AI 原生研发认知操作系统,通过统一的 monorepo 架构整合产品文档、前端应用、工具端、后端服务,为 AI 智能体提供完整的上下文视野和最大的操作自由度。

### 核心能力

- 🧠 **全域认知感知**: 统一的代码、文档、配置上下文
- 🤖 **智能体友好**: 为 AI Agent 优化的项目结构
- 🔄 **流式工程**: 从意图到交付的自动化闭环
- 🛡️ **架构守护**: 规范驱动的质量保障体系

---

## Monorepo 架构设计

### 整体架构视图

```
┌────────────────────────────────────────────────────────────────┐
│                        ZhiXing Monorepo                        │
│                    (AI-Native Workspace)                       │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Docs   │          │  Apps   │          │Services │
   │  产品文档  │          │  应用层   │          │ 服务层   │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                        ┌─────▼─────┐
                        │  Packages │
                        │  共享层     │
                        └───────────┘
```

### 分层说明

#### 1. **Docs 层** - 认知源头 (Source of Truth)
产品文档作为 AI 的"认知底座",包含完整的业务语境和决策谱系。

#### 2. **Apps 层** - 交互界面 (Interaction Plane)
- Web 控制台
- CLI 终端智能体
- IDE 插件
- VSM 价值流仪表盘

#### 3. **Services 层** - 能力中枢 (Capability Hub)
- API 网关服务
- 认知引擎服务
- Agent 编排服务
- MCP 服务集群

#### 4. **Packages 层** - 共享能力 (Shared Capabilities)
- 核心库
- UI 组件库
- 工具函数
- 类型定义
- 配置管理

---

## 目录结构

```
ZhiXing/
├── .ai/                          # AI 协作配置 (AI Context Root)
│   ├── AGENTS.md                 # 🤖 Agent 宪法 (最高优先级)
│   ├── context.md                # 上下文索引
│   ├── prompts/                  # Prompt 模板库
│   │   ├── code-generation/
│   │   ├── code-review/
│   │   ├── refactoring/
│   │   └── testing/
│   ├── skills/                   # MCP 技能定义
│   │   ├── database.mcp.json
│   │   ├── gitlab.mcp.json
│   │   ├── jira.mcp.json
│   │   └── k8s.mcp.json
│   └── rules/                    # 架构规则库
│       ├── architecture.yaml     # 适应度函数
│       ├── security.yaml         # 安全规范
│       └── style.yaml            # 代码风格
│
├── docs/                         # 📚 产品文档 (认知层 L1-L4)
│   ├── product/                  # 产品需求文档
│   │   ├── product.md            # 核心产品文档 ⭐
│   │   ├── prd/                  # PRD 模板
│   │   ├── specs/                # 功能规格说明
│   │   └── roadmap/              # 产品路线图
│   ├── architecture/             # 架构设计文档
│   │   ├── adr/                  # 架构决策记录 (ADR)
│   │   ├── system-design/        # 系统设计
│   │   ├── data-model/           # 数据模型
│   │   └── api-design/           # API 设计
│   ├── development/              # 开发文档
│   │   ├── getting-started.md    # 快速开始
│   │   ├── coding-standards.md   # 编码规范
│   │   ├── best-practices.md     # 最佳实践
│   │   └── workflows/            # 工作流文档
│   ├── operations/               # 运维文档
│   │   ├── deployment/           # 部署指南
│   │   ├── monitoring/           # 监控配置
│   │   └── troubleshooting/      # 故障排查
│   └── decision-traces/          # 🧬 决策谱系 (核心创新)
│       ├── context-graph/        # 语境图谱
│       ├── meeting-notes/        # 会议纪要
│       └── discussions/          # 讨论记录
│
├── apps/                         # 🎯 应用层 (L4 交互平面)
│   ├── web-console/              # Web 控制台
│   │   ├── src/
│   │   │   ├── features/         # 功能模块
│   │   │   │   ├── skill-store/       # 技能商店
│   │   │   │   ├── prompt-ops/        # Prompt 管理
│   │   │   │   ├── vsm-dashboard/     # 价值流仪表盘
│   │   │   │   └── agent-orchestration/ # Agent 编排
│   │   │   ├── components/       # 共享组件
│   │   │   ├── hooks/            # React Hooks
│   │   │   └── utils/            # 工具函数
│   │   ├── public/
│   │   ├── package.json
│   │   └── AGENTS.md             # 项目级 Agent 配置
│   │
│   ├── cli-agent/                # CLI 终端智能体
│   │   ├── src/
│   │   │   ├── commands/         # 命令集
│   │   │   │   ├── code/              # 代码操作
│   │   │   │   ├── file/              # 文件操作
│   │   │   │   ├── git/               # Git 操作
│   │   │   │   └── deploy/            # 部署操作
│   │   │   ├── plugins/          # 插件系统
│   │   │   └── agent/            # Agent 核心
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   ├── ide-extension/            # IDE 插件 (VS Code/Cursor)
│   │   ├── src/
│   │   │   ├── extension/        # 插件入口
│   │   │   ├── features/
│   │   │   │   ├── shadow-preview/    # 影子工作区预览
│   │   │   │   ├── real-time-diff/    # 实时差异对比
│   │   │   │   ├── context-loader/    # 上下文加载器
│   │   │   │   └── skill-runner/      # 技能执行器
│   │   │   └── webview/          # WebView UI
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   └── mobile-companion/         # 移动端协作助手 (未来)
│       ├── ios/
│       ├── android/
│       └── package.json
│
├── services/                     # ⚙️ 服务层 (L2/L3 核心能力)
│   ├── api-gateway/              # API 网关 (统一入口)
│   │   ├── src/
│   │   │   ├── routes/           # 路由定义
│   │   │   ├── middleware/       # 中间件
│   │   │   │   ├── auth.ts            # 认证
│   │   │   │   ├── pii-masking.ts     # PII 脱敏
│   │   │   │   └── rate-limit.ts      # 限流
│   │   │   └── gateway.ts
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   ├── cognitive-engine/         # 🧠 认知引擎 (L2 认知平面)
│   │   ├── src/
│   │   │   ├── ucs/              # 统一认知分层
│   │   │   │   ├── l1-public-knowledge/     # L1 公共基础
│   │   │   │   ├── l2-policy-rules/         # L2 制度红线
│   │   │   │   ├── l3-domain-expertise/     # L3 领域专家
│   │   │   │   └── l4-tribal-memory/        # L4 部落记忆
│   │   │   ├── decision-trace/   # 决策谱系引擎
│   │   │   │   ├── input-folding.ts         # 输入折叠
│   │   │   │   ├── causal-chain.ts          # 因果链记录
│   │   │   │   └── temporal-graph.ts        # 时序图谱
│   │   │   ├── context-graph/    # 语境图谱引擎
│   │   │   │   ├── graph-rag/             # GraphRAG
│   │   │   │   ├── ast-parser/            # AST 解析
│   │   │   │   └── dependency-analyzer/   # 依赖分析
│   │   │   ├── model-router/     # 模型路由网关
│   │   │   │   ├── router.ts              # 智能路由
│   │   │   │   ├── byok.ts                # BYOK 支持
│   │   │   │   └── cost-tracker.ts        # 成本追踪
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   ├── agent-orchestrator/       # 🤖 Agent 编排服务 (L3 控制平面)
│   │   ├── src/
│   │   │   ├── spec-compiler/    # Spec 编译器
│   │   │   │   ├── agents-parser.ts       # AGENTS.md 解析
│   │   │   │   ├── cascading-config.ts    # 级联配置
│   │   │   │   └── openapi-generator.ts   # OpenAPI 生成
│   │   │   ├── skill-arena/      # 技能竞技场
│   │   │   │   ├── sandbox.ts             # 沙箱测试
│   │   │   │   ├── elo-rating.ts          # ELO 评分
│   │   │   │   └── red-team.ts            # 红队测试
│   │   │   ├── guard-agent/      # 架构看护 Agent
│   │   │   │   ├── fitness-functions.ts   # 适应度函数
│   │   │   │   ├── ci-interceptor.ts      # CI 拦截器
│   │   │   │   └── dual-verification.ts   # 双模校验
│   │   │   ├── swarm-bus/        # Agent 编排总线
│   │   │   │   ├── handshake.ts           # 握手协议
│   │   │   │   └── coordinator.ts         # 协调器
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   ├── mcp-server-hub/           # 🔌 MCP 服务集群 (L1 行动平面)
│   │   ├── src/
│   │   │   ├── servers/
│   │   │   │   ├── database/              # 数据库 MCP
│   │   │   │   ├── gitlab/                # GitLab MCP
│   │   │   │   ├── jira/                  # Jira MCP
│   │   │   │   ├── k8s/                   # K8s MCP
│   │   │   │   └── snowflake/             # Snowflake MCP
│   │   │   ├── registry/         # 服务注册表
│   │   │   ├── proxy/            # MCP 代理
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   ├── shadow-executor/          # 🎭 影子执行服务
│   │   ├── src/
│   │   │   ├── workspace/        # 影子工作区
│   │   │   ├── linter/           # Linter 检查
│   │   │   ├── type-checker/     # 类型检查
│   │   │   └── test-runner/      # 测试执行器
│   │   ├── package.json
│   │   └── AGENTS.md
│   │
│   └── vsm-analytics/            # 📊 价值流分析服务
│       ├── src/
│       │   ├── collectors/       # 数据采集器
│       │   ├── metrics/          # 指标计算
│       │   │   ├── dora.ts               # DORA 指标
│       │   │   ├── ai-adoption.ts        # AI 采纳率
│       │   │   └── flow-state.ts         # 流状态时间
│       │   └── dashboard/        # 仪表盘后端
│       ├── package.json
│       └── AGENTS.md
│
├── packages/                     # 📦 共享包 (横向能力)
│   ├── core/                     # 核心库
│   │   ├── src/
│   │   │   ├── types/            # 类型定义
│   │   │   ├── constants/        # 常量定义
│   │   │   └── utils/            # 工具函数
│   │   └── package.json
│   │
│   ├── ui-components/            # UI 组件库
│   │   ├── src/
│   │   │   ├── components/       # 组件
│   │   │   ├── hooks/            # Hooks
│   │   │   ├── styles/           # 样式
│   │   │   └── stories/          # Storybook
│   │   └── package.json
│   │
│   ├── mcp-sdk/                  # MCP SDK
│   │   ├── src/
│   │   │   ├── client/           # MCP 客户端
│   │   │   ├── server/           # MCP 服务端
│   │   │   └── protocol/         # 协议定义
│   │   └── package.json
│   │
│   ├── agent-runtime/            # Agent 运行时
│   │   ├── src/
│   │   │   ├── executor/         # 执行器
│   │   │   ├── memory/           # 记忆管理
│   │   │   └── tools/            # 工具集成
│   │   └── package.json
│   │
│   ├── spec-parser/              # Spec 解析器
│   │   ├── src/
│   │   │   ├── agents-md/        # AGENTS.md 解析
│   │   │   ├── openapi/          # OpenAPI 解析
│   │   │   └── gherkin/          # Gherkin 解析
│   │   └── package.json
│   │
│   ├── graph-rag/                # GraphRAG 库
│   │   ├── src/
│   │   │   ├── indexer/          # 索引器
│   │   │   ├── retriever/        # 检索器
│   │   │   └── graph/            # 图谱构建
│   │   └── package.json
│   │
│   ├── config/                   # 配置包
│   │   ├── eslint/               # ESLint 配置
│   │   ├── typescript/           # TypeScript 配置
│   │   ├── prettier/             # Prettier 配置
│   │   └── tailwind/             # Tailwind 配置
│   │
│   └── database/                 # 数据库相关
│       ├── src/
│       │   ├── schema/           # 数据库模式
│       │   ├── migrations/       # 迁移脚本
│       │   └── seeds/            # 种子数据
│       └── package.json
│
├── infrastructure/               # 🏗️ 基础设施
│   ├── docker/                   # Docker 配置
│   │   ├── compose/
│   │   └── images/
│   ├── k8s/                      # K8s 配置
│   │   ├── base/
│   │   └── overlays/
│   ├── terraform/                # Terraform 脚本
│   └── scripts/                  # 部署脚本
│
├── data/                         # 📊 数据底座
│   ├── vector-db/                # Vector DB (记忆)
│   ├── graph-db/                 # Graph DB (关系)
│   └── timeseries-db/            # TimeSeries DB (谱系)
│
├── tests/                        # 🧪 测试
│   ├── e2e/                      # 端到端测试
│   ├── integration/              # 集成测试
│   ├── performance/              # 性能测试
│   └── security/                 # 安全测试
│
├── tools/                        # 🔧 工具脚本
│   ├── generators/               # 代码生成器
│   ├── migrators/                # 迁移工具
│   └── validators/               # 验证工具
│
├── .github/                      # GitHub 配置
│   ├── workflows/                # CI/CD 工作流
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── fitness-check.yml     # 架构适应度检查
│   └── CODEOWNERS                # 代码所有者
│
├── .vscode/                      # VS Code 配置
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .cursor/                      # Cursor 配置
│   ├── rules/                    # Cursor 规则
│   └── settings.json
│
├── .husky/                       # Git Hooks
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
│
├── package.json                  # 根 package.json
├── turbo.json                    # Turborepo 配置
├── pnpm-workspace.yaml           # pnpm workspace 配置
├── tsconfig.json                 # 根 TypeScript 配置
├── .env.example                  # 环境变量示例
├── .gitignore
├── LICENSE
└── README.markdown               # 本文件 ⭐
```

---

## 核心设计原则

### 1. AI 优先 (AI-First)

**设计目标**: 让 AI 能够理解整个项目的全貌并自主操作

#### 关键设计

- **`.ai/` 目录**: 作为 AI 的"配置中心",包含所有 AI 协作所需的上下文
  - `AGENTS.md`: 项目宪法,定义 AI 的行为边界和能力范围
  - `context.md`: 上下文索引,快速导航到关键信息
  - `prompts/`: 预设的 Prompt 模板,标准化 AI 交互
  - `skills/`: MCP 技能定义,声明 AI 可用的工具
  - `rules/`: 架构规则,定义 AI 生成代码的约束

- **分层 AGENTS.md**: 
  - 根级 `.ai/AGENTS.md`: 全局规则
  - 项目级 `apps/*/AGENTS.md`: 项目特定规则
  - 支持级联继承和覆盖

- **决策谱系记录**: `docs/decision-traces/` 保存所有设计决策的因果链,让 AI 理解"为什么"

#### 示例: `.ai/AGENTS.md` 结构

```markdown
# ZhiXing Agent 宪法

## 项目概览
- 名称: ZhiXing CogniAction OS
- 类型: AI 原生研发平台
- 技术栈: TypeScript, React, Node.js, GraphQL

## 角色定义
- **产品 Agent**: 负责需求分析和 PRD 生成
- **架构 Agent**: 负责系统设计和架构评审
- **编码 Agent**: 负责代码生成和测试编写
- **运维 Agent**: 负责部署和故障诊断

## 全局约束
1. 所有代码必须通过 TypeScript 类型检查
2. Controller 层禁止直接调用 DAO
3. 敏感操作需要人工审批
4. 遵循 Git Flow 工作流

## 技能清单
- gitlab: GitLab 操作
- jira: Jira 操作
- database: 数据库查询
- k8s: K8s 部署
...
```

---

### 2. 上下文完整性 (Context Completeness)

**设计目标**: 在单个 monorepo 中提供所有必要的上下文信息

#### 关键设计

- **文档优先**: `docs/` 目录作为认知源头,包含完整的产品、架构、开发文档
- **决策追溯**: `docs/decision-traces/` 记录每个重要决策的背景和理由
- **代码共存**: 所有相关代码在同一仓库,AI 可以轻松跨项目理解依赖
- **测试同步**: 测试代码与业务代码紧密关联,便于理解预期行为

#### 上下文层级

```
L1 公共基础 -> packages/core (通用工具)
L2 制度红线 -> .ai/rules (架构规则)
L3 领域专家 -> docs/architecture (架构设计)
L4 部落记忆 -> docs/decision-traces (决策谱系)
```

---

### 3. 模块化与可组合 (Modularity & Composability)

**设计目标**: 每个模块职责单一,可独立开发和测试

#### 关键设计

- **Turborepo 加速**: 利用缓存和并行构建提升效率
- **包依赖管理**: 通过 `pnpm workspace` 管理内部依赖
- **API 契约**: 使用 OpenAPI 定义服务接口,确保一致性
- **Shared Packages**: 核心能力沉淀到 `packages/`,避免重复

#### 依赖关系

```
apps/* -> packages/* (应用依赖共享包)
services/* -> packages/* (服务依赖共享包)
packages/* -> packages/core (包之间依赖)
```

---

### 4. 规范驱动 (Spec-Driven)

**设计目标**: 通过规范约束 AI 行为,确保输出质量

#### 关键设计

- **AGENTS.md 协议**: 每个子项目都有自己的 AGENTS.md,定义局部规则
- **OpenAPI 优先**: API 设计先于实现,生成客户端和服务端代码
- **Schema 验证**: 使用 JSON Schema 验证数据结构
- **适应度函数**: 在 CI 中自动检查架构合规性

---

### 5. 可观测性 (Observability)

**设计目标**: 实时监控 AI 的行为和效能

#### 关键设计

- **VSM 仪表盘**: 实时展示 DORA 指标和 AI 效能
- **决策日志**: 记录 AI 的每个决策和依据
- **审计追踪**: 所有操作可溯源
- **性能监控**: 追踪构建时间、测试覆盖率等

---

## 快速开始

### 环境要求

- **Node.js**: >= 20.x
- **pnpm**: >= 8.x
- **Docker**: >= 24.x (可选)
- **Git**: >= 2.40.x

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/ZhiXing.git
cd ZhiXing

# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行所有测试
pnpm test
```

### 本地开发

```bash
# 启动 Web 控制台 (开发模式)
pnpm --filter web-console dev

# 启动 API 网关
pnpm --filter api-gateway dev

# 启动认知引擎
pnpm --filter cognitive-engine dev

# 同时启动所有服务
pnpm dev
```

### 使用 Docker

```bash
# 启动所有服务
docker-compose -f infrastructure/docker/compose/dev.yml up

# 仅启动数据库
docker-compose -f infrastructure/docker/compose/dev.yml up -d postgres redis
```

---

## 开发指南

### Monorepo 命令

```bash
# 在特定包中执行命令
pnpm --filter <package-name> <command>

# 示例: 在 web-console 中运行测试
pnpm --filter web-console test

# 在所有包中执行命令
pnpm -r <command>

# 示例: 在所有包中运行 lint
pnpm -r lint

# 添加依赖到特定包
pnpm --filter <package-name> add <dependency>

# 添加内部依赖
pnpm --filter web-console add @zhixing/ui-components
```

### 创建新的应用

```bash
# 使用生成器创建新应用
pnpm run create:app my-new-app

# 手动创建
cd apps
mkdir my-new-app
cd my-new-app
pnpm init
# 配置 package.json 和 AGENTS.md
```

### 创建新的服务

```bash
# 使用生成器创建新服务
pnpm run create:service my-new-service

# 手动创建
cd services
mkdir my-new-service
cd my-new-service
pnpm init
# 配置 package.json 和 AGENTS.md
```

### 创建新的共享包

```bash
# 使用生成器创建新包
pnpm run create:package my-new-package

# 手动创建
cd packages
mkdir my-new-package
cd my-new-package
pnpm init
# 配置 package.json
```

---

## AI 协作指南

### 为什么选择这个结构?

这个 monorepo 架构是专门为 AI 协作优化的,具有以下优势:

#### 1. **单一真相源 (Single Source of Truth)**
所有代码、文档、配置都在一个仓库中,AI 无需切换上下文就能获取完整信息。

#### 2. **显式的上下文索引**
`.ai/context.md` 提供了项目的"地图",AI 可以快速定位所需信息:

```markdown
# 上下文索引

## 核心文档
- 产品定位: docs/product/product.md
- 系统架构: docs/architecture/system-design/overview.md
- API 设计: docs/architecture/api-design/rest-api.md

## 关键代码
- 认知引擎: services/cognitive-engine/src/
- Agent 编排: services/agent-orchestrator/src/
- MCP 集群: services/mcp-server-hub/src/

## 配置文件
- 全局 Agent 配置: .ai/AGENTS.md
- 架构规则: .ai/rules/architecture.yaml
- MCP 技能: .ai/skills/
```

#### 3. **分层的认知体系**
通过 UCS (统一认知分层) 结构,AI 能理解知识的优先级:

```
L1: packages/core (公共基础知识)
L2: .ai/rules (企业规范)
L3: docs/architecture (领域知识)
L4: docs/decision-traces (历史决策)
```

#### 4. **安全的执行环境**
影子执行层 (`services/shadow-executor`) 让 AI 可以安全地"试错":

```
AI 生成代码 -> 影子工作区 -> Linter/类型检查/测试 -> 通过后展示给人类
```

#### 5. **规范驱动的质量保障**
每个子项目的 `AGENTS.md` 定义了 AI 的行为边界:

```markdown
# apps/web-console/AGENTS.md

## 技术栈约束
- 前端框架: React 18+
- 状态管理: Zustand
- 样式方案: Tailwind CSS
- 禁止使用: Redux, Styled-Components

## 编码规范
- 组件必须使用函数式
- 所有 API 调用必须有错误处理
- 禁止在组件中直接写业务逻辑
```

---

### AI 工作流示例

#### 场景 1: 新增功能模块

**人类输入:**
```
在 web-console 中新增"技能商店"功能,允许用户浏览和订阅 MCP 技能
```

**AI 执行流程:**

1. **理解需求** (读取上下文)
   - 读取 `.ai/AGENTS.md` 理解全局约束
   - 读取 `apps/web-console/AGENTS.md` 理解项目规范
   - 读取 `docs/product/product.md` 理解业务背景

2. **设计方案** (生成规范)
   - 在 `docs/architecture/adr/` 创建 ADR (架构决策记录)
   - 在 `docs/architecture/api-design/` 设计 API 接口
   - 生成 OpenAPI 规范

3. **实施开发** (编写代码)
   - 在 `apps/web-console/src/features/skill-store/` 创建模块
   - 使用 `packages/ui-components` 中的组件
   - 调用 `services/mcp-server-hub` 的 API

4. **质量保障** (自动验证)
   - 在影子工作区执行 Linter 检查
   - 运行 TypeScript 类型检查
   - 执行单元测试
   - 通过适应度函数验证架构合规性

5. **提交审查** (人机协作)
   - 生成 Git 提交和 Pull Request
   - 在 PR 中附带变更说明和测试报告
   - 等待人类审查和批准

---

#### 场景 2: 故障诊断

**人类输入:**
```
生产环境的认知引擎服务响应缓慢,帮我诊断问题
```

**AI 执行流程:**

1. **信息收集** (调用 MCP 技能)
   - 调用 `k8s.mcp` 查看 Pod 状态和日志
   - 调用 `database.mcp` 检查数据库连接池
   - 读取 `services/cognitive-engine/src/` 理解代码逻辑

2. **原因分析** (决策谱系查询)
   - 查询 `docs/decision-traces/` 了解近期变更
   - 分析代码依赖图谱,定位瓶颈模块
   - 对比历史性能指标

3. **问题定位**
   - 发现 GraphRAG 索引查询过慢
   - 识别未命中缓存的查询模式

4. **修复方案** (生成补丁)
   - 优化查询逻辑,添加缓存层
   - 在影子环境验证修复效果
   - 生成性能测试报告

5. **部署上线** (自动化流程)
   - 创建 Hotfix 分支
   - 通过 CI/CD 自动部署到预发布环境
   - 验证通过后推送到生产环境

---

### AI 使用最佳实践

#### 1. 明确指定上下文范围

**不好的提示:**
```
帮我优化这段代码
```

**好的提示:**
```
优化 services/cognitive-engine/src/context-graph/graph-rag/retriever.ts 中的向量检索逻辑,
参考 docs/architecture/adr/003-graphrag-optimization.md 中的性能要求
```

#### 2. 引用决策谱系

**不好的提示:**
```
为什么这里要用 GraphRAG 而不是简单的向量检索?
```

**好的提示:**
```
根据 docs/decision-traces/context-graph/2025-01-15-graphrag-adoption.md,
解释选择 GraphRAG 的原因和权衡
```

#### 3. 遵循分层规范

**不好的提示:**
```
生成一个用户登录功能
```

**好的提示:**
```
根据 .ai/rules/security.yaml 中的安全规范,
在 apps/web-console 中生成用户登录功能,
使用 packages/core/src/auth/ 中的认证库
```

#### 4. 利用 MCP 技能

**不好的提示:**
```
查看数据库中用户表的结构
```

**好的提示:**
```
使用 database.mcp 技能查询生产环境 users 表的 schema,
并与 packages/database/src/schema/users.sql 对比是否一致
```

---

### 项目导航 (For AI)

当 AI 需要理解项目结构时,按以下顺序阅读:

1. **项目概览**: `README.markdown` (本文件)
2. **全局规范**: `.ai/AGENTS.md`
3. **上下文索引**: `.ai/context.md`
4. **产品文档**: `docs/product/product.md`
5. **架构设计**: `docs/architecture/system-design/overview.md`
6. **决策谱系**: `docs/decision-traces/README.md`
7. **具体模块**: 根据任务需要,进入相应的 `apps/` 或 `services/`

---

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **路由**: React Router v6
- **UI 组件**: 自研组件库 + shadcn/ui
- **样式**: Tailwind CSS
- **构建**: Vite

### 后端
- **运行时**: Node.js 20+
- **框架**: Fastify
- **API**: GraphQL (Apollo Server) + REST
- **认证**: JWT + OAuth 2.0
- **数据库**: PostgreSQL + Redis

### 数据层
- **关系型**: PostgreSQL (业务数据)
- **向量库**: Qdrant (代码向量)
- **图数据库**: Neo4j (依赖图谱)
- **时序库**: InfluxDB (决策谱系)
- **缓存**: Redis

### AI & ML
- **模型路由**: LiteLLM
- **向量化**: OpenAI Embeddings / text-embedding-3
- **GraphRAG**: Microsoft GraphRAG
- **MCP 协议**: Anthropic MCP SDK

### DevOps
- **容器**: Docker + Docker Compose
- **编排**: Kubernetes
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana
- **日志**: Loki + Promtail

### 开发工具
- **Monorepo**: Turborepo
- **包管理**: pnpm
- **代码检查**: ESLint + Prettier
- **类型检查**: TypeScript
- **测试**: Vitest + Playwright
- **Git Hooks**: Husky + lint-staged

---

## 许可证

MIT License

---

## 联系我们

- **官网**: https://zhixing.ai
- **文档**: https://docs.zhixing.ai
- **GitHub**: https://github.com/your-org/ZhiXing
- **邮箱**: contact@zhixing.ai

---

**让意图即交付,让架构即护栏 🚀**
