/**
 * 知行平台 API 服务入口
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { specRulesRoutes } from './routes/spec-rules';
import { projectsRoutes } from './routes/projects';
import { healthRoutes } from './routes/health';
import { distributionRoutes } from './routes/distribution';
import { complianceRoutes } from './routes/compliance';
import { skillsRoutes } from './routes/skills';
import { distributionQueueService } from '@zhixing/shared';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // 注册插件
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: true,
  });

  // 注册路由
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(specRulesRoutes, { prefix: '/api/specs' });
  await fastify.register(projectsRoutes, { prefix: '/api' });
  await fastify.register(distributionRoutes, { prefix: '/api/distribution' });
  await fastify.register(complianceRoutes, { prefix: '/api/compliance' });
  await fastify.register(skillsRoutes, { prefix: '/api/skills' });

  // 全局错误处理
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const message = error.message ?? 'Internal Server Error';

    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
      },
    });
  });

  // 启动服务
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 知行平台 API 服务已启动: http://${HOST}:${PORT}`);

    // 启动分发队列服务
    distributionQueueService.start();
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }

  return fastify;
}

// 启动应用
start();
