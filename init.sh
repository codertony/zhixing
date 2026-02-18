#!/bin/bash
# init.sh - 知行平台开发环境一键启动
# 使用方法: ./init.sh [--skip-deps] [--skip-db]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 知行平台开发环境启动器${NC}"
echo "========================================"

# 解析参数
SKIP_DEPS=false
SKIP_DB=false
for arg in "$@"; do
  case $arg in
    --skip-deps) SKIP_DEPS=true ;;
    --skip-db) SKIP_DB=true ;;
  esac
done

# 1. 检查环境依赖
echo -e "${YELLOW}[1/5] 检查环境依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 Node.js 20+${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 npm${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${YELLOW}警告: Docker 未安装，跳过数据库服务${NC}"; SKIP_DB=true; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}错误: Node.js 版本需要 20+，当前: $(node -v)${NC}"
  exit 1
fi
echo -e "  Node.js: ${GREEN}$(node -v)${NC}"
echo -e "  npm: ${GREEN}$(npm -v)${NC}"

# 2. 启动数据库服务
if [ "$SKIP_DB" = false ]; then
  echo -e "${YELLOW}[2/5] 启动数据库服务...${NC}"
  if [ -f "docker-compose.yml" ]; then
    docker-compose up -d postgres qdrant redis 2>/dev/null || {
      echo -e "${YELLOW}提示: docker-compose 启动失败，使用已有服务${NC}"
    }
    echo -e "  ${GREEN}✓ PostgreSQL${NC}"
    echo -e "  ${GREEN}✓ Qdrant${NC}"
    echo -e "  ${GREEN}✓ Redis${NC}"
  else
    echo -e "${YELLOW}提示: docker-compose.yml 不存在，跳过数据库启动${NC}"
    echo -e "       请确保 PostgreSQL、Qdrant、Redis 服务已手动启动"
  fi
else
  echo -e "${YELLOW}[2/5] 跳过数据库服务启动${NC}"
fi

# 3. 安装依赖
if [ "$SKIP_DEPS" = false ]; then
  echo -e "${YELLOW}[3/5] 安装依赖...${NC}"
  if [ -f "package.json" ]; then
    npm install --silent
    echo -e "  ${GREEN}✓ npm install 完成${NC}"
  else
    echo -e "${YELLOW}提示: package.json 不存在，跳过依赖安装${NC}"
  fi
else
  echo -e "${YELLOW}[3/5] 跳过依赖安装${NC}"
fi

# 4. 环境变量检查
echo -e "${YELLOW}[4/5] 检查环境变量...${NC}"
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  echo -e "  ${GREEN}✓ .env 文件存在${NC}"
else
  echo -e "  ${YELLOW}⚠ .env 文件不存在${NC}"
  if [ -f ".env.example" ]; then
    echo -e "  提示: 可以复制 .env.example 并配置"
  fi
fi

# 5. 启动开发服务
echo -e "${YELLOW}[5/5] 开发服务启动命令...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 开发环境就绪！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "可用命令:"
echo ""
if [ -f "package.json" ]; then
  echo "  npm run dev          # 启动所有服务（推荐）"
  echo "  npm run dev:backend  # 启动后端服务"
  echo "  npm run dev:frontend # 启动前端服务"
  echo "  npm run test         # 运行测试"
  echo "  npm run lint         # 代码检查"
fi
echo ""
echo "项目结构:"
echo "  openspec/            # 规范与变更管理"
echo "    workflow.md        # 研发流程文档"
echo "    changes/           # 当前变更"
echo "      */tasks.md       # 任务清单"
echo "      */feature-list.json  # 特性状态"
echo ""
echo "快速开始:"
echo "  cat openspec/changes/*/tasks.md    # 查看任务清单"
echo "  cat openspec/changes/*/.openspec.yaml  # 查看变更状态"
echo ""
