/**
 * 知行认知层 MCP Server
 * 提供代码语义检索和知识库查询能力
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { registerTools } from './tools/index.js';

const SERVER_NAME = process.env.MCP_SERVER_NAME ?? 'zhixing-cognitive';
const SERVER_VERSION = process.env.MCP_SERVER_VERSION ?? '0.1.0';

/**
 * 创建 MCP Server 实例
 */
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 注册工具列表处理器
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = registerTools();
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * 注册工具调用处理器
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tools = registerTools();
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  try {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
  }
});

/**
 * 启动服务器
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`知行认知层 MCP Server 已启动 (${SERVER_NAME} v${SERVER_VERSION})`);
}

main().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
