# zhixing-init Skill

初始化知行平台开发环境。

## 触发条件

- 用户说："初始化开发环境"
- 用户说："设置项目"
- 用户说："准备开发环境"
- 新成员首次加入项目

## 执行步骤

### 1. 检查环境要求

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 20.0.0

# 检查 pnpm
pnpm --version  # 需要 >= 8.0.0

# 检查 Docker
docker --version
docker-compose --version
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动数据库服务

```bash
# 使用 init.sh 启动 Docker 服务
./scripts/init.sh --skip-deps
```

### 4. 数据库迁移

```bash
pnpm db:migrate
```

### 5. 验证环境

```bash
# 运行类型检查
pnpm typecheck

# 运行 lint
pnpm lint

# 运行测试
pnpm test
```

### 6. 输出成功信息

显示环境就绪状态，包括：
- Node.js 版本
- pnpm 版本
- 数据库连接状态
- 可用命令列表

## 故障排除

### Node.js 版本不匹配

```bash
# 使用 nvm 切换版本
nvm use 20
```

### 依赖安装失败

```bash
# 清除缓存重新安装
pnpm store prune
rm -rf node_modules
pnpm install
```

### 数据库连接失败

```bash
# 重启 Docker 服务
docker-compose down
docker-compose up -d
```
