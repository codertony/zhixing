# @zhixing/web

知行平台 Web 前端应用

## 简介

基于 React 18 + TypeScript 构建的现代化前端应用，提供 Spec 规则管理、项目管理和分发状态查看等功能。

## 技术栈

- **框架**: React 18
- **路由**: React Router 6
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建工具**: Vite
- **测试**: Vitest

## 项目结构

```
src/
├── main.tsx           # 应用入口
├── App.tsx            # 根组件
├── pages/             # 页面组件
│   ├── RulesPage.tsx  # Spec 规则管理页
│   ├── ProjectsPage.tsx # 项目管理页
│   └── DistributionPage.tsx # 分发状态页
└── styles/            # 样式文件
```

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 预览
pnpm preview

# 测试
pnpm test

# 代码检查
pnpm lint
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_URL` | API 服务地址 | http://localhost:3001 |
