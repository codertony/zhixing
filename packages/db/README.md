# @zhixing/db

知行平台数据库 Schema 和迁移管理

## 简介

使用 Drizzle ORM 定义数据库 Schema，管理 PostgreSQL 数据库结构。

## 技术栈

- **ORM**: Drizzle ORM
- **迁移**: Drizzle Kit
- **数据库**: PostgreSQL

## 项目结构

```
src/
├── schema/            # Schema 定义
│   ├── index.ts      # 统一导出
│   ├── rules.ts      # Spec 规则表
│   ├── projects.ts   # 项目表
│   ├── skills.ts     # 技能表
│   ├── users.ts      # 用户表
│   └── domains.ts    # 领域表
└── migrations/       # 迁移文件
```

## 开发命令

```bash
# 生成迁移
pnpm generate

# 执行迁移
pnpm migrate

# 检查 Schema
pnpm studio

# 测试
pnpm test
```

## 核心表结构

### spec_rules

Spec 规则表，支持三级分层（company/domain/project）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| level | enum | 层级: company/domain/project |
| domain_id | uuid | 领域ID (domain级别) |
| project_id | uuid | 项目ID (project级别) |
| content | text | 规则内容 (Markdown) |
| version | varchar | 版本号 |
| created_by | uuid | 创建者 |
| created_at | timestamp | 创建时间 |

### projects

项目管理表。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 项目名称 |
| domain_id | uuid | 所属领域 |
| gitlab_url | varchar | GitLab 地址 |
| status | enum | 状态 |
