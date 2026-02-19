# @zhixing/cli

知行 (ZhiXing) 智能研发认知操作平台 CLI 工具。

## 安装

```bash
# 使用 npm
npm install -g @zhixing/cli

# 使用 yarn
yarn global add @zhixing/cli

# 使用 pnpm
pnpm add -g @zhixing/cli
```

## 配置

在使用 CLI 之前，需要配置知行平台 API 地址和认证信息：

```bash
# 创建配置文件
mkdir -p ~/.zhixing
cat > ~/.zhixing/config.json << EOF
{
  "apiBase": "https://api.zhixing.example.com",
  "apiKey": "your-api-key"
}
EOF
```

或者通过环境变量配置：

```bash
export ZHIXING_API_BASE="https://api.zhixing.example.com"
export ZHIXING_API_KEY="your-api-key"
```

## 命令

### zhixing init

初始化当前项目，拉取 Spec 配置并生成 CLAUDE.md：

```bash
zhixing init
```

### zhixing ask

向认知层提问，获取代码上下文理解：

```bash
zhixing ask "这个项目的认证流程是怎么实现的？"
```

### zhixing skill list

列出当前项目可用的 Skill：

```bash
zhixing skill list
```

### zhixing skill add

订阅指定 Skill：

```bash
zhixing skill add <skill-name>
```

### zhixing status

检查本地 CLAUDE.md 与平台版本的一致性：

```bash
zhixing status
```

## 许可证

MIT
