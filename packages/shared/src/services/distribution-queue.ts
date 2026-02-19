/**
 * 分发队列服务
 * 负责管理分发任务队列，支持准实时推送和重试机制
 */

import { distributionService } from './distribution.js';
import { db } from '@zhixing/db';
import { specRules, projects, specOverrides } from '@zhixing/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * 分发任务状态
 */
export type DistributionTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 分发任务
 */
export interface DistributionTask {
  id: string;
  projectId: string;
  triggerReason: string;
  status: DistributionTaskStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * 告警配置
 */
export interface AlertConfig {
  webhookUrl?: string;
  emailRecipients?: string[];
  onMaxRetriesExceeded: boolean;
}

/**
 * 分发队列配置
 */
export interface DistributionQueueConfig {
  maxRetries: number;
  retryDelayMs: number;
  processingIntervalMs: number;
  alertConfig?: AlertConfig;
}

const DEFAULT_CONFIG: DistributionQueueConfig = {
  maxRetries: 3,
  retryDelayMs: 5000, // 5 秒
  processingIntervalMs: 1000, // 1 秒
  alertConfig: {
    onMaxRetriesExceeded: true,
  },
};

/**
 * 分发队列服务
 */
export class DistributionQueueService {
  private queue: Map<string, DistributionTask> = new Map();
  private config: DistributionQueueConfig;
  private processingInterval?: NodeJS.Timeout;
  private isProcessing: boolean = false;

  constructor(config: Partial<DistributionQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 启动队列处理器
   */
  start(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingIntervalMs);

    console.log('分发队列服务已启动');
  }

  /**
   * 停止队列处理器
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    console.log('分发队列服务已停止');
  }

  /**
   * 添加分发任务到队列
   */
  async enqueueDistribution(
    projectId: string,
    triggerReason: string
  ): Promise<string> {
    const taskId = this.generateTaskId();

    const task: DistributionTask = {
      id: taskId,
      projectId,
      triggerReason,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date(),
    };

    this.queue.set(taskId, task);

    console.log(`分发任务已入队: ${taskId}, 项目: ${projectId}, 原因: ${triggerReason}`);

    return taskId;
  }

  /**
   * 批量添加分发任务
   */
  async enqueueBatch(
    projectIds: string[],
    triggerReason: string
  ): Promise<string[]> {
    const taskIds: string[] = [];

    for (const projectId of projectIds) {
      const taskId = await this.enqueueDistribution(projectId, triggerReason);
      taskIds.push(taskId);
    }

    return taskIds;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): DistributionTask | undefined {
    return this.queue.get(taskId);
  }

  /**
   * 获取队列统计
   */
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const task of this.queue.values()) {
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      total: this.queue.size,
      pending,
      processing,
      completed,
      failed,
    };
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 获取待处理的任务
      const pendingTasks = Array.from(this.queue.values())
        .filter(task => task.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // 处理每个任务
      for (const task of pendingTasks) {
        await this.processTask(task);
      }

      // 清理已完成的任务（保留最近 100 条）
      this.cleanupCompletedTasks();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: DistributionTask): Promise<void> {
    // 更新状态为处理中
    task.status = 'processing';
    task.startedAt = new Date();

    console.log(`开始处理分发任务: ${task.id}`);

    try {
      // 执行分发
      const result = await distributionService.distributeToProject(
        task.projectId,
        task.triggerReason
      );

      if (result.success) {
        task.status = 'completed';
        task.completedAt = new Date();
        console.log(`分发任务完成: ${task.id}, commit: ${result.commitSha}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      task.error = errorMessage;
      task.retryCount++;

      console.error(`分发任务失败: ${task.id}, 重试次数: ${task.retryCount}/${task.maxRetries}, 错误: ${errorMessage}`);

      if (task.retryCount >= task.maxRetries) {
        // 超过最大重试次数，标记为失败
        task.status = 'failed';
        task.completedAt = new Date();

        // 发送告警
        await this.sendAlert(task, errorMessage);

        console.error(`分发任务最终失败: ${task.id}`);
      } else {
        // 重试：延迟后重新入队
        task.status = 'pending';

        setTimeout(() => {
          if (task.status === 'pending') {
            console.log(`分发任务准备重试: ${task.id}`);
          }
        }, this.config.retryDelayMs);
      }
    }
  }

  /**
   * 发送告警
   */
  private async sendAlert(task: DistributionTask, errorMessage: string): Promise<void> {
    if (!this.config.alertConfig?.onMaxRetriesExceeded) {
      return;
    }

    const alertMessage = {
      type: 'distribution_failed',
      taskId: task.id,
      projectId: task.projectId,
      triggerReason: task.triggerReason,
      retryCount: task.retryCount,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    console.warn('分发任务告警:', JSON.stringify(alertMessage, null, 2));

    // TODO: 实现实际的告警发送（webhook、邮件等）
    if (this.config.alertConfig.webhookUrl) {
      try {
        await fetch(this.config.alertConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertMessage),
        });
      } catch (error) {
        console.error('发送告警失败:', error);
      }
    }
  }

  /**
   * 清理已完成的任务
   */
  private cleanupCompletedTasks(): void {
    const completedTasks = Array.from(this.queue.entries())
      .filter(([, task]) => task.status === 'completed' || task.status === 'failed')
      .sort(([, a], [, b]) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

    // 保留最近 100 条
    if (completedTasks.length > 100) {
      const tasksToRemove = completedTasks.slice(100);
      for (const [taskId] of tasksToRemove) {
        this.queue.delete(taskId);
      }
    }
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 规则变更监听器
 */
export class RuleChangeWatcher {
  private queueService: DistributionQueueService;

  constructor(queueService: DistributionQueueService) {
    this.queueService = queueService;
  }

  /**
   * 当规则创建时触发
   */
  async onRuleCreated(ruleId: string): Promise<void> {
    console.log(`规则创建事件: ${ruleId}`);

    const affectedProjects = await this.findAffectedProjectsByRule(ruleId);

    if (affectedProjects.length > 0) {
      await this.queueService.enqueueBatch(
        affectedProjects,
        `规则创建: ${ruleId}`
      );
    }
  }

  /**
   * 当规则更新时触发
   */
  async onRuleUpdated(ruleId: string): Promise<void> {
    console.log(`规则更新事件: ${ruleId}`);

    const affectedProjects = await this.findAffectedProjectsByRule(ruleId);

    if (affectedProjects.length > 0) {
      await this.queueService.enqueueBatch(
        affectedProjects,
        `规则更新: ${ruleId}`
      );
    }
  }

  /**
   * 当规则删除时触发
   */
  async onRuleDeleted(rule: { id: string; level: string; domainId?: string; projectId?: string }): Promise<void> {
    console.log(`规则删除事件: ${rule.id}`);

    const affectedProjects = await this.findAffectedProjectsByRule(rule.id);

    if (affectedProjects.length > 0) {
      await this.queueService.enqueueBatch(
        affectedProjects,
        `规则删除: ${rule.id}`
      );
    }
  }

  /**
   * 当 Override 创建时触发
   */
  async onOverrideCreated(ruleId: string, projectId: string): Promise<void> {
    console.log(`Override 创建事件: 规则 ${ruleId}, 项目 ${projectId}`);

    await this.queueService.enqueueDistribution(
      projectId,
      `Override 创建: 规则 ${ruleId}`
    );
  }

  /**
   * 当项目订阅变更时触发
   */
  async onProjectSubscriptionsChanged(projectId: string): Promise<void> {
    console.log(`项目订阅变更事件: ${projectId}`);

    await this.queueService.enqueueDistribution(
      projectId,
      '项目订阅变更'
    );
  }

  /**
   * 查找受规则影响的项目
   */
  private async findAffectedProjectsByRule(ruleId: string): Promise<string[]> {
    // 获取规则信息
    const [rule] = await db
      .select()
      .from(specRules)
      .where(eq(specRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return [];
    }

    const projectIds: string[] = [];

    switch (rule.level) {
      case 'company':
        // 公司级规则影响所有项目
        const allProjects = await db.select().from(projects);
        projectIds.push(...allProjects.map(p => p.id));
        break;

      case 'domain':
        // 领域级规则影响该领域的项目 + 订阅该领域的项目
        if (rule.domainId) {
          // 所属领域的项目
          const domainProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.domainId, rule.domainId));

          projectIds.push(...domainProjects.map(p => p.id));

          // 订阅该领域的项目
          const allProjectsWithSubscriptions = await db.select().from(projects);

          for (const project of allProjectsWithSubscriptions) {
            const subscriptions = project.subscriptions as string[];
            if (subscriptions?.includes(rule.domainId) && !projectIds.includes(project.id)) {
              projectIds.push(project.id);
            }
          }
        }
        break;

      case 'project':
        // 项目级规则只影响该项目
        if (rule.projectId) {
          projectIds.push(rule.projectId);
        }
        break;
    }

    // 排除已 override 该规则的项目
    const overrides = await db
      .select()
      .from(specOverrides)
      .where(eq(specOverrides.ruleId, ruleId));

    const overriddenProjectIds = overrides.map(o => o.projectId);

    return projectIds.filter(id => !overriddenProjectIds.includes(id));
  }
}

// 创建默认实例
export const distributionQueueService = new DistributionQueueService();
export const ruleChangeWatcher = new RuleChangeWatcher(distributionQueueService);
