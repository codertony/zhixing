# Podman 安装和配置指南

本指南介绍如何在 Windows 环境下使用 Podman 替代 Docker 来启动知行平台的基础设施服务。

## 为什么选择 Podman

- **无守护进程**: 不需要持续运行的后台服务
- **根less 安全**: 容器以非 root 用户运行，更安全
- **与 Docker 兼容**: 支持大多数 Docker 命令和 compose 文件
- **Kubernetes 原生**: 更贴近 K8s 生态

---

## Windows 安装 Podman

### 方式一：使用安装包（推荐）

1. 下载安装程序
   - 访问 [Podman Windows Release](https://github.com/containers/podman/releases)
   - 下载 `podman-4.x.x-setup.exe`

2. 运行安装程序
   - 双击安装包，按向导完成安装
   - 安装完成后重启终端

3. 验证安装
   ```powershell
   podman --version
   # 输出: podman version 4.9.0
   ```

### 方式二：使用 Chocolatey

```powershell
# 安装 Chocolatey（如果未安装）
# 然后安装 Podman
choco install podman-cli

# 验证
podman --version
```

### 方式三：使用 Winget

```powershell
# Windows 10/11 自带 winget
winget install RedHat.Podman

# 验证
podman --version
```

---

## 初始化 Podman 机器

Windows 上的 Podman 需要运行在 WSL2 或 Hyper-V 虚拟机中：

```powershell
# 初始化 Podman 机器（首次运行）
podman machine init

# 启动 Podman 机器
podman machine start

# 查看机器状态
podman machine list
```

---

## 安装 podman-compose

### 使用 pip 安装

```powershell
# 确保已安装 Python 和 pip
python --version
pip --version

# 安装 podman-compose
pip install podman-compose

# 验证安装
podman-compose --version
```

### 常见问题

#### 问题 1: "pip 不是内部或外部命令"

**解决方案**:
```powershell
# 安装 Python 时勾选 "Add Python to PATH"
# 或手动添加到环境变量
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python3x\Scripts", "User")
```

#### 问题 2: podman-compose 安装后无法识别

**解决方案**:
```powershell
# 找到 Python Scripts 目录并添加到 PATH
$pythonScripts = python -c "import site; print(site.USER_SITE.replace('site-packages', 'Scripts'))"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$pythonScripts", "User")

# 刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

## 使用 Podman 启动知行平台

### 快速启动

```powershell
# 1. 确保 Podman 机器已启动
podman machine start

# 2. 运行初始化脚本（自动检测 Podman）
.\init.ps1

# 3. 启动所有服务
pnpm dev
```

### 手动步骤

```powershell
# 1. 启动 Podman 机器
podman machine start

# 2. 启动基础设施
podman-compose up -d
# 或
podman compose up -d

# 3. 安装依赖
pnpm install

# 4. 执行数据库迁移
pnpm db:migrate

# 5. 启动应用服务
pnpm dev
```

---

## 常用 Podman 命令

```powershell
# 容器管理
podman ps                    # 查看运行中的容器
podman ps -a                 # 查看所有容器
podman logs zhixing-postgres # 查看容器日志
podman stop zhixing-postgres # 停止容器
podman start zhixing-postgres # 启动容器
podman rm zhixing-postgres   # 删除容器

# 镜像管理
podman images                # 查看镜像列表
podman pull postgres:16-alpine # 拉取镜像
podman rmi <image-id>       # 删除镜像

# Compose 操作
podman-compose up -d         # 后台启动服务
podman-compose down          # 停止并删除服务
podman-compose logs -f       # 查看实时日志
podman-compose ps            # 查看服务状态

# 机器管理
podman machine list          # 列出机器
podman machine start         # 启动机器
podman machine stop          # 停止机器
podman machine rm            # 删除机器
```

---

## 故障排查

### 问题 1: "Error: failed to start machine"

**原因**: WSL2 未启用或 Hyper-V 冲突

**解决方案**:
```powershell
# 启用 WSL2
wsl --install

# 重启后设置默认版本
wsl --set-default-version 2

# 重新初始化 Podman 机器
podman machine rm
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重启电脑后
podman machine init
podman machine start
```

### 问题 2: "cannot connect to Podman socket"

**原因**: Podman 机器未启动

**解决方案**:
```powershell
# 检查机器状态
podman machine list

# 如果显示 stopped，启动机器
podman machine start

# 如果问题持续，重新创建机器
podman machine rm
podman machine init
podman machine start
```

### 问题 3: "permission denied" 运行容器

**原因**: Windows 上的权限问题

**解决方案**:
```powershell
# 以管理员身份运行 PowerShell
# 或配置 Podman 使用当前用户
podman machine ssh
sudo usermod -aG wheel $USER
exit
podman machine stop
podman machine start
```

### 问题 4: 端口映射不生效

**原因**: Windows 防火墙或端口冲突

**解决方案**:
```powershell
# 检查端口占用
netstat -ano | findstr :5432

# 在 compose 文件中使用不同端口
# 编辑 docker-compose.yml，修改端口映射
# ports:
#   - "5433:5432"  # 主机端口:容器端口

# 重启服务
podman-compose down
podman-compose up -d
```

### 问题 5: 磁盘空间不足

**原因**: Podman 虚拟机磁盘满了

**解决方案**:
```powershell
# 查看磁盘使用
podman machine ssh
df -h

# 清理未使用的镜像和容器
podman system prune -a

# 如果仍不足，增加机器磁盘大小
podman machine stop
podman machine rm
podman machine init --disk-size 100
```

---

## Podman vs Docker 对比

| 特性 | Podman | Docker |
|------|--------|--------|
| 守护进程 | ❌ 不需要 | ✅ 需要 dockerd |
| 根权限 | ❌ 不需要 | ⚠️ 通常需要 |
| Windows 支持 | ✅ WSL2/Hyper-V | ✅ Native |
| Compose | ⚠️ 需要单独安装 | ✅ 内置 |
| 性能 | ⚠️ VM 开销 | ✅ 原生 |
| 安全性 | ✅ 更高 | ⚠️ 一般 |

---

## 迁移自 Docker

### 导出 Docker 镜像到 Podman

```powershell
# 使用 Docker 导出镜像
docker save postgres:16-alpine -o postgres.tar

# 使用 Podman 导入镜像
podman load -i postgres.tar
```

### 数据卷迁移

```powershell
# Docker 卷位置（Windows WSL2）
\\wsl$\docker-desktop-data\data\docker\volumes\

# Podman 卷位置（Windows WSL2）
\\wsl$\podman-machine-default\var\lib\containers\storage\volumes\
```

---

## 相关链接

- [Podman 官方文档](https://docs.podman.io/)
- [Podman Windows 安装指南](https://github.com/containers/podman/blob/main/docs/tutorials/podman-for-windows.md)
- [podman-compose GitHub](https://github.com/containers/podman-compose)
- [Podman vs Docker 对比](https://www.redhat.com/sysadmin/podman-vs-docker)

---

**提示**: 如果在 Windows 上遇到 Podman 的兼容性问题，可以考虑使用 WSL2 直接安装 Linux 版本的 Podman，或者在 Linux 虚拟机中运行开发环境。
