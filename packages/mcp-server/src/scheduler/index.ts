/**
 * 索引任务调度器
 * 支持定期批量索引和手动触发
 */

import { createGitLabClient } from '@zhixing/gitlab-client';
import { db, projects } from '@zhixing/db';
import { logger } from '@zhixing/shared';
import { createCodeIndexer, createDocumentIndexer, type IndexResult, type DocumentIndexResult } from '../services/index.js';

/**
 * 调度配置
 */
export interface SchedulerConfig {
  defaultSchedule?: string;  // Cron 表达式，默认每天 02:00
}

/**
 * 索引任务记录
 */
interface IndexJob {
  projectId: string;
  type: 'full' | 'incremental' | 'docs';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: IndexResult | DocumentIndexResult;
  error?: string;
}

/**
 * 任务调度器
 */
export class IndexScheduler {
  private config: SchedulerConfig;
  private jobs: Map<string, IndexJob> = new Map();
  private isRunning = false;

  constructor(config?: SchedulerConfig) {
    this.config = {
      defaultSchedule: '0 2 * * *',  // 每天 02:00
      ...config,
    };
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    logger.info('Index scheduler started');

    // 启动定期调度
    this.scheduleDailyJob();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false;
    logger.info('Index scheduler stopped');
  }

  /**
   * 手动触发项目全量索引
   */
  async triggerFullIndex(projectId: string): Promise<IndexResult> {
    const jobId = `${projectId}:full:${Date.now()}`;

    const job: IndexJob = {
      projectId,
      type: 'full',
      status: 'running',
      startedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    try {
      const gitlabClient = createGitLabClient();
      const indexer = createCodeIndexer({ gitlabClient });
      await indexer.initialize();

      const result = await indexer.fullIndex(projectId);

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      logger.info(`Full index completed for ${projectId}: ${result.filesIndexed} files, ${result.chunksIndexed} chunks`);

      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Full index failed for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 手动触发项目增量索引
   */
  async triggerIncrementalIndex(projectId: string): Promise<IndexResult> {
    const jobId = `${projectId}:incremental:${Date.now()}`;

    const job: IndexJob = {
      projectId,
      type: 'incremental',
      status: 'running',
      startedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    try {
      const gitlabClient = createGitLabClient();
      const indexer = createCodeIndexer({ gitlabClient });
      await indexer.initialize();

      const result = await indexer.incrementalIndex({ projectId });

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      logger.info(`Incremental index completed for ${projectId}: ${result.filesIndexed} files`);

      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Incremental index failed for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 手动触发文档索引
   */
  async triggerDocsIndex(projectId: string): Promise<DocumentIndexResult> {
    const jobId = `${projectId}:docs:${Date.now()}`;

    const job: IndexJob = {
      projectId,
      type: 'docs',
      status: 'running',
      startedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    try {
      const gitlabClient = createGitLabClient();
      const indexer = createDocumentIndexer({ gitlabClient });

      const result = await indexer.indexProjectDocs(projectId);

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      logger.info(`Docs index completed for ${projectId}: ${result.filesIndexed} files, ${result.chunksIndexed} chunks`);

      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Docs index failed for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 执行定期任务（所有项目）
   */
  async runScheduledJob(): Promise<void> {
    logger.info('Running scheduled index job for all projects');

    try {
      // 获取所有项目
      const allProjects = await db.query.projects.findMany();

      for (const project of allProjects) {
        try {
          // 增量索引代码
          await this.triggerIncrementalIndex(project.id);

          // 全量索引文档（文档变更较少）
          await this.triggerDocsIndex(project.id);
        } catch (error) {
          logger.error(`Scheduled index failed for project ${project.id}:`, error);
          // 继续处理下一个项目
        }
      }

      logger.info('Scheduled index job completed');
    } catch (error) {
      logger.error('Scheduled index job failed:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  getJobStatus(jobId: string): IndexJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * 获取所有任务
   */
  getAllJobs(): IndexJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * 设置每日调度
   */
  private scheduleDailyJob(): void {
    // 使用简单的 setTimeout 实现，生产环境应使用 node-cron
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(2, 0, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.runScheduledJob();
      // 设置下一次调度
      this.scheduleDailyJob();
    }, delay);

    logger.info(`Next scheduled index job at ${scheduledTime.toISOString()}`);
  }
}

/**
 * 创建调度器实例
 */
export function createScheduler(config?: SchedulerConfig): IndexScheduler {
  return new IndexScheduler(config);
}

// 导出默认实例
export const defaultScheduler = createScheduler();
