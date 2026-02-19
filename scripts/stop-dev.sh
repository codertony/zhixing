#!/bin/bash
#
# 知行平台开发环境停止脚本
# 停止所有服务并记录
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

echo -e "${BLUE}🛑 知行平台停止脚本${NC}"
echo "==================="

# 引入服务管理工具
source "$SCRIPT_DIR/service-manager.sh"

# 停止应用服务
echo -e "\n${YELLOW}停止应用服务...${NC}"

for service in api web mcp-api; do
    stop_service "$service" || true
done

# 询问是否停止基础设施
read -p "是否停止基础设施服务 (PostgreSQL, Qdrant, Redis)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}停止基础设施服务...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose down

    for service in postgres qdrant redis; do
        log_service "$service" "stop" "localhost:${SERVICE_PORTS[$service]}" "success" ""
    done

    echo -e "${GREEN}✓ 基础设施服务已停止${NC}"
fi

echo ""
echo -e "${GREEN}✓ 所有服务已停止${NC}"

# 显示最终状态
echo ""
show_service_status
