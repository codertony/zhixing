/**
 * 知行认知层 MCP Server
 * 提供代码语义检索和知识库查询能力
 * 任务 5.9: 将认知层能力封装为 MCP Server
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
import { startApiServer, createApiServer } from './api/index.js';
import { defaultScheduler } from './scheduler/index.js';
import { createCodeIndexer, createDocumentIndexer } from './services/index.js';
import { createGitLabClient } from '@zhixing/gitlab-client';
import { logger } from '@zhixing/shared';

const SERVER_NAME = process.env.MCP_SERVER_NAME ?? 'zhixing-cognitive';
const SERVER_VERSION = process.env.MCP_SERVER_VERSION ?? '0.1.0';
const ENABLE_HTTP_API = process.env.ENABLE_HTTP_API === 'true';

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
 * 初始化向量存储
 */
async function initializeServices(): Promise<void> {
  logger.info('Initializing cognitive layer services...');

  const gitlabClient = createGitLabClient();
  const codeIndexer = createCodeIndexer({ gitlabClient });

  // 初始化 Qdrant 集合
  await codeIndexer.initialize();

  logger.info('Services initialized successfully');
}

/**
 * 启动 MCP Server (stdio 模式)
 */
async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`知行认知层 MCP Server 已启动 (${SERVER_NAME} v${SERVER_VERSION})`);
}

/**
 * 主函数
 */
async function main() {
  // 初始化服务
  await initializeServices();

  // 启动调度器
  defaultScheduler.start();

  // 同时启动 HTTP API 和 MCP Server (如果启用)
  if (ENABLE_HTTP_API) {
    // 在后台启动 HTTP API
    startApiServer().catch((error) => {
      logger.error('HTTP API server failed to start:', error);
    });
  }

  // 启动 MCP Server (stdio 模式)
  await startMcpServer();
}

main().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
