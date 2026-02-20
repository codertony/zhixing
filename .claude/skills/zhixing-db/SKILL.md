# zhixing-db Skill

数据库操作指南。

## 触发条件

- 用户说："更新数据库 schema"
- 用户说："创建迁移"
- 用户说："重置数据库"
- 用户说："添加种子数据"

## 常用命令

### 生成迁移

```bash
# 根据 schema 变更生成迁移文件
pnpm db:generate
```

### 运行迁移

```bash
# 执行所有待处理的迁移
pnpm db:migrate
```

### 重置数据库

```bash
# 警告：这会删除所有数据
pnpm db:reset
```

### 种子数据

```bash
# 加载种子数据
pnpm db:seed
```

## 工作流

### Schema 变更流程

1. 修改 `packages/db/src/schema.ts`
2. 运行 `pnpm db:generate` 生成迁移
3. 检查生成的迁移文件
4. 运行 `pnpm db:migrate` 应用迁移
5. 提交迁移文件到 git

### 添加新表

```typescript
// packages/db/src/schema.ts
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const newTable = pgTable('new_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## 故障排除

### 迁移冲突

```bash
# 查看当前迁移状态
pnpm --filter @zhixing/db drizzle-kit check

# 如果需要，重置并重新生成
pnpm db:reset
pnpm db:generate
```

### 连接失败

检查 `.env.local` 中的数据库连接字符串：
```
DB_URL=postgresql://user:password@localhost:5432/zhixing
```
