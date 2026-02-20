# zhixing-test Skill

测试驱动开发工作流。

## 触发条件

- 用户说："给 X 添加测试"
- 用户说："运行测试"
- 用户说："检查覆盖率"
- 用户说："TDD 开发"

## TDD 循环

### 1. 红（写测试）

```typescript
// apps/api/src/auth/auth.test.ts
import { describe, it, expect } from 'vitest';
import { authService } from './auth.service';

describe('AuthService', () => {
  it('should authenticate valid user', async () => {
    const result = await authService.login({
      email: 'test@example.com',
      password: 'password'
    });

    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
  });
});
```

### 2. 绿（实现功能）

```typescript
// apps/api/src/auth/auth.service.ts
export const authService = {
  async login(credentials: LoginCredentials) {
    // 实现认证逻辑
    const user = await validateUser(credentials);
    const token = generateToken(user);
    return { token, user };
  }
};
```

### 3. 重构（优化代码）

```bash
# 运行测试
pnpm test

# 检查覆盖率
pnpm test:coverage
```

## 测试策略

### 单元测试

- 每个 service 必须有单元测试
- 每个 util 函数必须有单元测试
- Mock 外部依赖

### 集成测试

- API 端点测试
- 数据库操作测试
- 使用测试数据库

### E2E 测试

- 关键用户流程
- 使用 Playwright

## 覆盖率要求

| 类型 | 阈值 | 工具 |
|------|------|------|
| 语句 | >= 80% | Vitest |
| 分支 | >= 80% | Vitest |
| 函数 | >= 80% | Vitest |
| 行 | >= 80% | Vitest |

## 常用命令

```bash
# 运行所有测试
pnpm test

# 运行特定文件
pnpm test -- auth.test.ts

# 运行并查看覆盖率
pnpm test:coverage

# 运行并更新快照
pnpm test -- -u

# 监听模式
pnpm test -- --watch
```
