# ZhiXing 三插件融合开发方法论

## 概述

本项目集成 **superpowers** + **everything-claude-code** + **ralph-wiggum** 三大插件体系，形成独特的 AI-Native 开发流程。

## 方法论对比与融合

| 插件 | 核心哲学 | 适用场景 | 本项目定位 |
|------|----------|----------|------------|
| **superpowers** | Skill-First 严格约束 | 所有任务入口 | **主导流程控制** - 任何操作前必须检查并调用 Skill |
| **everything-claude-code** | 领域专业技能库 | 具体技术实现 | **能力增强** - 提供 27+ 领域技能（TDD、安全、数据库等） |
| **ralph-wiggum** | 迭代自修正循环 | 复杂任务持续交付 | **持续集成模式** - 长时间运行任务的循环执行策略 |

## Skill-First 执行铁律

**绝对规则**：在任何操作之前，即使只有 1% 的概率某个 Skill 可能适用，也必须调用它。

```
用户消息接收
    │
    ▼
是否需要 PlanMode? ──是──▶ 已脑暴? ──否──▶ 调用 brainstorming Skill
    │                          │
    否                         是
    │                          │
    ▼                          ▼
是否有 Skill 可能适用? ──是──▶ 调用 Skill 工具
    │
    否
    │
    ▼
直接响应
```

**危险信号**（出现这些想法时立即停止）：
- "这只是个简单问题" → 问题即任务，检查 Skill
- "我需要先了解更多上下文" → Skill 检查在澄清问题之前
- "我先快速看看代码" → Skill 告诉你如何探索
- "我记得这个 Skill" → Skill 会演进，必须调用最新版本
- "这不需要正式 Skill" → 如果存在 Skill，就必须用

## Skill 优先级

当多个 Skill 冲突时：

1. **流程 Skill 优先**：brainstorming、debugging、writing-plans - 决定如何执行任务
2. **实现 Skill 次之**：frontend-patterns、backend-patterns、tdd-workflow - 指导具体执行

**决策示例**：
- "构建 X" → 先 brainstorming，再 frontend/backend patterns
- "修复 bug" → 先 debugging，再领域-specific skills

## 双模式执行策略

### 模式 A: Skill-Driven 单次会话（默认模式）

适用于：需求明确、范围清晰、单会话可完成的任务

```
检查 Skill ──▶ 调用相关 Skill ──▶ 执行 ──▶ 验证 ──▶ /done
```

**执行 checklist**：
- [ ] 调用 Skill 前声明："使用 [skill-name] 来 [purpose]"
- [ ] 如果 Skill 有 checklist，使用 TaskCreate 创建任务
- [ ] 严格遵循 Skill 指令（Rigid skills 不得变通）

### 模式 B: Ralph Loop 持续迭代（复杂任务模式）

适用于：跨会话长时间运行、需要持续自修正的任务

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ralph + OpenSpec 融合循环                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Session 1:                                                     │
│  ─────────                                                      │
│  1. 检查 Skill（superpowers 铁律）                              │
│  2. /opsx:new <change-name> 或 /opsx:ff                         │
│  3. 创建 artifacts（proposal → specs → design → tasks）        │
│  4. 启动 Ralph Loop: /ralph-loop "实现 [change-name]"           │
│                                                                 │
│  Loop 迭代（每个 Session）:                                     │
│  ─────────────────────────                                      │
│  1. 会话启动流程（读取 progress、tasks、init.sh）               │
│  2. /opsx:apply 下一个 task                                     │
│  3. 测试验证                                                    │
│  4. 更新 tasks.json（passes: true）                             │
│  5. git commit                                                  │
│  6. 更新 .progress.md                                           │
│  7. 输出 <promise>TASK COMPLETE</promise>                       │
│  8. Loop 自动继续（看到之前的工作，自修正）                     │
│                                                                 │
│  Final:                                                         │
│  ─────                                                          │
│  /opsx:verify ──▶ /opsx:archive ──▶ /cancel-ralph              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ralph Loop 最佳实践**：
- **定义清晰的完成承诺**：使用 `<promise>SPECIFIC COMPLETION TEXT</promise>`
- **设置最大迭代数**：避免无限循环（建议 `--max-iterations 20`）
- **增量交付**：每个 task 完成后 commit，不要等全部完成
- **自参考机制**：Claude 通过 git history 和 progress 文件看到之前的工作

## Task 执行规范（RALPH 执行规则）

所有 Task 任务或 OpenSpec Apply 命令均基于 **RALPH**（Recursive Agent Loop with Promise Handling）执行：

**核心规则**：

| 规则 | 说明 |
|------|------|
| **执行引擎** | 所有 Task 和 `/opsx:apply` 命令均基于 RALPH 循环执行 |
| **错误重试** | 任务执行出错时，最多重试 **3 次** |
| **重试策略** | 每次重试前需等待 1-2 秒，避免瞬时错误；3 次失败则暂停并报告 |
| **完成条件** | 任务必须完成且通过测试验证才算成功 |
| **提交频率** | **每完成一个任务，立即进行一次 git commit** |
| **提交信息** | 格式：`feat: 完成 [task-id] [task-description]` |

**单次 Task 会话强制流程**：
```
1. 读取当前 tasks.json 确定下一个待处理任务
2. 实现任务代码
3. 运行测试验证（单元测试 + 覆盖率检查）
4. 更新 tasks.json：将 passes 设为 true
5. git commit -m "feat: 完成 [task-id] [task-description]"
6. 更新 .progress.md 记录进度
7. 输出 <promise>TASK COMPLETE</promise>
8. 若使用 Ralph Loop，循环继续；否则结束会话
```

## everything-claude-code 技能栈映射

### 1. 框架与语言
- `backend-patterns` - Node.js/Fastify API 设计
- `frontend-patterns` - React/TypeScript/Zustand
- `coding-standards` - TypeScript/JavaScript 规范

### 2. 数据库
- `postgres-patterns` - PostgreSQL 优化与 schema 设计

### 3. 工作流与质量
- `tdd-workflow` - TDD 与 80%+ 覆盖率
- `security-review` - 安全审查清单
- `verification-loop` - 验证与质量循环
- `continuous-learning-v2` - 模式学习与演化

### 4. API 设计
- `api-design` - REST/GraphQL 设计规范

## 四层架构与 Skill 映射

| 架构层 | 对应 Skills | 开发重点 |
|--------|-------------|----------|
| L4 交互平面 | `frontend-patterns`, `e2e-testing` | UI/UX、交互状态管理 |
| L3 控制平面 | `api-design`, `backend-patterns` | Spec 编译、API 契约 |
| L2 认知平面 | `postgres-patterns`, `security-review` | 数据流、权限控制 |
| L1 数据平面 | `postgres-patterns`, MCP SDK | 持久化、外部集成 |

## 质量门禁与 Skill 触发点

```
代码提交前自动触发：
├── TypeScript 编译 ──▶ coding-standards Skill
├── ESLint 检查 ──▶ coding-standards Skill
├── 单元测试覆盖率 >= 80% ──▶ tdd-workflow Skill
├── 集成测试 ──▶ tdd-workflow Skill
└── 安全扫描 ──▶ security-review Skill

OpenSpec 归档前强制触发：
├── /opsx:verify ──▶ verification-loop Skill
├── delta specs 同步 ──▶ openspec-sync-specs Skill
└── 架构合规检查 ──▶ backend-patterns Skill
```

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

## 技能调用速查表

| 用户意图 | 首要 Skill | 次要 Skills |
|----------|------------|-------------|
| "添加/构建/实现 X" | superpowers:brainstorming | backend-patterns/frontend-patterns |
| "修复 bug" | superpowers:systematic-debugging | 领域相关 skills |
| "重构代码" | superpowers:writing-plans | coding-standards |
| "写测试" | tdd-workflow | - |
| "安全审查" | security-review | - |
| "创建 API" | api-design | backend-patterns |
| "优化性能" | backend-patterns | systematic-debugging |
| "完成/验证工作" | verification-before-completion | verification-loop |
| "审查 PR" | receiving-code-review | security-review |
