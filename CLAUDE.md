# ZhiXing Platform - Claude 行为规范

## 语言约束（首要规则）

**Always respond in Chinese (Simplified). 请始终使用简体中文回复。**

- 所有技术解释、错误分析、命令说明均使用中文
- 代码注释说明、架构分析、思考过程全部以中文输出
- 代码本身（变量名、函数名等）保持英文，但解释说明使用中文

---

## 项目概述

- **项目名称**：知行 (ZhiXing) 智能研发认知操作平台
- **英文品牌**：ZhiXing CogniAction OS
- **核心理念**：知行合一 —— 从静态知识检索到动态智能体执行的闭环
- **核心愿景**："让意图即交付，让架构即护栏"
- **开发模式**：AI-Native、规范驱动开发（SDD）、流工程（Flow Engineering）

### 四层架构体系

| 层级 | 名称 | 职责 |
|------|------|------|
| L4 | 交互平面 | IDE 插件、CLI 智能体、Web 控制台、VSM 仪表盘 |
| L3 | 控制平面 | Spec 编译器、技能竞技场、PromptOps、架构看护 Agent |
| L2 | 认知平面 | 统一认知分层（UCS）、决策谱系引擎、模型路由网关 |
| L1 | 数据与行动平面 | 影子执行层、MCP Server 集群、数据底座 |

### 技术栈约束

- **前端**：React 18 + TypeScript + Zustand + Tailwind CSS + Vite
- **后端**：Node.js 20 + Fastify + GraphQL + REST
- **数据库**：PostgreSQL（主）、Redis（缓存）、Qdrant（向量）、Neo4j（图）、InfluxDB（时序）
- **AI/ML**：LiteLLM 路由网关、OpenAI Embeddings、Microsoft GraphRAG、Anthropic MCP SDK
- **DevOps**：Docker + Kubernetes + GitHub Actions + Prometheus + Grafana + Turborepo

---

## 核心原则

### 1. Skill-First 执行铁律

在任何操作之前，即使只有 1% 的概率某个 Skill 可能适用，也必须调用它。

### 2. 增量进度原则

| 规则 | 说明 |
|------|------|
| 一次一个任务 | 每次会话只处理一个任务 |
| 测试驱动 | 功能必须测试验证后才能标记完成 |
| 频繁提交 | 每完成一个任务，立即进行一次 git commit |
| 错误重试 | 任务执行出错时，最多重试 3 次 |

### 3. 质量门禁

- TypeScript 编译无错误
- ESLint 检查通过
- 单元测试覆盖率 >= 80%
- 集成测试通过

---

## 项目专属 Skills

| Skill | 用途 | 触发场景 |
|-------|------|----------|
| `zhixing-init` | 项目初始化 | 新环境设置、依赖更新 |
| `zhixing-db` | 数据库操作 | Schema 变更、数据迁移 |
| `zhixing-test` | 测试驱动开发 | 写测试、运行测试、覆盖率检查 |
| `zhixing-arch` | 架构看护 | 代码审查、架构合规检查 |
| `zhixing-long-running-agent` | 长时间运行 Agent 设计 | 跨会话任务、复杂功能开发 |
| `zhixing-dev-methodology` | 三插件融合开发方法论 | Skill-First 执行、Ralph Loop |
| `zhixing-project-specs` | 项目特定规范 | Podman 使用、Monorepo 结构 |
| `zhixing-anti-patterns` | 常见反模式与纠正 | 避免开发陷阱 |
| `zhixing-troubleshooting` | 故障排除 | 解决常见错误 |

---

## OpenSpec 命令速查

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
| `/opsx:bulk-archive` | 批量归档 |

---

## 关键开发命令

```bash
# 开发环境初始化
./scripts/init.sh

# 安装依赖
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
```

---

## 强制指令

1. "删除或修改测试是不可接受的，因为这可能导致功能缺失或存在 bug。"
2. "只有当所有验证步骤都通过后，才能将 passes 设置为 true。"
3. "每次会话只处理一个任务，不要试图一次完成所有工作。"
4. "会话结束时，环境必须处于清洁、可工作的状态。"
5. "使用 JSON 格式存储功能清单，不要使用 Markdown。"
6. "发现 CRITICAL 问题时必须暂停，等待人工介入。"
7. "在任何操作前，即使只有 1% 的概率某个 Skill 可能适用，也必须调用它。"
8. "流程 Skill（brainstorming、debugging、planning）优先于实现 Skill。"
9. "进入 Ralph Loop 前必须完成 OpenSpec artifacts 创建。"
10. "长时间运行任务必须使用 Ralph Loop 或检查点模式，禁止一次性执行。"

---

## 附录

### 相关链接

- [OpenSpec 工作流文档](./openspec/workflow.md)
- [产品定义文档](./product.md)
- [架构设计文档](./README.markdown)

### 技术栈文档

- [Fastify 文档](https://www.fastify.io/docs/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol)
- [Turborepo 文档](https://turbo.build/repo/docs)

### 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2025-02 | 初始版本，基础 OpenSpec 工作流 |
| 1.1 | 2025-02 | 集成 superpowers + everything-claude-code + ralph-wiggum |
| 1.2 | 2025-02 | 添加项目特定规范和 monorepo 配置 |
| 1.3 | 2025-02 | 精简文档，提取内容为独立 Skills |
