#!/bin/bash
# 知行平台本地开发环境启动脚本
# 使用 podman 运行 PostgreSQL 和 Qdrant

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 知行平台本地开发环境 ===${NC}"

# 检查 podman 是否安装
if ! command -v podman &> /dev/null; then
    echo -e "${RED}错误: podman 未安装${NC}"
    echo "请先安装 podman: https://podman.io/getting-started/installation"
    exit 1
fi

echo -e "${GREEN}✓ podman 已安装: $(podman --version)${NC}"

# 设置容器名称
POSTGRES_CONTAINER="zhixing-postgres"
QDRANT_CONTAINER="zhixing-qdrant"

# PostgreSQL 配置
POSTGRES_USER="zhixing"
POSTGRES_PASSWORD="zhixing_dev_password"
POSTGRES_DB="zhixing"
POSTGRES_PORT=5432

# Qdrant 配置
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334

# 清理旧容器
echo -e "\n${YELLOW}检查现有容器...${NC}"
for container in $POSTGRES_CONTAINER $QDRANT_CONTAINER; do
    if podman ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${YELLOW}移除现有容器: ${container}${NC}"
        podman rm -f $container 2>/dev/null || true
    fi
done

# 启动 PostgreSQL
echo -e "\n${GREEN}启动 PostgreSQL...${NC}"
podman run -d \
    --name $POSTGRES_CONTAINER \
    -e POSTGRES_USER=$POSTGRES_USER \
    -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    -e POSTGRES_DB=$POSTGRES_DB \
    -p $POSTGRES_PORT:5432 \
    -v zhixing-postgres-data:/var/lib/postgresql/data \
    docker.io/postgres:16-alpine

echo -e "${GREEN}✓ PostgreSQL 已启动${NC}"
echo -e "  连接信息:"
echo -e "    Host: localhost"
echo -e "    Port: ${POSTGRES_PORT}"
echo -e "    User: ${POSTGRES_USER}"
echo -e "    Password: ${POSTGRES_PASSWORD}"
echo -e "    Database: ${POSTGRES_DB}"

# 等待 PostgreSQL 启动
echo -e "\n${YELLOW}等待 PostgreSQL 就绪...${NC}"
for i in {1..30}; do
    if podman exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL 就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}PostgreSQL 启动超时${NC}"
        exit 1
    fi
    sleep 1
done

# 启动 Qdrant
echo -e "\n${GREEN}启动 Qdrant...${NC}"
podman run -d \
    --name $QDRANT_CONTAINER \
    -p $QDRANT_PORT:6333 \
    -p $QDRANT_GRPC_PORT:6334 \
    -v zhixing-qdrant-data:/qdrant/storage \
    docker.io/qdrant/qdrant:latest

echo -e "${GREEN}✓ Qdrant 已启动${NC}"
echo -e "  连接信息:"
echo -e "    REST API: http://localhost:${QDRANT_PORT}"
echo -e "    gRPC API: http://localhost:${QDRANT_GRPC_PORT}"
echo -e "    Dashboard: http://localhost:${QDRANT_PORT}/dashboard"

# 等待 Qdrant 启动
echo -e "\n${YELLOW}等待 Qdrant 就绪...${NC}"
for i in {1..30}; do
    if curl -s "http://localhost:${QDRANT_PORT}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Qdrant 就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Qdrant 启动超时${NC}"
        exit 1
    fi
    sleep 1
done

# 创建 .env 文件
ENV_FILE="$(dirname "$0")/../.env.local"
echo -e "\n${GREEN}创建环境变量文件: ${ENV_FILE}${NC}"

cat > "$ENV_FILE" << EOF
# 知行平台本地开发环境配置
# 此文件由 scripts/init-local.sh 自动生成

# PostgreSQL
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# Qdrant
QDRANT_URL="http://localhost:${QDRANT_PORT}"
QDRANT_GRPC_URL="http://localhost:${QDRANT_GRPC_PORT}"

# 大模型中转代理（请根据实际情况配置）
# ANTHROPIC_BASE_URL="https://your-proxy.example.com"
# OPENAI_BASE_URL="https://your-proxy.example.com"
# OPENAI_API_KEY="your-api-key"
EOF

echo -e "${GREEN}✓ 环境变量文件已创建${NC}"

# 显示运行中的容器
echo -e "\n${GREEN}=== 运行中的容器 ===${NC}"
podman ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# 显示后续步骤
echo -e "\n${GREEN}=== 后续步骤 ===${NC}"
echo -e "1. 配置大模型代理（编辑 .env.local）"
echo -e "2. 运行数据库迁移: pnpm --filter @zhixing/db run db:migrate"
echo -e "3. 启动开发服务器: pnpm dev"

echo -e "\n${GREEN}=== 停止服务 ===${NC}"
echo -e "运行以下命令停止服务:"
echo -e "  podman stop $POSTGRES_CONTAINER $QDRANT_CONTAINER"
echo -e "\n或者使用 scripts/stop-local.sh"
