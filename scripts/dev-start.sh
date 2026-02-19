#!/bin/bash
#
# 知行平台开发环境启动脚本（增强版）
# 功能：
#   1. 启动前检测服务是否已启动
#   2. 检测服务健康状态
#   3. 记录启动服务的地址和端口号
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 引入服务管理工具
source "$SCRIPT_DIR/service-manager.sh"

# 初始化目录
init_directories

# 日志文件
STARTUP_LOG="${LOG_DIR}/startup.log"

# 记录启动日志
log_startup() {
    local message="$1"
    echo "[$(timestamp)] $message" >> "$STARTUP_LOG"
}

# 带检测的基础设施启动
start_infrastructure() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔍 步骤 1: 检测基础设施服务状态${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local services=("postgres" "qdrant" "redis")
    local missing_services=()

    for service in "${services[@]}"; do
        local status
        status=$(check_service_running "$service")
        local port="${SERVICE_PORTS[$service]}"

        case "$status" in
            "healthy")
                echo -e "  ${GREEN}✓ $service (端口 $port) - 运行中且健康${NC}"
                log_startup "$service already running and healthy on port $port"
                ;;
            "occupied")
                echo -e "  ${YELLOW}⚠ $service (端口 $port) - 端口被占用但健康检查失败${NC}"
                missing_services+=("$service")
                ;;
            "stopped")
                echo -e "  ${RED}✗ $service (端口 $port) - 未启动${NC}"
                missing_services+=("$service")
                ;;
        esac
    done

    # 如果有服务未启动，启动 Docker 服务
    if [ ${#missing_services[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}📦 步骤 2: 启动基础设施服务${NC}"

        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ 错误: Docker 未安装${NC}"
            exit 1
        fi

        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
            exit 1
        fi

        cd "$PROJECT_ROOT"

        # 启动服务
        echo -e "${YELLOW}正在启动: ${missing_services[*]}${NC}"
        docker-compose up -d "${missing_services[@]}"

        # 等待服务就绪
        echo -e "\n${YELLOW}⏳ 等待服务就绪...${NC}"
        for service in "${missing_services[@]}"; do
            local max_retries=30
            local retries=0
            echo -n "  等待 $service ..."
            while [ $retries -lt $max_retries ]; do
                if check_service_health "$service"; then
                    echo -e "\r  ${GREEN}✓ $service 已就绪${NC}"
                    local port="${SERVICE_PORTS[$service]}"
                    log_service "$service" "start" "localhost:$port" "success" ""
                    break
                fi
                echo -n "."
                sleep 1
                retries=$((retries + 1))
            done

            if [ $retries -eq $max_retries ]; then
                echo -e "\r  ${RED}✗ $service 启动超时${NC}"
                log_service "$service" "start" "localhost:${SERVICE_PORTS[$service]}" "timeout" ""
                exit 1
            fi
        done
    else
        echo -e "\n${GREEN}✓ 所有基础设施服务已运行${NC}"
    fi
}

# 检查 Node.js 环境
check_node_environment() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔍 步骤 3: 检查 Node.js 环境${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
        echo "请运行: npm install -g pnpm"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${RED}❌ 错误: Node.js 版本需要 20+，当前: $(node -v)${NC}"
        exit 1
    fi

    echo -e "  ${GREEN}✓ Node.js: $(node -v)${NC}"
    echo -e "  ${GREEN}✓ pnpm: $(pnpm -v)${NC}"

    log_startup "Node.js environment check passed: $(node -v), pnpm: $(pnpm -v)"
}

# 安装依赖
install_dependencies() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📥 步骤 4: 安装项目依赖${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    cd "$PROJECT_ROOT"

    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}  node_modules 已存在，跳过安装${NC}"
        echo -e "  ${YELLOW}如需重新安装，请运行: rm -rf node_modules && pnpm install${NC}"
    else
        echo -e "${YELLOW}  正在安装依赖...${NC}"
        pnpm install
        echo -e "  ${GREEN}✓ 依赖安装完成${NC}"
        log_startup "Dependencies installed"
    fi
}

# 执行数据库迁移
run_migrations() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🗄️  步骤 5: 执行数据库迁移${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    cd "$PROJECT_ROOT"

    # 检查数据库连接
    echo -n "  检查数据库连接..."
    if check_service_health "postgres"; then
        echo -e "\r  ${GREEN}✓ 数据库连接正常${NC}"
    else
        echo -e "\r  ${RED}✗ 数据库连接失败${NC}"
        exit 1
    fi

    # 执行迁移
    echo -e "  ${YELLOW}正在执行数据库迁移...${NC}"
    cd packages/db
    pnpm migrate
    cd ../..

    echo -e "  ${GREEN}✓ 数据库迁移完成${NC}"
    log_startup "Database migration completed"
}

# 显示服务启动信息
show_startup_info() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 知行平台开发环境已就绪！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo -e "\n${CYAN}📋 基础设施服务地址:${NC}"
    echo -e "  PostgreSQL: ${GREEN}postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing${NC}"
    echo -e "  Qdrant:     ${GREEN}http://localhost:6333${NC}"
    echo -e "  Redis:      ${GREEN}localhost:6379${NC}"

    echo -e "\n${CYAN}🚀 启动应用服务:${NC}"

    # 检测应用服务是否已启动
    local api_status
    local web_status
    local mcp_status
    api_status=$(check_service_running "api")
    web_status=$(check_service_running "web")
    mcp_status=$(check_service_running "mcp-api")

    if [ "$api_status" = "healthy" ]; then
        echo -e "  API 服务:   ${GREEN}http://localhost:3000 ✓ 运行中${NC}"
    else
        echo -e "  API 服务:   ${YELLOW}http://localhost:3000 (未启动)${NC}"
        echo -e "              启动命令: ${CYAN}pnpm --filter @zhixing/api dev${NC}"
    fi

    if [ "$web_status" = "healthy" ]; then
        echo -e "  Web 前端:   ${GREEN}http://localhost:5173 ✓ 运行中${NC}"
    else
        echo -e "  Web 前端:   ${YELLOW}http://localhost:5173 (未启动)${NC}"
        echo -e "              启动命令: ${CYAN}pnpm --filter @zhixing/web dev${NC}"
    fi

    if [ "$mcp_status" = "healthy" ]; then
        echo -e "  MCP 服务:   ${GREEN}http://localhost:3002 ✓ 运行中${NC}"
    else
        echo -e "  MCP 服务:   ${YELLOW}http://localhost:3002 (未启动)${NC}"
        echo -e "              启动命令: ${CYAN}ENABLE_HTTP_API=true pnpm --filter @zhixing/mcp-server dev${NC}"
    fi

    echo -e "\n${CYAN}📊 快捷命令:${NC}"
    echo -e "  启动所有服务: ${CYAN}pnpm dev${NC}"
    echo -e "  查看服务状态: ${CYAN}./scripts/service-manager.sh status${NC}"
    echo -e "  查看启动记录: ${CYAN}./scripts/service-manager.sh log${NC}"
    echo -e "  停止基础设施: ${CYAN}docker-compose down${NC}"

    echo -e "\n${CYAN}📁 日志文件:${NC}"
    echo -e "  启动日志: ${STARTUP_LOG}"
    echo -e "  服务记录: ${SERVICE_LOG_FILE}"

    log_startup "Startup info displayed successfully"
}

# 主函数
main() {
    echo -e "${BLUE}🚀 知行平台开发环境启动脚本${NC}"
    echo -e "${BLUE}==============================${NC}"

    log_startup "=== Development environment startup initiated ==="

    # 执行各步骤
    start_infrastructure
    check_node_environment
    install_dependencies
    run_migrations
    show_startup_info

    log_startup "=== Development environment startup completed ==="
}

# 处理中断信号
trap 'echo -e "\n${RED}启动过程被中断${NC}"; log_startup "Startup interrupted"; exit 130' INT TERM

# 执行主函数
main "$@"
