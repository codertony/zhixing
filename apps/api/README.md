# @zhixing/api

知行平台 REST API 服务

## 简介

基于 Fastify 框架构建的 API 服务，提供 Spec 规则管理、项目管理和分发引擎等核心功能。

## 技术栈

- **框架**: Fastify 4.x
- **数据库**: PostgreSQL (postgres.js)
- **缓存**: Redis
- **日志**: Pino
- **测试**: Vitest

## 项目结构

```
src/
├── index.ts           # 服务入口
├── server.ts          # Fastify 实例配置
├── routes/            # 路由定义
│   ├── rules.ts       # Spec 规则 CRUD
│   ├── projects.ts    # 项目管理
│   └── distribution.ts # 分发状态
├── services/          # 业务逻辑
│   ├── rules.ts       # 规则服务
│   ├── compiler.ts    # Spec 编译器
│   └── distribution.ts # 分发服务
└── types.ts           # 类型定义
```

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint
```

## API 端点

### 健康检查

- `GET /` - API 信息
- `GET /health` - 健康检查

### Spec 规则管理

- `GET /api/specs/rules` - 获取规则列表
- `GET /api/specs/rules/:id` - 获取单个规则
- `POST /api/specs/rules` - 创建规则
- `PUT /api/specs/rules/:id` - 更新规则
- `DELETE /api/specs/rules/:id` - 删除规则

### 项目管理

- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取单个项目
- `POST /api/projects` - 创建项目

### Spec 编译

- `POST /api/specs/compile/:projectId` - 编译项目 Spec

### 分发状态

- `GET /api/distribution/status/:projectId` - 获取分发状态
- `POST /api/distribution/push/:projectId` - 推送到 GitLab

### 用户管理

- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取单个用户

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `API_PORT` | 服务端口 | 9000 |
| `API_HOST` | 服务主机 | 127.0.0.1 |
| `API_CORS_ORIGIN` | CORS 允许来源 | http://localhost:5173 |
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `REDIS_URL` | Redis 连接字符串 | - |
