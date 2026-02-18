# 知行平台研发流程

> 灵感来源：[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## 核心理念

长时间运行的 AI Agent 面临两大挑战：
1. **上下文断层**：每个新会话都没有之前记忆，如同"工程师轮班工作，每班新工程师对上一班发生的事情毫无记忆"
2. **进度丢失**：要么试图一次性完成太多导致上下文耗尽，要么过早宣布完成

**核心解法**：让 Agent 能**快速理解工作状态**，并做出**增量进展**，留下**清晰工件**供下一会话使用。

---

## 研发流程架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      研发流程全景图                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 需求分析  │ ──▶ │ 规范设计  │ ──▶ │ 任务实现  │ ──▶ │ 验证归档  │  │
│  │ (Explore) │    │ (Spec)   │    │ (Apply)  │    │ (Archive)│  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │              │              │              │           │
│       ▼              ▼              ▼              ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   状态追踪层                              │  │
│  │  • feature-list.json（特性状态）                          │  │
│  │  • .openspec.yaml（Change 元数据）                        │  │
│  │  • tasks.md（任务清单）                                   │  │
│  │  • Git 提交历史（审计日志）                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 阶段一：需求分析（Explore Mode）

### 触发条件
- 新功能需求
- Bug 修复
- 技术债务清理
- 架构重构

### 执行流程

```
1. 运行 /opsx:explore 进入探索模式
2. 分析需求上下文
3. 澄清边界条件
4. 输出探索结论
```

### 输出工件
- **proposal.md**：需求理解、目标定义、非目标边界

### 检查点
- [ ] 需求是否足够清晰？
- [ ] 是否有技术可行性风险？
- [ ] 是否需要拆分为多个 Change？

---

## 阶段二：规范设计（Spec Mode）

### 触发条件
- proposal.md 已完成
- 进入正式设计阶段

### 执行流程

```
1. 运行 /opsx:new 创建新 Change
2. 系统自动生成：
   - .openspec.yaml（Change 元数据）
   - proposal.md（继承探索阶段输出）
3. 运行 /opsx:continue 生成设计文档
4. 运行 /opsx:continue 生成规格说明
5. 运行 /opsx:continue 生成任务清单
```

### 关键文件结构

```
openspec/changes/{change-name}/
├── .openspec.yaml      # Change 元数据（状态、阶段）
├── proposal.md         # 需求理解
├── design.md           # 设计决策
├── specs/              # 规格说明目录
│   ├── {component-1}/
│   │   └── spec.md
│   └── {component-2}/
│       └── spec.md
└── tasks.md            # 任务清单（状态追踪）
```

### 快速通道
如果需求明确，可运行 `/opsx:ff` 一次性生成所有设计工件。

### 检查点
- [ ] design.md 是否覆盖所有关键技术决策？
- [ ] specs/ 是否包含所有组件规格？
- [ ] tasks.md 是否可执行、可验证？

---

## 阶段三：任务实现（Apply Mode）

### 触发条件
- tasks.md 已生成
- 准备开始编码

### 会话启动仪式

**每次新会话开始时，Agent 自动执行：**

```bash
# 1. 确认工作目录
pwd

# 2. 读取 Git 日志（最近 5 条）
git log --oneline -5

# 3. 读取 OpenSpec 配置
cat openspec/config.yaml

# 4. 读取当前 Change 状态
cat openspec/changes/{current-change}/.openspec.yaml

# 5. 读取任务清单，确认进度
cat openspec/changes/{current-change}/tasks.md
```

### 执行流程

```
1. 运行 /opsx:apply 开始实现
2. 从 tasks.md 选择下一个待办任务
3. 实现代码
4. 运行测试验证
5. Git 提交（带标准消息格式）
6. 更新 tasks.md 标记完成
7. 重复直到所有任务完成
```

### 任务状态流转

```yaml
# tasks.md 状态标记
- [ ] 待办
- [x] 已完成
- [>] 进行中
- [-] 阻塞
- [_] 跳过
```

### Git 提交规范

```
<type>(<scope>): <subject>

type:
  feat     新功能
  fix      Bug 修复
  refactor 重构
  docs     文档
  test     测试
  chore    构建/工具

scope:
  spec-mgmt    Spec 管理中心
  cognitive    认知层
  cli          CLI 智能体
  skill        Skill 系统
  compliance   合规追踪

示例:
  feat(spec-mgmt): 实现三层规则 CRUD API
  fix(cli): 修复 zhixing init 权限检测问题
```

### 会话结束要求

**每次会话结束前必须完成：**

```bash
# 1. 确保代码已提交
git status
git add <files>
git commit -m "feat(scope): 描述"

# 2. 更新任务状态
# 编辑 tasks.md，标记完成的任务

# 3. 推送到远程（如适用）
git push origin <branch>
```

### 检查点
- [ ] 代码是否通过 lint 检查？
- [ ] 单元测试是否通过？
- [ ] Git 提交消息是否规范？
- [ ] tasks.md 状态是否更新？

---

## 阶段四：验证归档（Verify & Archive）

### 触发条件
- tasks.md 所有任务已标记完成

### 执行流程

```
1. 运行 /opsx:verify 验证实现
2. 检查：
   - 所有特性是否端到端测试通过
   - API 契约是否兼容
   - 代码覆盖率是否达标
3. 运行 /opsx:archive 归档
4. 系统自动：
   - 同步 specs 到主规范目录
   - 生成变更报告
   - 归档到 openspec/archive/
```

### 特性验证标准

使用 JSON 格式追踪特性状态（比 Markdown 更不易被误修改）：

```json
{
  "change": "zhixing-mvp-architecture",
  "features": [
    {
      "id": "F001",
      "name": "Spec CRUD API",
      "passes": true,
      "verified_at": "2026-02-19T10:30:00Z",
      "evidence": "tests/spec-management.test.ts"
    },
    {
      "id": "F002",
      "name": "三层规则 Override",
      "passes": false,
      "note": "待端到端测试"
    }
  ]
}
```

### 检查点
- [ ] 所有特性是否 passes: true？
- [ ] 是否有端到端测试证据？
- [ ] 文档是否同步更新？

---

## 状态追踪机制

### 文件职责清单

| 文件 | 格式 | 职责 | 更新时机 |
|------|------|------|----------|
| `.openspec.yaml` | YAML | Change 元数据、阶段状态 | 阶段流转时 |
| `tasks.md` | Markdown | 任务清单、进度追踪 | 任务完成时 |
| `feature-list.json` | JSON | 特性状态、验证结果 | 端到端测试通过时 |
| Git History | Git | 审计日志、回滚依据 | 每次提交时 |

### 状态查询命令

```bash
# 查看当前所有 Change 状态
ls openspec/changes/

# 查看特定 Change 详情
cat openspec/changes/{change-name}/.openspec.yaml

# 查看任务进度
grep -E "^\s*-\s*\[" openspec/changes/{change-name}/tasks.md

# 查看最近提交
git log --oneline -10
```

---

## 快速参考

### OpenSpec 命令速查

| 命令 | 用途 | 阶段 |
|------|------|------|
| `/opsx:explore` | 探索需求、澄清问题 | 分析 |
| `/opsx:new` | 创建新 Change | 设计 |
| `/opsx:continue` | 生成下一工件 | 设计 |
| `/opsx:ff` | 快速生成所有工件 | 设计 |
| `/opsx:apply` | 实现任务 | 实现 |
| `/opsx:verify` | 验证实现 | 验证 |
| `/opsx:archive` | 归档 Change | 归档 |

### 典型工作流

```bash
# 新功能完整流程
/opsx:explore          # 探索需求
/opsx:new              # 创建 Change
/opsx:ff               # 快速生成设计
/opsx:apply            # 实现任务（可能多次会话）
/opsx:verify           # 验证
/opsx:archive          # 归档

# 紧急 Bug 修复
/opsx:new              # 创建 Change
# 直接编码修复
git commit -m "fix: ..."
/opsx:archive          # 归档

# 继续未完成工作
# Agent 自动读取状态，继续上次进度
/opsx:apply
```

---

## 最佳实践

### ✅ 应该
- 每个会话只做**增量进展**
- 会话结束前**必须提交 Git**
- 使用 JSON 格式追踪特性状态
- 端到端测试通过后才能标记完成
- 保持 `init.sh` 脚本可用（启动开发环境）

### ❌ 避免
- 试图一次性完成太多任务
- 过早宣布完成（未验证）
- 跳过 Git 提交
- 修改历史提交（除非明确要求）
- 在 tasks.md 中模糊描述任务

---

## 附录：初始化脚本规范

项目应提供 `init.sh` 脚本，让 Agent 能快速启动开发环境：

```bash
#!/bin/bash
# init.sh - 一键启动开发环境

set -e

echo "🚀 启动知行平台开发环境..."

# 启动数据库
docker-compose up -d postgres qdrant redis

# 安装依赖
npm install

# 启动后端服务
npm run dev:backend &

# 启动前端服务
npm run dev:frontend &

echo "✅ 开发环境就绪"
echo "  - 后端: http://localhost:3000"
echo "  - 前端: http://localhost:5173"
echo "  - API 文档: http://localhost:3000/docs"
```

---

*文档版本：v1.0 | 最后更新：2026-02-19*
