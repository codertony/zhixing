## ADDED Requirements

### Requirement: Skill 定义与注册
系统 SHALL 支持将以下类型的资产注册为 Skill：MCP Tool（可调用接口）、Prompt 模板（文本生成模板）、OpenSpec change 模板（任务流程模板）。每个 Skill SHALL 包含名称、类型、描述、使用场景与版本信息。

#### Scenario: 注册 MCP Tool 类型 Skill
- **WHEN** 管理员通过 Web UI 提交一个 MCP Tool Skill（含工具名、接口描述、参数 Schema）
- **THEN** 系统 SHALL 将其存入 Skill 仓库，生成唯一 Skill ID，并标记为"待审核"状态

#### Scenario: 注册 Prompt 模板类型 Skill
- **WHEN** 用户上传一个 Prompt 模板（含模板内容、适用场景描述）
- **THEN** 系统 SHALL 存储模板内容，记录创建者与创建时间，并关联到对应领域或公司级

### Requirement: Skill 分发至项目
系统 SHALL 支持项目通过 CLI 或 Web UI 订阅 Skill，订阅后 Skill 的配置 SHALL 自动写入项目的 MCP 配置或 `CLAUDE.md` 的 Skill 声明区块。

#### Scenario: 项目订阅 Skill 后配置自动更新
- **WHEN** 项目订阅某 MCP Tool 类型的 Skill
- **THEN** 系统 SHALL 在该项目的 MCP 配置中添加对应工具的 Server 地址与工具描述，下次 `zhixing init` 后 AI 工具即可调用

#### Scenario: Skill 版本升级通知
- **WHEN** 项目已订阅的 Skill 发布新版本
- **THEN** 系统 SHALL 通知该项目的管理员，并提供版本对比与一键升级入口

### Requirement: Skill 与 OpenSpec 集成
系统 SHALL 支持将 OpenSpec change 模板作为 Skill 类型，项目订阅后可通过 `/opsx:apply <skill-name>` 直接调用预定义任务流程。

#### Scenario: 调用 OpenSpec 模板类型 Skill
- **WHEN** 开发者执行 `zhixing skill apply unit-feature-template`
- **THEN** 系统 SHALL 将该 OpenSpec change 模板实例化为当前项目的变更，开发者可直接进入任务实施阶段

### Requirement: Skill 可见性控制
系统 SHALL 支持 Skill 的可见性设置：公司级（全员可见）、领域级（仅指定领域可见）、私有（仅创建者可见）。

#### Scenario: 领域级 Skill 仅对该领域项目可见
- **WHEN** 财务领域团队创建了一个领域级 Skill
- **THEN** 其他领域的项目在 `zhixing skill list` 中 SHALL 不看到该 Skill，除非跨领域订阅财务领域
