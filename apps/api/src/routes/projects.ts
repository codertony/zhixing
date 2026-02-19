/**
 * 项目管理路由
 */

import type { FastifyPluginAsync } from 'fastify';
import { db } from '@zhixing/db';
import { projects, domains } from '@zhixing/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ruleChangeWatcher } from '@zhixing/shared';

// 验证 Schema
const createProjectSchema = z.object({
  name: z.string().min(1),
  gitlabPath: z.string().min(1),
  domainId: z.string().uuid(),
  subscriptions: z.array(z.string()).default([]),
});

const updateSubscriptionsSchema = z.object({
  subscriptions: z.array(z.string()),
});

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/projects - 获取项目列表
  fastify.get('/projects', async (request, reply) => {
    const projectsList = await db.select().from(projects);

    return {
      data: projectsList,
      total: projectsList.length,
    };
  });

  // GET /api/projects/:id - 获取单个项目
  fastify.get<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = request.params;

    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project) {
      reply.status(404);
      return { error: 'Project not found' };
    }

    return { data: project };
  });

  // POST /api/projects - 创建项目
  fastify.post('/projects', async (request, reply) => {
    const body = createProjectSchema.parse(request.body);

    // 检查领域是否存在
    const [domain] = await db.select().from(domains).where(eq(domains.id, body.domainId)).limit(1);

    if (!domain) {
      reply.status(400);
      return { error: 'Domain not found' };
    }

    const [project] = await db.insert(projects).values({
      name: body.name,
      gitlabPath: body.gitlabPath,
      domainId: body.domainId,
      subscriptions: body.subscriptions,
    }).returning();

    reply.status(201);
    return { data: project };
  });

  // PUT /api/projects/:id/subscriptions - 更新项目订阅
  fastify.put<{ Params: { id: string } }>('/projects/:id/subscriptions', async (request, reply) => {
    const { id } = request.params;
    const body = updateSubscriptionsSchema.parse(request.body);

    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project) {
      reply.status(404);
      return { error: 'Project not found' };
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        subscriptions: body.subscriptions,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    // 触发订阅变更监听器
    await ruleChangeWatcher.onProjectSubscriptionsChanged(id);

    return { data: updatedProject };
  });

  // DELETE /api/projects/:id - 删除项目
  fastify.delete<{ Params: { id: string } }>('/projects/:id', async (request, reply) => {
    const { id } = request.params;

    const [deletedProject] = await db.delete(projects).where(eq(projects.id, id)).returning();

    if (!deletedProject) {
      reply.status(404);
      return { error: 'Project not found' };
    }

    return { data: deletedProject };
  });
};
