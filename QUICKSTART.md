# 知行平台快速开始指南

## Windows 环境开发启动

### 前置要求

1. **Node.js 20+**: [下载安装](https://nodejs.org/)
2. **pnpm**: 安装命令 `npm install -g pnpm`
3. **容器运行时**（二选一）：
   - **Docker Desktop**: [下载安装](https://www.docker.com/products/docker-desktop)
   - **Podman**: [下载安装](https://podman.io/getting-started/installation) + `pip install podman-compose`
4. **Git**: [下载安装](https://git-scm.com/download/win)

### 启动步骤

#### 方式一：PowerShell 脚本（推荐）

```powershell
# 1. 进入项目目录
cd E:\workSpace\ZhiXing

# 2. 如果使用 Podman，先启动机器
podman machine start  # Podman 用户需要执行

# 3. 运行初始化脚本（自动检测 Docker/Podman 并启动服务）
.\init.ps1

# 4. 配置环境变量（编辑 .env.local）
notepad .env.local

# 5. 启动所有服务
pnpm dev
```

#### 方式二：手动步骤

```powershell
# 1. 如果使用 Podman，先启动机器
podman machine start

# 2. 启动基础设施（PostgreSQL、Qdrant、Redis）
# Docker 用户
docker-compose up -d
# Podman 用户
podman-compose up -d

# 3. 安装依赖
pnpm install

# 4. 执行数据库迁移
pnpm db:migrate

# 5. 启动所有服务
pnpm dev
```

#### 方式三：单独启动服务

```powershell
# 启动基础设施
docker-compose up -d

# 安装依赖
pnpm install

# 终端 1：启动 API 服务
pnpm dev:api

# 终端 2：启动 Web 服务
pnpm dev:web

# 终端 3：启动 MCP 服务（HTTP 模式）
$env:ENABLE_HTTP_API="true"; pnpm dev:mcp
```

### 验证启动

```powershell
# 查看服务状态
.\init.ps1 -Status

# 或使用详细命令
# PostgreSQL
docker ps | findstr zhixing-postgres

# Qdrant
curl http://localhost:6333/healthz

# API 服务
curl http://localhost:3000/health

# Web 服务（浏览器访问）
start http://localhost:5173
```

### 停止服务

```powershell
# 停止所有服务（按 Ctrl+C 停止 pnpm dev）

# 停止基础设施
docker-compose down

# 或者停止并删除数据卷（清理数据）
docker-compose down -v
```

### 故障排查

#### 问题 1: "无法加载文件 init.ps1，因为在此系统上禁止运行脚本"

**解决方案**:
```powershell
# 以管理员身份运行 PowerShell，执行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新运行脚本
.\init.ps1
```

#### 问题 2: "docker-compose 不是内部或外部命令"

**解决方案**:
```powershell
# Docker Desktop 可能使用 docker compose（空格而非横线）
docker compose up -d

# 如果使用 Podman
podman-compose up -d
# 或
podman compose up -d

# 或者确保 Docker Desktop/Podman 已启动并添加到 PATH
```

#### 问题 3: "端口被占用"

**解决方案**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5432

# 终止进程（替换 <PID> 为实际的进程 ID）
taskkill /PID <PID> /F
```

#### 问题 4: "pnpm 不是内部或外部命令"

**解决方案**:
```powershell
# 安装 pnpm
npm install -g pnpm

# 如果已安装但未识别，可能需要刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User")
```

#### 问题 5: 数据库连接失败

**解决方案**:
```powershell
# 检查 PostgreSQL 容器状态
# Docker
docker ps | findstr postgres
docker logs zhixing-postgres

# Podman
podman ps | findstr postgres
podman logs zhixing-postgres

# 重启 PostgreSQL
# Docker
docker-compose restart postgres
# 或 Podman
podman-compose restart postgres

# 手动执行迁移
cd packages/db
npx drizzle-kit up:pg
cd ..\..
```

#### 问题 6: 环境变量未加载或 DATABASE_URL 错误

**解决方案**:
```powershell
# 确保 .env.local 文件存在
ls .env.local

# 如果不存在，从模板创建
cp .env.example .env.local

# 编辑文件并设置必要的环境变量
notepad .env.local

# 关键配置项：
# DATABASE_URL="postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing"
# OPENAI_API_KEY="your-actual-api-key"
```

#### 问题 7: Podman 机器未启动

**解决方案**:
```powershell
# 检查 Podman 机器状态
podman machine list

# 启动 Podman 机器
podman machine start

# 如果机器不存在，初始化一个
podman machine init
podman machine start
```

#### 问题 8: 模块未找到或导入错误

**解决方案**:
```powershell
# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 构建共享包
pnpm --filter @zhixing/shared build
pnpm --filter @zhixing/db build
```

### 开发工作流程

```powershell
# 1. 查看服务状态
.\init.ps1 -Status

# 2. 启动开发环境
pnpm dev

# 3. 运行测试（新开终端）
pnpm test

# 4. 代码检查
pnpm lint
pnpm format
```

### 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动所有服务 |
| `pnpm dev:api` | 仅启动 API |
| `pnpm dev:web` | 仅启动 Web |
| `pnpm test` | 运行测试 |
| `pnpm lint` | 代码检查 |
| `pnpm db:migrate` | 数据库迁移 |
| `pnpm infra:up` | 启动基础设施 |
| `pnpm infra:down` | 停止基础设施 |
| `.\init.ps1 -Status` | 查看服务状态 |

### 访问地址

- **Web 控制台**: http://localhost:3001
- **API 文档**: http://localhost:3000/health
- **Drizzle Studio**: `pnpm --filter @zhixing/db db:studio`

### 下一步

1. 访问 http://localhost:5173 查看 Web 控制台
2. 阅读 [CLAUDE.md](CLAUDE.md) 了解 AI Agent 行为规范
3. 查看 [README.md](README.md) 获取完整文档
