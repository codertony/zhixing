/**
 * MCP 工具类型定义
 */

import type { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';

/**
 * 工具处理器函数
 */
export type ToolHandler<T = unknown> = (args: T) => Promise<unknown>;

/**
 * 工具定义
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: MCPTool['inputSchema'];
  handler: ToolHandler;
}

/**
 * 代码搜索参数
 */
export interface SearchCodeArgs {
  query: string;
  projectId: string;
  limit?: number;
  fileType?: 'code' | 'document' | 'all';
}

/**
 * 文件信息参数
 */
export interface GetFileInfoArgs {
  projectId: string;
  filePath: string;
  ref?: string;
}

/**
 * Git 历史分析参数
 */
export interface AnalyzeGitHistoryArgs {
  projectId: string;
  filePath?: string;
  since?: string;
  limit?: number;
}
