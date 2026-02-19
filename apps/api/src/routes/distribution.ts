/**
 * 分发状态路由
 */

import type { FastifyPluginAsync } from 'fastify';
import { db } from '@zhixing/db';
import { distributionLogs, projects } from '@zhixing/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(['pending', 'success', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const distributionRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/distribution/logs - 获取分发记录列表
  fastify.get('/logs', async (request, reply) => {
    const query = querySchema.parse(request.query);

    let queryBuilder = db
      .select({
        id: distributionLogs.id,
        projectId: distributionLogs.projectId,
        projectName: projects.name,
        projectGitlabPath: projects.gitlabPath,
        triggerReason: distributionLogs.triggerReason,
        status: distributionLogs.status,
        gitlabCommitSha: distributionLogs.gitlabCommitSha,
        errorMessage: distributionLogs.errorMessage,
        createdAt: distributionLogs.createdAt,
      })
      .from(distributionLogs)
      .leftJoin(projects, eq(distributionLogs.projectId, projects.id));

    // 应用过滤条件
    if (query.projectId) {
      queryBuilder = queryBuilder.where(eq(distributionLogs.projectId, query.projectId)) as any;
    }

    // 排序和限制
    const logs = await queryBuilder
      .orderBy(desc(distributionLogs.createdAt))
      .limit(query.limit);

    return {
      data: logs,
      total: logs.length,
    };
  });

  // GET /api/distribution/logs/:id - 获取单个分发记录
  fastify.get<{ Params: { id: string } }>('/logs/:id', async (request, reply) => {
    const { id } = request.params;

    const [log] = await db
      .select({
        id: distributionLogs.id,
        projectId: distributionLogs.projectId,
        projectName: projects.name,
        projectGitlabPath: projects.gitlabPath,
        triggerReason: distributionLogs.triggerReason,
        status: distributionLogs.status,
        gitlabCommitSha: distributionLogs.gitlabCommitSha,
        errorMessage: distributionLogs.errorMessage,
        createdAt: distributionLogs.createdAt,
      })
      .from(distributionLogs)
      .leftJoin(projects, eq(distributionLogs.projectId, projects.id))
      .where(eq(distributionLogs.id, id))
      .limit(1);

    if (!log) {
      reply.status(404);
      return { error: 'Distribution log not found' };
    }

    return { data: log };
  });

  // GET /api/distribution/projects/:projectId/status - 获取项目最近的分发状态
  fastify.get<{ Params: { projectId: string } }>('/projects/:projectId/status', async (request, reply) => {
    const { projectId } = request.params;

    // 验证项目存在
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      reply.status(404);
      return { error: 'Project not found' };
    }

    // 获取最近的分发记录
    const recentLogs = await db
      .select()
      .from(distributionLogs)
      .where(eq(distributionLogs.projectId, projectId))
      .orderBy(desc(distributionLogs.createdAt))
      .limit(10);

    // 统计信息
    const stats = {
      total: recentLogs.length,
      success: recentLogs.filter(l => l.status === 'success').length,
      failed: recentLogs.filter(l => l.status === 'failed').length,
      pending: recentLogs.filter(l => l.status === 'pending').length,
    };

    // 最近一次成功分发
    const lastSuccess = recentLogs.find(l => l.status === 'success');

    return {
      data: {
        project: {
          id: project.id,
          name: project.name,
          gitlabPath: project.gitlabPath,
        },
        recentDistributions: recentLogs,
        stats,
        lastSuccessfulDistribution: lastSuccess ? {
          id: lastSuccess.id,
          commitSha: lastSuccess.gitlabCommitSha,
          triggeredAt: lastSuccess.createdAt,
          triggerReason: lastSuccess.triggerReason,
        } : null,
      },
    };
  });

  // GET /api/distribution/stats - 获取分发统计信息
  fastify.get('/stats', async (request, reply) => {
    // 获取所有分发记录
    const allLogs = await db
      .select()
      .from(distributionLogs)
      .orderBy(desc(distributionLogs.createdAt));

    // 总体统计
    const totalStats = {
      total: allLogs.length,
      success: allLogs.filter(l => l.status === 'success').length,
      failed: allLogs.filter(l => l.status === 'failed').length,
      pending: allLogs.filter(l => l.status === 'pending').length,
    };

    // 按项目统计
    const projectStats = new Map<string, {
      projectId: string;
      total: number;
      success: number;
      failed: number;
      pending: number;
    }>();

    for (const log of allLogs) {
      const existing = projectStats.get(log.projectId) || {
        projectId: log.projectId,
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
      };

      existing.total++;
      if (log.status === 'success') existing.success++;
      else if (log.status === 'failed') existing.failed++;
      else if (log.status === 'pending') existing.pending++;

      projectStats.set(log.projectId, existing);
    }

    return {
      data: {
        total: totalStats,
        byProject: Array.from(projectStats.values()),
      },
    };
  });
};
