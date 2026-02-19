#!/bin/bash
#
# 知行 CLI 发布脚本
# 用于将 @zhixing/cli 发布到 npm registry
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 知行 CLI 发布脚本 ===${NC}"

# 检查参数
REGISTRY="${1:-https://registry.npmjs.org/}"
echo -e "${YELLOW}发布 Registry: $REGISTRY${NC}"

# 进入 CLI 目录
cd "$(dirname "$0")/../apps/cli"

echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 1. 检查 Git 工作区是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}错误: Git 工作区不干净，请先提交更改${NC}"
    git status
    exit 1
fi

# 2. 检查是否在 main 分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}错误: 必须在 main 分支发布，当前分支: $CURRENT_BRANCH${NC}"
    exit 1
fi

# 3. 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull origin main

# 4. 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
pnpm install

# 5. 运行测试
echo -e "${YELLOW}运行测试...${NC}"
pnpm test
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 测试失败${NC}"
    exit 1
fi

# 6. 构建项目
echo -e "${YELLOW}构建项目...${NC}"
pnpm build

# 7. 检查 package.json
echo -e "${YELLOW}检查 package.json...${NC}"
if ! grep -q '"private": true' package.json; then
    echo -e "${GREEN}✓ package.json 未标记为 private${NC}"
else
    echo -e "${RED}错误: package.json 仍标记为 private${NC}"
    exit 1
fi

# 8. 登录检查
echo -e "${YELLOW}检查 npm 登录状态...${NC}"
npm whoami --registry "$REGISTRY" || {
    echo -e "${RED}错误: 未登录 npm registry${NC}"
    echo -e "${YELLOW}请运行: npm login --registry $REGISTRY${NC}"
    exit 1
}

# 9. 发布
echo -e "${GREEN}开始发布...${NC}"
npm publish --registry "$REGISTRY" --access restricted

# 10. 验证发布
echo -e "${YELLOW}验证发布...${NC}"
sleep 5
VERSION=$(node -p "require('./package.json').version")
npm view @zhixing/cli@"$VERSION" --registry "$REGISTRY" && {
    echo -e "${GREEN}✓ 发布成功! 版本: $VERSION${NC}"
} || {
    echo -e "${RED}错误: 发布验证失败${NC}"
    exit 1
}

# 11. 打标签
echo -e "${YELLOW}创建 Git 标签...${NC}"
git tag "cli-v$VERSION"
git push origin "cli-v$VERSION"

echo -e "${GREEN}=== 发布完成 ===${NC}"
echo -e "${GREEN}版本: $VERSION${NC}"
echo -e "${GREEN}Registry: $REGISTRY${NC}"

# 12. 安装验证说明
echo ""
echo -e "${YELLOW}安装验证命令:${NC}"
echo "  npm install -g @zhixing@cli@$VERSION --registry $REGISTRY"
echo "  zhixing --version"
