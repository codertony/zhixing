#!/usr/bin/env node
/**
 * MCP Server 实现
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// 工具定义
const TOOLS = [
  {
    name: 'search_code',
    description: '搜索代码库中的相关内容',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询',
        },
        projectId: {
          type: 'string',
          description: '项目ID',
        },
      },
      required: ['query', 'projectId'],
    },
  },
  {
    name: 'get_spec_rules',
    description: '获取项目的 Spec 规则',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: '项目ID',
        },
      },
      required: ['projectId'],
    },
  },
]

interface ToolArgs {
  query?: string
  projectId?: string
}

async function main() {
  const server = new Server(
    {
      name: 'zhixing-mcp-server',
      version: '0.0.1',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  // 列出可用工具
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS }
  })

  // 处理工具调用
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const toolArgs = (args as ToolArgs) || {}

    switch (name) {
      case 'search_code':
        return {
          content: [
            {
              type: 'text',
              text: `搜索代码: ${toolArgs.query || ''} (项目: ${toolArgs.projectId || ''})`,
            },
          ],
        }
      case 'get_spec_rules':
        return {
          content: [
            {
              type: 'text',
              text: `获取项目 ${toolArgs.projectId || ''} 的 Spec 规则`,
            },
          ],
        }
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('ZhiXing MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
