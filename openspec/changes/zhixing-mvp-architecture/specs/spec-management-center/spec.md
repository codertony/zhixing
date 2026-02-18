## ADDED Requirements

### Requirement: 三层规则结构
系统 SHALL 维护三层 Spec 规则结构：公司级（Company）、领域级（Domain）、项目级（Project），每层规则独立存储，支持继承与显式 override。

#### Scenario: 公司级规则对所有项目生效
- **WHEN** 公司级规则被发布
- **THEN** 所有项目在生成 `CLAUDE.md` 时 SHALL 包含该规则内容

#### Scenario: 项目级显式 override 上层规则
- **WHEN** 项目级规则中显式声明 override 某条上层规则，并填写 override 原因
- **THEN** 系统 SHALL 记录 override 事件（规则 ID、项目、原因、操作人、时间），并在生成 `CLAUDE.md` 时使用项目级版本

#### Scenario: 未声明 override 时规则向下继承
- **WHEN** 项目级未对某条规则声明 override
- **THEN** 系统 SHALL 自动继承领域级或公司级规则

### Requirement: 分层权限管理
系统 SHALL 实现分层权限控制：公司级规则仅中台部门与产研架构组可编辑；领域级规则仅该领域架构师可编辑；项目级规则由项目成员管理。

#### Scenario: 无权限用户尝试编辑上层规则
- **WHEN** 无公司级编辑权限的用户尝试修改公司级规则
- **THEN** 系统 SHALL 拒绝操作并返回权限不足提示

#### Scenario: 领域架构师编辑本领域规则
- **WHEN** 领域架构师在自己管辖的领域下创建或修改规则
- **THEN** 系统 SHALL 允许操作并记录变更历史

### Requirement: 规则内容管理
系统 SHALL 支持通过 Web UI 对 Spec 规则进行增删改查，并保留完整版本历史。

#### Scenario: 创建新规则
- **WHEN** 有权限的用户在 Web UI 填写规则内容并提交
- **THEN** 系统 SHALL 将规则存入数据库，生成规则 ID，并记录创建时间与操作人

#### Scenario: 查看规则版本历史
- **WHEN** 用户查看某条规则的历史版本
- **THEN** 系统 SHALL 展示该规则的所有历史版本，包含变更时间、操作人、变更内容摘要

### Requirement: 规则编译（三层合并）
系统 SHALL 在分发时将三层规则编译为单一可读的 Spec 文档，公司级 → 领域级 → 项目级依次合并，显式 override 的规则使用项目级版本。

#### Scenario: 编译项目级 Spec 文档
- **WHEN** 系统为某项目生成 `CLAUDE.md`
- **THEN** 生成内容 SHALL 包含：适用的公司级规则 + 该项目所属领域的领域级规则 + 项目级规则（含 override 声明）
