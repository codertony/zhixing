/**
 * 合规追踪 API 路由
 * 任务 9.1-9.5: 合规上报、Override 事件记录、采纳率统计
 */

import { FastifyInstance } from 'fastify';
import { db, complianceReports, specOverrides, highFrequencyOverrides, projects, specRules } from '@zhixing/db';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { verifyProjectToken } from '../middleware/auth.js';

export async function complianceRoutes(fastify: FastifyInstance) {
  // 9.1 合规上报 REST API
  fastify.post('/reports', async (request, reply) => {
    const { projectToken } = request.headers;

    // 验证项目 Token
    const projectId = await verifyProjectToken(projectToken as string);
    if (!projectId) {
      reply.status(401);
      return { error: 'Invalid project token' };
    }

    const { rules, overrideEvents, scanTime } = request.body as {
      rules: string[];
      overrideEvents: Array<{ ruleId: string; reason: string }>;
      scanTime: string;
    };

    try {
      // 保存合规报告
      await db.insert(complianceReports).values({
        projectId,
        scanTime: new Date(scanTime),
        rules,
        overrideEvents,
      });

      // 9.4 记录 Override 事件
      for (const event of overrideEvents) {
        const commitSha = request.body?.commitSha || 'unknown';
        await db.insert(specOverrides).values({
          ruleId: event.ruleId,
          projectId,
          reason: event.reason,
          operatorId: 'system', // CI 扫描时无法获取操作人
          commitSha,
        });
      }

      // 检查高频 Override
      await checkHighFrequencyOverrides();

      return { success: true, message: 'Report received' };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to process report' };
    }
  });

  // 9.2 Override 事件查询 API
  fastify.get('/overrides', async (request, reply) => {
    const { ruleId, projectId, startDate, endDate } = request.query as {
      ruleId?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    };

    try {
      let query = db
        .select({
          override: specOverrides,
          projectName: projects.name,
          ruleContent: specRules.content,
        })
        .from(specOverrides)
        .leftJoin(projects, eq(specOverrides.projectId, projects.id))
        .leftJoin(specRules, eq(specOverrides.ruleId, specRules.id))
        .orderBy(desc(specOverrides.createdAt));

      // 应用过滤条件
      const conditions = [];
      if (ruleId) {
        conditions.push(eq(specOverrides.ruleId, ruleId));
      }
      if (projectId) {
        conditions.push(eq(specOverrides.projectId, projectId));
      }
      if (startDate) {
        conditions.push(gte(specOverrides.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(specOverrides.createdAt, new Date(endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;

      return results.map((r) => ({
        id: r.override.id,
        ruleId: r.override.ruleId,
        ruleContent: r.ruleContent?.substring(0, 200) || 'Unknown',
        projectId: r.override.projectId,
        projectName: r.projectName || 'Unknown',
        reason: r.override.reason,
        operatorId: r.override.operatorId,
        commitSha: r.override.commitSha,
        createdAt: r.override.createdAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch overrides' };
    }
  });

  // 9.5 规则采纳率统计 API
  fastify.get('/adoption-rate', async (request, reply) => {
    try {
      // 获取所有公司级规则
      const rules = await db
        .select({
          id: specRules.id,
          content: specRules.content,
        })
        .from(specRules)
        .where(eq(specRules.level, 'company'));

      // 获取所有项目
      const allProjects = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects);

      const totalProjects = allProjects.length;

      // 计算每条规则的采纳率
      const adoptionRates = await Promise.all(
        rules.map(async (rule) => {
          // 获取该规则的 Override 项目数（30天内）
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const overrideResult = await db
            .select({ count: count() })
            .from(specOverrides)
            .where(
              and(
                eq(specOverrides.ruleId, rule.id),
                gte(specOverrides.createdAt, thirtyDaysAgo)
              )
            );

          const overrideCount = overrideResult[0]?.count || 0;
          const adoptionCount = totalProjects - overrideCount;
          const adoptionRate = totalProjects > 0
            ? (adoptionCount / totalProjects) * 100
            : 0;

          // 检查是否高频 Override
          const isHighFrequency = overrideCount >= 5;

          return {
            ruleId: rule.id,
            ruleContent: rule.content.substring(0, 100),
            totalProjects,
            adoptionCount,
            overrideCount,
            adoptionRate: Number(adoptionRate.toFixed(2)),
            isHighFrequency,
            timeWindow: '30d',
          };
        })
      );

      return {
        summary: {
          totalRules: rules.length,
          totalProjects,
          highFrequencyRules: adoptionRates.filter((r) => r.isHighFrequency).length,
        },
        details: adoptionRates,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to calculate adoption rate' };
    }
  });

  // 获取高频 Override 规则列表
  fastify.get('/high-frequency-overrides', async (request, reply) => {
    try {
      const results = await db
        .select({
          rule: specRules,
          highFreq: highFrequencyOverrides,
        })
        .from(highFrequencyOverrides)
        .leftJoin(specRules, eq(highFrequencyOverrides.ruleId, specRules.id))
        .orderBy(desc(highFrequencyOverrides.overrideCount));

      return results.map((r) => ({
        ruleId: r.rule.id,
        ruleContent: r.rule?.content?.substring(0, 100),
        overrideCount: r.highFreq.overrideCount,
        timeWindowStart: r.highFreq.timeWindowStart,
        timeWindowEnd: r.highFreq.timeWindowEnd,
        markedAt: r.highFreq.markedAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch high frequency overrides' };
    }
  });
}

/**
 * 检查高频 Override 规则
 */
async function checkHighFrequencyOverrides(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 统计每个规则的 Override 次数
  const overrideCounts = await db
    .select({
      ruleId: specOverrides.ruleId,
      count: count(),
    })
    .from(specOverrides)
    .where(gte(specOverrides.createdAt, thirtyDaysAgo))
    .groupBy(specOverrides.ruleId);

  // 标记高频 Override 规则（30天内 5+ 项目 override）
  for (const { ruleId, count } of overrideCounts) {
    if (count >= 5) {
      // 检查是否已标记
      const existing = await db
        .select()
        .from(highFrequencyOverrides)
        .where(eq(highFrequencyOverrides.ruleId, ruleId));

      if (existing.length === 0) {
        await db.insert(highFrequencyOverrides).values({
          ruleId,
          overrideCount: count,
          timeWindowStart: thirtyDaysAgo,
          timeWindowEnd: new Date(),
        });
      } else {
        // 更新计数
        await db
          .update(highFrequencyOverrides)
          .set({ overrideCount: count })
          .where(eq(highFrequencyOverrides.ruleId, ruleId));
      }
    }
  }
}
