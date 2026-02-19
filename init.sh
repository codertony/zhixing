#!/bin/bash
# init.sh - 知行平台开发环境一键启动（增强版）
# 使用方法: ./init.sh [--skip-deps] [--skip-db] [--status]
#
# 功能：
#   1. 启动前检测服务是否已启动
#   2. 检测服务健康状态
#   3. 记录启动服务的地址和端口号

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 知行平台开发环境启动器${NC}"
echo "========================================"

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 解析参数
SKIP_DEPS=false
SKIP_DB=false
SHOW_STATUS=false
for arg in "$@"; do
  case $arg in
    --skip-deps) SKIP_DEPS=true ;;
    --skip-db) SKIP_DB=true ;;
    --status) SHOW_STATUS=true ;;
  esac
done

# 显示状态模式
if [ "$SHOW_STATUS" = true ]; then
  if [ -f "$SCRIPT_DIR/scripts/service-manager.sh" ]; then
    source "$SCRIPT_DIR/scripts/service-manager.sh"
    show_service_status
    show_service_log
  else
    echo -e "${YELLOW}service-manager.sh 未找到${NC}"
  fi
  exit 0
fi

# 引入服务管理工具
if [ -f "$SCRIPT_DIR/scripts/service-manager.sh" ]; then
  source "$SCRIPT_DIR/scripts/service-manager.sh"
else
  echo -e "${YELLOW}警告: service-manager.sh 未找到，部分功能不可用${NC}"
fi

# 1. 检查环境依赖
echo -e "${YELLOW}[1/6] 检查环境依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 Node.js 20+${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 npm${NC}"; exit 1; }
# 检查容器运行时（Docker 或 Podman）
if command -v docker >/dev/null 2>&1; then
  CONTAINER_RUNTIME="docker"
  COMPOSE_CMD="docker-compose"
elif command -v podman >/dev/null 2>&1; then
  CONTAINER_RUNTIME="podman"
  # 检查 podman-compose 或 docker-compose 兼容
  if command -v podman-compose >/dev/null 2>&1; then
    COMPOSE_CMD="podman-compose"
  elif podman compose version >/dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
  else
    echo -e "${YELLOW}警告: 找到 Podman 但未找到 podman-compose，跳过数据库服务${NC}"
    echo -e "${YELLOW}提示: 安装 podman-compose: pip install podman-compose${NC}"
    SKIP_DB=true
  fi
else
  echo -e "${YELLOW}警告: Docker/Podman 未安装，跳过数据库服务${NC}"
  SKIP_DB=true
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}错误: Node.js 版本需要 20+，当前: $(node -v)${NC}"
  exit 1
fi
echo -e "  Node.js: ${GREEN}$(node -v)${NC}"
echo -e "  npm: ${GREEN}$(npm -v)${NC}"

# 2. 检测和启动数据库服务
echo -e "${YELLOW}[2/6] 检测基础设施服务...${NC}"

if [ "$SKIP_DB" = false ] && [ -f "docker-compose.yml" ]; then
  # 检测现有服务状态
  for service in postgres qdrant redis; do
    if type check_service_running &>/dev/null; then
      local status
      status=$(check_service_running "$service")
      port_var="${service^^}_PORT"
      port=$(eval echo "\$${port_var}")
      port="${port:-${SERVICE_PORTS[$service]}}"

      case "$status" in
        "healthy")
          echo -e "  ${GREEN}✓ $service (端口 $port) - 运行中且健康${NC}"
          ;;
        "occupied")
          echo -e "  ${YELLOW}⚠ $service (端口 $port) - 端口被占用但健康检查失败${NC}"
          ;;
        "stopped")
          echo -e "  ${YELLOW}→ $service (端口 $port) - 将启动${NC}"
          ;;
      esac
    fi
  done

  echo -e "${YELLOW}[3/6] 启动数据库服务...${NC}"
  echo -e "  使用容器运行时: ${GREEN}${CONTAINER_RUNTIME}${NC}"
  $COMPOSE_CMD up -d postgres qdrant redis 2>/dev/null || {
    echo -e "${YELLOW}提示: compose 启动失败，使用已有服务${NC}"
  }

  # 等待服务就绪
  echo -e "${YELLOW}等待数据库就绪...${NC}"
  for i in {1..30}; do
    if type check_service_health &>/dev/null; then
      pg_health=$(check_service_health "postgres" && echo "ok" || echo "pending")
      qdrant_health=$(check_service_health "qdrant" && echo "ok" || echo "pending")
      redis_health=$(check_service_health "redis" && echo "ok" || echo "pending")

      if [ "$pg_health" = "ok" ] && [ "$qdrant_health" = "ok" ] && [ "$redis_health" = "ok" ]; then
        echo -e "  ${GREEN}✓ PostgreSQL${NC}"
        echo -e "  ${GREEN}✓ Qdrant${NC}"
        echo -e "  ${GREEN}✓ Redis${NC}"
        break
      fi
    fi

    if [ $i -eq 30 ]; then
      echo -e "${YELLOW}警告: 等待数据库超时，继续执行...${NC}"
    fi
    sleep 1
  done
else
  echo -e "${YELLOW}[2/6] 跳过数据库服务检测${NC}"
  echo -e "${YELLOW}[3/6] 跳过数据库服务启动${NC}"
fi

# 3. 安装依赖
echo -e "${YELLOW}[4/6] 安装依赖...${NC}"
if [ "$SKIP_DEPS" = false ]; then
  if [ -f "package.json" ]; then
    # 检查 pnpm 是否可用
    if command -v pnpm &> /dev/null; then
      pnpm install
      echo -e "  ${GREEN}✓ pnpm install 完成${NC}"
    else
      echo -e "${YELLOW}警告: pnpm 未安装，尝试使用 npm${NC}"
      npm install --silent
      echo -e "  ${GREEN}✓ npm install 完成${NC}"
    fi
  else
    echo -e "${YELLOW}提示: package.json 不存在，跳过依赖安装${NC}"
  fi
else
  echo -e "  ${YELLOW}跳过依赖安装${NC}"
fi

# 4. 环境变量检查
echo -e "${YELLOW}[5/6] 检查环境变量...${NC}"
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  echo -e "  ${GREEN}✓ .env 文件存在${NC}"
else
  echo -e "  ${YELLOW}⚠ .env 文件不存在${NC}"
  if [ -f ".env.example" ]; then
    echo -e "  提示: 可以复制 .env.example 并配置"
  fi
fi

# 5. 记录服务地址
echo -e "${YELLOW}[6/6] 记录服务地址...${NC}"
if type log_service &>/dev/null; then
  log_service "postgres" "init" "localhost:5432" "success" ""
  log_service "qdrant" "init" "localhost:6333" "success" ""
  log_service "redis" "init" "localhost:6379" "success" ""
  echo -e "  ${GREEN}✓ 服务地址已记录${NC}"
fi

# 6. 显示完整状态
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 开发环境就绪！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}📋 服务地址:${NC}"
echo -e "  PostgreSQL: ${GREEN}postgresql://zhixing:zhixing_dev_password@localhost:5432/zhixing${NC}"
echo -e "  Qdrant:     ${GREEN}http://localhost:6333${NC}"
echo -e "  Redis:      ${GREEN}localhost:6379${NC}"
echo ""

echo "可用命令:"
echo ""
if [ -f "package.json" ]; then
  echo -e "  ${CYAN}pnpm dev${NC}          # 启动所有服务（推荐）"
  echo -e "  ${CYAN}pnpm run dev:api${NC}  # 启动后端服务"
  echo -e "  ${CYAN}pnpm run dev:web${NC}  # 启动前端服务"
  echo -e "  ${CYAN}pnpm test${NC}         # 运行测试"
  echo -e "  ${CYAN}pnpm lint${NC}         # 代码检查"
fi
echo ""
echo -e "  ${CYAN}./scripts/dev-start.sh${NC}       # 完整开发环境启动"
echo -e "  ${CYAN}./scripts/service-manager.sh status${NC}  # 查看服务状态"
echo -e "  ${CYAN}./scripts/service-manager.sh log${NC}     # 查看启动记录"
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
