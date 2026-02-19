/**
 * MCP 工具定义
 */

import type { Tool } from './types.js';

/**
 * 注册所有工具
 * TODO: 实现具体工具（代码搜索、文件信息、Git历史分析）
 */
export function registerTools(): Tool[] {
  return [
    // TODO: 添加具体工具实现
    // searchCodeTool,
    // getFileInfoTool,
    // analyzeGitHistoryTool,
  ];
}

export * from './types.js';
