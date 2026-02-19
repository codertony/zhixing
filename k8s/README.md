# 知行平台 K8s 部署说明

## 本地开发环境

使用 Podman 运行本地开发环境（推荐）：

```bash
# 启动 PostgreSQL 和 Qdrant
./scripts/init-local.sh

# 停止服务
./scripts/stop-local.sh

# 清理（包括数据卷）
./scripts/cleanup-local.sh
```

## K8s 集群部署

### 前提条件

- Kubernetes 集群（1.28+）
- kubectl 已配置并连接到集群
- 持久存储支持（PVC）

### 部署步骤

1. **创建命名空间和基础设施**

```bash
kubectl apply -f k8s/infrastructure.yaml
```

2. **验证部署状态**

```bash
kubectl get pods -n zhixing
kubectl get services -n zhixing
```

3. **获取连接信息**

```bash
# PostgreSQL
kubectl get secret zhixing-postgres-secret -n zhixing -o jsonpath='{.data.POSTGRES_USER}' | base64 -d
kubectl get secret zhixing-postgres-secret -n zhixing -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d

# 端口转发（本地测试）
kubectl port-forward -n zhixing svc/zhixing-postgres 5432:5432
kubectl port-forward -n zhixing svc/zhixing-qdrant 6333:6333
```

4. **配置应用环境变量**

```bash
# 在应用部署时配置
DATABASE_URL=postgresql://zhixing:<password>@zhixing-postgres.zhixing.svc.cluster.local:5432/zhixing
QDRANT_URL=http://zhixing-qdrant.zhixing.svc.cluster.local:6333
```

### 生产环境注意事项

1. **修改默认密码**

```bash
# 编辑 k8s/infrastructure.yaml 中的 POSTGRES_PASSWORD
```

2. **配置资源限制**

根据实际负载调整 `resources.requests` 和 `resources.limits`

3. **持久存储**

确保 `storageClassName` 与集群配置匹配

4. **备份策略**

定期备份 PostgreSQL 数据库和 Qdrant 数据卷

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 关系数据库 |
| Qdrant REST | 6333 | 向量数据库 REST API |
| Qdrant gRPC | 6334 | 向量数据库 gRPC API |
