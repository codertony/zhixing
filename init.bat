@echo off
chcp 65001 >nul
echo 🚀 知行平台开发环境启动器
echo ========================================
echo.

REM 检查 Node.js
echo [1/5] 检查 Node.js 环境...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 需要 Node.js 20+
    exit /b 1
)
echo   ✓ Node.js:
node -v

REM 检查 pnpm
echo.
echo [2/5] 检查 pnpm...
pnpm -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 警告: pnpm 未安装，尝试使用 npm
    echo 请运行: npm install -g pnpm
) else (
    echo   ✓ pnpm:
    pnpm -v
)

REM 检查容器运行时（Docker 或 Podman）
echo.
echo [3/5] 检查容器运行时...

set "CONTAINER_RUNTIME="
set "COMPOSE_CMD="

REM 检查 Docker
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "CONTAINER_RUNTIME=docker"
    set "COMPOSE_CMD=docker-compose"
    echo   ✓ Docker 已安装
    goto :CONTAINER_FOUND
)

REM 检查 Podman
podman --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "CONTAINER_RUNTIME=podman"
    REM 检查 podman compose 是否可用
    podman compose version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "COMPOSE_CMD=podman compose"
    ) else (
        podman-compose --version >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            set "COMPOSE_CMD=podman-compose"
        ) else (
            echo 警告: 找到 Podman 但未找到 podman-compose，跳过数据库服务
            echo 提示: 安装 podman-compose: pip install podman-compose
            goto SKIP_DB
        )
    )
    echo   ✓ Podman 已安装
    goto :CONTAINER_FOUND
)

echo 警告: Docker/Podman 未安装，跳过数据库服务
goto SKIP_DB

:CONTAINER_FOUND

REM 启动基础设施
echo.
echo [4/5] 启动基础设施服务...
echo 使用容器运行时: %CONTAINER_RUNTIME%

if "%COMPOSE_CMD%"=="podman compose" (
    podman compose up -d postgres qdrant redis 2>nul
) else (
    %COMPOSE_CMD% up -d postgres qdrant redis 2>nul
)

if %ERRORLEVEL% NEQ 0 (
    echo 提示: compose 启动失败，使用已有服务
) else (
    echo   ✓ 基础设施服务已启动
)

:SKIP_DB

REM 安装依赖
echo.
echo [5/6] 安装依赖...
if exist "node_modules" (
    echo   ✓ node_modules 已存在
) else (
    pnpm install 2>nul
    if %ERRORLEVEL% NEQ 0 (
        npm install
    )
    echo   ✓ 依赖安装完成
)

REM 检查环境变量
echo.
echo [6/6] 检查环境变量...
if not exist ".env.local" (
    echo   ⚠ .env.local 不存在
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo   ✓ 已创建 .env.local（请编辑并配置 API 密钥）
    ) else (
        echo   ✗ .env.example 也不存在，请手动创建 .env.local
    )
) else (
    echo   ✓ .env.local 已存在
)

echo.
echo ========================================
echo ✅ 开发环境初始化完成！
echo ========================================
echo.
echo 服务地址:
echo   PostgreSQL: postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing
echo   Qdrant:     http://localhost:6333
echo   Redis:      localhost:6379
echo.
echo 启动命令:
echo   pnpm dev           - 启动所有服务
echo   pnpm dev:api       - 仅启动 API
echo   pnpm dev:web       - 仅启动 Web
echo   pnpm db:migrate    - 执行数据库迁移
echo.
echo 查看状态:
echo   docker-compose ps
echo   podman-compose ps
echo.
echo 下一步:
echo   1. 配置 .env.local 文件（设置 OPENAI_API_KEY 等）
echo   2. 运行 pnpm db:migrate 执行数据库迁移
echo   3. 运行 pnpm dev 启动所有服务
echo   4. 访问 http://localhost:5173
echo.

pause
