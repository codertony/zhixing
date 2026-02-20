# 知行平台 MVP Phase 1 设计方案

> 基于需求澄清会议确认的实现策略
> 日期：2026-02-20
> 试点项目：营销采购系统

---

## 1. 背景与目标

### 1.1 问题背景

营销采购系统作为试点项目，面临典型的大团队 AI 编程挑战：
- 代码规范分散在多个文档中，AI 编程工具缺乏统一上下文
- 项目级规范无法有效同步到开发者的 AI 编程环境
- 规范更新后，开发者手中的 `CLAUDE.md` 版本不一致

### 1.2 Phase 1 目标

在 **4 周内** 交付最小可用产品，验证核心假设：

> **核心假设**：通过"平台集中管理 Spec 规则 + CLI 自动分发到项目"的闭环，能够提升 AI 编程工具的上下文质量和规范一致性。

### 1.3 成功标准

- [ ] 架构师能在 Web UI 创建并发布项目级 Spec 规则
- [ ] 开发者运行 `zhixing init` 能成功生成 `CLAUDE.md`
- [ ] `CLAUDE.md` 内容包含平台发布的规则
- [ ] 营销采购系统开发团队确认可用

---

## 2. 功能边界

### 2.1 包含功能（Must Have）

| 模块 | 功能范围 |
|------|----------|
| **Spec 管理中心** | 项目级规则 CRUD、单层规则编译、草稿/发布状态流转、基础权限 |
| **分发引擎** | 手动触发 `CLAUDE.md` 生成、GitLab 文件推送、分发状态记录 |
| **CLI** | `zhixing init`（拉取 Spec 生成 `CLAUDE.md`）、版本差异提示 |
| **基础设施** | Monorepo、PostgreSQL、GitLab API 集成、Fastify 后端、React 前端 |

### 2.2 不包含功能（Won't Have in Phase 1）

| 功能 | 延后阶段 | 原因 |
|------|----------|------|
| 认知层 MCP（代码索引、语义问答） | Phase 2 | 非核心路径，可独立验证 |
| Skill 体系 | Phase 3 | 依赖生态建设，前期价值有限 |
| 合规追踪 | Phase 3 | 需要数据积累，前期无上报内容 |
| 三层规则继承与 override | Phase 2 | 营销采购系统单项目试点，暂不需要跨层继承 |
| 领域级/公司级规则管理 | Phase 2 | UI 优先项目级，数据结构保留扩展能力 |
| 自动分发触发 | Phase 2 | 手动触发足够验证核心流程 |
| MCP 实时轨 | Phase 2 | 文件轨已能满足基础需求 |

---

## 3. 技术架构

### 3.1 技术栈选型

| 层级 | 选型 | 理由 |
|------|------|------|
| **Monorepo** | Turborepo + pnpm | 团队熟悉，缓存机制优秀 |
| **后端框架** | Fastify (Node.js 20) | 轻量、高性能、TypeScript 友好 |
| **数据库** | PostgreSQL 15 | 关系型数据存储，事务支持 |
| **前端框架** | React 18 + Vite + Tailwind CSS | 开发体验好，构建速度快 |
| **ORM** | Drizzle ORM | 类型安全，迁移方便 |
| **GitLab 集成** | 自建封装（基于 axios） | 轻量，按需定制 |
| **模板引擎** | Handlebars | 简单成熟，CLAUDE.md 渲染 |

### 3.2 项目结构

```
zhixing/
├── apps/
│   ├── api/                 # Fastify 后端 API
│   ├── web/                 # React 管理后台
│   └── cli/                 # zhixing CLI
├── packages/
│   ├── db/                  # Drizzle ORM + Schema
│   ├── gitlab-client/       # GitLab API 封装
│   └── shared/              # 共享类型和工具
├── docs/
│   └── plans/               # 设计文档
└── scripts/                 # 开发脚本
```

### 3.3 数据模型（Phase 1 简化版）

```typescript
// projects 表
interface Project {
  id: string;
  name: string;
  gitlabRepo: string;        // 格式: group/project-name
  gitlabToken: string;       // 加密存储
  createdAt: Date;
  updatedAt: Date;
}

// spec_rules 表（Phase 1 仅支持项目级）
interface SpecRule {
  id: string;
  projectId: string;         // 外键，Phase 1 必填
  title: string;
  content: string;           // Markdown 内容
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// distribution_logs 表
interface DistributionLog {
  id: string;
  projectId: string;
  triggeredBy: 'manual';
  status: 'pending' | 'success' | 'failed';
  gitlabCommitSha?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

---

## 4. 用户流程

### 4.1 架构师管理流程

```
登录 Web UI
    │
    ▼
选择"营销采购系统"项目
    │
    ▼
创建/编辑 Spec 规则
├── 标题：如"Java 异常处理规范"
├── 内容：Markdown 格式规范文本
└── 状态：draft（草稿）
    │
    ▼
审核内容，确认无误
    │
    ▼
发布规则（状态变为 published）
    │
    ▼
点击"生成分发"
    │
    ▼
查看分发状态
├── 成功：显示 GitLab commit SHA
└── 失败：显示错误信息，可重试
```

### 4.2 开发者使用流程

```bash
# 1. 安装 CLI（内部 npm registry）
npm install -g @zhixing/cli

# 2. 项目初始化
cd /path/to/marketing-procurement
zhixing init

# 输出示例：
# ✓ 检测到 GitLab 仓库: marketing-group/marketing-procurement
# ✓ 从知行平台拉取 Spec 规则...
# ✓ 发现 3 条已发布规则
# ✓ 生成 CLAUDE.md...
# ✓ 写入本地文件 ./CLAUDE.md
#
# 下一步：
# 1. 请检查 CLAUDE.md 内容是否正确
# 2. 提交 CLAUDE.md 到 Git 仓库（可选，根据团队约定）
# 3. 启动你的 AI 编程工具，享受统一的规范上下文

# 3. 启动 AI 编程工具
# Cursor / Claude Code 会自动读取 CLAUDE.md
```

### 4.3 CLAUDE.md 模板结构

```markdown
# 营销采购系统 - AI 编程规范

> 本文件由知行平台自动生成，请勿手动修改
> 生成时间: 2026-02-20 10:30:00
> 规则版本: v3

---

## 规则 1: Java 异常处理规范

{{rule.content}}

---

## 规则 2: API 接口命名规范

{{rule.content}}

---

## 规则 3: 数据库字段命名规范

{{rule.content}}

---

*Powered by 知行平台*
```

---

## 5. 关键决策记录

### 5.1 领域划分策略

**决策**：采用混合模式（业务领域 + 技术领域）

- 业务领域：财务、采购、订单、库存、营销等
- 技术领域：Java 后端、React 前端、基础设施等

**Phase 1 处理**：仅保留数据结构，不实现领域管理功能。营销采购系统作为一个完整项目试点，暂不涉及跨领域订阅。

### 5.2 规则格式与生命周期

**决策**：纯文本 Markdown + 草稿/发布状态流转

- 规则内容：纯 Markdown，人工编写
- 状态流转：draft → published（发布后仍可编辑，产生新版本）
- 版本历史：Phase 1 仅保留 updatedAt，完整版本历史 Phase 2 实现

### 5.3 Embedding 与向量检索

**决策**：Phase 1 不做代码索引和语义问答

- 原因：4 周时间紧张，Embedding  Pipeline 实现复杂度高
- 替代方案：Phase 1 聚焦 Spec 规则管理，Phase 2 引入认知层 MCP

### 5.4 合规追踪策略

**决策**：Phase 1 不做 CI 扫描和合规上报

- 原因：需要先有规则和用户基础数据
- Phase 2 引入：渐进式阻断策略 + 混合审批模式

---

## 6. 风险评估与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| GitLab API 权限配置复杂 | 中 | 中 | 提前准备配置文档，提供测试脚本验证连通性 |
| 4 周时间无法完成 | 中 | 高 | Week 2 结束时做 mid-check，必要时调整范围 |
| 营销采购系统团队配合度低 | 低 | 高 | 提前沟通目标，确保有专人对接 |
| CLAUDE.md 格式不被 AI 工具识别 | 低 | 高 | 参考现有有效 CLAUDE.md 格式设计模板 |
| 并发编辑冲突 | 低 | 中 | Phase 1 采用乐观锁（updatedAt 校验），Phase 2 引入版本控制 |

---

## 7. Phase 2 预览（规划）

| 模块 | Phase 2 新增功能 |
|------|------------------|
| **三层规则** | 公司级/领域级规则管理、规则继承与编译、显式 override |
| **认知层 MCP** | 代码索引、语义问答、Git 历史分析、跨领域知识订阅 |
| **分发引擎** | 自动触发（规则发布后自动分发）、MCP 实时轨 |
| **CLI** | `zhixing ask` 语义问答、`zhixing skill` Skill 管理 |
| **合规追踪** | CI 扫描脚本、override 上报、采纳率统计 |

---

## 8. 附录

### 8.1 术语表

| 术语 | 定义 |
|------|------|
| Spec 规则 | 面向 AI 编程工具的规范文本，如代码规范、架构约束等 |
| CLAUDE.md | 放置于项目根目录的规范文件，Cursor/Claude Code 等工具自动读取 |
| 三层规则 | 公司级（全员适用）、领域级（业务/技术域适用）、项目级（单项目适用） |
| 认知层 MCP | 基于 RAG 的代码语义问答服务，通过 MCP 协议暴露 |
| Skill | 可复用的 AI 编程能力单元，包括 MCP Tool、Prompt 模板、OpenSpec 模板 |

### 8.2 参考资料

- [OpenSpec Workflow](../../openspec/workflow.md)
- [产品定义文档](../../product.md)
- [原始需求 Specs](../../openspec/changes/zhixing-mvp-architecture/specs/)
