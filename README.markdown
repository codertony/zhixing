# 知行 (ZhiXing) 智能研发认知操作平台 - 架构设计文档

## 项目概述

基于产品文档中定义的四层架构体系，设计一个 AI 原生的 monorepo 项目结构，实现"意图即交付，架构即护栏"的核心愿景。

## Monorepo 项目结构

```
zhixing-platform/
├── README.md                          # 项目总览
├── AGENTS.md                          # AI Agent 行为规范和上下文配置
├── package.json                       # 根目录依赖管理
├── pnpm-workspace.yaml               # pnpm 工作空间配置
├── turbo.json                        # Turborepo 构建配置
├── .env.example                      # 环境变量模板
├── .gitignore                        # Git 忽略配置
├── docker-compose.yml                # 开发环境容器编排
├──
├── docs/                             # 📚 产品与技术文档中心
│   ├── product/                      # 产品文档
│   │   ├── product.md               # 产品定义文档
│   │   ├── roadmap.md               # 产品路线图
│   │   ├── user-stories/            # 用户故事集合
│   │   └── specifications/          # 功能规格说明
│   ├── architecture/                # 架构文档
│   │   ├── system-design.md         # 系统架构设计
│   │   ├── api-contracts/           # API 契约定义
│   │   └── decision-records/        # 架构决策记录 (ADR)
│   ├── development/                 # 开发文档
│   │   ├── setup.md                 # 环境搭建指南
│   │   ├── coding-standards.md     # 编码规范
│   │   └── workflows.md             # 开发工作流
│   └── operations/                  # 运维文档
│       ├── deployment.md            # 部署指南
│       ├── monitoring.md            # 监控配置
│       └── troubleshooting.md       # 故障排查
│
├── packages/                         # 📦 核心业务包
│   ├── core/                        # 核心业务逻辑
│   │   ├── cognitive-plane/         # L2 认知平面
│   │   │   ├── ucs/                # 统一认知分层
│   │   │   ├── decision-trace/     # 决策谱系引擎
│   │   │   ├── context-graph/      # 语境图谱引擎
│   │   │   ├── model-router/       # 模型路由网关
│   │   │   └── agent-swarm/        # Agent 编排总线
│   │   ├── control-plane/           # L3 控制平面
│   │   │   ├── spec-compiler/      # Spec 编译器
│   │   │   ├── skill-arena/        # 技能竞技场
│   │   │   ├── prompt-ops/         # PromptOps 管理
│   │   │   ├── arch-guardian/      # 架构看护
│   │   │   └── dual-verification/  # 双模校验
│   │   └── data-action-plane/       # L1 数据与行动平面
│   │       ├── shadow-execution/   # 影子执行层
│   │       ├── mcp-cluster/        # MCP Server 集群
│   │       └── data-foundation/    # 数据底座
│   │
│   ├── services/                    # 🚀 微服务集合
│   │   ├── gateway/                 # API 网关服务
│   │   ├── auth/                    # 认证授权服务
│   │   ├── agent-runtime/           # Agent 运行时服务
│   │   ├── knowledge-graph/         # 知识图谱服务
│   │   ├── workflow-engine/         # 工作流引擎
│   │   ├── vector-db/               # 向量数据库服务
│   │   ├── metrics-collector/       # 指标收集服务
│   │   └── notification/            # 通知服务
│   │
│   ├── interfaces/                  # 🖥️ L4 交互平面
│   │   ├── web-console/             # Web 控制台
│   │   │   ├── src/
│   │   │   │   ├── components/     # React 组件
│   │   │   │   ├── pages/          # 页面组件
│   │   │   │   ├── hooks/          # 自定义 Hooks
│   │   │   │   ├── services/       # API 调用层
│   │   │   │   └── utils/          # 工具函数
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   └── vite.config.ts
│   │   ├── ide-extension/           # IDE 插件
│   │   │   ├── vscode/             # VS Code 扩展
│   │   │   └── cursor/             # Cursor 扩展
│   │   ├── cli-agent/               # CLI 终端智能体
│   │   │   ├── src/
│   │   │   ├── bin/
│   │   │   └── package.json
│   │   └── mobile-app/              # 移动端应用 (可选)
│   │
│   ├── shared/                      # 🔧 共享工具库
│   │   ├── types/                   # TypeScript 类型定义
│   │   ├── utils/                   # 通用工具函数
│   │   ├── config/                  # 配置管理
│   │   ├── constants/               # 常量定义
│   │   ├── validators/              # 数据验证
│   │   └── test-utils/              # 测试工具
│   │
│   └── integrations/                # 🔌 集成组件
│       ├── mcp-servers/             # MCP Server 实现
│       │   ├── gitlab-mcp/         # GitLab 集成
│       │   ├── jira-mcp/           # Jira 集成
│       │   ├── k8s-mcp/            # Kubernetes 集成
│       │   ├── database-mcp/       # 数据库集成
│       │   └── slack-mcp/          # Slack 集成
│       ├── ai-models/               # AI 模型集成
│       │   ├── openai/             # OpenAI 集成
│       │   ├── anthropic/          # Claude 集成
│       │   ├── deepseek/           # DeepSeek 集成
│       │   └── local-models/       # 本地模型集成
│       └── external-apis/           # 外部 API 集成
│
├── infrastructure/                   # 🏗️ 基础设施代码
│   ├── docker/                      # Docker 配置
│   │   ├── services/               # 各服务 Dockerfile
│   │   └── compose/                # Docker Compose 配置
│   ├── k8s/                        # Kubernetes 部署配置
│   │   ├── base/                   # 基础配置
│   │   ├── overlays/               # 环境特定配置
│   │   └── charts/                 # Helm Charts
│   ├── terraform/                   # 基础设施即代码
│   │   ├── modules/                # Terraform 模块
│   │   ├── environments/           # 环境配置
│   │   └── providers/              # 云提供商配置
│   └── monitoring/                  # 监控配置
│       ├── prometheus/             # Prometheus 配置
│       ├── grafana/                # Grafana 仪表盘
│       └── alertmanager/           # 告警配置
│
├── scripts/                         # 🛠️ 自动化脚本
│   ├── setup/                       # 环境搭建脚本
│   ├── build/                       # 构建脚本
│   ├── deploy/                      # 部署脚本
│   ├── test/                        # 测试脚本
│   └── migration/                   # 数据迁移脚本
│
├── tests/                           # 🧪 测试代码
│   ├── unit/                        # 单元测试
│   ├── integration/                 # 集成测试
│   ├── e2e/                        # 端到端测试
│   ├── performance/                 # 性能测试
│   └── fixtures/                    # 测试数据
│
├── tools/                           # 🔨 开发工具
│   ├── generators/                  # 代码生成器
│   ├── linters/                     # 代码检查工具
│   ├── formatters/                  # 代码格式化工具
│   ├── analyzers/                   # 代码分析工具
│   └── ai-helpers/                  # AI 辅助工具
│
├── examples/                        # 📖 示例代码
│   ├── agent-configs/               # Agent 配置示例
│   ├── mcp-integrations/           # MCP 集成示例
│   ├── workflow-templates/         # 工作流模板
│   └── api-usage/                  # API 使用示例
│
├── config/                          # ⚙️ 配置文件
│   ├── environments/                # 环境配置
│   │   ├── development.json
│   │   ├── staging.json
│   │   └── production.json
│   ├── agents/                      # Agent 配置
│   │   ├── coding-agent.yaml
│   │   ├── review-agent.yaml
│   │   └── testing-agent.yaml
│   ├── workflows/                   # 工作流配置
│   │   ├── feature-development.yaml
│   │   ├── bug-fixing.yaml
│   │   └── code-review.yaml
│   └── integrations/                # 集成配置
│       ├── gitlab.yaml
│       ├── jira.yaml
│       └── slack.yaml
│
└── ai-context/                      # 🤖 AI 上下文配置
    ├── prompts/                     # Prompt 模板
    │   ├── code-generation/        # 代码生成 Prompt
    │   ├── code-review/            # 代码评审 Prompt
    │   ├── documentation/          # 文档生成 Prompt
    │   └── testing/                # 测试生成 Prompt
    ├── knowledge-base/              # 知识库
    │   ├── coding-standards/       # 编码标准
    │   ├── architecture-patterns/  # 架构模式
    │   ├── best-practices/         # 最佳实践
    │   └── troubleshooting/        # 故障排查
    ├── training-data/               # 训练数据
    │   ├── code-samples/           # 代码示例
    │   ├── documentation-samples/  # 文档示例
    │   └── test-cases/             # 测试用例
    └── vector-embeddings/           # 向量嵌入
        ├── code-embeddings/        # 代码向量
        ├── doc-embeddings/         # 文档向量
        └── conversation-embeddings/ # 对话向量
```

## 核心 AGENTS.md 配置

每个项目根目录的 AGENTS.md 文件定义了 AI Agent 的行为规范和上下文配置：

### 全局 AGENTS.md 结构

```markdown
# ZhiXing Platform AI Agents Configuration

## 项目上下文 (Project Context)

### 项目概述
- **项目名称**: 知行 (ZhiXing) 智能研发认知操作平台
- **核心理念**: 知行合一 - 从静态知识检索到动态智能体执行的闭环
- **技术架构**: 四层分层架构 (L1-L4)
- **开发模式**: AI-Native, Spec-Driven Development, Flow Engineering

### 技术栈约束
- **后端**: Node.js/TypeScript, Python, Go
- **前端**: React, TypeScript, Vite
- **数据库**: PostgreSQL (主), Redis (缓存), Milvus (向量), Neo4j (图)
- **消息队列**: RabbitMQ
- **容器化**: Docker, Kubernetes
- **监控**: Prometheus, Grafana
- **CI/CD**: GitHub Actions, ArgoCD

## Agent 角色定义

### 1. 架构 Agent (Architecture Agent)
- **职责**: 系统架构设计、技术选型、依赖管理
- **工具权限**: 读写架构文档、生成 ADR、修改依赖配置
- **约束规则**:
  - 必须遵循四层架构原则
  - 新增依赖需要在 ADR 中说明理由
  - 跨层调用必须通过标准接口

### 2. 编码 Agent (Coding Agent)
- **职责**: 代码生成、重构、优化
- **工具权限**: 读写源码、运行测试、调用 MCP 工具
- **约束规则**:
  - 必须先写测试再写实现
  - 遵循 ESLint/Prettier 配置
  - 禁止跳过类型检查
  - 生成代码必须包含完整的 JSDoc 注释

### 3. 评审 Agent (Review Agent)
- **职责**: 代码审查、架构合规检查
- **工具权限**: 读取所有代码、运行静态分析工具
- **约束规则**:
  - 检查架构适应度函数
  - 验证测试覆盖率 > 80%
  - 确保 API 契约兼容性

### 4. 文档 Agent (Documentation Agent)
- **职责**: 生成和维护技术文档
- **工具权限**: 读写文档、生成 API 文档、更新 README
- **约束规则**:
  - 文档与代码同步更新
  - 使用标准化模板
  - 包含代码示例和使用场景

## 工作流规则 (Workflow Rules)

### Feature Development Flow
1. PM Agent 生成结构化 PRD
2. Architecture Agent 设计技术方案并生成 ADR
3. Coding Agent 基于 Spec 生成代码和测试
4. Review Agent 执行合规检查
5. Documentation Agent 更新相关文档

### Bug Fixing Flow
1. 自动收集错误日志和上下文
2. Coding Agent 分析根因并生成修复方案
3. 在 Shadow Workspace 中验证修复
4. Review Agent 审查修复质量
5. 自动部署到测试环境

## MCP 工具权限 (MCP Tool Permissions)

### 允许的工具集合
- **gitlab-mcp**: 代码仓库操作、PR 管理
- **jira-mcp**: 需求管理、任务跟踪
- **k8s-mcp**: 集群状态查询、日志获取
- **database-mcp**: 查询执行、Schema 分析
- **slack-mcp**: 通知发送、讨论记录获取

### 安全约束
- 生产环境操作需要人工确认
- 敏感数据查询自动脱敏
- 所有操作记录审计日志

## 质量门禁 (Quality Gates)

### 代码质量
- TypeScript 编译无错误
- ESLint 检查通过
- 单元测试覆盖率 >= 80%
- 集成测试通过

### 架构合规
- 无循环依赖
- 跨层调用合规
- API 契约兼容
- 性能指标达标

### 安全合规
- 依赖漏洞扫描通过
- 代码安全扫描通过
- 敏感信息泄露检查通过
```

## 关键设计特性

### 1. AI 上下文优化

#### 分层上下文结构
- **L1 基础上下文**: 通用编程知识、框架文档
- **L2 领域上下文**: 业务逻辑、企业规范
- **L3 项目上下文**: 具体实现、历史决策
- **L4 实时上下文**: 当前会话、即时状态

#### 向量化知识库
```
ai-context/vector-embeddings/
├── code-embeddings/           # 代码片段向量化
│   ├── functions.json        # 函数级别向量
│   ├── classes.json          # 类级别向量
│   └── modules.json          # 模块级别向量
├── doc-embeddings/           # 文档向量化
│   ├── requirements.json    # 需求文档向量
│   ├── architecture.json    # 架构文档向量
│   └── apis.json            # API 文档向量
└── conversation-embeddings/  # 对话历史向量化
    ├── decisions.json       # 决策讨论向量
    ├── reviews.json         # 代码评审向量
    └── issues.json          # 问题解决向量
```

### 2. 开发工作流集成

#### 自动化 Pipeline
```yaml
# .github/workflows/ai-assisted-development.yml
name: AI-Assisted Development

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  ai-code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: AI Code Review
        uses: ./tools/ai-helpers/code-review-action
        with:
          review-agent: 'architecture-guardian'
          context-depth: 'full'

  ai-test-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate Missing Tests
        uses: ./tools/ai-helpers/test-generator
        with:
          coverage-threshold: 80
          test-types: 'unit,integration'
```

### 3. 配置驱动的 Agent 行为

#### 环境特定配置
```yaml
# config/environments/development.json
{
  "agents": {
    "coding-agent": {
      "model": "deepseek-coder",
      "temperature": 0.2,
      "max-tokens": 4000,
      "tools": ["gitlab-mcp", "database-mcp"],
      "safety-checks": "permissive"
    },
    "review-agent": {
      "model": "claude-3-sonnet",
      "temperature": 0.1,
      "max-tokens": 8000,
      "tools": ["all-mcps"],
      "safety-checks": "strict"
    }
  },
  "workflows": {
    "feature-development": {
      "auto-test-generation": true,
      "shadow-workspace": true,
      "dual-model-verification": false
    }
  }
}
```

## 技术实现要点

### 1. Monorepo 管理

#### 依赖管理策略
- 使用 `pnpm workspaces` 管理依赖
- 共享依赖版本锁定
- 按层级组织包结构
- 循环依赖检测和防护

#### 构建优化
- 使用 `Turborepo` 进行增量构建
- 按层级并行构建
- 智能缓存策略
- 构建产物共享

### 2. AI 上下文管理

#### 动态上下文加载
```typescript
// packages/core/cognitive-plane/context-graph/src/context-loader.ts
export class ContextLoader {
  async loadContextForTask(task: Task): Promise<Context> {
    const contexts = await Promise.all([
      this.loadProjectContext(task.projectId),
      this.loadDomainContext(task.domain),
      this.loadHistoricalContext(task.relatedTasks),
      this.loadRealtimeContext(task.currentSession)
    ]);

    return this.mergeContexts(contexts);
  }

  private async loadProjectContext(projectId: string): Promise<ProjectContext> {
    // 加载项目特定的 AGENTS.md、架构文档、编码规范
  }

  private async loadDomainContext(domain: string): Promise<DomainContext> {
    // 加载领域特定的业务逻辑、规则、模式
  }
}
```

#### 向量检索优化
```typescript
// packages/shared/utils/src/vector-search.ts
export class VectorSearchEngine {
  async semanticSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const queryVector = await this.embedQuery(query);

    const results = await Promise.all([
      this.searchCodebase(queryVector, options.codeWeight),
      this.searchDocumentation(queryVector, options.docWeight),
      this.searchConversations(queryVector, options.historyWeight)
    ]);

    return this.rankAndMergeResults(results);
  }
}
```

### 3. 安全和权限控制

#### MCP 权限管理
```typescript
// packages/integrations/mcp-servers/src/permission-manager.ts
export class MCPPermissionManager {
  async checkPermission(agent: Agent, operation: MCPOperation): Promise<boolean> {
    const agentRole = await this.getAgentRole(agent);
    const operationLevel = this.getOperationRiskLevel(operation);

    if (operationLevel === 'HIGH' && agentRole !== 'SENIOR') {
      return false;
    }

    if (operation.target === 'PRODUCTION' && !agent.hasProductionAccess) {
      return false;
    }

    return this.checkRoleBasedPermission(agentRole, operation);
  }
}
```

## 部署和运维

### 1. 容器化策略

#### 多阶段构建
```dockerfile
# infrastructure/docker/services/cognitive-plane.Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/core/cognitive-plane/package.json packages/core/cognitive-plane/
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY packages/core/cognitive-plane/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2. 监控和可观测性

#### 自定义指标
```yaml
# infrastructure/monitoring/prometheus/ai-metrics.yml
groups:
  - name: zhixing.ai.metrics
    rules:
      - record: zhixing:ai_code_adoption_rate
        expr: sum(ai_generated_code_accepted) / sum(ai_generated_code_total)

      - record: zhixing:flow_state_time
        expr: sum(developer_focused_time) / sum(developer_total_time)

      - record: zhixing:architecture_violation_rate
        expr: sum(architecture_violations) / sum(code_commits_total)
```

## 开发指南

### 1. 快速开始

```bash
# 克隆项目
git clone https://github.com/your-org/zhixing-platform.git
cd zhixing-platform

# 安装依赖
pnpm install

# 启动开发环境
pnpm dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

### 2. AI Agent 开发

```bash
# 生成新的 Agent
pnpm run generate:agent --name=code-optimizer --layer=cognitive

# 测试 Agent
pnpm run test:agent code-optimizer

# 部署 Agent
pnpm run deploy:agent code-optimizer --env=staging
```

### 3. MCP 集成开发

```bash
# 生成新的 MCP Server
pnpm run generate:mcp --name=confluence --type=read-write

# 测试 MCP 集成
pnpm run test:mcp confluence

# 发布 MCP Server
pnpm run publish:mcp confluence
```

## 总结

这个 monorepo 架构设计实现了以下关键目标：

1. **完整的上下文整合**: 将产品文档、技术文档、代码、配置统一管理
2. **AI 友好的结构**: 通过分层上下文、向量化知识库为 AI 提供充分信息
3. **高度的操作自由度**: 通过 MCP 集成、工作流自动化让 AI 能够执行复杂操作
4. **严格的安全边界**: 通过权限管理、影子执行、双模校验确保操作安全
5. **可扩展的架构**: 支持新功能、新集成、新 Agent 的快速开发和部署

该架构完美体现了产品文档中"知行合一"的理念，让 AI 既有充分的"知"（上下文和知识），又有强大的"行"（工具和权限），通过"合一"（规范和约束）确保整个系统的安全可控。