## ADDED Requirements

### Requirement: 代码仓库全量索引
系统 SHALL 支持对接入的 GitLab 仓库进行全量代码索引，将代码文件解析为可语义检索的向量，存入向量数据库。第一期支持 Java 和 JavaScript/TypeScript 文件。

#### Scenario: 首次全量索引执行
- **WHEN** 管理员在 Web UI 触发某仓库的首次索引任务
- **THEN** 系统 SHALL 拉取仓库全量代码，按文件分块进行 Embedding，存入向量数据库，并记录索引完成时间与文件总数

#### Scenario: 定期增量索引
- **WHEN** 定期索引任务触发（默认每日 02:00）
- **THEN** 系统 SHALL 对比上次索引以来的 git commit，仅对变更文件重新索引，减少全量重建开销

### Requirement: 文档索引（需求文档与 API 文档）
系统 SHALL 支持索引需求文档（Markdown、PDF）和 API 文档（OpenAPI YAML/JSON），与代码索引统一存储，支持联合语义检索。

#### Scenario: 上传需求文档并索引
- **WHEN** 用户上传需求文档至平台
- **THEN** 系统 SHALL 解析文档内容，分块 Embedding 后存入向量数据库，并与所属项目/领域关联

#### Scenario: 检索时文档与代码结果统一返回
- **WHEN** 用户提问涉及某功能模块
- **THEN** 认知层 MCP SHALL 返回相关代码片段与相关需求/API 文档片段，并注明来源类型

### Requirement: 代码语义问答
系统 SHALL 通过 MCP 接口提供代码语义问答能力，AI 优先自主检索，无法定位时主动追问用户。

#### Scenario: 代码定位问答
- **WHEN** 用户通过 MCP 提问："X 功能的核心逻辑在哪里？"
- **THEN** 系统 SHALL 在向量数据库中检索最相关的代码片段，返回文件路径、行号范围与内容摘要

#### Scenario: 无法定位时主动追问
- **WHEN** 向量检索置信度低于阈值（无高相关结果）
- **THEN** 系统 SHALL 返回"未找到高置信度匹配，请提供更多上下文"，并附上检索到的次相关候选项

### Requirement: Git 历史变更分析
系统 SHALL 支持对指定文件或模块的 Git 提交历史进行分析，返回变更摘要与关键变更时间线。

#### Scenario: 查询文件变更历史
- **WHEN** 用户通过 MCP 请求某文件的变更历史分析
- **THEN** 系统 SHALL 调用 GitLab API 获取该文件的 commit 列表，并生成包含变更时间、作者、变更摘要的结构化报告

#### Scenario: 识别近期重要变更
- **WHEN** 用户询问某模块"最近有什么重要变更"
- **THEN** 系统 SHALL 返回最近 30 天内的 commit 摘要，并标注涉及接口签名变更或业务逻辑变更的高影响提交

### Requirement: 跨领域知识检索隔离
系统 SHALL 按领域隔离索引命名空间，跨领域检索须显式声明订阅关系，未订阅领域的代码与文档不出现在检索结果中。

#### Scenario: 项目仅检索本领域知识
- **WHEN** 项目未订阅其他领域，用户发起检索
- **THEN** 系统 SHALL 仅在该项目所属领域的索引命名空间中检索，不跨域返回结果
