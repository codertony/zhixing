## ADDED Requirements

### Requirement: CI 静态扫描集成
系统 SHALL 提供可集成至 GitLab CI 的扫描脚本，对代码提交进行 Spec 遵守情况静态检查，第一期只上报结果，不阻断流水线。

#### Scenario: CI 扫描检测到 override 声明
- **WHEN** CI 扫描执行时，发现项目代码中包含显式 Spec override 声明
- **THEN** 扫描脚本 SHALL 将 override 事件（规则 ID、项目、原因、commit SHA、时间）上报至知行平台合规追踪 API，CI 流水线 SHALL 继续执行（不阻断）

#### Scenario: CI 扫描检测到未声明 override（规则不一致）
- **WHEN** CI 扫描发现 `CLAUDE.md` 内容与平台当前版本不一致，且无 override 声明
- **THEN** 扫描脚本 SHALL 将不一致事件上报至平台，并在 CI 日志中输出警告信息，不阻断流水线

### Requirement: 合规数据上报 API
系统 SHALL 提供 REST API 接收 CI 扫描上报的合规数据，并持久化存储至数据库，供后续分析使用。

#### Scenario: 上报合规扫描结果
- **WHEN** CI 扫描脚本调用上报 API（POST /api/compliance/reports）
- **THEN** 系统 SHALL 验证请求合法性（项目 Token），将扫描结果存储（项目 ID、规则列表、override 事件、扫描时间），返回 200 确认

#### Scenario: 上报数据包含 override 原因
- **WHEN** CI 扫描发现带原因的显式 override，并上报
- **THEN** 数据库 SHALL 存储 override 记录，包含：规则 ID、override 原因文本、操作人（从 git commit 中提取）、commit SHA

### Requirement: Override 事件记录与查询
系统 SHALL 在 Web UI 中提供 override 事件列表，支持按项目、规则、时间范围过滤查询，供架构师分析规则采纳情况。

#### Scenario: 查询特定规则的 override 情况
- **WHEN** 架构师在 Web UI 查询某条公司级规则的 override 记录
- **THEN** 系统 SHALL 展示所有显式 override 该规则的项目列表、override 原因、发生时间，按时间降序排列

#### Scenario: 发现高频 override 规则
- **WHEN** 某条规则在 30 天内被 5 个以上项目 override
- **THEN** 系统 SHALL 在规则管理页面标记该规则为"高频 override"，提示架构师评估规则合理性

### Requirement: 规则采纳率统计
系统 SHALL 统计各规则在项目中的采纳率（未 override 项目数 / 应遵守项目总数），并提供按领域聚合的采纳率数据。

#### Scenario: 查看某规则的采纳率
- **WHEN** 架构师查看某条公司级规则的采纳统计
- **THEN** 系统 SHALL 展示：应遵守项目总数、未 override 项目数、显式 override 项目数、采纳率百分比（按最近 30 天计算）
