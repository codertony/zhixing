#!/bin/bash
#
# 知行平台开发环境启动脚本
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 知行平台开发环境启动脚本${NC}"
echo "=============================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
    echo "请运行: npm install -g pnpm"
    exit 1
fi

# 启动基础设施服务
echo -e "\n${YELLOW}📦 启动基础设施服务 (PostgreSQL, Qdrant, Redis)...${NC}"
docker-compose up -d

# 等待服务就绪
echo -e "\n${YELLOW}⏳ 等待数据库就绪...${NC}"
sleep 5

# 检查 PostgreSQL 健康状态
echo -e "${YELLOW}检查 PostgreSQL 连接...${NC}"
until docker exec zhixing-postgres pg_isready -U zhixing > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✅${NC}"

# 检查 Qdrant 健康状态
echo -e "${YELLOW}检查 Qdrant 连接...${NC}"
until curl -sf http://localhost:6333/healthz > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✅${NC}"

# 安装依赖
echo -e "\n${YELLOW}📥 安装项目依赖...${NC}"
pnpm install

# 执行数据库迁移
echo -e "\n${YELLOW}🗄️  执行数据库迁移...${NC}"
cd packages/db
pnpm migrate
cd ../..

echo -e "\n${GREEN}✅ 基础设施服务已就绪！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "PostgreSQL: ${GREEN}postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing${NC}"
echo -e "Qdrant:     ${GREEN}http://localhost:6333${NC}"
echo -e "Redis:      ${GREEN}localhost:6379${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}🚀 启动开发服务器:${NC}"
echo ""
echo "选项 1: 同时启动所有服务"
echo "  pnpm dev"
echo ""
echo "选项 2: 单独启动特定服务"
echo "  pnpm --filter @zhixing/api dev      # API 服务"
echo "  pnpm --filter @zhixing/web dev      # Web 前端"
echo "  pnpm --filter @zhixing/mcp-server dev # MCP 服务"
echo ""
echo "选项 3: 使用 Turbo 并行启动"
echo "  pnpm turbo run dev --parallel"
echo ""
