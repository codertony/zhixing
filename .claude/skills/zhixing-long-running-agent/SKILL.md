# ZhiXing 长时间运行 Agent 设计原则

## 概述

基于 Anthropic "Effective Harnesses for Long-Running Agents" 最佳实践，解决 Agent 在离散会话中工作的核心挑战。

## 核心挑战

Agent 必须在离散会话中工作，每个新会话开始时没有之前的记忆。这就像一个软件项目由轮班工程师组成，每位新工程师到达时都不记得之前发生了什么。

## 两大失败模式

### 模式 1: 一次做太多 (One-Shot 症候群)
Agent 试图一次性完成所有工作，导致上下文溢出。

```
[Session 1] ──▶ 开始实现 ──▶ 继续实现 ──▶ 上下文耗尽 ✗
```

**解决方案**: 增量进度，每次只做一个任务

### 模式 2: 过早宣布完成 (Premature Victory)
Agent 看到一些进度后误以为工作已完成。

```
[Session 2] ──▶ 检查进度 ──▶ "看起来完成了" ──▶ 停止工作 ✗
```

**解决方案**: 结构化任务清单 + 强制测试验证

## 双层 Agent 架构

### 1. 初始器 Agent (Initializer Agent)

**职责**：首次会话设置环境和结构

| 任务 | OpenSpec 映射 | 输出文件 |
|------|---------------|----------|
| 创建 init.sh 启动脚本 | 项目初始化 | `scripts/init.sh` |
| 创建进度日志文件 | change 目录结构 | `openspec/changes/<name>/.progress.md` |
| 创建功能需求清单 | tasks.md | `openspec/changes/<name>/tasks.md` |
| 创建初始 git commit | 项目初始状态 | git commit |

**约束**：
- 使用 JSON 格式存储功能清单
- 每个任务包含明确的验证步骤
- 设置清晰的 "passes: false" 状态字段

### 2. 编码 Agent (Coding Agent)

**职责**：每个后续会话增量推进工作

**会话启动流程**：

1. **定位**: `pwd` 确认工作目录
2. **获取上下文**: `git log --oneline -20` + 读取 `.progress.md` + 读取 `tasks.json`
3. **环境验证**: 运行 `./scripts/init.sh` + 运行基本测试
4. **选择任务**: 选择优先级最高的未完成任务（只选一个）
5. **执行并记录**: 实现任务 → 测试验证 → 更新 tasks.json → 更新 `.progress.md` → `git commit`

## 环境管理规则

### Feature List 格式规范

使用 JSON 格式而非 Markdown：
- 模型更不容易误改 JSON 文件
- 结构化字段减少歧义
- 状态变更更清晰

**tasks.json 格式示例**：

```json
{
  "changeName": "add-oauth-integration",
  "schema": "spec-driven",
  "tasks": [
    {
      "id": "1",
      "category": "authentication",
      "description": "实现 OAuth 登录按钮",
      "steps": [...],
      "verification": [...],
      "passes": false,
      "blockedBy": []
    }
  ]
}
```

### 增量进度原则

| 规则 | 说明 | OpenSpec 实践 |
|------|------|---------------|
| 一次一个任务 | 每次会话只处理一个任务 | `/opsx:apply` 按任务迭代 |
| 清洁环境 | 会话结束时环境处于可工作状态 | git commit + 更新进度 |
| 可恢复性 | 任何中断都能从检查点恢复 | `/opsx:continue` |
| 测试驱动 | 功能必须测试验证后才能标记完成 | `/opsx:verify` |

### 进度文件规范

`.progress.md` 文件格式：

```markdown
# Progress Log: add-oauth-integration

## 2025-02-19 Session 1

### Completed
- [x] 创建 OAuth 按钮组件

### In Progress
- [ ] 处理 OAuth 回调（正在进行）

### Issues
- 需要确认 redirect URI 配置

### Next Steps
- 完成回调处理逻辑

### Git Commits
- abc1234: feat: 添加 OAuth 登录按钮组件

---
```

## 测试验证规则

**主要失败模式**：Agent 在没有适当测试的情况下将功能标记为完成。

**验证流程**：
1. **自动化测试**: 运行单元测试 + 集成测试 + 检查测试覆盖率
2. **用户视角测试 (E2E)**: 使用浏览器自动化工具验证完整用户流程
3. **验证清单**: 每个任务有明确的 verification 步骤，所有步骤通过后才能设置 passes: true

## 恢复与回滚机制

**正常流程**: [实现] ──▶ [测试] ──▶ [通过] ──▶ [commit]

**错误流程**: [实现] ──▶ [测试] ──▶ [失败] ──▶ [git revert] ──▶ [重试]

**检查点恢复**:
- 每个 artifact 完成后 git commit
- 每个 task 完成后 git commit
- 使用 git revert 而非 git reset（保留历史）
