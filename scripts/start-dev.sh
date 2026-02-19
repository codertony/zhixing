#!/bin/bash
#
# 知行平台开发环境快速启动脚本
# 一键启动所有服务和检测
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 知行平台快速启动${NC}"
echo "===================="

# 引入服务管理工具
source "$SCRIPT_DIR/service-manager.sh"

# 显示当前状态
echo -e "\n${BLUE}当前服务状态:${NC}"
show_service_status

# 询问是否启动基础设施
read -p "是否启动基础设施服务? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    "$SCRIPT_DIR/dev-start.sh"
fi

# 询问是否启动应用服务
echo ""
read -p "是否启动应用服务? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo -e "\n${YELLOW}启动应用服务...${NC}"

    cd "$PROJECT_ROOT"

    # 启动 API 服务
    if [ "$(check_service_running "api")" != "healthy" ]; then
        echo -e "${CYAN}启动 API 服务...${NC}"
        pnpm --filter @zhixing/api dev &
        API_PID=$!
        echo $API_PID > "${PID_DIR}/api.pid"
    else
        echo -e "${GREEN}API 服务已在运行${NC}"
    fi

    # 启动 Web 服务
    if [ "$(check_service_running "web")" != "healthy" ]; then
        echo -e "${CYAN}启动 Web 服务...${NC}"
        pnpm --filter @zhixing/web dev &
        WEB_PID=$!
        echo $WEB_PID > "${PID_DIR}/web.pid"
    else
        echo -e "${GREEN}Web 服务已在运行${NC}"
    fi

    # 启动 MCP 服务（如果启用 HTTP API）
    if [ "${ENABLE_HTTP_API:-false}" = "true" ]; then
        if [ "$(check_service_running "mcp-api")" != "healthy" ]; then
            echo -e "${CYAN}启动 MCP 服务...${NC}"
            ENABLE_HTTP_API=true pnpm --filter @zhixing/mcp-server dev &
            MCP_PID=$!
            echo $MCP_PID > "${PID_DIR}/mcp-api.pid"
        else
            echo -e "${GREEN}MCP 服务已在运行${NC}"
        fi
    fi

    echo ""
    echo -e "${GREEN}应用服务已启动！${NC}"
    echo -e "${YELLOW}使用 Ctrl+C 停止，或使用 ./scripts/stop-dev.sh${NC}"

    # 等待信号
    wait
fi

echo ""
echo -e "${GREEN}完成！${NC}"
