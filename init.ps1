# init.ps1 - 知行平台开发环境一键启动（Windows PowerShell 版本）
# 使用方法: .\init.ps1 [-SkipDeps] [-SkipDb] [-Status]
#
# 功能：
#   1. 启动前检测服务是否已启动
#   2. 检测服务健康状态
#   3. 记录启动服务的地址和端口号

param(
    [switch]$SkipDeps,
    [switch]$SkipDb,
    [switch]$Status
)

# 颜色定义
$Red = "`e[0;31m"
$Green = "`e[0;32m"
$Yellow = "`e[1;33m"
$Blue = "`e[0;34m"
$Cyan = "`e[0;36m"
$NC = "`e[0m" # No Color

Write-Host "$Blue🚀 知行平台开发环境启动器$NC"
Write-Host "========================================"

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = if ($ScriptDir) { $ScriptDir } else { Get-Location }

# 显示状态模式
if ($Status) {
    Write-Host "$Blue━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"
    Write-Host "$Blue🔍 知行平台服务状态检查$NC"
    Write-Host "$Blue━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"

    $services = @(
        @{Name="PostgreSQL"; Port=5432; Url="postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing"},
        @{Name="Qdrant"; Port=6333; Url="http://localhost:6333"},
        @{Name="Redis"; Port=6379; Url="localhost:6379"},
        @{Name="API"; Port=3000; Url="http://localhost:3000"},
        @{Name="Web"; Port=5173; Url="http://localhost:5173"},
        @{Name="MCP API"; Port=3002; Url="http://localhost:3002"}
    )

    Write-Host "$Cyan服务名称     端口    地址                    状态$NC"
    Write-Host "────────────────────────────────────────────────────────────"

    foreach ($svc in $services) {
        $port = $svc.Port
        $isListening = $false

        # 检测端口是否被占用
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
            $isListening = $connection.TcpTestSucceeded
        } catch {
            $isListening = $false
        }

        if ($isListening) {
            Write-Host "{0,-12} {1,-7} {2,-23} {3}运行中 ✓$NC" -f $svc.Name, $port, "localhost:$port", $Green
        } else {
            Write-Host "{0,-12} {1,-7} {2,-23} {3}未启动 ✗$NC" -f $svc.Name, $port, "localhost:$port", $Red
        }
    }
    Write-Host ""
    return
}

# 1. 检查环境依赖
Write-Host "$Yellow[1/6] 检查环境依赖...$NC"

# 检查 Node.js
try {
    $nodeVersion = node -v 2>$null
    if (-not $nodeVersion) {
        Write-Host "$Red错误: 需要 Node.js 20+$NC"
        exit 1
    }

    $majorVersion = [int]($nodeVersion -replace 'v', '').Split('.')[0]
    if ($majorVersion -lt 20) {
        Write-Host "$Red错误: Node.js 版本需要 20+，当前: $nodeVersion$NC"
        exit 1
    }

    Write-Host "  Node.js: $Green$nodeVersion$NC"
} catch {
    Write-Host "$Red错误: 需要 Node.js 20+$NC"
    exit 1
}

# 检查 pnpm
try {
    $pnpmVersion = pnpm -v 2>$null
    if ($pnpmVersion) {
        Write-Host "  pnpm: $Green$pnpmVersion$NC"
    } else {
        Write-Host "$Yellow警告: pnpm 未安装，部分功能可能不可用$NC"
        Write-Host "  请运行: npm install -g pnpm"
    }
} catch {
    Write-Host "$Yellow警告: pnpm 未安装$NC"
}

# 检查容器运行时（Docker 或 Podman）
$ContainerRuntime = $null
$ComposeCmd = $null

try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        $ContainerRuntime = "docker"
        $ComposeCmd = "docker-compose"
        Write-Host "  Docker: $Green已安装$NC"
    }
} catch {}

if (-not $ContainerRuntime) {
    try {
        $podmanVersion = podman --version 2>$null
        if ($podmanVersion) {
            $ContainerRuntime = "podman"
            # 检查 podman compose 是否可用
            $podmanComposeCheck = podman compose version 2>$null
            if ($podmanComposeCheck) {
                $ComposeCmd = "podman compose"
            } else {
                try {
                    $podmanComposeVersion = podman-compose --version 2>$null
                    if ($podmanComposeVersion) {
                        $ComposeCmd = "podman-compose"
                    }
                } catch {}
            }
            Write-Host "  Podman: $Green已安装$NC"
            if (-not $ComposeCmd) {
                Write-Host "$Yellow警告: 找到 Podman 但未找到 podman-compose，跳过数据库服务$NC"
                Write-Host "$Yellow提示: 安装 podman-compose: pip install podman-compose$NC"
                $SkipDb = $true
            }
        } else {
            Write-Host "$Yellow警告: Docker/Podman 未安装，跳过数据库服务$NC"
            $SkipDb = $true
        }
    } catch {
        Write-Host "$Yellow警告: Docker/Podman 未安装，跳过数据库服务$NC"
        $SkipDb = $true
    }
}

# 2. 检测和启动数据库服务
Write-Host "$Yellow[2/6] 检测基础设施服务...$NC"

function Test-ServiceHealth {
    param($Service, $Port)

    switch ($Service) {
        "postgres" {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
                $tcp.Close()
                return $true
            } catch {
                return $false
            }
        }
        "qdrant" {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$Port/healthz" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                return $response.StatusCode -eq 200
            } catch {
                return $false
            }
        }
        "redis" {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
                $tcp.Close()
                return $true
            } catch {
                return $false
            }
        }
        default {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
                $tcp.Close()
                return $true
            } catch {
                return $false
            }
        }
    }
}

if (-not $SkipDb) {
    $services = @(
        @{Name="postgres"; Port=5432},
        @{Name="qdrant"; Port=6333},
        @{Name="redis"; Port=6379}
    )

    $missingServices = @()

    foreach ($svc in $services) {
        $isHealthy = Test-ServiceHealth -Service $svc.Name -Port $svc.Port

        if ($isHealthy) {
            Write-Host "  $Green✓ $($svc.Name) (端口 $($svc.Port)) - 运行中且健康$NC"
        } else {
            Write-Host "  $Yellow→ $($svc.Name) (端口 $($svc.Port)) - 将启动$NC"
            $missingServices += $svc.Name
        }
    }

    # 启动缺失的服务
    if ($missingServices.Count -gt 0) {
        Write-Host "$Yellow[3/6] 启动基础设施服务...$NC"
        Write-Host "$Yellow正在启动: $($missingServices -join ', ')$NC"

        Set-Location $ProjectRoot

        Write-Host "$Yellow使用容器运行时: $Green$ContainerRuntime$NC"
        try {
            if ($ComposeCmd -eq "podman compose") {
                # podman compose 使用空格分隔
                $env:COMPOSE_CMD = "podman compose"
                podman compose up -d @missingServices 2>$null
            } else {
                & $ComposeCmd up -d @missingServices 2>$null
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host "$Yellow提示: compose 启动失败，使用已有服务$NC"
            }
        } catch {
            Write-Host "$Yellow提示: compose 启动失败，使用已有服务$NC"
        }

        # 等待服务就绪
        Write-Host "$Yellow等待数据库就绪...$NC"
        $maxRetries = 30
        $allReady = $false

        for ($i = 1; $i -le $maxRetries; $i++) {
            $pgReady = Test-ServiceHealth -Service "postgres" -Port 5432
            $qdrantReady = Test-ServiceHealth -Service "qdrant" -Port 6333
            $redisReady = Test-ServiceHealth -Service "redis" -Port 6379

            if ($pgReady -and $qdrantReady -and $redisReady) {
                Write-Host "  $Green✓ PostgreSQL$NC"
                Write-Host "  $Green✓ Qdrant$NC"
                Write-Host "  $Green✓ Redis$NC"
                $allReady = $true
                break
            }

            if ($i -eq $maxRetries) {
                Write-Host "$Yellow警告: 等待数据库超时，继续执行...$NC"
            }
            Start-Sleep -Seconds 1
        }
    } else {
        Write-Host "$Yellow[3/6] 所有基础设施服务已运行$NC"
    }
} else {
    Write-Host "$Yellow[2/6] 跳过数据库服务检测$NC"
    Write-Host "$Yellow[3/6] 跳过数据库服务启动$NC"
}

# 3. 安装依赖
Write-Host "$Yellow[4/6] 安装依赖...$NC"
if (-not $SkipDeps) {
    if (Test-Path "package.json") {
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            pnpm install
            Write-Host "  $Green✓ pnpm install 完成$NC"
        } else {
            Write-Host "$Yellow警告: pnpm 未安装，尝试使用 npm$NC"
            npm install
            Write-Host "  $Green✓ npm install 完成$NC"
        }
    } else {
        Write-Host "$Yellow提示: package.json 不存在，跳过依赖安装$NC"
    }
} else {
    Write-Host "  $Yellow跳过依赖安装$NC"
}

# 4. 环境变量检查
Write-Host "$Yellow[5/6] 检查环境变量...$NC"
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "  $Green✓ .env.local 文件存在$NC"
} else {
    Write-Host "  $Yellow⚠ .env.local 文件不存在$NC"
    if (Test-Path ".env.example") {
        Write-Host "  提示: 可以复制 .env.example 为 .env.local 并配置"
        Copy-Item ".env.example" ".env.local"
        Write-Host "  $Green✓ 已复制 .env.example 为 .env.local$NC"
    }
}

# 5. 记录服务地址
Write-Host "$Yellow[6/6] 记录服务地址...$NC"
$logDir = "$env:USERPROFILE\.zhixing\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = "$logDir\services.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"$timestamp|postgres|init|localhost:5432|success|" | Out-File -FilePath $logFile -Append -Encoding UTF8
"$timestamp|qdrant|init|localhost:6333|success|" | Out-File -FilePath $logFile -Append -Encoding UTF8
"$timestamp|redis|init|localhost:6379|success|" | Out-File -FilePath $logFile -Append -Encoding UTF8

Write-Host "  $Green✓ 服务地址已记录$NC"

# 6. 显示完整状态
Write-Host ""
Write-Host "$Green========================================$NC"
Write-Host "$Green✅ 开发环境就绪！$NC"
Write-Host "$Green========================================$NC"
Write-Host ""
Write-Host "$Cyan📋 服务地址:$NC"
Write-Host "  PostgreSQL: $Green postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing$NC"
Write-Host "  Qdrant:     $Green http://localhost:6333$NC"
Write-Host "  Redis:      $Green localhost:6379$NC"
Write-Host ""

Write-Host "可用命令:"
Write-Host ""
if (Test-Path "package.json") {
    Write-Host "  $Cyanpnpm dev$NC          # 启动所有服务（推荐）"
    Write-Host "  $Cyanpnpm run dev:api$NC  # 启动后端服务"
    Write-Host "  $Cyanpnpm run dev:web$NC  # 启动前端服务"
    Write-Host "  $Cyanpnpm db:migrate$NC   # 执行数据库迁移"
    Write-Host "  $Cyanpnpm test$NC         # 运行测试"
    Write-Host "  $Cyanpnpm lint$NC         # 代码检查"
}
Write-Host ""
Write-Host "  $Cyan.\init.ps1 -Status$NC           # 查看服务状态"
Write-Host ""
Write-Host "快速开始:"
Write-Host "  1. 配置 .env.local 文件中的 API 密钥（必需：OPENAI_API_KEY）"
Write-Host "  2. 运行 pnpm db:migrate 执行数据库迁移"
Write-Host "  3. 运行 pnpm dev 启动所有服务"
Write-Host "  4. 访问 http://localhost:5173 打开 Web 控制台"
Write-Host ""
