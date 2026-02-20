# @zhixing/gitlab-client

知行平台 GitLab API 客户端

## 简介

封装 GitLab API 调用，支持项目信息获取、文件读取和 MR 创建等功能。

## 技术栈

- **HTTP 客户端**: Native fetch
- **类型**: TypeScript

## 主要功能

- 获取项目信息
- 读取仓库文件内容
- 创建/更新文件
- 创建 Merge Request

## 使用方式

```typescript
import { GitLabClient } from '@zhixing/gitlab-client'

const client = new GitLabClient({
  url: 'https://gitlab.com',
  token: 'your-token'
})

// 获取项目
const project = await client.getProject('group/project')

// 读取文件
const content = await client.getFileContent('group/project', 'path/to/file', 'main')

// 创建文件
await client.createFile(
  'group/project',
  'path/to/file',
  'content',
  'commit message',
  'main'
)
```

## 开发命令

```bash
# 构建
pnpm build

# 测试
pnpm test
```
