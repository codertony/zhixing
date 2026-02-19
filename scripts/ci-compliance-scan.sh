#!/bin/bash
#
# CI 合规扫描脚本
# 任务 9.2: 检查 CLAUDE.md 版本一致性与 override 声明，上报结果
#

set -e

# 配置
ZHIXING_API_BASE="${ZHIXING_API_BASE:-http://localhost:3001}"
PROJECT_TOKEN="${ZHIXING_PROJECT_TOKEN:-}"
CLAUDE_MD_PATH="${CLAUDE_MD_PATH:-CLAUDE.md}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 知行平台 CI 合规扫描"
echo "========================"

# 检查项目 Token
if [ -z "$PROJECT_TOKEN" ]; then
    echo -e "${RED}错误: 未设置 ZHIXING_PROJECT_TOKEN 环境变量${NC}"
    exit 1
fi

# 检查 CLAUDE.md 是否存在
if [ ! -f "$CLAUDE_MD_PATH" ]; then
    echo -e "${YELLOW}警告: 未找到 CLAUDE.md 文件${NC}"
    # 上报未找到文件
    curl -s -X POST "${ZHIXING_API_BASE}/api/compliance/reports" \
        -H "Content-Type: application/json" \
        -H "project-token: $PROJECT_TOKEN" \
        -d '{
            "rules": [],
            "overrideEvents": [],
            "scanTime": "'"$(date -Iseconds)"'",
            "error": "CLAUDE.md not found"
        }' || true
    exit 0
fi

# 提取本地 CLAUDE.md 版本
LOCAL_VERSION=$(grep -oP '版本:\s*\K[^[:space:]]+' "$CLAUDE_MD_PATH" || echo "unknown")
echo "📄 本地 CLAUDE.md 版本: $LOCAL_VERSION"

# 提取本地 CLAUDE.md 内容
LOCAL_CONTENT=$(cat "$CLAUDE_MD_PATH")

# 检查 override 声明
OVERRIDE_COUNT=$(grep -c "OVERRIDE:" "$CLAUDE_MD_PATH" || echo "0")
echo "⚠️  发现 $OVERRIDE_COUNT 处 override 声明"

# 解析 override 事件
OVERRIDE_EVENTS=""
if [ "$OVERRIDE_COUNT" -gt 0 ]; then
    # 提取 override 信息（简化实现）
    while IFS= read -r line; do
        if [[ $line == *"OVERRIDE:"* ]]; then
            REASON=$(echo "$line" | sed 's/.*OVERRIDE:\s*//')
            # 尝试找到对应的规则 ID（简化处理）
            RULE_ID="unknown"
            OVERRIDE_EVENTS="${OVERRIDE_EVENTS}{\"ruleId\": \"$RULE_ID\", \"reason\": \"$REASON\"},"
        fi
    done < "$CLAUDE_MD_PATH"

    # 移除最后一个逗号
    OVERRIDE_EVENTS=$(echo "$OVERRIDE_EVENTS" | sed 's/,$//')
fi

# 获取 Git 信息
COMMIT_SHA=$(git rev-parse HEAD || echo "unknown")
COMMIT_AUTHOR=$(git log -1 --pretty=format:'%an' || echo "unknown")

echo "📊 准备上报扫描结果..."

# 上报合规数据
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ZHIXING_API_BASE}/api/compliance/reports" \
    -H "Content-Type: application/json" \
    -H "project-token: $PROJECT_TOKEN" \
    -d '{
        "rules": ["'"$LOCAL_VERSION"'"],
        "overrideEvents": ['"$OVERRIDE_EVENTS"'],
        "scanTime": "'"$(date -Iseconds)"'",
        "commitSha": "'"$COMMIT_SHA"'",
        "commitAuthor": "'"$COMMIT_AUTHOR"'"
    }' 2>/dev/null || echo -e "\n500")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 扫描结果上报成功${NC}"
else
    echo -e "${YELLOW}⚠️  上报失败 (HTTP $HTTP_CODE)${NC}"
    echo "响应: $BODY"
fi

# 输出扫描摘要
echo ""
echo "📋 扫描摘要"
echo "-----------"
echo "CLAUDE.md 版本: $LOCAL_VERSION"
echo "Override 声明: $OVERRIDE_COUNT"
echo "Commit SHA: $COMMIT_SHA"

# 注意：第一期只上报不拦截
echo -e "${GREEN}✅ 合规扫描完成 (仅上报，不拦截流水线)${NC}"
exit 0
