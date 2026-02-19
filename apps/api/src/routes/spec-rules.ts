/**
 * Spec 规则路由
 */

import type { FastifyPluginAsync } from 'fastify';
import { db } from '@zhixing/db';
import { specRules, ruleVersions } from '@zhixing/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { ruleChangeWatcher, distributionQueueService } from '@zhixing/shared';

// 验证 Schema
const createRuleSchema = z.object({
  level: z.enum(['company', 'domain', 'project']),
  domainId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  content: z.string().min(1),
  createdBy: z.string().uuid(),
});

const updateRuleSchema = z.object({
  content: z.string().min(1),
  updatedBy: z.string().uuid(),
});

export const specRulesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/specs/rules - 获取规则列表
  fastify.get('/rules', async (request, reply) => {
    const { level, domainId, projectId } = request.query as {
      level?: string;
      domainId?: string;
      projectId?: string;
    };

    let query = db.select().from(specRules);

    // TODO: 添加过滤条件

    const rules = await query.orderBy(desc(specRules.createdAt));

    return {
      data: rules,
      total: rules.length,
    };
  });

  // GET /api/specs/rules/:id - 获取单个规则
  fastify.get<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const { id } = request.params;

    const rule = await db.select().from(specRules).where(eq(specRules.id, id)).limit(1);

    if (!rule.length) {
      reply.status(404);
      return { error: 'Rule not found' };
    }

    return { data: rule[0] };
  });

  // POST /api/specs/rules - 创建规则
  fastify.post('/rules', async (request, reply) => {
    const body = createRuleSchema.parse(request.body);

    // 创建规则
    const [rule] = await db.insert(specRules).values({
      level: body.level,
      domainId: body.domainId ?? null,
      projectId: body.projectId ?? null,
      content: body.content,
      createdBy: body.createdBy,
    }).returning();

    // 创建版本记录
    await db.insert(ruleVersions).values({
      ruleId: rule.id,
      version: 1,
      content: body.content,
      createdBy: body.createdBy,
    });

    // 触发规则变更监听器
    await ruleChangeWatcher.onRuleCreated(rule.id);

    reply.status(201);
    return { data: rule };
  });

  // PUT /api/specs/rules/:id - 更新规则
  fastify.put<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const { id } = request.params;
    const body = updateRuleSchema.parse(request.body);

    // 获取当前规则
    const [currentRule] = await db.select().from(specRules).where(eq(specRules.id, id)).limit(1);

    if (!currentRule) {
      reply.status(404);
      return { error: 'Rule not found' };
    }

    // 更新规则
    const [updatedRule] = await db
      .update(specRules)
      .set({
        content: body.content,
        version: currentRule.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(specRules.id, id))
      .returning();

    // 创建版本记录
    await db.insert(ruleVersions).values({
      ruleId: updatedRule.id,
      version: updatedRule.version,
      content: body.content,
      createdBy: body.updatedBy,
    });

    // 触发规则变更监听器
    await ruleChangeWatcher.onRuleUpdated(updatedRule.id);

    return { data: updatedRule };
  });

  // DELETE /api/specs/rules/:id - 删除规则
  fastify.delete<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const { id } = request.params;

    // 先获取规则信息用于变更监听
    const [ruleToDelete] = await db.select().from(specRules).where(eq(specRules.id, id)).limit(1);

    const [deletedRule] = await db.delete(specRules).where(eq(specRules.id, id)).returning();

    if (!deletedRule) {
      reply.status(404);
      return { error: 'Rule not found' };
    }

    // 触发规则变更监听器
    if (ruleToDelete) {
      await ruleChangeWatcher.onRuleDeleted({
        id: ruleToDelete.id,
        level: ruleToDelete.level,
        domainId: ruleToDelete.domainId ?? undefined,
        projectId: ruleToDelete.projectId ?? undefined,
      });
    }

    return { data: deletedRule };
  });

  // GET /api/specs/rules/:id/history - 获取规则版本历史
  fastify.get<{ Params: { id: string } }>('/rules/:id/history', async (request, reply) => {
    const { id } = request.params;

    const versions = await db
      .select()
      .from(ruleVersions)
      .where(eq(ruleVersions.ruleId, id))
      .orderBy(desc(ruleVersions.version));

    return {
      data: versions,
      total: versions.length,
    };
  });
};
