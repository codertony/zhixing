# ZhiXing Platform - Claude 行为规范

## 语言约束（首要规则）

**Always respond in Chinese (Simplified). 请始终使用简体中文回复。**

- 所有技术解释、错误分析、命令说明均使用中文
- 代码注释说明、架构分析、思考过程全部以中文输出
- 代码本身（变量名、函数名等）保持英文，但解释说明使用中文

---

## 项目上下文

- **项目名称**：知行 (ZhiXing) 智能研发认知操作平台
- **英文品牌**：ZhiXing CogniAction OS
- **核心理念**：知行合一 —— 从静态知识检索到动态智能体执行的闭环
- **核心愿景**："让意图即交付，让架构即护栏"
- **开发模式**：AI-Native、规范驱动开发（SDD）、流工程（Flow Engineering）

### 四层架构体系

| 层级 | 名称 | 职责 |
|------|------|------|
| L4 | 交互平面 | IDE 插件、CLI 智能体、Web 控制台、VSM 仪表盘 |
| L3 | 控制平面 | Spec 编译器、技能竞技场、PromptOps、架构看护 Agent |
| L2 | 认知平面 | 统一认知分层（UCS）、决策谱系引擎、模型路由网关 |
| L1 | 数据与行动平面 | 影子执行层、MCP Server 集群、数据底座 |

### 技术栈约束

- **前端**：React 18 + TypeScript + Zustand + Tailwind CSS + Vite
- **后端**：Node.js 20 + Fastify + GraphQL + REST
- **数据库**：PostgreSQL（主）、Redis（缓存）、Qdrant（向量）、Neo4j（图）、InfluxDB（时序）
- **AI/ML**：LiteLLM 路由网关、OpenAI Embeddings、Microsoft GraphRAG、Anthropic MCP SDK
- **DevOps**：Docker + Kubernetes + GitHub Actions + Prometheus + Grafana + Turborepo

---

## 长时间运行 Agent 设计原则

> 基于 Anthropic "Effective Harnesses for Long-Running Agents" 最佳实践

### 核心挑战

Agent 必须在离散会话中工作，每个新会话开始时没有之前的记忆。这就像一个软件项目由轮班工程师组成，每位新工程师到达时都不记得之前发生了什么。

### 两大失败模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    长时间运行 Agent 失败模式                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  模式 1: 一次做太多 (One-Shot 症候群)                           │
│  ─────────────────────────────────────────                     │
│  Agent 试图一次性完成所有工作，导致上下文溢出                    │
│                                                                 │
│  [Session 1] ──▶ 开始实现 ──▶ 继续实现 ──▶ 上下文耗尽 ✗        │
│                                                                 │
│  解决方案: 增量进度，每次只做一个任务                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  模式 2: 过早宣布完成 (Premature Victory)                       │
│  ─────────────────────────────────────────                     │
│  Agent 看到一些进度后误以为工作已完成                            │
│                                                                 │
│  [Session 2] ──▶ 检查进度 ──▶ "看起来完成了" ──▶ 停止工作 ✗    │
│                                                                 │
│  解决方案: 结构化任务清单 + 强制测试验证                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 双层 Agent 架构

Anthropic 推荐将 Agent 分为两个角色：

#### 1. 初始器 Agent (Initializer Agent)

**职责**：首次会话设置环境和结构

| 任务 | OpenSpec 映射 | 输出文件 |
|------|---------------|----------|
| 创建 init.sh 启动脚本 | 项目初始化 | `scripts/init.sh` |
| 创建进度日志文件 | change 目录结构 | `openspec/changes/<name>/.progress.md` |
| 创建功能需求清单 | tasks.md | `openspec/changes/<name>/tasks.md` |
| 创建初始 git commit | 项目初始状态 | git commit |

**初始器 Agent 模板**：

```
你是一个初始器 Agent，负责设置长时间运行项目的环境。

任务：
1. 创建 init.sh 启动脚本（包含启动开发服务器、数据库等命令）
2. 创建 .progress.md 进度日志文件
3. 基于 /opsx:new 流程创建初始 artifacts（proposal, specs, design, tasks）
4. 创建初始 git commit，记录添加的文件

约束：
- 使用 JSON 格式存储功能清单（比 Markdown 更稳定，不易被误改）
- 每个任务包含明确的验证步骤
- 设置清晰的 "passes: false" 状态字段
```

#### 2. 编码 Agent (Coding Agent)

**职责**：每个后续会话增量推进工作

**会话启动流程**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    编码 Agent 会话启动流程                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 定位                                                   │
│  ─────────────                                                  │
│  $ pwd                          # 确认工作目录                   │
│                                                                 │
│  Step 2: 获取上下文                                             │
│  ─────────────                                                  │
│  $ git log --oneline -20        # 查看最近提交                   │
│  读取 .progress.md              # 了解最近进度                   │
│  读取 tasks.md                  # 获取任务清单                   │
│                                                                 │
│  Step 3: 环境验证                                               │
│  ─────────────                                                  │
│  $ ./scripts/init.sh            # 启动开发环境                   │
│  运行基本测试                    # 验证核心功能正常               │
│                                                                 │
│  Step 4: 选择任务                                               │
│  ─────────────                                                  │
│  选择优先级最高的未完成任务      # 只选一个任务                   │
│  检查依赖是否满足                # 确保可以开始                   │
│                                                                 │
│  Step 5: 执行并记录                                             │
│  ─────────────                                                  │
│  实现选定任务                    # 增量进度                       │
│  测试验证                        # 用户视角测试                   │
│  更新 tasks.md checkbox         # 标记完成                       │
│  更新 .progress.md              # 记录进度                       │
│  $ git commit                   # 提交更改                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 环境管理规则

#### Feature List 格式规范

使用 JSON 格式而非 Markdown，原因：
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
      "steps": [
        "在登录页面添加 OAuth 按钮",
        "配置 OAuth 提供商",
        "处理 OAuth 回调",
        "创建用户会话"
      ],
      "verification": [
        "点击按钮能跳转到 OAuth 页面",
        "授权后能正确回调",
        "用户信息正确存储"
      ],
      "passes": false,
      "blockedBy": []
    },
    {
      "id": "2",
      "category": "authentication",
      "description": "添加 OAuth 状态管理",
      "steps": [
        "创建 OAuth state token",
        "存储到 Redis",
        "验证回调 state"
      ],
      "verification": [
        "state token 正确生成",
        "无效 state 被拒绝"
      ],
      "passes": false,
      "blockedBy": ["1"]
    }
  ]
}
```

#### 增量进度原则

**核心规则**：

| 规则 | 说明 | OpenSpec 实践 |
|------|------|---------------|
| 一次一个任务 | 每次会话只处理一个任务 | `/opsx:apply` 按任务迭代 |
| 清洁环境 | 会话结束时环境处于可工作状态 | git commit + 更新进度 |
| 可恢复性 | 任何中断都能从检查点恢复 | `/opsx:continue` |
| 测试驱动 | 功能必须测试验证后才能标记完成 | `/opsx:verify` |

#### 进度文件规范

`.progress.md` 文件格式：

```markdown
# Progress Log: add-oauth-integration

## 2025-02-19 Session 1

### Completed
- [x] 创建 OAuth 按钮组件
- [x] 配置 Google OAuth 提供商

### In Progress
- [ ] 处理 OAuth 回调（正在进行）

### Issues
- 需要确认 redirect URI 配置

### Next Steps
- 完成回调处理逻辑
- 添加 state token 验证

### Git Commits
- abc1234: feat: 添加 OAuth 登录按钮组件
- def5678: feat: 配置 Google OAuth 提供商

---
```

### 测试验证规则

**主要失败模式**：Agent 在没有适当测试的情况下将功能标记为完成。

**解决方案**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    测试验证流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  功能实现完成后，必须：                                          │
│                                                                 │
│  1. 自动化测试                                                  │
│     ─────────────                                               │
│     - 运行单元测试                                              │
│     - 运行集成测试                                              │
│     - 检查测试覆盖率                                            │
│                                                                 │
│  2. 用户视角测试 (E2E)                                          │
│     ─────────────                                               │
│     - 使用浏览器自动化工具 (Puppeteer/Playwright)               │
│     - 像真实用户一样操作                                        │
│     - 验证完整用户流程                                          │
│                                                                 │
│  3. 验证清单                                                    │
│     ─────────────                                               │
│     - 每个任务有明确的 verification 步骤                        │
│     - 所有步骤通过后才能设置 passes: true                       │
│                                                                 │
│  限制: 浏览器原生 alert 弹窗可能无法通过自动化工具检测           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**强制指令示例**：

```
"删除或修改测试是不可接受的，因为这可能导致功能缺失或存在 bug。
只有当所有验证步骤都通过后，才能将 passes 设置为 true。"
```

### 恢复与回滚机制

```
┌─────────────────────────────────────────────────────────────────┐
│                    错误恢复策略                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Git 作为回滚机制                                               │
│  ─────────────────                                              │
│                                                                 │
│  正常流程:                                                      │
│  [实现] ──▶ [测试] ──▶ [通过] ──▶ [commit]                     │
│                                                                 │
│  错误流程:                                                      │
│  [实现] ──▶ [测试] ──▶ [失败] ──▶ [git revert] ──▶ [重试]      │
│                     │                                           │
│                     ▼                                           │
│              [分析问题]                                         │
│                     │                                           │
│              ┌──────┴──────┐                                    │
│              ▼             ▼                                    │
│         [修复后重试]    [回滚到上一个工作状态]                   │
│                                                                 │
│  检查点恢复:                                                    │
│  ─────────────                                                  │
│  - 每个 artifact 完成后 git commit                              │
│  - 每个 task 完成后 git commit                                  │
│  - 使用 git revert 而非 git reset（保留历史）                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## OpenSpec 工作流集成

### 失败模式与解决方案对照表

| 问题 | 初始器 Agent 行为 | 编码 Agent 行为 | OpenSpec 命令 |
|------|------------------|-----------------|---------------|
| Agent 过早宣布完成 | 创建结构化 tasks.json | 启动时读取 tasks，选择单个任务工作 | `/opsx:new` + `/opsx:apply` |
| Agent 留下 bug 或未记录进度 | 创建初始 git repo 和 .progress.md | 读取进度文件和 git log；结束前 commit 和更新进度 | `/opsx:continue` |
| Agent 未测试就标记完成 | 创建包含验证步骤的 tasks | 自验证所有功能，测试后才标记 passes | `/opsx:verify` |
| Agent 花时间弄清如何运行应用 | 创建 init.sh 脚本 | 启动时读取 init.sh 并运行 | 项目初始化 |

### 工作流总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenSpec 完整工作流                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   初始化阶段        规划阶段              执行阶段        收尾   │
│   (Initializer)     (Coding)             (Coding)       (Coding)│
│                                                                 │
│   ┌────────┐      ┌────────────┐      ┌────────────┐    ┌────┐ │
│   │项目设置│      │/opsx:new   │      │/opsx:apply │    │归档│ │
│   │init.sh │      │或 /opsx:ff │      │            │    │    │ │
│   │.progress│     └─────┬──────┘      └─────┬──────┘    └─┬──┘ │
│   └───┬────┘            │                   │             │    │
│       │                 ▼                   ▼             ▼    │
│       │           ┌────────────┐      ┌────────────┐    ┌────┐ │
│       │           │proposal    │      │ task 1 [x] │    │sync│ │
│       │           │specs       │      │ task 2 [x] │    │arch│ │
│       │           │design      │      │ task 3 [ ] │    │ive │ │
│       │           │tasks.json  │      │    ...     │    │    │ │
│       │           └────────────┘      └────────────┘    └────┘ │
│       │                                                         │
│       ▼                                                         │
│   会话启动: pwd → git log → .progress → tasks.json → init.sh   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 命令速查表

| 命令 | 阶段 | 用途 | 检查点 | 测试验证 |
|------|------|------|--------|----------|
| `/opsx:explore` | 探索 | 思考伙伴，调研问题 | N/A | N/A |
| `/opsx:new` | 规划 | 逐步创建 artifacts | ✓ 每个 artifact | N/A |
| `/opsx:ff` | 规划 | 快速生成所有 artifacts | ✓ 每个 artifact | N/A |
| `/opsx:continue` | 恢复 | 从检查点恢复 | ✓ 自动恢复 | 读取验证状态 |
| `/opsx:apply` | 执行 | 实现 tasks 中的任务 | ✓ 每个 task | 强制测试验证 |
| `/opsx:verify` | 验证 | 验证实现一致性 | N/A | CRITICAL 检查 |
| `/opsx:sync` | 收尾 | 同步 delta specs | ✓ 幂等 | N/A |
| `/opsx:archive` | 收尾 | 归档已完成的 change | N/A | 检查 passes 状态 |
| `/opsx:bulk-archive` | 收尾 | 批量归档 | ✓ 冲突解决 | 自动验证 |
| `/opsx:onboard` | 入门 | 引导式教学 | N/A | N/A |

### 状态管理

**Change 状态**：
- **active**: 正在进行中
- **blocked**: 被阻塞（缺少依赖）
- **complete**: 所有 artifacts 完成，所有 tasks passes: true
- **archived**: 已归档

**Artifact 状态**：
- **pending**: 等待依赖
- **ready**: 可创建
- **done**: 已完成

**Task 状态（JSON 格式）**：
```json
{
  "passes": false,    // 必须测试验证后才能设为 true
  "blockedBy": ["1"]  // 依赖的任务 ID
}
```

---

## Agent 角色定义

### 初始器 Agent (Initializer)

**职责**：
- 创建 `scripts/init.sh` 启动脚本
- 创建 `.progress.md` 进度日志
- 初始化 OpenSpec change 结构
- 创建初始 git commit

**约束**：
- 使用 JSON 格式存储功能清单
- 每个任务包含明确的 verification 步骤
- 设置 passes: false 初始状态

**触发条件**：
- 新项目初始化
- `/opsx:new` 或 `/opsx:ff` 创建新 change

### 编码 Agent (Coding)

**职责**：
- 每次会话增量推进一个任务
- 测试验证后更新状态
- 记录进度并提交

**约束**：
- 会话启动必须运行标准流程
- 一次只处理一个任务
- 功能必须测试验证后才能标记 passes: true
- 会话结束前 git commit + 更新 .progress.md

**会话启动检查清单**：
- [ ] 运行 `pwd` 确认目录
- [ ] 读取 git log 了解最近工作
- [ ] 读取 .progress.md 了解当前进度
- [ ] 读取 tasks.json 获取任务清单
- [ ] 运行 init.sh 启动环境
- [ ] 验证基本功能正常
- [ ] 选择优先级最高的未完成任务

### 评审 Agent (Verifier)

**职责**：
- 验证实现与 artifacts 一致性
- 检查测试覆盖率
- 确认所有验证步骤通过

**约束**：
- 发现 CRITICAL 问题必须阻塞归档
- 使用浏览器自动化工具进行 E2E 测试
- 检查 passes 状态是否正确

### 文档 Agent

**职责**：
- 生成和维护技术文档
- 更新 .progress.md 进度日志

**约束**：
- 文档与代码同步更新
- 使用标准化模板
- 包含代码示例和使用场景

---

## 质量门禁

### 代码质量
- TypeScript 编译无错误
- ESLint 检查通过
- 单元测试覆盖率 >= 80%
- 集成测试通过

### 架构合规
- 无循环依赖
- 跨层调用合规
- API 契约兼容
- 性能指标达标

### 安全合规
- 依赖漏洞扫描通过
- 代码安全扫描通过
- 敏感信息泄露检查通过
- 生产环境操作需人工确认

### OpenSpec 合规
- 所有 artifacts 已创建
- 所有 tasks 的 passes: true
- `/opsx:verify` 通过（无 CRITICAL 问题）
- delta specs 已同步（如适用）
- .progress.md 已更新

---

## 执行模式指南

### 流式执行（简单任务）

```
初始化 ──▶ /opsx:ff <name> ──▶ /opsx:apply ──▶ 测试验证 ──▶ /opsx:archive
```

**适用场景**：
- 任务清晰，需求明确
- 变更范围小（1-3 个文件）
- 预计耗时短（单会话可完成）

### 检查点执行（复杂任务）

```
┌─────────────────────────────────────────────────────────────────┐
│                    检查点执行流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Session 1 (Initializer):                                       │
│  ────────────────────────                                       │
│  创建 init.sh ──▶ 创建 .progress.md ──▶ /opsx:new <name>       │
│                                            │                    │
│                                            ▼                    │
│                                      [检查点: proposal 完成]    │
│                                            │                    │
│                                      git commit                 │
│                                                                 │
│  Session 2 (Coding):                                            │
│  ────────────────────────                                       │
│  会话启动流程 ──▶ /opsx:continue ──▶ 创建 specs                 │
│                                            │                    │
│                                            ▼                    │
│                                      [检查点: specs 完成]       │
│                                            │                    │
│                                      git commit                 │
│                                                                 │
│  Session N (Coding):                                            │
│  ────────────────────────                                       │
│  会话启动流程 ──▶ /opsx:apply ──▶ task 1                        │
│                                     │                           │
│                                     ▼                           │
│                              [检查点: task 1 完成]              │
│                                     │                           │
│                               测试验证 ──▶ passes: true         │
│                                     │                           │
│                                git commit                       │
│                                                                 │
│  ... 重复直到所有 tasks 完成 ...                                │
│                                                                 │
│  Final Session:                                                 │
│  ────────────────────────                                       │
│  /opsx:verify ──▶ /opsx:archive                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**适用场景**：
- 任务复杂，需要分步确认
- 变更范围大（多个模块）
- 需要中间反馈
- 可能中断（跨多个会话）

### 并行执行（独立任务）

```
┌─────────────────────────────────────────────────────────────────┐
│                    并行 Changes 管理                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Change A: add-auth      Change B: add-api      Change C       │
│      │                        │                    │           │
│      ▼                        ▼                    ▼           │
│  [progress A]            [progress B]         [progress C]     │
│      │                        │                    │           │
│      ▼                        ▼                    ▼           │
│  Session 1:              Session 1:            Session 1:      │
│  会话启动                会话启动              会话启动          │
│      │                        │                    │           │
│      ▼                        ▼                    ▼           │
│  选择独立任务            选择独立任务          选择独立任务      │
│                                                                 │
│  归档: /opsx:bulk-archive 自动处理 spec 冲突                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**适用场景**：
- 多个独立功能并行开发
- 不同团队成员协作
- 需要 conflict resolution

---

## 错误处理规范

### 错误分类

| 级别 | 定义 | 处理方式 |
|------|------|----------|
| **CRITICAL** | 阻塞执行，必须修复 | 立即暂停，请求人工介入 |
| **WARNING** | 可能影响质量，建议修复 | 记录问题，继续执行，完成后提醒 |
| **INFO** | 信息提示，无需修复 | 记录日志，继续执行 |

### 错误恢复流程

```
错误发生
    │
    ▼
┌───────────────┐
│ 可重试？      │──否──▶ 人工介入 (AskUserQuestion)
└───────┬───────┘
        │是
        ▼
┌───────────────┐
│ 幂等操作？    │──否──▶ git revert ──▶ 重试
└───────┬───────┘
        │是
        ▼
    重试执行（最多 3 次）
        │
        ▼
    更新 .progress.md
```

### Git 回滚规范

**使用 git revert 而非 git reset**：
- 保留完整历史记录
- 可追溯所有尝试
- 安全的回滚机制

**回滚场景**：
- 测试失败无法修复
- 实现方向错误
- 引入严重 bug

### 用户沟通模板

**错误发生时**：

```markdown
## 执行暂停

**问题**：[错误描述]

**上下文**：
- 当前任务：[task 名称]
- 检查点：[最近的 git commit]
- 已完成：[N/M tasks, passes 状态]

**恢复选项**：
1. 重试当前操作
2. git revert 到上一个工作状态
3. 跳过并继续（可能影响质量）
4. 人工修复后继续

**建议**：[基于情况的具体建议]

请选择处理方式。
```

---

## MCP 工具权限

允许使用：`gitlab-mcp`（代码仓库）, `chrome-devtools-mcp`（浏览器自动化测试）

安全约束：所有操作记录审计日志；敏感数据查询自动脱敏

---

## 最佳实践清单

### 初始器 Agent 会话
- [ ] 创建 `scripts/init.sh` 启动脚本
- [ ] 创建 `.progress.md` 进度日志
- [ ] 创建 tasks.json（JSON 格式）
- [ ] 每个任务包含 verification 步骤
- [ ] 创建初始 git commit

### 编码 Agent 会话启动
- [ ] 运行 `pwd` 确认工作目录
- [ ] 读取 git log（最近 20 条）
- [ ] 读取 .progress.md 了解进度
- [ ] 读取 tasks.json 获取任务清单
- [ ] 运行 init.sh 启动环境
- [ ] 验证基本功能正常
- [ ] 选择优先级最高的未完成任务

### 编码 Agent 会话执行
- [ ] 一次只处理一个任务
- [ ] 实现后必须测试验证
- [ ] 所有验证步骤通过才能设置 passes: true
- [ ] 更新 tasks.json checkbox
- [ ] 更新 .progress.md 记录进度
- [ ] git commit 保存更改

### 编码 Agent 会话结束
- [ ] 环境处于清洁状态
- [ ] 所有更改已 commit
- [ ] .progress.md 已更新
- [ ] 下次会话可从检查点恢复

### 归档前检查
- [ ] 所有 tasks 的 passes: true
- [ ] `/opsx:verify` 通过（无 CRITICAL 问题）
- [ ] delta specs 已同步
- [ ] 文档已更新

### 长时间运行项目
- [ ] 使用检查点执行模式
- [ ] 定期检查状态（`openspec status`）
- [ ] 使用 git 作为回滚机制
- [ ] 每个会话只做一个任务
- [ ] 保持 .progress.md 更新

---

## 三插件融合开发方法论

本项目集成 **superpowers** + **everything-claude-code** + **ralph-wiggum** 三大插件体系，形成独特的 AI-Native 开发流程。

### 方法论对比与融合

| 插件 | 核心哲学 | 适用场景 | 本项目定位 |
|------|----------|----------|------------|
| **superpowers** | Skill-First 严格约束 | 所有任务入口 | **主导流程控制** - 任何操作前必须检查并调用 Skill |
| **everything-claude-code** | 领域专业技能库 | 具体技术实现 | **能力增强** - 提供 27+ 领域技能（TDD、安全、数据库等） |
| **ralph-wiggum** | 迭代自修正循环 | 复杂任务持续交付 | **持续集成模式** - 长时间运行任务的循环执行策略 |

### Skill-First 执行铁律（来自 superpowers）

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

### Skill 优先级（多 Skill 冲突时）

1. **流程 Skill 优先**：brainstorming、debugging、writing-plans - 决定如何执行任务
2. **实现 Skill 次之**：frontend-patterns、backend-patterns、tdd-workflow - 指导具体执行

**决策示例**：
- "构建 X" → 先 brainstorming，再 frontend/backend patterns
- "修复 bug" → 先 debugging，再领域-specific skills

### 双模式执行策略

#### 模式 A: Skill-Driven 单次会话（默认模式）

适用于：需求明确、范围清晰、单会话可完成的任务

```
检查 Skill ──▶ 调用相关 Skill ──▶ 执行 ──▶ 验证 ──▶ /done
```

**执行 checklist**：
- [ ] 调用 Skill 前声明："使用 [skill-name] 来 [purpose]"
- [ ] 如果 Skill 有 checklist，使用 TaskCreate 创建任务
- [ ] 严格遵循 Skill 指令（Rigid skills 不得变通）

#### 模式 B: Ralph Loop 持续迭代（复杂任务模式）

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

### everything-claude-code 技能栈映射

本项目作为 AI-Native 平台，预配置以下 ECC 技能类别：

#### 1. 框架与语言（已配置）
- `backend-patterns` - Node.js/Fastify API 设计
- `frontend-patterns` - React/TypeScript/Zustand
- `coding-standards` - TypeScript/JavaScript 规范

#### 2. 数据库（已配置）
- `postgres-patterns` - PostgreSQL 优化与 schema 设计

#### 3. 工作流与质量（已配置）
- `tdd-workflow` - TDD 与 80%+ 覆盖率
- `security-review` - 安全审查清单
- `verification-loop` - 验证与质量循环
- `continuous-learning-v2` - 模式学习与演化

#### 4. API 设计（已配置）
- `api-design` - REST/GraphQL 设计规范

### 四层架构与 Skill 映射

| 架构层 | 对应 Skills | 开发重点 |
|--------|-------------|----------|
| L4 交互平面 | `frontend-patterns`, `e2e-testing` | UI/UX、交互状态管理 |
| L3 控制平面 | `api-design`, `backend-patterns` | Spec 编译、API 契约 |
| L2 认知平面 | `postgres-patterns`, `security-review` | 数据流、权限控制 |
| L1 数据平面 | `postgres-patterns`, MCP SDK | 持久化、外部集成 |

### 质量门禁与 Skill 触发点

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

---

## 强制指令

以下指令必须在相关场景中严格执行：

```
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
```

---

## 知行平台项目特定规范

### 容器工具规范（本地开发）

**本地开发强制使用 Podman**，不使用 Docker 或远程云 K8s 服务。

| 场景 | 工具 | 说明 |
|------|------|------|
| 本地开发 | **Podman** | 本地容器运行时，rootless 更安全 |
| 本地编排 | **podman-compose** | 本地多容器管理 |
| 容器构建 | **podman build** | 替代 docker build |
| 镜像管理 | **podman** | 本地镜像管理 |
| 生产部署 | Docker / K8s | 由运维团队配置，不在本地开发使用 |

**Podman 安装:**

```bash
# macOS
brew install podman podman-compose
podman machine init
podman machine start

# Linux (Ubuntu/Debian)
sudo apt-get install podman podman-compose

# Linux (Fedora/RHEL)
sudo dnf install podman podman-compose

# Windows
# 使用 Podman Desktop: https://podman-desktop.io/
```

**常用 Podman 命令:**

```bash
# 容器生命周期
podman ps              # 查看运行中的容器
podman ps -a           # 查看所有容器
podman start <name>   # 启动容器
podman stop <name>    # 停止容器
podman rm <name>      # 删除容器

# 镜像管理
podman images          # 查看本地镜像
podman pull <image>   # 拉取镜像
podman rmi <image>    # 删除镜像

# 日志和调试
podman logs -f <name> # 查看容器日志
podman exec -it <name> sh  # 进入容器

# 使用 podman-compose
cd scripts
podman-compose up -d          # 启动所有服务
podman-compose down           # 停止所有服务
podman-compose logs -f        # 查看日志
podman-compose pull           # 更新镜像
```

**Docker 兼容模式（可选）:**

如果习惯使用 docker 命令，可以设置别名:

```bash
# ~/.bashrc 或 ~/.zshrc
alias docker=podman
alias docker-compose=podman-compose
```

### Monorepo 工作区结构

```
zhixing/
├── apps/
│   ├── api/                 # Fastify 后端 API
│   ├── web/                 # React + Vite 前端
│   └── cli/                 # CLI 智能体
├── packages/
│   ├── db/                  # Drizzle ORM + 数据库配置
│   ├── shared/              # 共享类型和工具
│   ├── eslint-config/       # 共享 ESLint 配置
│   ├── gitlab-client/       # GitLab API 客户端
│   └── mcp-server/          # MCP Server 实现
├── openspec/                # OpenSpec 规范管理
├── .claude/                 # Claude Code 配置
├── scripts/                 # 开发脚本
├── package.json             # 根工作区配置
├── turbo.json               # Turborepo 配置
└── pnpm-workspace.yaml      # pnpm 工作空间
```

### 关键开发命令

```bash
# 开发环境初始化
./scripts/init.sh

# 安装依赖（根目录）
pnpm install

# 开发模式（所有应用）
pnpm dev

# 单独应用开发
pnpm --filter @zhixing/api dev
pnpm --filter @zhixing/web dev
pnpm --filter @zhixing/cli dev

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck

# 测试
pnpm test
pnpm test:coverage

# 数据库操作
pnpm --filter @zhixing/db migrate
pnpm --filter @zhixing/db generate

# 构建
pnpm build

# OpenSpec 命令
openspec list
openspec status
openspec new change <name>
```

### 包命名规范

- 应用包：`@zhixing/<name>`（如 `@zhixing/api`）
- 共享包：`@zhixing/<name>`（如 `@zhixing/db`）

### 环境配置管理

**必需的环境文件：**
```
.env.example           # 环境变量模板（提交到仓库）
.env.local             # 本地开发环境（不提交）
```

**环境变量分类：**
| 类别 | 前缀 | 示例 |
|------|------|------|
| 数据库 | `DB_` | `DB_URL`, `DB_POOL_SIZE` |
| API | `API_` | `API_PORT`, `API_HOST` |
| AI/ML | `AI_` | `AI_LITELLM_URL`, `AI_OPENAI_KEY` |
| 缓存 | `REDIS_` | `REDIS_URL` |
| 向量库 | `QDRANT_` | `QDRANT_URL` |
| GitLab | `GITLAB_` | `GITLAB_TOKEN`, `GITLAB_URL` |

---

## 质量门禁详细规范

### 代码质量门禁

| 检查项 | 工具 | 阈值 | 失败处理 |
|--------|------|------|----------|
| TypeScript 编译 | `tsc --noEmit` | 0 错误 | 阻塞提交 |
| ESLint | `eslint .` | 0 错误，警告需解释 | 阻塞提交 |
| Prettier 格式化 | `prettier --check` | 100% 符合 | 自动修复 |
| 单元测试覆盖率 | `vitest --coverage` | >= 80% | 阻塞提交 |
| 集成测试 | `vitest run` | 100% 通过 | 阻塞提交 |

### 架构合规门禁

| 检查项 | 方法 | 失败处理 |
|--------|------|----------|
| 无循环依赖 | `madge --circular` | 阻塞提交 |
| 跨层调用合规 | 自定义规则 | 警告 |
| API 契约兼容 | OpenAPI 对比 | 阻塞提交 |

### OpenSpec 合规门禁

| 阶段 | 检查内容 | 通过标准 |
|------|----------|----------|
| proposal | 需求完整性 | 包含背景、目标、范围 |
| specs | 规格清晰度 | 每个 spec 有验收标准 |
| design | 设计合理性 | 技术方案评审通过 |
| tasks | 任务可执行性 | 每个 task 有 verification |
| apply | 实现一致性 | 代码与 specs 匹配 |
| verify | 验证完整性 | passes: true 且测试通过 |

---

## 扩展 Skill 体系

### 项目专属 Skills（需创建）

#### 1. `zhixing-init` - 项目初始化

**触发条件：** 新环境设置、依赖更新

**职责：**
- 验证 Node.js 20+ 版本
- 安装 pnpm 依赖
- 启动 Docker 数据库服务
- 运行数据库迁移
- 验证环境变量

**调用方式：**
```
用户: "初始化开发环境"
Claude: 调用 zhixing-init Skill
```

#### 2. `zhixing-db` - 数据库操作

**触发条件：** Schema 变更、数据迁移

**职责：**
- 生成 Drizzle 迁移
- 运行迁移
- 种子数据管理
- 数据库重置

**调用方式：**
```
用户: "更新数据库 schema"
Claude: 调用 zhixing-db Skill
```

#### 3. `zhixing-test` - 测试驱动开发

**触发条件：** 写测试、运行测试、覆盖率检查

**职责：**
- TDD 红-绿-重构循环
- 单元测试脚手架
- 集成测试配置
- 覆盖率报告分析

**调用方式：**
```
用户: "给 auth 模块添加测试"
Claude: 调用 zhixing-test Skill
```

#### 4. `zhixing-lint` - 代码规范

**触发条件：** 代码格式化、风格检查

**职责：**
- 自动修复 ESLint 错误
- Prettier 格式化
- 类型检查
- 提交前检查

#### 5. `zhixing-arch` - 架构看护

**触发条件：** 代码审查、架构合规检查

**职责：**
- 四层架构合规检查
- 循环依赖检测
- API 契约验证
- 跨层调用审计

---

## MCP Server 开发规范

### MCP Server 目录结构

```
packages/mcp-server/
├── src/
│   ├── index.ts            # Server 入口
│   ├── tools/              # Tool 实现
│   │   ├── index.ts
│   │   └── gitlab/         # GitLab 工具组
│   ├── resources/          # Resource 实现
│   └── prompts/            # Prompt 模板
├── tests/
├── package.json
└── tsconfig.json
```

### Tool 开发模板

```typescript
// packages/mcp-server/src/tools/gitlab/search-projects.ts
import { Tool } from '@modelcontextprotocol/sdk';

export const searchProjectsTool: Tool = {
  name: 'gitlab_search_projects',
  description: '搜索 GitLab 项目',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      limit: { type: 'number', default: 20 }
    },
    required: ['query']
  },
  async handler(args) {
    // 实现逻辑
  }
};
```

### MCP Server 测试规范

- 每个 Tool 必须有单元测试
- 使用 Mock 测试外部 API 调用
- 测试覆盖率 >= 80%

---

## CLI 智能体开发规范

### CLI 目录结构

```
apps/cli/
├── src/
│   ├── index.ts            # CLI 入口
│   ├── commands/           # 命令实现
│   │   ├── init.ts
│   │   ├── sync.ts
│   │   └── status.ts
│   ├── utils/              # 工具函数
│   └── types/              # 类型定义
├── tests/
├── package.json
└── bin/
    └── zhixing             # 可执行文件
```

### 命令开发模板

```typescript
// apps/cli/src/commands/sync.ts
import { Command } from 'commander';

export const syncCommand = new Command('sync')
  .description('同步 Spec 到下游系统')
  .option('-e, --env <env>', '目标环境', 'development')
  .action(async (options) => {
    // 实现逻辑
  });
```

---

## 典型场景工作流示例

### 场景 1: 新功能开发（完整流程）

**用户**: "添加用户认证功能"

**Claude 执行流程**:

```
Step 1: Skill-First 检查
├── 调用 superpowers:brainstorming（创造性工作）
├── 调用 everything-claude-code:backend-patterns（API 设计）
├── 调用 everything-claude-code:security-review（安全考虑）
└── 调用 everything-claude-code:tdd-workflow（测试策略）

Step 2: 规划阶段
├── /opsx:new user-authentication
│   ├── proposal.md - 功能提案
│   ├── specs/auth-module/spec.md - 详细规格
│   ├── design.md - 技术设计
│   └── tasks.json - 结构化任务清单
└── git commit -m "docs: 添加用户认证功能 OpenSpec 文档"

Step 3: 执行阶段（Ralph Loop 或手动迭代）
├── /ralph-loop "实现用户认证功能" --max-iterations 15
│   ├── Session N: 会话启动流程
│   ├── /opsx:apply task-1
│   ├── 实现代码 + 测试（TDD）
│   ├── 验证: npm test + coverage >= 80%
│   ├── 更新 tasks.json (passes: true)
│   ├── git commit
│   ├── 更新 .progress.md
│   └── <promise>TASK COMPLETE</promise>
└── 循环直到所有 tasks 完成

Step 4: 收尾阶段
├── /opsx:verify（验证实现与 specs 一致性）
├── /opsx:archive（归档 change）
└── /cancel-ralph（结束循环）
```

### 场景 2: Bug 修复（快速流程）

**用户**: "修复登录页面的状态错误"

**Claude 执行流程**:

```
Step 1: Skill-First 检查
├── 调用 superpowers:systematic-debugging（先调试再修复）
└── 调用 everything-claude-code:frontend-patterns（React 模式）

Step 2: 调试
├── 复现问题
├── 定位根因
└── 记录分析

Step 3: 修复
├── 如果简单修复（单会话可完成）:
│   ├── 直接修复
│   ├── 添加回归测试
│   ├── 验证修复
│   └── git commit
└── 如果复杂修复（需多会话）:
    ├── /opsx:new fix-login-state-bug
    ├── 创建 tasks.json
    └── 进入 Ralph Loop 或检查点模式
```

### 场景 3: 代码审查（PR 审查）

**用户**: "审查这个 PR"

**Claude 执行流程**:

```
Step 1: Skill-First 检查
├── 调用 superpowers:receiving-code-review
└── 调用 everything-claude-code:security-review

Step 2: 审查流程
├── 读取 PR 描述和变更
├── 对照 OpenSpec specs（如果有）
├── 检查:
│   ├── 代码质量（TypeScript、ESLint）
│   ├── 测试覆盖率
│   ├── 安全合规
│   └── 架构合规（四层架构约束）
└── 输出审查意见

Step 3: 如果需要修改
├── 进入 Ralph Loop（复杂修改）
└── 或直接修改（简单修复）
```

### 场景 4: 架构重构（长时间运行任务）

**用户**: "将现有代码重构为四层架构"

**Claude 执行流程**:

```
Step 1: 初始化阶段（Initializer Agent）
├── 创建 scripts/init.sh
├── 创建 .progress.md
├── /opsx:ff four-layer-refactoring（快速创建所有 artifacts）
└── git commit -m "chore: 初始化四层架构重构"

Step 2: Ralph Loop 持续交付
├── /ralph-loop "四层架构重构" --completion-promise "REFACTORING COMPLETE"
│   └── 每次迭代:
│       ├── 读取 .progress.md 了解进度
│       ├── 读取 tasks.json 选择下一个任务
│       ├── /opsx:apply
│       ├── TDD 实现（红-绿-重构）
│       ├── /opsx:verify（验证架构合规）
│       ├── 更新进度文件
│       └── git commit
└── 直到输出 <promise>REFACTORING COMPLETE</promise>

Step 3: 批量归档
└── /opsx:bulk-archive（处理多个并行 changes）
```

---

## 技能调用速查表

| 用户意图 | 首要 Skill | 次要 Skills |
|----------|------------|-------------|
| "添加/构建/实现 X" | superpowers:brainstorming | everything-claude-code:backend-patterns/frontend-patterns |
| "修复 bug" | superpowers:systematic-debugging | 领域相关 skills |
| "重构代码" | superpowers:writing-plans | everything-claude-code:coding-standards |
| "写测试" | everything-claude-code:tdd-workflow | - |
| "安全审查" | everything-claude-code:security-review | - |
| "创建 API" | everything-claude-code:api-design | everything-claude-code:backend-patterns |
| "优化性能" | everything-claude-code:backend-patterns | superpowers:systematic-debugging |
| "完成/验证工作" | superpowers:verification-before-completion | everything-claude-code:verification-loop |
| "审查 PR" | superpowers:receiving-code-review | everything-claude-code:security-review |

---

## 常见反模式与纠正

### 反模式 1: 跳过 Skill 直接编码

**错误**:
```
用户: "添加登录功能"
Claude: 直接开始写代码
```

**纠正**:
```
用户: "添加登录功能"
Claude: "这是一个新功能开发任务，我需要：
        1. 先调用 brainstorming Skill 探索需求
        2. 调用 security-review Skill 确保安全
        3. 然后使用 OpenSpec 流程创建规划"
```

### 反模式 2: 一次处理多个 Tasks

**错误**:
```
在一个 Session 中完成所有 tasks
```

**纠正**:
```
每次 Session 只处理一个 task
使用 Ralph Loop 或 /opsx:continue 跨会话推进
```

### 反模式 3: 未验证就标记 passes: true

**错误**:
```
实现后直接更新 tasks.json: passes: true
```

**纠正**:
```
实现 ──▶ 运行测试 ──▶ 检查覆盖率 >= 80% ──▶ 验证功能 ──▶ 更新 passes: true
```

### 反模式 4: 不使用 Ralph Loop 处理长任务

**错误**:
```
试图在一个 Session 完成大型重构
```

**纠正**:
```
大型任务:
1. /opsx:new 或 /opsx:ff 创建规划
2. /ralph-loop 启动持续迭代
3. 每个 task 完成后 commit
4. 通过 progress 文件保持状态
```

### 反模式 5: 跨层调用违规

**错误**:
```
L4 交互平面直接调用 L1 数据层
跳过控制平面和认知平面的约束
```

**纠正**:
```
L4 ──▶ L3 ──▶ L2 ──▶ L1
前端 ──▶ API ──▶ 业务逻辑 ──▶ 数据库
```

### 反模式 6: 忽略测试覆盖率

**错误**:
```
功能实现后没有添加测试
或者测试覆盖率 < 80% 就提交
```

**纠正**:
```
使用 TDD 流程：
1. 先写测试（红）
2. 实现功能（绿）
3. 重构优化
4. 确保覆盖率 >= 80%
5. 提交代码
```

### 反模式 7: 环境变量硬编码

**错误**:
```
const API_URL = 'http://localhost:3000'
```

**纠正**:
```
const API_URL = process.env.API_URL || 'http://localhost:3000'
```

---

## 故障排除指南

### 数据库连接问题

**症状**: `Error: Connection refused` 或 `database does not exist`

**解决方案**:
```bash
# 1. 检查 Podman 容器状态
podman ps

# 2. 检查特定容器日志
podman logs zhixing-postgres
podman logs zhixing-redis
podman logs zhixing-qdrant

# 3. 重启数据库服务
./scripts/init.sh --skip-deps

# 4. 验证环境变量
cat .env.local | grep DB_

# 5. 重置数据库（谨慎使用）
pnpm --filter @zhixing/db reset

# 6. 如果容器启动失败，尝试重新创建
cd scripts
podman-compose down
podman-compose up -d
```

**Podman Machine 问题（macOS/Windows）:**
```bash
# 检查 machine 状态
podman machine list

# 如果未运行
podman machine start

# 如果未初始化
podman machine init
podman machine start

# 重启 machine
podman machine stop
podman machine start
```

### 依赖安装问题

**症状**: `Cannot find module` 或 `pnpm install` 失败

**解决方案**:
```bash
# 1. 清除 pnpm 缓存
pnpm store prune

# 2. 删除 node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 3. 重新安装
pnpm install
```

### TypeScript 编译错误

**症状**: `tsc --noEmit` 失败

**解决方案**:
```bash
# 1. 检查类型定义
pnpm typecheck

# 2. 清理构建缓存
rm -rf apps/*/dist packages/*/dist

# 3. 重启 TS 服务（VS Code）
Cmd/Ctrl + Shift + P -> TypeScript: Restart TS Server
```

### 测试失败

**症状**: `pnpm test` 失败

**解决方案**:
```bash
# 1. 运行特定测试文件
pnpm test -- src/auth.test.ts

# 2. 更新快照
pnpm test -- -u

# 3. 检查覆盖率
pnpm test:coverage
```

### OpenSpec 命令失败

**症状**: `openspec` 命令报错

**解决方案**:
```bash
# 1. 检查 CLI 安装
which openspec

# 2. 查看帮助
openspec --help

# 3. 验证配置
cat openspec/config.yaml

# 4. 查看状态
openspec status
```

### Git 提交问题

**症状**: `git commit` 被拦截

**解决方案**:
```bash
# 1. 检查 ESLint
pnpm lint

# 2. 检查类型
pnpm typecheck

# 3. 运行测试
pnpm test

# 4. 临时跳过（不推荐）
git commit --no-verify -m "message"
```

---

## 快速参考卡

### OpenSpec 命令速查

| 命令 | 用途 | 示例 |
|------|------|------|
| `/opsx:explore` | 需求探索 | `/opsx:explore` |
| `/opsx:new` | 创建变更 | `/opsx:new feature-x` |
| `/opsx:ff` | 快速生成 | `/opsx:ff feature-x` |
| `/opsx:continue` | 继续变更 | `/opsx:continue` |
| `/opsx:apply` | 实现任务 | `/opsx:apply` |
| `/opsx:verify` | 验证实现 | `/opsx:verify` |
| `/opsx:sync` | 同步规格 | `/opsx:sync` |
| `/opsx:archive` | 归档变更 | `/opsx:archive` |
| `/opsx:bulk-archive` | 批量归档 | `/opsx:bulk-archive` |

### Ralph Loop 命令速查

| 命令 | 用途 | 示例 |
|------|------|------|
| `/ralph-loop` | 启动循环 | `/ralph-loop "实现功能"` |
| `--max-iterations` | 最大迭代 | `--max-iterations 20` |
| `--completion-promise` | 完成承诺 | `--completion-promise "DONE"` |
| `/cancel-ralph` | 取消循环 | `/cancel-ralph` |

### 项目命令速查

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动所有开发服务器 |
| `pnpm build` | 构建所有项目 |
| `pnpm lint` | 运行 ESLint |
| `pnpm typecheck` | 运行 TypeScript 检查 |
| `pnpm test` | 运行测试 |
| `pnpm test:coverage` | 运行测试并检查覆盖率 |

---

## 项目状态与下一步

### 当前状态

| 模块 | 状态 | 进度 |
|------|------|------|
| 基础设施与工程脚手架 | 规划中 | 0/6 tasks |
| 数据模型与数据库 Schema | 规划中 | 0/7 tasks |
| Spec 管理中心后端 API | 规划中 | 0/5 tasks |
| Spec 分发引擎 | 规划中 | 0/5 tasks |
| 认知层 MCP 服务 | 规划中 | 0/11 tasks |
| Spec 管理中心 Web UI | 规划中 | 0/7 tasks |
| Skill 体系 | 规划中 | 0/5 tasks |
| CLI 智能体 | 规划中 | 0/8 tasks |
| 合规追踪 | 规划中 | 0/5 tasks |
| 试点验证 | 规划中 | 0/7 tasks |

### 下一步建议

**P0 - 立即执行**:
1. 创建根目录 `package.json` 和 `turbo.json`
2. 配置 pnpm 工作空间
3. 为 apps/api、apps/web、apps/cli 创建 package.json

**P1 - 本周完成**:
4. 配置 GitHub Actions CI/CD
5. 完善 `.claude/settings.json` 安全配置
6. 创建项目专属 skills

**P2 - 下周完成**:
7. 完善测试基础设施
8. 创建架构看护自动化
9. 完善文档体系

---

## 附录

### A. 相关链接

- [OpenSpec 工作流文档](./openspec/workflow.md)
- [产品定义文档](./product.md)
- [架构设计文档](./README.markdown)

### B. 技术栈文档

- [Fastify 文档](https://www.fastify.io/docs/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol)
- [Turborepo 文档](https://turbo.build/repo/docs)

### C. 贡献指南

1. 遵循 OpenSpec 工作流
2. 使用 TDD 开发模式
3. 确保测试覆盖率 >= 80%
4. 遵循四层架构约束
5. 更新相关文档

### D. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2025-02 | 初始版本，基础 OpenSpec 工作流 |
| 1.1 | 2025-02 | 集成 superpowers + everything-claude-code + ralph-wiggum |
| 1.2 | 2025-02 | 添加项目特定规范和 monorepo 配置 |
