/**
 * 认知层 MCP Server HTTP API
 * 提供 RESTful 接口供 Web UI 调用
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createGitLabClient } from '@zhixing/gitlab-client';
import { db, projects } from '@zhixing/db';
import { eq } from 'drizzle-orm';
import { logger } from '@zhixing/shared';
import { createCodeIndexer, createDocumentIndexer, createRetrievalService } from '../services/index.js';
import { defaultScheduler } from '../scheduler/index.js';

const PORT = process.env.MCP_API_PORT ?? 3002;

/**
 * 创建 Fastify 实例
 */
export function createApiServer() {
  const app = Fastify({
    logger: true,
  });

  // 注册 CORS
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  const gitlabClient = createGitLabClient();
  const retrievalService = createRetrievalService({ gitlabClient });

  // 健康检查
  app.get('/health', async () => {
    const codeIndexer = createCodeIndexer({ gitlabClient });
    const health = await codeIndexer.healthCheck();
    return {
      status: health.vectorStore ? 'healthy' : 'unhealthy',
      vectorStore: health.vectorStore,
    };
  });

  // 语义检索 API
  app.post('/api/search', async (request, reply) => {
    const { query, projectId, limit, fileType, scoreThreshold } = request.body as {
      query: string;
      projectId: string;
      limit?: number;
      fileType?: 'code' | 'document' | 'all';
      scoreThreshold?: number;
    };

    if (!query || !projectId) {
      reply.status(400);
      return { error: 'Missing required fields: query, projectId' };
    }

    try {
      const result = await retrievalService.search({
        query,
        projectId,
        limit,
        fileType,
        scoreThreshold,
      });

      return result;
    } catch (error) {
      logger.error('Search API error:', error);
      reply.status(500);
      return { error: 'Search failed' };
    }
  });

  // Git 历史分析 API
  app.post('/api/git-history', async (request, reply) => {
    const { projectId, filePath, since, limit } = request.body as {
      projectId: string;
      filePath?: string;
      since?: string;
      limit?: number;
    };

    if (!projectId) {
      reply.status(400);
      return { error: 'Missing required field: projectId' };
    }

    try {
      const result = await retrievalService.analyzeGitHistory({
        projectId,
        filePath,
        since,
        limit,
      });

      return result;
    } catch (error) {
      logger.error('Git history API error:', error);
      reply.status(500);
      return { error: 'Git history analysis failed' };
    }
  });

  // 触发全量索引 API
  app.post('/api/index/full', async (request, reply) => {
    const { projectId } = request.body as { projectId: string };

    if (!projectId) {
      reply.status(400);
      return { error: 'Missing required field: projectId' };
    }

    try {
      const result = await defaultScheduler.triggerFullIndex(projectId);
      return result;
    } catch (error) {
      logger.error('Full index API error:', error);
      reply.status(500);
      return { error: 'Full index failed' };
    }
  });

  // 触发增量索引 API
  app.post('/api/index/incremental', async (request, reply) => {
    const { projectId } = request.body as { projectId: string };

    if (!projectId) {
      reply.status(400);
      return { error: 'Missing required field: projectId' };
    }

    try {
      const result = await defaultScheduler.triggerIncrementalIndex(projectId);
      return result;
    } catch (error) {
      logger.error('Incremental index API error:', error);
      reply.status(500);
      return { error: 'Incremental index failed' };
    }
  });

  // 触发文档索引 API
  app.post('/api/index/docs', async (request, reply) => {
    const { projectId } = request.body as { projectId: string };

    if (!projectId) {
      reply.status(400);
      return { error: 'Missing required field: projectId' };
    }

    try {
      const result = await defaultScheduler.triggerDocsIndex(projectId);
      return result;
    } catch (error) {
      logger.error('Docs index API error:', error);
      reply.status(500);
      return { error: 'Docs index failed' };
    }
  });

  // 获取索引统计 API
  app.get('/api/stats', async (request, reply) => {
    try {
      const indexer = createCodeIndexer({ gitlabClient });
      const stats = await indexer.getStats();
      return stats;
    } catch (error) {
      logger.error('Stats API error:', error);
      reply.status(500);
      return { error: 'Failed to get stats' };
    }
  });

  return app;
}

/**
 * 启动 API 服务器
 */
export async function startApiServer(): Promise<void> {
  const app = createApiServer();

  try {
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
    logger.info(`Cognitive MCP API server started on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start API server:', error);
    throw error;
  }
}
