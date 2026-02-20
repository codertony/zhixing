#!/usr/bin/env node
/**
 * 知行平台 MCP Server
 * 提供代码语义问答、Spec 规则查询等能力
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { indexerService } from './services/indexer.js'

// 工具定义
const TOOLS = [
  {
    name: 'search_code',
    description: '搜索代码库中的相关内容，返回最匹配的代码片段',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询（自然语言描述）',
        },
        projectId: {
          type: 'string',
          description: '项目ID（可选，不填则搜索所有订阅的项目）',
        },
        topK: {
          type: 'number',
          description: '返回结果数量（默认5）',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_spec_rules',
    description: '获取项目的 Spec 规则（公司级 + 领域级 + 项目级合并）',
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
  {
    name: 'get_file_history',
    description: '获取文件的 Git 变更历史',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: '项目ID',
        },
        filePath: {
          type: 'string',
          description: '文件路径',
        },
      },
      required: ['projectId', 'filePath'],
    },
  },
]

interface SearchCodeArgs {
  query: string
  projectId?: string
  topK?: number
}

interface GetSpecRulesArgs {
  projectId: string
}

interface GetFileHistoryArgs {
  projectId: string
  filePath: string
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

    try {
      switch (name) {
        case 'search_code': {
          const { query, projectId, topK = 5 } = (args as unknown as SearchCodeArgs) || {}

          if (!query) {
            return {
              content: [
                { type: 'text', text: '错误: 请提供搜索查询' },
              ],
            }
          }

          // 调用搜索服务
          const results = await indexerService.search({
            query,
            projectId,
            topK,
          })

          if (results.length === 0) {
            return {
              content: [
                { type: 'text', text: '未找到匹配的代码片段。请尝试提供更具体的描述。' },
              ],
            }
          }

          const formatted = results
            .map(
              (r, i) =>
                `[${i + 1}] ${r.filePath}:${r.startLine}-${r.endLine}\n匹配度: ${(
                  (r.score || 0) * 100
                ).toFixed(1)}%\n\n${r.content}\n`
            )
            .join('\n---\n')

          return {
            content: [
              {
                type: 'text',
                text: `搜索结果（${results.length}个）:\n\n${formatted}`,
              },
            ],
          }
        }

        case 'get_spec_rules': {
          const { projectId } = (args as unknown as GetSpecRulesArgs) || {}

          if (!projectId) {
            return {
              content: [
                { type: 'text', text: '错误: 请提供项目ID' },
              ],
            }
          }

          // TODO: 调用 API 获取 Spec 规则
          return {
            content: [
              {
                type: 'text',
                text: `项目 ${projectId} 的 Spec 规则:\n\n（功能开发中）`,
              },
            ],
          }
        }

        case 'get_file_history': {
          const { projectId, filePath } = (args as unknown as GetFileHistoryArgs) || {}

          if (!projectId || !filePath) {
            return {
              content: [
                { type: 'text', text: '错误: 请提供项目ID和文件路径' },
              ],
            }
          }

          // TODO: 调用 GitLab API 获取文件历史
          return {
            content: [
              {
                type: 'text',
                text: `文件 ${filePath} 的变更历史:\n\n（功能开发中）`,
              },
            ],
          }
        }

        default:
          throw new Error(`未知工具: ${name}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return {
        content: [
          { type: 'text', text: `执行出错: ${errorMessage}` },
        ],
        isError: true,
      }
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
