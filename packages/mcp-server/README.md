# @zhixing/mcp-server

知行平台 MCP (Model Context Protocol) 服务

## 简介

基于 MCP SDK 构建的智能体服务，为 AI 助手提供代码搜索、Spec 规则获取等工具。

## 技术栈

- **协议**: MCP (Model Context Protocol)
- **传输**: StdioServerTransport
- **向量数据库**: Qdrant

## 提供的工具

### search_code

语义搜索代码库中的相关内容。

```json
{
  "name": "search_code",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "搜索查询" }
    },
    "required": ["query"]
  }
}
```

### get_spec_rules

获取项目的 Spec 规则。

```json
{
  "name": "get_spec_rules",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": { "type": "string", "description": "项目ID" },
      "level": { "type": "string", "description": "规则层级" }
    },
    "required": ["projectId"]
  }
}
```

### get_file_history

获取文件的修改历史。

```json
{
  "name": "get_file_history",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": { "type": "string", "description": "文件路径" }
    },
    "required": ["filePath"]
  }
}
```

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## 配置方式

在 Claude Code 中添加 MCP 服务器配置：

```json
{
  "mcpServers": {
    "zhixing": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```
