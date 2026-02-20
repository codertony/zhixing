# @zhixing/cli

知行平台 CLI 智能体工具

## 简介

类似于 Claude Code 的终端智能体工具，支持 Spec 规则管理、代码索引和 MCP 工具调用。

## 功能

- Spec 规则查看和应用
- 代码库索引和搜索
- MCP 工具调用
- 项目初始化

## 技术栈

- **运行时**: Node.js 20
- **CLI 框架**: Commander.js
- **交互**: Inquirer
- **样式**: Chalk

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 本地安装测试
npm link
```

## 使用方式

```bash
# 查看帮助
zhixing --help

# 初始化项目
zhixing init

# 查看 Spec 规则
zhixing rules list

# 索引代码库
zhixing index
```
