## Why

大团队 AI 编程面临知识孤岛问题：约 100 个项目（10 个领域 × 10 个子项目）代码隔离、Spec 规则分散、跨项目知识无法复用，导致 AI 编程工具（Cursor/Claude Code）缺乏企业上下文，生成质量低且合规性无保障。知行平台 MVP 通过构建三层 Spec 管理中心、认知层 MCP 服务和 CLI 智能体，打破知识孤岛，为 AI 编程提供统一的规则上下文与企业知识底座。

## What Changes

- 新增**三层 Spec 管理中心**（Web UI）：公司级 / 领域级 / 项目级规则统一管理，知行平台为唯一事实来源
- 新增**Spec 双轨分发引擎**：自动生成 `CLAUDE.md`/`AGENTS.md` 推送至各 GitLab 项目（本地文件轨）+ MCP 服务实时注入（运行时轨）
- 新增**认知层 MCP 服务**：索引 GitLab 代码仓库、需求文档、API 文档，提供代码语义问答与跨领域知识订阅
- 新增**知行 CLI 智能体**：预装公司认知与规则的 AI 编程入口，差异化于原生 Claude Code
- 新增**Skill 体系**：MCP Tool + Prompt 模板 + OpenSpec change 模板的容器化分发机制
- 新增**合规追踪数据层**：CI 静态扫描上报 Spec 遵守情况，记录显式 override 及原因

## Capabilities

### New Capabilities

- `spec-management-center`：三层（公司级/领域级/项目级）Spec 规则管理 Web UI，支持显式 override 与权限分层，知行平台为唯一 Source of Truth
- `spec-distribution-engine`：双轨分发引擎，本地文件轨（生成 CLAUDE.md/AGENTS.md 推送 GitLab）与 MCP 实时轨（按需跨领域知识订阅注入）
- `cognitive-layer-mcp`：RAG 知识底座 MCP 服务，索引 GitLab（Java/React 代码）+ 文档，支持代码语义问答、Git 历史分析、跨领域知识订阅
- `cli-agent`：预装三层 Spec 规范 + 认知层上下文的 CLI 智能体，统一 MCP 工具入口，零配置接入 GitLab 历史
- `skill-system`：Skill 仓库（MCP Tool / Prompt 模板 / OpenSpec 模板容器），团队沉淀优质 Skill 后分发至各项目
- `compliance-tracking`：CI 静态扫描 + 数据上报，记录 Spec 采纳率与显式 override 事件，为后续规则优化提供数据基础

### Modified Capabilities

（无现有 specs，本次为全新建设）

## Impact

- **GitLab**：需 API 集成（代码索引、文件推送 `CLAUDE.md`/`AGENTS.md`）；试点仓库：Java 后端 + React/JS 前端各 2-3 个
- **CI 流水线**：各项目 CI 新增 Spec 合规静态扫描步骤，上报数据至知行平台（只上报，不拦截）
- **MCP Server 基础设施**：新增认知层 MCP 服务部署至现有 K8s 集群；新增 Spec 分发 MCP 服务
- **现有 OpenSpec 工作流**：知行平台作为上游，为 OpenSpec 提供规则上下文与 Skill 供给；`CLAUDE.md` 内容由平台统一管理
- **开发者工具链**：CLI 智能体需与现有大模型中转代理集成；已有 `CLAUDE.md` 的项目需迁移至平台管理
- **数据存储**：新增向量数据库（代码/文档 RAG）、关系数据库（Spec 规则/Skill/合规记录）
