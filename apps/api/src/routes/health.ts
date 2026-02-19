/**
 * 健康检查路由
 */

import type { FastifyPluginAsync } from 'fastify';
import { healthCheck } from '@zhixing/db';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const dbHealth = await healthCheck();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
      },
    };
  });

  fastify.get('/ready', async (request, reply) => {
    const dbHealth = await healthCheck();

    if (!dbHealth) {
      reply.status(503);
      return { status: 'not ready', reason: 'database unavailable' };
    }

    return { status: 'ready' };
  });

  fastify.get('/live', async (request, reply) => {
    return { status: 'alive' };
  });
};
