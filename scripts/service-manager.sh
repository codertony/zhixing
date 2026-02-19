#!/bin/bash
#
# 知行平台服务管理工具
# 提供服务检测、健康检查和启动记录功能
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 服务配置
declare -A SERVICE_PORTS
SERVICE_PORTS=(
    ["postgres"]=5432
    ["qdrant"]=6333
    ["redis"]=6379
    ["api"]=3000
    ["web"]=3001
    ["mcp-api"]=3002
)

declare -A SERVICE_HOSTS
SERVICE_HOSTS=(
    ["postgres"]=localhost
    ["qdrant"]=localhost
    ["redis"]=localhost
    ["api"]=localhost
    ["web"]=localhost
    ["mcp-api"]=localhost
)

# 日志文件路径
LOG_DIR="${HOME}/.zhixing/logs"
SERVICE_LOG_FILE="${LOG_DIR}/services.log"
PID_DIR="${HOME}/.zhixing/pids"

# 初始化目录
init_directories() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$PID_DIR"
}

# 获取当前时间戳
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 记录服务日志
log_service() {
    local service_name="$1"
    local action="$2"
    local address="$3"
    local status="$4"
    local pid="${5:-N/A}"

    init_directories

    local log_entry="$(timestamp)|${service_name}|${action}|${address}|${status}|${pid}"
    echo "$log_entry" >> "$SERVICE_LOG_FILE"
}

# 显示服务日志
show_service_log() {
    if [ -f "$SERVICE_LOG_FILE" ]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}📋 最近启动的服务记录${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}时间                    | 服务      | 操作   | 地址              | 状态     | PID${NC}"
        echo "────────────────────────────────────────────────────────────────────────────────────"
        tail -20 "$SERVICE_LOG_FILE" | while IFS='|' read -r time service action address status pid; do
            local status_color="$GREEN"
            if [ "$status" = "failed" ]; then
                status_color="$RED"
            elif [ "$status" = "skipped" ]; then
                status_color="$YELLOW"
            fi
            printf "%-23s | %-9s | %-6s | %-17s | ${status_color}%-8s${NC} | %s\n" \
                "$time" "$service" "$action" "$address" "$status" "$pid"
        done
    else
        echo -e "${YELLOW}暂无服务启动记录${NC}"
    fi
}

# 检测端口是否被占用
check_port_in_use() {
    local port="$1"
    if command -v lsof &> /dev/null; then
        lsof -i :"$port" &> /dev/null
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
        return $?
    elif command -v ss &> /dev/null; then
        ss -tuln 2>/dev/null | grep -q ":$port "
        return $?
    else
        # Windows 使用 PowerShell
        if command -v powershell &> /dev/null; then
            powershell -Command "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue" &> /dev/null
            return $?
        fi
        return 1
    fi
}

# 获取占用端口的进程信息
get_port_process_info() {
    local port="$1"
    if command -v lsof &> /dev/null; then
        lsof -i :"$port" -P -n | grep LISTEN | head -1
    elif command -v netstat &> /dev/null; then
        netstat -tulpn 2>/dev/null | grep ":$port " | head -1
    elif command -v ss &> /dev/null; then
        ss -tulpn 2>/dev/null | grep ":$port " | head -1
    else
        echo "未知"
    fi
}

# 获取占用端口的 PID
get_port_pid() {
    local port="$1"
    if command -v lsof &> /dev/null; then
        lsof -t -i :"$port" | head -1
    elif command -v fuser &> /dev/null; then
        fuser "$port/tcp" 2>/dev/null | tr -d ' '
    else
        echo ""
    fi
}

# 检查服务健康状态
check_service_health() {
    local service="$1"
    local host="${SERVICE_HOSTS[$service]}"
    local port="${SERVICE_PORTS[$service]}"

    case "$service" in
        "postgres")
            # 检查 PostgreSQL
            if command -v pg_isready &> /dev/null; then
                pg_isready -h "$host" -p "$port" &> /dev/null
                return $?
            else
                # 使用 nc 或超时 telnet
                timeout 2 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null
                return $?
            fi
            ;;
        "qdrant")
            # 检查 Qdrant HTTP 端点
            curl -sf "http://${host}:${port}/healthz" &> /dev/null
            return $?
            ;;
        "redis")
            # 检查 Redis
            if command -v redis-cli &> /dev/null; then
                redis-cli -h "$host" -p "$port" ping &> /dev/null
                return $?
            else
                timeout 2 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null
                return $?
            fi
            ;;
        "api"|"mcp-api")
            # 检查 API 健康端点
            curl -sf "http://${host}:${port}/health" &> /dev/null
            return $?
            ;;
        "web")
            # 检查 Web 服务
            curl -sf "http://${host}:${port}" &> /dev/null
            return $?
            ;;
        *)
            # 默认检查端口连通性
            timeout 2 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null
            return $?
            ;;
    esac
}

# 检测服务是否已启动
check_service_running() {
    local service="$1"
    local port="${SERVICE_PORTS[$service]}"

    if check_port_in_use "$port"; then
        # 端口被占用，进一步检查是否是健康的服务
        if check_service_health "$service"; then
            echo "healthy"
        else
            echo "occupied"
        fi
    else
        echo "stopped"
    fi
}

# 显示服务状态
show_service_status() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔍 知行平台服务状态检查${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    printf "${CYAN}%-12s %-10s %-15s %-10s %-20s${NC}\n" "服务" "端口" "地址" "状态" "进程信息"
    echo "────────────────────────────────────────────────────────────────────────────"

    for service in postgres qdrant redis api mcp-api web; do
        local port="${SERVICE_PORTS[$service]}"
        local host="${SERVICE_HOSTS[$service]}"
        local status
        local status_color
        local process_info=""

        status=$(check_service_running "$service")

        case "$status" in
            "healthy")
                status_color="$GREEN"
                status="运行中 ✓"
                process_info=$(get_port_process_info "$port" | awk '{print $1, $2}' | head -c 20)
                ;;
            "occupied")
                status_color="$YELLOW"
                status="端口被占用 ⚠"
                process_info=$(get_port_process_info "$port" | awk '{print $1, $2}' | head -c 20)
                ;;
            "stopped")
                status_color="$RED"
                status="未启动 ✗"
                process_info="-"
                ;;
        esac

        printf "%-12s %-10s %-15s ${status_color}%-10s${NC} %-20s\n" \
            "$service" "$port" "$host:$port" "$status" "$process_info"
    done
    echo ""
}

# 智能启动服务
smart_start_service() {
    local service="$1"
    local start_command="$2"
    local health_check_url="${3:-}"
    local max_retries="${4:-30}"

    local port="${SERVICE_PORTS[$service]}"
    local host="${SERVICE_HOSTS[$service]}"
    local address="$host:$port"

    echo -e "${YELLOW}▶ 准备启动服务: $service ($address)${NC}"

    # 1. 检测服务是否已启动
    local status
    status=$(check_service_running "$service")

    if [ "$status" = "healthy" ]; then
        echo -e "  ${GREEN}✓ 服务 $service 已在运行且健康${NC}"
        local pid=$(get_port_pid "$port")
        log_service "$service" "start" "$address" "skipped" "$pid"
        return 0
    elif [ "$status" = "occupied" ]; then
        echo -e "  ${YELLOW}⚠ 端口 $port 被占用，但健康检查失败${NC}"
        echo -e "  ${YELLOW}  进程信息: $(get_port_process_info "$port")${NC}"
        read -p "  是否终止占用进程并重新启动? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local pid=$(get_port_pid "$port")
            if [ -n "$pid" ]; then
                echo -e "  ${YELLOW}正在终止进程 $pid...${NC}"
                kill -15 "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
                sleep 2
            fi
        else
            echo -e "  ${YELLOW}跳过启动 $service${NC}"
            log_service "$service" "start" "$address" "skipped" ""
            return 1
        fi
    fi

    # 2. 启动服务
    echo -e "  ${YELLOW}正在启动 $service...${NC}"

    # 记录 PID 文件
    local pid_file="${PID_DIR}/${service}.pid"

    # 执行启动命令
    eval "$start_command" &
    local pid=$!

    # 保存 PID
    echo $pid > "$pid_file"

    # 3. 等待服务就绪
    echo -n "  等待服务就绪..."
    local retries=0
    while [ $retries -lt $max_retries ]; do
        if check_service_health "$service"; then
            echo -e "\r  ${GREEN}✓ $service 启动成功 (PID: $pid)${NC}"
            log_service "$service" "start" "$address" "success" "$pid"
            return 0
        fi
        echo -n "."
        sleep 1
        retries=$((retries + 1))
    done

    echo -e "\r  ${RED}✗ $service 启动超时或失败${NC}"
    log_service "$service" "start" "$address" "failed" "$pid"
    return 1
}

# 停止服务
stop_service() {
    local service="$1"
    local port="${SERVICE_PORTS[$service]}"
    local pid_file="${PID_DIR}/${service}.pid"

    echo -e "${YELLOW}▶ 正在停止服务: $service${NC}"

    # 尝试从 PID 文件读取
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill -15 "$pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            echo -e "  ${GREEN}✓ 已停止 $service (PID: $pid)${NC}"
            log_service "$service" "stop" "localhost:$port" "success" "$pid"
            rm -f "$pid_file"
            return 0
        fi
        rm -f "$pid_file"
    fi

    # 尝试通过端口查找并终止
    local pid
    pid=$(get_port_pid "$port")
    if [ -n "$pid" ]; then
        kill -15 "$pid" 2>/dev/null || true
        sleep 2
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        echo -e "  ${GREEN}✓ 已停止 $service (PID: $pid)${NC}"
        log_service "$service" "stop" "localhost:$port" "success" "$pid"
        return 0
    fi

    echo -e "  ${YELLOW}⚠ $service 未在运行${NC}"
    return 1
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}知行平台服务管理工具${NC}"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  status              显示所有服务状态"
    echo "  log                 显示服务启动记录"
    echo "  check <服务名>      检查指定服务状态"
    echo "  health <服务名>     检查指定服务健康状态"
    echo "  start <服务名>      智能启动服务（带检测）"
    echo "  stop <服务名>       停止服务"
    echo "  restart <服务名>    重启服务"
    echo ""
    echo "支持的服务:"
    echo "  postgres, qdrant, redis, api, web, mcp-api"
    echo ""
    echo "示例:"
    echo "  $0 status           # 查看所有服务状态"
    echo "  $0 start api        # 启动 API 服务"
    echo "  $0 restart web      # 重启 Web 服务"
    echo "  $0 log              # 查看启动记录"
}

# 主函数
main() {
    case "${1:-}" in
        "status")
            show_service_status
            ;;
        "log")
            show_service_log
            ;;
        "check")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}错误: 请指定服务名${NC}"
                exit 1
            fi
            local status
            status=$(check_service_running "$2")
            echo "服务 $2 状态: $status"
            ;;
        "health")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}错误: 请指定服务名${NC}"
                exit 1
            fi
            if check_service_health "$2"; then
                echo -e "${GREEN}服务 $2 健康检查通过${NC}"
                exit 0
            else
                echo -e "${RED}服务 $2 健康检查失败${NC}"
                exit 1
            fi
            ;;
        "start")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}错误: 请指定服务名${NC}"
                exit 1
            fi
            # 这里需要根据具体服务调用相应的启动命令
            echo -e "${YELLOW}请使用 dev-start.sh 或 init.sh 启动完整环境${NC}"
            echo -e "${YELLOW}或使用 pnpm dev 启动开发服务${NC}"
            ;;
        "stop")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}错误: 请指定服务名${NC}"
                exit 1
            fi
            stop_service "$2"
            ;;
        "restart")
            if [ -z "${2:-}" ]; then
                echo -e "${RED}错误: 请指定服务名${NC}"
                exit 1
            fi
            stop_service "$2"
            sleep 2
            echo -e "${YELLOW}请使用 dev-start.sh 或 pnpm dev 重新启动服务${NC}"
            ;;
        *)
            show_help
            ;;
    esac
}

# 如果直接执行此脚本
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
