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

# 检查 Podman（本地开发使用 Podman，不使用 Docker）
podman --version
podman-compose --version

# 检查 Podman machine 状态（macOS/Windows）
podman machine list
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动数据库服务（使用 Podman）

```bash
# 使用 init.sh 启动 Podman 容器
./scripts/init.sh --skip-deps

# 或者手动启动
podman-compose -f scripts/podman-compose.yml up -d
```

### 4. 验证容器状态

```bash
# 查看运行中的容器
podman ps

# 查看容器日志
podman logs -f zhixing-postgres
podman logs -f zhixing-redis
podman logs -f zhixing-qdrant
```

### 5. 数据库迁移

```bash
pnpm db:migrate
```

### 6. 验证环境

```bash
# 运行类型检查
pnpm typecheck

# 运行 lint
pnpm lint

# 运行测试
pnpm test
```

### 7. 输出成功信息

显示环境就绪状态，包括：
- Node.js 版本
- pnpm 版本
- Podman 版本
- 数据库连接状态
- 可用命令列表

## 故障排除

### Node.js 版本不匹配

```bash
# 使用 nvm 切换版本
nvm use 20
```

### Podman 未安装

```bash
# macOS
brew install podman podman-compose
podman machine init
podman machine start

# Linux (Ubuntu/Debian)
sudo apt-get install podman podman-compose

# Linux (Fedora/RHEL)
sudo dnf install podman podman-compose
```

### Podman Machine 未运行（macOS/Windows）

```bash
# 启动 machine
podman machine start

# 如果未初始化
podman machine init
podman machine start
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
# 检查容器状态
podman ps

# 查看日志
podman logs zhixing-postgres

# 重启 Podman 服务
cd scripts
podman-compose down
podman-compose up -d
```

## 注意事项

**本地开发强制使用 Podman**，不使用 Docker。
- Podman 是 rootless 容器，更安全
- 命令与 Docker 兼容
- 支持 Docker Compose 文件格式
- 本地开发无需守护进程（Linux）

如果需要使用 Docker 兼容命令，可以设置别名：
```bash
alias docker=podman
alias docker-compose=podman-compose
```
