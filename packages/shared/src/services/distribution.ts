/**
 * Spec 分发服务
 */

import { GitLabClient, createGitLabClient } from '@zhixing/gitlab-client';
import { specCompiler } from './spec-compiler.js';
import { db } from '@zhixing/db';
import { distributionLogs, projects } from '@zhixing/db/schema';
import { eq } from 'drizzle-orm';

export interface DistributionResult {
  success: boolean;
  commitSha?: string;
  error?: string;
}

/**
 * Spec 分发服务
 */
export class DistributionService {
  private gitlabClient: GitLabClient;

  constructor() {
    this.gitlabClient = createGitLabClient();
  }

  /**
   * 分发 Spec 到项目仓库
   */
  async distributeToProject(projectId: string, triggerReason: string): Promise<DistributionResult> {
    try {
      // 获取项目信息
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 生成 CLAUDE.md 内容
      const claudeMdContent = await specCompiler.generateClaudeMd(projectId);

      // 推送到 GitLab
      const commit = await this.gitlabClient.pushClaudeMd(
        project.gitlabPath,
        claudeMdContent,
        {
          branch: 'main',
          commitMessage: `docs: update CLAUDE.md - ${triggerReason}`,
        }
      );

      // 记录分发日志
      await db.insert(distributionLogs).values({
        projectId,
        triggerReason,
        status: 'success',
        gitlabCommitSha: commit.id,
      });

      return {
        success: true,
        commitSha: commit.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 记录失败日志
      await db.insert(distributionLogs).values({
        projectId,
        triggerReason,
        status: 'failed',
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 批量分发到多个项目
   */
  async distributeToProjects(projectIds: string[], triggerReason: string): Promise<Map<string, DistributionResult>> {
    const results = new Map<string, DistributionResult>();

    for (const projectId of projectIds) {
      const result = await this.distributeToProject(projectId, triggerReason);
      results.set(projectId, result);
    }

    return results;
  }

  /**
   * 重试失败的分发
   */
  async retryDistribution(logId: string): Promise<DistributionResult> {
    // 获取分发日志
    const [log] = await db
      .select()
      .from(distributionLogs)
      .where(eq(distributionLogs.id, logId))
      .limit(1);

    if (!log) {
      throw new Error(`Distribution log not found: ${logId}`);
    }

    if (log.status !== 'failed') {
      throw new Error(`Cannot retry non-failed distribution`);
    }

    return this.distributeToProject(log.projectId, `Retry: ${log.triggerReason}`);
  }

  /**
   * 获取项目的分发历史
   */
  async getDistributionHistory(projectId: string, limit: number = 20) {
    const logs = await db
      .select()
      .from(distributionLogs)
      .where(eq(distributionLogs.projectId, projectId))
      .limit(limit);

    return logs;
  }
}

// 导出单例
export const distributionService = new DistributionService();
