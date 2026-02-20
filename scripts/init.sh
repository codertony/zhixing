#!/bin/bash

# ZhiXing Platform - Development Environment Initialization Script
# 使用 Podman 作为容器运行时（本地开发首选）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 默认配置
SKIP_DEPS=false
SKIP_DB=false
VERBOSE=false

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-db)
      SKIP_DB=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: ./scripts/init.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-deps    跳过依赖安装"
      echo "  --skip-db      跳过数据库启动"
      echo "  --verbose      显示详细输出"
      echo "  --help         显示此帮助信息"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# 日志函数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
  if ! command -v "$1" &> /dev/null; then
    return 1
  fi
  return 0
}

# 检查 Podman
check_podman() {
  log_info "检查 Podman 安装..."

  if check_command podman; then
    PODMAN_VERSION=$(podman --version)
    log_success "Podman 已安装: $PODMAN_VERSION"

    # 检查 Podman machine 状态（macOS/Windows）
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
      if ! podman machine list --format json 2>/dev/null | grep -q '"Running":true'; then
        log_warning "Podman machine 未运行，尝试启动..."
        podman machine start 2>/dev/null || {
          log_error "无法启动 Podman machine，请手动运行: podman machine init && podman machine start"
          exit 1
        }
      fi
    fi

    return 0
  else
    log_error "Podman 未安装"
    echo ""
    echo "请安装 Podman:"
    echo "  macOS:   brew install podman"
    echo "  Linux:   sudo apt-get install podman 或 sudo dnf install podman"
    echo "  Windows: 下载 Podman Desktop"
    echo ""
    echo "或使用 Docker 兼容模式:"
    echo "  alias docker=podman"
    return 1
  fi
}

# 检查 Node.js
check_node() {
  log_info "检查 Node.js 版本..."

  if check_command node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="20.0.0"

    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
      log_success "Node.js 版本符合要求: $NODE_VERSION"
      return 0
    else
      log_error "Node.js 版本过低: $NODE_VERSION (需要 >= 20.0.0)"
      echo "请升级 Node.js: https://nodejs.org/"
      return 1
    fi
  else
    log_error "Node.js 未安装"
    echo "请安装 Node.js 20+: https://nodejs.org/"
    return 1
  fi
}

# 检查 pnpm
check_pnpm() {
  log_info "检查 pnpm..."

  if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm 已安装: $PNPM_VERSION"
    return 0
  else
    log_warning "pnpm 未安装，尝试安装..."
    npm install -g pnpm
    log_success "pnpm 安装完成"
    return 0
  fi
}

# 安装依赖
install_dependencies() {
  if [ "$SKIP_DEPS" = true ]; then
    log_info "跳过依赖安装 (--skip-deps)"
    return 0
  fi

  log_info "安装项目依赖..."

  if [ "$VERBOSE" = true ]; then
    pnpm install
  else
    pnpm install --silent
  fi

  log_success "依赖安装完成"
}

# 启动数据库服务
start_databases() {
  if [ "$SKIP_DB" = true ]; then
    log_info "跳过数据库启动 (--skip-db)"
    return 0
  fi

  log_info "启动数据库服务 (使用 Podman)..."

  # 检查是否存在 podman-compose
  if check_command podman-compose; then
    COMPOSE_CMD="podman-compose"
  elif check_command docker-compose; then
    COMPOSE_CMD="docker-compose"
    log_warning "使用 docker-compose，建议安装 podman-compose"
  else
    log_info "未安装 podman-compose，使用 podman 命令直接启动容器..."
    start_containers_manual
    return 0
  fi

  # 使用 compose 启动
  cd "$PROJECT_ROOT/scripts"

  if [ "$VERBOSE" = true ]; then
    $COMPOSE_CMD up -d
  else
    $COMPOSE_CMD up -d --quiet-pull
  fi

  cd "$PROJECT_ROOT"
  log_success "数据库服务启动完成"

  # 等待服务就绪
  wait_for_services
}

# 手动启动容器（无 compose）
start_containers_manual() {
  log_info "使用 podman 命令启动容器..."

  # PostgreSQL
  if ! podman ps --format "{{.Names}}" | grep -q "^zhixing-postgres$"; then
    log_info "启动 PostgreSQL..."
    podman run -d \
      --name zhixing-postgres \
      --replace \
      -p 5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=zhixing \
      -v zhixing-postgres-data:/var/lib/postgresql/data \
      docker.io/postgres:16-alpine
  else
    log_info "PostgreSQL 已运行"
  fi

  # Redis
  if ! podman ps --format "{{.Names}}" | grep -q "^zhixing-redis$"; then
    log_info "启动 Redis..."
    podman run -d \
      --name zhixing-redis \
      --replace \
      -p 6379:6379 \
      -v zhixing-redis-data:/data \
      docker.io/redis:7-alpine \
      redis-server --appendonly yes
  else
    log_info "Redis 已运行"
  fi

  # Qdrant
  if ! podman ps --format "{{.Names}}" | grep -q "^zhixing-qdrant$"; then
    log_info "启动 Qdrant..."
    podman run -d \
      --name zhixing-qdrant \
      --replace \
      -p 6333:6333 \
      -v zhixing-qdrant-data:/qdrant/storage \
      docker.io/qdrant/qdrant:latest
  else
    log_info "Qdrant 已运行"
  fi

  log_success "容器启动完成"
  wait_for_services
}

# 等待服务就绪
wait_for_services() {
  log_info "等待数据库服务就绪..."

  # 等待 PostgreSQL
  local retries=0
  local max_retries=30

  while [ $retries -lt $max_retries ]; do
    if podman exec zhixing-postgres pg_isready -U postgres -q 2>/dev/null; then
      log_success "PostgreSQL 就绪"
      break
    fi
    retries=$((retries + 1))
    echo -n "."
    sleep 1
  done

  if [ $retries -eq $max_retries ]; then
    log_error "PostgreSQL 启动超时"
    return 1
  fi

  # 等待 Redis
  retries=0
  while [ $retries -lt $max_retries ]; do
    if podman exec zhixing-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
      log_success "Redis 就绪"
      break
    fi
    retries=$((retries + 1))
    echo -n "."
    sleep 1
  done

  if [ $retries -eq $max_retries ]; then
    log_warning "Redis 启动超时，继续执行..."
  fi

  echo ""
}

# 检查环境变量文件
check_env_files() {
  log_info "检查环境变量配置..."

  if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
      log_warning ".env.local 不存在，从 .env.example 复制..."
      cp .env.example .env.local
      log_success ".env.local 已创建，请编辑配置"
    else
      log_error ".env.example 不存在"
      return 1
    fi
  else
    log_success ".env.local 已存在"
  fi
}

# 运行数据库迁移
run_migrations() {
  log_info "运行数据库迁移..."

  if [ -f "packages/db/src/schema.ts" ]; then
    pnpm --filter @zhixing/db migrate 2>/dev/null || {
      log_warning "迁移失败或无需迁移，继续执行..."
    }
  else
    log_warning "数据库 schema 不存在，跳过迁移"
  fi
}

# 验证环境
verify_environment() {
  log_info "验证开发环境..."

  # 类型检查
  log_info "运行 TypeScript 类型检查..."
  if pnpm typecheck > /dev/null 2>&1; then
    log_success "类型检查通过"
  else
    log_warning "类型检查失败，请修复错误"
  fi

  # Lint 检查
  log_info "运行 ESLint 检查..."
  if pnpm lint > /dev/null 2>&1; then
    log_success "ESLint 检查通过"
  else
    log_warning "ESLint 检查失败，请修复错误"
  fi

  echo ""
  log_success "环境验证完成"
}

# 打印状态信息
print_status() {
  echo ""
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}  知行平台开发环境初始化完成${NC}"
  echo -e "${GREEN}====================================${NC}"
  echo ""
  echo "环境信息:"
  echo "  Node.js: $(node --version)"
  echo "  pnpm: $(pnpm --version)"
  echo "  Podman: $(podman --version)"
  echo ""
  echo "数据库服务:"
  podman ps --format "  {{.Names}}: {{.Status}}" | grep zhixing- || echo "  无运行中的容器"
  echo ""
  echo "可用命令:"
  echo "  pnpm dev          - 启动所有开发服务器"
  echo "  pnpm dev:api      - 仅启动 API 服务"
  echo "  pnpm dev:web      - 仅启动 Web 服务"
  echo "  pnpm test         - 运行测试"
  echo "  pnpm lint         - 代码检查"
  echo ""
  echo "数据库管理:"
  echo "  pnpm db:migrate   - 运行迁移"
  echo "  pnpm db:generate  - 生成迁移"
  echo "  pnpm db:studio    - 打开 Drizzle Studio"
  echo ""
  echo "容器管理:"
  echo "  podman ps         - 查看运行中的容器"
  echo "  podman logs -f zhixing-postgres  - 查看 PostgreSQL 日志"
  echo ""
  echo -e "${YELLOW}提示: 编辑 .env.local 配置环境变量${NC}"
  echo ""
}

# 主函数
main() {
  echo -e "${BLUE}====================================${NC}"
  echo -e "${BLUE}  知行平台 - 开发环境初始化${NC}"
  echo -e "${BLUE}====================================${NC}"
  echo ""

  # 检查前置条件
  check_podman || exit 1
  check_node || exit 1
  check_pnpm || exit 1

  # 安装依赖
  install_dependencies

  # 启动数据库
  start_databases

  # 检查环境变量
  check_env_files

  # 运行迁移
  run_migrations

  # 验证环境
  verify_environment

  # 打印状态
  print_status
}

# 运行主函数
main "$@"
