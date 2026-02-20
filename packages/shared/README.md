# @zhixing/shared

知行平台共享工具包

## 简介

提供跨应用共享的工具函数、类型定义和通用类。

## 项目结构

```
src/
├── index.ts           # 统一导出
├── errors.ts          # 错误类定义
└── types.ts           # 共享类型
```

## 主要导出

### 工具函数

- `generateId()` - 生成 UUID
- `sleep(ms)` - 延迟函数

### 类

- `OpenAIEmbeddings` - OpenAI 向量嵌入客户端

### 错误类

- `AppError` - 应用基础错误
- `ValidationError` - 验证错误
- `NotFoundError` - 资源不存在错误

## 使用方式

```typescript
import { generateId, OpenAIEmbeddings, AppError } from '@zhixing/shared'

// 生成 ID
const id = generateId()

// 向量嵌入
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small'
})
const vector = await embeddings.embedQuery('text')

// 错误处理
throw new AppError('Something went wrong', 500)
```

## 开发命令

```bash
# 构建
pnpm build

# 测试
pnpm test
```
