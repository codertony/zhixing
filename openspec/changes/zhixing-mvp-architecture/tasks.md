## 1. 基础设施与工程脚手架

- [x] 1.1 初始化 Monorepo 项目结构（Turborepo），划分 `apps/web`、`apps/cli`、`packages/mcp-server`、`packages/db` 等工作区
- [x] 1.2 配置 TypeScript + ESLint + Prettier 统一代码规范
- [x] 1.3 在 K8s 集群部署 PostgreSQL 实例，初始化数据库连接配置
- [x] 1.4 在 K8s 集群部署 Qdrant 向量数据库实例，验证连通性
- [x] 1.5 配置大模型中转代理环境变量（`ANTHROPIC_BASE_URL` / `OPENAI_BASE_URL`），验证 Embedding API 可用
- [x] 1.6 建立 GitLab API 集成基础库（认证、仓库信息读取、文件推送封装）

## 2. 数据模型与数据库 Schema

- [x] 2.1 设计并创建 Spec 规则表（`spec_rules`）：规则 ID、层级、所属域/项目、内容、版本、创建人、时间
- [x] 2.2 设计并创建 Override 记录表（`spec_overrides`）：规则 ID、项目 ID、原因、操作人、commit SHA、时间
- [x] 2.3 设计并创建项目注册表（`projects`）：项目 ID、GitLab 仓库路径、所属领域、领域订阅列表
- [x] 2.4 设计并创建 Skill 表（`skills`）：Skill ID、类型、名称、描述、内容、可见性、版本
- [x] 2.5 设计并创建合规上报记录表（`compliance_reports`）：项目 ID、扫描时间、规则列表、override 事件 JSON
- [x] 2.6 设计并创建分发记录表（`distribution_logs`）：项目 ID、触发原因、推送状态、GitLab commit SHA、时间
- [x] 2.7 编写数据库 migration 脚本并验证

## 3. Spec 管理中心后端 API

- [x] 3.1 实现规则 CRUD API（`GET/POST/PUT/DELETE /api/specs/rules`），含分层权限校验
- [x] 3.2 实现规则版本历史查询 API（`GET /api/specs/rules/:id/history`）
- [x] 3.3 实现三层规则编译逻辑：公司级 + 领域级 + 项目级合并，显式 override 优先
- [x] 3.4 实现项目注册与领域订阅管理 API（`POST /api/projects`、`PUT /api/projects/:id/subscriptions`）
- [x] 3.5 实现用户权限系统（公司级/领域级/项目级角色绑定）

## 4. Spec 分发引擎

- [x] 4.1 实现 `CLAUDE.md` 模板生成器：将编译后三层规则渲染为标准 `CLAUDE.md` 格式
- [x] 4.2 实现 GitLab 文件推送服务：通过 GitLab API 将 `CLAUDE.md` 提交至目标仓库
- [x] 4.3 实现规则变更监听器：Spec 规则写入后触发受影响项目的分发任务队列
- [x] 4.4 实现分发任务失败重试机制（最多 3 次）与失败告警日志
- [x] 4.5 实现分发记录写入（`distribution_logs`）与状态查询 API

## 5. 认知层 MCP 服务

- [x] 5.1 实现 GitLab 代码拉取与文件解析模块（支持 Java、JavaScript、TypeScript 文件）
- [x] 5.2 实现代码文件分块（Chunking）策略（按函数/类边界分块，非固定字符数）
- [x] 5.3 实现 Embedding 调用与向量存储（通过中转代理调用 OpenAI Embeddings → 写入 Qdrant）
- [x] 5.4 实现定期批量索引任务调度（默认每日 02:00，支持手动触发）
- [x] 5.5 实现增量索引逻辑：对比 git commit diff，只重新索引变更文件
- [x] 5.6 实现文档索引（Markdown/OpenAPI）：解析文档并写入 Qdrant，与代码索引统一命名空间管理
- [x] 5.7 实现语义检索 API：接受自然语言查询，返回 Top-K 相关代码/文档片段（含文件路径、行号）
- [x] 5.8 实现 Git 历史变更分析 API：调用 GitLab API 获取文件 commit 列表并生成摘要
- [x] 5.9 将认知层能力封装为 MCP Server（使用 Anthropic MCP SDK），暴露标准 MCP 工具接口
- [x] 5.10 实现跨领域检索隔离：按领域命名空间过滤，未订阅领域结果不返回
- [x] 5.11 部署认知层 MCP Server 至 K8s 集群，配置健康检查与服务发现

## 6. Spec 管理中心 Web UI

- [x] 6.1 搭建 React 18 + TypeScript + Tailwind CSS 前端工程（`apps/web`）
- [x] 6.2 实现公司级规则管理页面（列表、详情、新建、编辑、版本历史）
- [x] 6.3 实现领域级规则管理页面（按领域分组，权限控制）
- [x] 6.4 实现项目级规则管理页面（含 override 声明表单：选择规则、填写原因）
- [x] 6.5 实现项目注册与领域订阅管理页面
- [x] 6.6 实现分发状态查询页面（各项目最近分发记录、状态、GitLab 链接）
- [x] 6.7 实现 Override 事件查询页面（按规则/项目/时间范围过滤）

## 7. Skill 体系

- [x] 7.1 实现 Skill 注册 API（`POST /api/skills`），支持 MCP Tool、Prompt 模板、OpenSpec 模板三种类型
- [x] 7.2 实现 Skill 查询 API（`GET /api/skills`），支持按类型、可见性、领域过滤
- [x] 7.3 实现项目 Skill 订阅 API（`POST /api/projects/:id/skills`）
- [x] 7.4 在 Web UI 实现 Skill 仓库页面（浏览、详情、订阅入口）
- [x] 7.5 实现 Skill 可见性控制（公司级/领域级/私有）

## 8. CLI 智能体（zhixing CLI）

- [x] 8.1 初始化 CLI 工程（`apps/cli`），使用 Node.js + Commander.js 实现命令框架
- [x] 8.2 实现 `zhixing init` 命令：检测当前 git 仓库、拉取项目 Spec、生成 `CLAUDE.md`、写入 MCP 配置
- [x] 8.3 实现 `CLAUDE.md` 本地版本与平台版本一致性检测及差异提示
- [x] 8.4 实现 `zhixing ask "<question>"` 命令：调用认知层 MCP API，输出问答结果至终端
- [x] 8.5 实现 `zhixing skill list` 命令：列出平台可用 Skill（过滤当前项目可见范围）
- [x] 8.6 实现 `zhixing skill add <name>` 命令：订阅 Skill 并写入项目 MCP 配置
- [x] 8.7 实现大模型中转代理配置读取（`ZHIXING_API_BASE` 环境变量或 `~/.zhixing/config.json`）
- [ ] 8.8 发布 CLI 至内部 npm registry，验证安装与使用流程

## 9. 合规追踪

- [x] 9.1 实现合规上报 REST API（`POST /api/compliance/reports`），含项目 Token 鉴权
- [x] 9.2 编写 CI 静态扫描脚本（Shell/Node.js）：检查 `CLAUDE.md` 版本一致性与 override 声明，上报结果
- [x] 9.3 提供 GitLab CI 集成示例（`.gitlab-ci.yml` snippet），说明如何引入扫描步骤
- [x] 9.4 实现 override 事件持久化与高频 override 规则标记逻辑（30 天内 5+ 项目 override 标记）
- [x] 9.5 实现规则采纳率统计 API（`GET /api/compliance/adoption-rate`）

## 10. 试点验证（端到端）

- [ ] 10.1 选定试点 Java 后端仓库，完成 `zhixing init` 接入，验证 `CLAUDE.md` 生成正确
- [ ] 10.2 完成试点仓库首次全量代码索引，验证认知层问答基本可用
- [ ] 10.3 迁移试点项目现有 `CLAUDE.md` 内容至平台项目级规则
- [ ] 10.4 在试点项目中录入公司级基础规则（至少 5 条），验证三层编译与分发
- [ ] 10.5 试点开发者完成一个增量 feature 的端到端流程：`zhixing ask` 理解上下文 → AI 编程工具基于规范实现功能
- [ ] 10.6 接入 CI 合规扫描，验证 override 事件上报链路
- [ ] 10.7 收集试点反馈，记录 Open Questions（来自 design.md Q1-Q4）的实测答案
