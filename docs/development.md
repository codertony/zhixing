# 开发指南

## 环境准备

### 必需工具

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Podman** (本地开发强制使用，禁止直接使用 Docker)

### 安装步骤

1. 克隆仓库
```bash
git clone <repo-url>
cd zhixing
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填写必要的配置
```

4. 初始化数据库
```bash
# 启动 PostgreSQL 和 Redis (使用 Podman)
podman-compose up -d

# 执行数据库迁移
pnpm --filter @zhixing/db migrate
```

## 开发工作流

### 启动开发服务器

```bash
# 启动所有应用
pnpm dev

# 或单独启动某个应用
pnpm --filter @zhixing/api dev
pnpm --filter @zhixing/web dev
```

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

### 类型检查

```bash
# 检查所有包
pnpm typecheck

# 检查单个包
pnpm --filter @zhixing/api typecheck
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行单个包测试
pnpm --filter @zhixing/api test

# 覆盖率报告
pnpm test:coverage
```

## 数据库操作

### 修改 Schema

1. 编辑 `packages/db/src/schema/*.ts` 文件
2. 生成迁移文件：
```bash
pnpm --filter @zhixing/db generate
```
3. 执行迁移：
```bash
pnpm --filter @zhixing/db migrate
```

### 查看数据库

```bash
pnpm --filter @zhixing/db studio
```

## Git 工作流

### 分支命名

- 功能分支：`feat/description`
- 修复分支：`fix/description`
- 文档分支：`docs/description`

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
refactor: 重构代码
test: 添加测试
chore: 构建/工具变更
```

## 故障排除

### 常见问题

1. **依赖安装失败**
   - 检查 Node.js 版本 (>= 20)
   - 清除缓存：`pnpm store prune`

2. **数据库连接失败**
   - 检查 PostgreSQL 是否运行
   - 验证 `DATABASE_URL` 配置

3. **类型错误**
   - 确保所有包已构建：`pnpm build`
   - 检查 workspace 依赖版本

4. **测试失败**
   - 检查测试环境变量
   - 确保数据库迁移已执行
