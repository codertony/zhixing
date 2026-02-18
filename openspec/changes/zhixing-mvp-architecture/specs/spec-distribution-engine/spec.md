## ADDED Requirements

### Requirement: 本地文件轨分发（CLAUDE.md 推送）
系统 SHALL 将编译后的三层 Spec 规则生成 `CLAUDE.md` 和 `AGENTS.md` 文件，并通过 GitLab API 推送至对应项目仓库的指定分支。

#### Scenario: Spec 规则变更触发准实时推送
- **WHEN** 任意层级的 Spec 规则发生变更
- **THEN** 系统 SHALL 在 60 秒内识别受影响的项目，重新编译并推送更新后的 `CLAUDE.md` 到对应 GitLab 仓库

#### Scenario: 推送失败时告警
- **WHEN** GitLab API 推送失败（网络错误或权限问题）
- **THEN** 系统 SHALL 记录失败日志，进行最多 3 次重试，超过重试次数后发送告警通知

### Requirement: MCP 实时轨分发（运行时上下文注入）
系统 SHALL 提供 MCP Server 接口，供 CLI 智能体或 AI 编程工具在运行时按需获取项目 Spec 规则与认知层上下文，无需预置全量数据。

#### Scenario: CLI 调用 MCP 获取当前项目 Spec
- **WHEN** CLI 智能体通过 MCP 协议请求当前项目的 Spec 规则
- **THEN** MCP Server SHALL 返回编译后的三层规则（公司级 + 领域级 + 项目级），响应时间 SHALL 不超过 2 秒

#### Scenario: 运行时上下文不包含无关领域知识
- **WHEN** 项目未声明订阅某领域
- **THEN** MCP Server SHALL 不在响应中包含该领域的任何规则或知识

### Requirement: 跨领域知识订阅
系统 SHALL 支持项目声明订阅一个或多个业务领域，MCP 服务在提供上下文时自动包含订阅领域的相关知识。

#### Scenario: 项目订阅财务领域知识
- **WHEN** 采购项目声明订阅 `finance` 领域
- **THEN** 系统 SHALL 在该项目的 MCP 上下文中注入财务领域的 Spec 规则摘要与领域术语，且不影响其他未订阅的项目

#### Scenario: 取消订阅立即生效
- **WHEN** 项目取消对某领域的订阅
- **THEN** 下一次 MCP 上下文请求 SHALL 不再包含该领域知识

### Requirement: 分发状态跟踪
系统 SHALL 记录每次分发操作的状态（成功/失败/进行中），并在 Web UI 中提供各项目最近一次分发状态查询。

#### Scenario: 查看项目分发状态
- **WHEN** 管理员在 Web UI 查看某项目的分发记录
- **THEN** 系统 SHALL 展示最近 10 次分发的时间、触发原因、推送状态与 GitLab commit SHA
