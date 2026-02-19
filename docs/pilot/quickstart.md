# 知行平台试点项目快速启动指南

本文档提供试点项目接入知行平台的最简步骤。

## 前置条件

1. 已有 GitLab 仓库
2. 已安装 Node.js 18+
3. 知行平台已部署且可访问

## 5 分钟快速接入

### 步骤 1: 注册项目（1分钟）

登录知行 Web 控制台：

1. 访问 `https://zhixing.example.com`
2. 进入「项目管理」→「新建项目」
3. 填写：
   - 项目名称: 你的项目名
   - GitLab 路径: `group/project-name`
   - 所属领域: 选择或创建
4. 点击「创建」

### 步骤 2: 安装 CLI（1分钟）

```bash
npm install -g @zhixing/cli
```

配置 API 地址：

```bash
mkdir -p ~/.zhixing
echo '{
  "apiBase": "https://api.zhixing.example.com",
  "apiKey": "your-api-key"
}' > ~/.zhixing/config.json
```

### 步骤 3: 初始化项目（1分钟）

```bash
cd your-project
git pull origin main  # 确保代码最新
zhixing init
```

预期输出：
```
✓ 检测到 Git 仓库: group/project-name
✓ 拉取项目 Spec 配置
✓ 生成 CLAUDE.md
✓ MCP 配置已写入 .cursor/mcp.json
✓ 初始化完成
```

### 步骤 4: 验证问答（1分钟）

```bash
zhixing ask "这个项目的架构分层是怎样的？"
```

预期输出：
```
根据代码分析，该项目采用以下架构分层：

1. Controller 层: 处理 HTTP 请求...
   📄 src/main/java/.../UserController.java:45

2. Service 层: 业务逻辑...
   📄 src/main/java/.../UserService.java:23

...
```

### 步骤 5: 配置 CI（1分钟）

创建 `.gitlab-ci.yml`：

```yaml
zhixing-compliance:
  stage: test
  image: node:20-alpine
  before_script:
    - npm install -g @zhixing/cli
  script:
    - zhixing status
  allow_failure: false
```

提交：

```bash
git add .gitlab-ci.yml CLAUDE.md
git commit -m "chore: integrate zhixing platform"
git push
```

## 完成验证

✅ 你已接入知行平台！

接下来可以：
- 在 Web 控制台管理规则
- 使用 `zhixing ask` 理解代码
- 使用 `zhixing skill list` 发现可用技能

## 故障排查

### "zhixing init" 失败

```bash
# 检查 API 配置
cat ~/.zhixing/config.json

# 检查 Git 远程地址
git remote -v

# 检查项目是否已在平台注册
# 访问 Web 控制台 → 项目管理
```

### "zhixing ask" 无结果

```bash
# 检查代码是否已索引
# 访问 Web 控制台 → 项目详情 → 认知层 → 索引状态

# 手动触发索引
# Web 控制台 → 项目详情 → 认知层 → 立即索引
```

### CI 扫描失败

```bash
# 本地先验证
zhixing status

# 检查 API Token 是否有 CI 权限
# Web 控制台 → 设置 → API Token
```

## 下一步

阅读完整 [试点验证指南](./README.md) 进行深入验证。
