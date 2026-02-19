#!/bin/bash
# 停止知行平台本地开发环境

set -e

echo "停止本地开发环境..."

# 容器名称
POSTGRES_CONTAINER="zhixing-postgres"
QDRANT_CONTAINER="zhixing-qdrant"

# 停止容器
for container in $POSTGRES_CONTAINER $QDRANT_CONTAINER; do
    if podman ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "停止容器: ${container}"
        podman stop $container
    fi
done

echo "✓ 服务已停止"
echo "运行 'podman ps -a' 查看所有容器"
