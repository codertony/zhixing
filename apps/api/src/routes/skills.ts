/**
 * Skill API 路由
 * 任务 7.1-7.5: Skill 注册、查询、项目订阅、可见性控制
 */

import { FastifyInstance } from 'fastify';
import { db, skills, projectSkills, domains } from '@zhixing/db';
import { eq, and, or, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function skillsRoutes(fastify: FastifyInstance) {
  // 7.2 获取 Skill 列表（支持过滤）
  fastify.get('/', async (request, reply) => {
    const { type, visibility, domainId, projectId } = request.query as {
      type?: string;
      visibility?: string;
      domainId?: string;
      projectId?: string;
    };

    try {
      let query = db.select().from(skills);

      const conditions = [];

      if (type) {
        conditions.push(eq(skills.type, type));
      }

      if (visibility) {
        conditions.push(eq(skills.visibility, visibility));
      }

      if (domainId) {
        conditions.push(eq(skills.domainId, domainId));
      }

      // 如果指定了项目 ID，过滤该项目的可见 Skill
      if (projectId) {
        // TODO: 获取项目的领域订阅，过滤可见的 Skill
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      return results;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch skills' };
    }
  });

  // 7.1 注册 Skill
  fastify.post('/', async (request, reply) => {
    const { type, name, description, content, visibility, domainId } = request.body as {
      type: string;
      name: string;
      description: string;
      content: string;
      visibility: string;
      domainId?: string;
    };

    // 验证必填字段
    if (!type || !name || !description || !content || !visibility) {
      reply.status(400);
      return { error: 'Missing required fields' };
    }

    // 验证类型
    const validTypes = ['mcp_tool', 'prompt_template', 'openspec_template'];
    if (!validTypes.includes(type)) {
      reply.status(400);
      return { error: 'Invalid skill type' };
    }

    // 验证可见性
    const validVisibilities = ['company', 'domain', 'private'];
    if (!validVisibilities.includes(visibility)) {
      reply.status(400);
      return { error: 'Invalid visibility' };
    }

    try {
      // 检查名称是否已存在
      const existing = await db
        .select()
        .from(skills)
        .where(eq(skills.name, name));

      if (existing.length > 0) {
        reply.status(409);
        return { error: 'Skill name already exists' };
      }

      // 7.5 根据可见性验证领域
      if (visibility === 'domain' && !domainId) {
        reply.status(400);
        return { error: 'Domain ID is required for domain-level skills' };
      }

      // 创建 Skill
      const newSkill = await db.insert(skills).values({
        id: uuidv4(),
        type,
        name,
        description,
        content,
        visibility,
        domainId,
        version: 1,
        createdBy: 'current-user', // TODO: 从认证信息获取
      }).returning();

      reply.status(201);
      return newSkill[0];
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to create skill' };
    }
  });

  // 获取单个 Skill
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const results = await db
        .select({
          skill: skills,
          domainName: domains.name,
        })
        .from(skills)
        .leftJoin(domains, eq(skills.domainId, domains.id))
        .where(eq(skills.id, id));

      if (results.length === 0) {
        reply.status(404);
        return { error: 'Skill not found' };
      }

      return {
        ...results[0].skill,
        domainName: results[0].domainName,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch skill' };
    }
  });

  // 更新 Skill
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { description, content, visibility, domainId } = request.body as {
      description?: string;
      content?: string;
      visibility?: string;
      domainId?: string;
    };

    try {
      // 获取现有 Skill
      const existing = await db
        .select()
        .from(skills)
        .where(eq(skills.id, id));

      if (existing.length === 0) {
        reply.status(404);
        return { error: 'Skill not found' };
      }

      const skill = existing[0];

      // 更新字段并增加版本
      const updates: Record<string, unknown> = {
        version: skill.version + 1,
        updatedAt: new Date(),
      };

      if (description !== undefined) updates.description = description;
      if (content !== undefined) updates.content = content;
      if (visibility !== undefined) updates.visibility = visibility;
      if (domainId !== undefined) updates.domainId = domainId;

      const updated = await db
        .update(skills)
        .set(updates)
        .where(eq(skills.id, id))
        .returning();

      return updated[0];
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to update skill' };
    }
  });

  // 删除 Skill
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await db.delete(skills).where(eq(skills.id, id));
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to delete skill' };
    }
  });

  // 7.3 项目订阅 Skill
  fastify.post('/:projectId/skills', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { skillId } = request.body as { skillId: string };

    if (!skillId) {
      reply.status(400);
      return { error: 'Skill ID is required' };
    }

    try {
      // 检查 Skill 是否存在
      const skillResults = await db
        .select()
        .from(skills)
        .where(eq(skills.id, skillId));

      if (skillResults.length === 0) {
        reply.status(404);
        return { error: 'Skill not found' };
      }

      const skill = skillResults[0];

      // 7.5 检查可见性
      // TODO: 检查项目是否有权限订阅该 Skill（领域可见性）

      // 检查是否已订阅
      const existing = await db
        .select()
        .from(projectSkills)
        .where(
          and(
            eq(projectSkills.projectId, projectId),
            eq(projectSkills.skillId, skillId)
          )
        );

      if (existing.length > 0) {
        reply.status(409);
        return { error: 'Skill already subscribed' };
      }

      // 创建订阅
      await db.insert(projectSkills).values({
        id: uuidv4(),
        projectId,
        skillId,
      });

      reply.status(201);
      return {
        success: true,
        message: `Skill "${skill.name}" subscribed successfully`,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to subscribe skill' };
    }
  });

  // 获取项目的 Skill 列表
  fastify.get('/:projectId/skills', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const results = await db
        .select({
          subscription: projectSkills,
          skill: skills,
        })
        .from(projectSkills)
        .leftJoin(skills, eq(projectSkills.skillId, skills.id))
        .where(eq(projectSkills.projectId, projectId));

      return results.map((r) => ({
        ...r.skill,
        subscribedAt: r.subscription.createdAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch project skills' };
    }
  });

  // 取消订阅 Skill
  fastify.delete('/:projectId/skills/:skillId', async (request, reply) => {
    const { projectId, skillId } = request.params as { projectId: string; skillId: string };

    try {
      await db
        .delete(projectSkills)
        .where(
          and(
            eq(projectSkills.projectId, projectId),
            eq(projectSkills.skillId, skillId)
          )
        );

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to unsubscribe skill' };
    }
  });
}
