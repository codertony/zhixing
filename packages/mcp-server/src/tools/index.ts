/**
 * MCP 工具定义
 * 注册认知层 MCP Server 的所有工具
 */

import { createGitLabClient } from '@zhixing/gitlab-client';
import type { Tool } from './types.js';
import { createCodeIndexer, createDocumentIndexer, createRetrievalService } from '../services/index.js';
import { defaultScheduler } from '../scheduler/index.js';

/**
 * 注册所有工具
 */
export function registerTools(): Tool[] {
  const gitlabClient = createGitLabClient();
  const retrievalService = createRetrievalService({ gitlabClient });

  return [
    // 5.7 语义检索工具
    createSearchCodeTool(retrievalService),
    // 5.8 Git 历史分析工具
    createAnalyzeGitHistoryTool(retrievalService),
    // 5.9 索引管理工具
    createIndexProjectTool(),
    // 5.9 文档检索工具
    createSearchDocsTool(retrievalService),
  ];
}

/**
 * 代码语义检索工具
 */
function createSearchCodeTool(retrievalService: ReturnType<typeof createRetrievalService>): Tool {
  return {
    name: 'search_code',
    description: 'Search for code snippets by natural language query. Returns relevant code blocks with file paths and line numbers.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you are looking for',
        },
        projectId: {
          type: 'string',
          description: 'Project ID to search within',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
          minimum: 1,
          maximum: 50,
        },
        fileType: {
          type: 'string',
          enum: ['code', 'document', 'all'],
          description: 'Type of files to search (default: all)',
        },
      },
      required: ['query', 'projectId'],
    },
    handler: async (args: { query: string; projectId: string; limit?: number; fileType?: 'code' | 'document' | 'all' }) => {
      const result = await retrievalService.search({
        query: args.query,
        projectId: args.projectId,
        limit: args.limit,
        fileType: args.fileType,
      });

      return {
        success: true,
        query: result.query,
        totalResults: result.totalResults,
        hasHighConfidence: result.hasHighConfidence,
        results: result.results.map(r => ({
          name: r.name,
          type: r.type,
          filePath: r.filePath,
          startLine: r.startLine,
          endLine: r.endLine,
          language: r.language,
          signature: r.signature,
          content: r.content.substring(0, 500) + (r.content.length > 500 ? '...' : ''),
          score: r.score,
        })),
      };
    },
  };
}

/**
 * Git 历史分析工具
 */
function createAnalyzeGitHistoryTool(retrievalService: ReturnType<typeof createRetrievalService>): Tool {
  return {
    name: 'analyze_git_history',
    description: 'Analyze Git commit history for a file or project. Returns commit list with summaries and identifies high-impact changes.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID',
        },
        filePath: {
          type: 'string',
          description: 'Optional: specific file path to analyze',
        },
        since: {
          type: 'string',
          description: 'Optional: start date in ISO format (default: 30 days ago)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of commits (default: 20)',
        },
      },
      required: ['projectId'],
    },
    handler: async (args: { projectId: string; filePath?: string; since?: string; limit?: number }) => {
      const result = await retrievalService.analyzeGitHistory({
        projectId: args.projectId,
        filePath: args.filePath,
        since: args.since,
        limit: args.limit,
      });

      return {
        success: true,
        summary: result.summary,
        recentChanges: result.recentChanges,
        commits: result.commits.map(c => ({
          sha: c.sha,
          message: c.message,
          author: c.author,
          date: c.date,
          isHighImpact: c.isHighImpact,
        })),
      };
    },
  };
}

/**
 * 项目索引工具
 */
function createIndexProjectTool(): Tool {
  return {
    name: 'index_project',
    description: 'Trigger code or document indexing for a project. Supports full index, incremental index, and docs index.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID to index',
        },
        type: {
          type: 'string',
          enum: ['full', 'incremental', 'docs'],
          description: 'Type of index to run',
        },
      },
      required: ['projectId', 'type'],
    },
    handler: async (args: { projectId: string; type: 'full' | 'incremental' | 'docs' }) => {
      let result;

      switch (args.type) {
        case 'full':
          result = await defaultScheduler.triggerFullIndex(args.projectId);
          break;
        case 'incremental':
          result = await defaultScheduler.triggerIncrementalIndex(args.projectId);
          break;
        case 'docs':
          result = await defaultScheduler.triggerDocsIndex(args.projectId);
          break;
        default:
          throw new Error(`Unknown index type: ${args.type}`);
      }

      return {
        success: true,
        projectId: args.projectId,
        type: args.type,
        filesIndexed: result.filesIndexed,
        chunksIndexed: 'chunksIndexed' in result ? result.chunksIndexed : 0,
        duration: result.duration,
        errors: result.errors,
      };
    },
  };
}

/**
 * 文档检索工具
 */
function createSearchDocsTool(retrievalService: ReturnType<typeof createRetrievalService>): Tool {
  return {
    name: 'search_docs',
    description: 'Search for documentation by natural language query. Searches Markdown and OpenAPI documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query',
        },
        projectId: {
          type: 'string',
          description: 'Project ID to search within',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query', 'projectId'],
    },
    handler: async (args: { query: string; projectId: string; limit?: number }) => {
      const result = await retrievalService.search({
        query: args.query,
        projectId: args.projectId,
        limit: args.limit,
        fileType: 'document',
      });

      return {
        success: true,
        query: result.query,
        totalResults: result.totalResults,
        results: result.results.map(r => ({
          filePath: r.filePath,
          title: r.name,
          content: r.content.substring(0, 800) + (r.content.length > 800 ? '...' : ''),
          score: r.score,
        })),
      };
    },
  };
}

export * from './types.js';
