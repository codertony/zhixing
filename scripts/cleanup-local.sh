#!/bin/bash
# 清理知行平台本地开发环境（包括数据卷）

set -e

echo "=== 清理本地开发环境 ==="

# 容器名称
POSTGRES_CONTAINER="zhixing-postgres"
QDRANT_CONTAINER="zhixing-qdrant"

# 停止并删除容器
for container in $POSTGRES_CONTAINER $QDRANT_CONTAINER; do
    if podman ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "删除容器: ${container}"
        podman rm -f $container
    fi
done

# 删除数据卷
echo "删除数据卷..."
podman volume rm zhixing-postgres-data 2>/dev/null || true
podman volume rm zhixing-qdrant-data 2>/dev/null || true

echo "✓ 清理完成"
