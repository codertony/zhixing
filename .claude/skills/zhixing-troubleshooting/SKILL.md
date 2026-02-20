# ZhiXing 故障排除指南

## 概述

本文档提供知行平台开发过程中常见问题的解决方案。

## 数据库连接问题

**症状**: `Error: Connection refused` 或 `database does not exist`

**解决方案**:
```bash
# 1. 检查 Podman 容器状态
podman ps

# 2. 检查特定容器日志
podman logs zhixing-postgres
podman logs zhixing-redis
podman logs zhixing-qdrant

# 3. 重启数据库服务
./scripts/init.sh --skip-deps

# 4. 验证环境变量
cat .env.local | grep DB_

# 5. 重置数据库（谨慎使用）
pnpm --filter @zhixing/db reset

# 6. 如果容器启动失败，尝试重新创建
cd scripts
podman-compose down
podman-compose up -d
```

### Podman Machine 问题（macOS/Windows）

```bash
# 检查 machine 状态
podman machine list

# 如果未运行
podman machine start

# 如果未初始化
podman machine init
podman machine start

# 重启 machine
podman machine stop
podman machine start
```

## 依赖安装问题

**症状**: `Cannot find module` 或 `pnpm install` 失败

**解决方案**:
```bash
# 1. 清除 pnpm 缓存
pnpm store prune

# 2. 删除 node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 3. 重新安装
pnpm install
```

## TypeScript 编译错误

**症状**: `tsc --noEmit` 失败

**解决方案**:
```bash
# 1. 检查类型定义
pnpm typecheck

# 2. 清理构建缓存
rm -rf apps/*/dist packages/*/dist

# 3. 重启 TS 服务（VS Code）
Cmd/Ctrl + Shift + P -> TypeScript: Restart TS Server
```

## 测试失败

**症状**: `pnpm test` 失败

**解决方案**:
```bash
# 1. 运行特定测试文件
pnpm test -- src/auth.test.ts

# 2. 更新快照
pnpm test -- -u

# 3. 检查覆盖率
pnpm test:coverage
```

## OpenSpec 命令失败

**症状**: `openspec` 命令报错

**解决方案**:
```bash
# 1. 检查 CLI 安装
which openspec

# 2. 查看帮助
openspec --help

# 3. 验证配置
cat openspec/config.yaml

# 4. 查看状态
openspec status
```

## Git 提交问题

**症状**: `git commit` 被拦截

**解决方案**:
```bash
# 1. 检查 ESLint
pnpm lint

# 2. 检查类型
pnpm typecheck

# 3. 运行测试
pnpm test

# 4. 临时跳过（不推荐）
git commit --no-verify -m "message"
```

## RALPH Loop 问题

**症状**: Ralph Loop 进入无限循环或不继续

**解决方案**:
1. 检查 `.progress.md` 是否正确更新
2. 检查 `tasks.json` 中 passes 状态
3. 确认上一次 commit 是否成功
4. 手动运行 `/cancel-ralph` 后重新开始
5. 增加 `--max-iterations` 参数限制迭代次数

## 任务执行重试耗尽

**症状**: 任务执行 3 次后仍失败

**解决方案**:
1. 检查错误日志，确定失败原因
2. 如果是环境问题，修复后手动重试
3. 如果是代码问题，修复后更新 tasks.json 重试
4. 如果是依赖问题，检查依赖是否已安装/启动

## MCP Server 连接问题

**症状**: MCP 工具无法调用

**解决方案**:
1. 检查 MCP Server 是否已启动
2. 检查 `.claude/settings.json` 配置
3. 检查环境变量是否正确设置
4. 重启 Claude Code 重新加载配置

## 环境变量未生效

**症状**: 应用读取不到环境变量

**解决方案**:
1. 确认 `.env.local` 文件存在
2. 检查变量名是否正确（区分大小写）
3. 重启开发服务器
4. 检查变量是否以正确的前缀开头（如 `DB_`, `API_`）
