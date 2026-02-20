# zhixing-arch Skill

四层架构合规检查。

## 触发条件

- 用户说："检查架构合规"
- 用户说："架构审查"
- 用户说："跨层调用检查"
- 代码审查时

## 四层架构规则

```
L4 交互平面 (Presentation)
├── React Components
├── Zustand Store
└── UI Logic
    │
    ▼
L3 控制平面 (Control)
├── API Routes
├── GraphQL Resolvers
└── Input Validation
    │
    ▼
L2 认知平面 (Cognitive)
├── Business Logic
├── Domain Services
└── Decision Engine
    │
    ▼
L1 数据平面 (Data)
├── Database Access
├── External APIs
└── Cache Layer
```

## 合规检查

### 允许的方向

- L4 → L3 → L2 → L1（自上而下）
- 同层内部调用

### 禁止的调用

- L4 直接调用 L2/L1
- L3 直接调用 L1
- 下层调用上层

## 检查命令

### 循环依赖检测

```bash
# 使用 madge 检查循环依赖
npx madge --circular apps/api/src
npx madge --circular apps/web/src
```

### 跨层调用检查

```bash
# 检查违规导入
# L4 不应该导入 L2/L1
# L3 不应该导入 L1

grep -r "from '@zhixing/db'" apps/web/src  # 违规！
grep -r "from '@zhixing/db'" apps/api/src  # 如果不在 L2，违规！
```

## 修复指南

### 违规示例

```typescript
// apps/web/src/pages/Home.tsx
// ❌ 错误：L4 直接调用 L1
import { db } from '@zhixing/db';
```

### 正确做法

```typescript
// apps/web/src/pages/Home.tsx
// ✅ 正确：通过 API 调用
import { api } from '../api';

const data = await api.projects.list();
```

```typescript
// apps/api/src/routes/projects.ts
// ✅ 正确：L3 调用 L2
import { projectService } from '../services/project.service';
```

```typescript
// apps/api/src/services/project.service.ts
// ✅ 正确：L2 调用 L1
import { db } from '@zhixing/db';
```
