## ADDED Requirements

### Requirement: 项目上下文初始化（zhixing init）
系统 SHALL 提供 `zhixing init` 命令，从知行平台拉取当前项目的编译后 Spec 规则，生成或更新 `CLAUDE.md`，并自动挂载认知层 MCP Server 配置。

#### Scenario: 新项目首次初始化
- **WHEN** 开发者在项目根目录执行 `zhixing init`
- **THEN** CLI SHALL 检测当前 GitLab 仓库信息，从平台拉取对应项目 Spec，生成 `CLAUDE.md`，并在 `~/.claude/mcp.json`（或等效配置）中挂载认知层 MCP Server 地址

#### Scenario: 本地文件与平台版本不一致时提示
- **WHEN** 执行 `zhixing init` 时检测到本地 `CLAUDE.md` 与平台最新版本存在差异
- **THEN** CLI SHALL 展示差异摘要并询问用户是否覆盖，用户确认后方可覆盖

### Requirement: 认知层问答（zhixing ask）
系统 SHALL 提供 `zhixing ask "<问题>"` 命令，直接调用认知层 MCP 服务进行代码语义问答，结果输出至终端。

#### Scenario: 代码定位问答
- **WHEN** 开发者执行 `zhixing ask "订单金额计算逻辑在哪里"`
- **THEN** CLI SHALL 调用认知层 MCP，返回最相关代码片段的文件路径与内容摘要，并可附带 Git 历史变更提示

#### Scenario: 跨领域问答（已订阅领域）
- **WHEN** 开发者的项目已订阅财务领域，执行 `zhixing ask "财务对账接口规范"`
- **THEN** CLI SHALL 在响应中包含财务领域的相关 API 文档或规则内容

### Requirement: Skill 管理（zhixing skill）
系统 SHALL 提供 `zhixing skill list` 和 `zhixing skill add <name>` 命令，支持查看可用 Skill 并订阅至当前项目。

#### Scenario: 列出可用 Skill
- **WHEN** 开发者执行 `zhixing skill list`
- **THEN** CLI SHALL 展示平台 Skill 仓库中所有可用 Skill 的名称、类型（MCP Tool/Prompt/OpenSpec 模板）与描述

#### Scenario: 订阅 Skill 到当前项目
- **WHEN** 开发者执行 `zhixing skill add unit-test-generator`
- **THEN** CLI SHALL 将该 Skill 的 MCP Tool 或 Prompt 模板配置写入项目的 MCP 配置文件，下次 AI 编程会话即可直接使用

### Requirement: 统一 MCP 入口（零配置接入）
系统 SHALL 通过 `zhixing init` 自动完成所有 MCP Server 挂载（认知层 + Spec 分发 + Skill），开发者无需手动配置各 MCP Server 地址。

#### Scenario: 开发者无需手动配置 MCP
- **WHEN** 开发者完成 `zhixing init` 后启动 Cursor 或 Claude Code
- **THEN** 认知层 MCP、Spec MCP 和已订阅 Skill 的 MCP 工具 SHALL 自动对 AI 编程工具可见，无需额外配置步骤

### Requirement: 大模型中转代理集成
系统 SHALL 支持通过环境变量或配置文件指定内部大模型中转代理地址，CLI 所有 LLM 调用均通过该代理路由，不直接访问外部 API。

#### Scenario: 使用内部代理发起 LLM 调用
- **WHEN** CLI 发起代码生成或问答请求
- **THEN** 请求 SHALL 通过配置的中转代理地址路由，且不绕过代理直连外部 LLM API
