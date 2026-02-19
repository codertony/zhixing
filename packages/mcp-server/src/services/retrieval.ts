/**
 * 语义检索服务
 * 提供代码和文档的语义检索能力
 */

import { GitLabClient } from '@zhixing/gitlab-client';
import { db, projects } from '@zhixing/db';
import { eq } from 'drizzle-orm';
import { logger } from '@zhixing/shared';
import { createEmbeddingService } from './embedding.js';
import { createVectorStore, type SearchResult } from './vector-store.js';

/**
 * 检索参数
 */
export interface RetrievalParams {
  query: string;
  projectId: string;
  limit?: number;
  fileType?: 'code' | 'document' | 'all';
  scoreThreshold?: number;
}

/**
 * 检索结果
 */
export interface RetrievalResult {
  query: string;
  results: Array<{
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    language: string;
    type: string;
    name: string;
    signature?: string;
    docstring?: string;
    score: number;
  }>;
  totalResults: number;
  hasHighConfidence: boolean;
}

/**
 * Git 历史分析参数
 */
export interface GitHistoryParams {
  projectId: string;
  filePath?: string;
  since?: string;
  limit?: number;
}

/**
 * Git 历史分析结果
 */
export interface GitHistoryResult {
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    isHighImpact: boolean;
  }>;
  summary: string;
  recentChanges: string[];
}

/**
 * 语义检索服务
 */
export class RetrievalService {
  private gitlabClient: GitLabClient;
  private embedding = createEmbeddingService();
  private vectorStore = createVectorStore();

  constructor(config: { gitlabClient: GitLabClient }) {
    this.gitlabClient = config.gitlabClient;
  }

  /**
   * 语义检索
   */
  async search(params: RetrievalParams): Promise<RetrievalResult> {
    const {
      query,
      projectId,
      limit = 10,
      fileType = 'all',
      scoreThreshold = 0.7,
    } = params;

    logger.info(`Semantic search: "${query}" for project ${projectId}`);

    try {
      // 获取项目信息
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
          domain: true,
        },
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 创建查询的 Embedding
      const queryEmbedding = await this.embedding.embed(query);

      // 确定检索的命名空间
      const namespace = fileType === 'document'
        ? `domain:${project.domain?.name || 'default'}:docs`
        : `domain:${project.domain?.name || 'default'}`;

      // 执行向量检索
      const results = await this.vectorStore.search({
        vector: queryEmbedding.embedding,
        namespace,
        projectId: fileType === 'all' ? undefined : projectId,
        subscribedDomains: [...project.subscriptions, project.domainId],
        limit,
        scoreThreshold,
        filter: fileType === 'code'
          ? { type: ['class', 'interface', 'function', 'method'] }
          : fileType === 'document'
            ? { type: ['document'] }
            : undefined,
      });

      // 检查是否有高置信度结果
      const highConfidenceThreshold = 0.8;
      const hasHighConfidence = results.some(r => r.score >= highConfidenceThreshold);

      logger.info(`Search returned ${results.length} results, high confidence: ${hasHighConfidence}`);

      return {
        query,
        results: results.map(r => ({
          content: r.content,
          filePath: r.filePath,
          startLine: r.startLine,
          endLine: r.endLine,
          language: r.language,
          type: r.type,
          name: r.name,
          signature: r.signature,
          docstring: r.docstring,
          score: r.score,
        })),
        totalResults: results.length,
        hasHighConfidence,
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 分析 Git 历史
   */
  async analyzeGitHistory(params: GitHistoryParams): Promise<GitHistoryResult> {
    const { projectId, filePath, since, limit = 20 } = params;

    logger.info(`Analyzing git history for project ${projectId}${filePath ? `, file: ${filePath}` : ''}`);

    try {
      // 获取项目信息
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 获取提交列表
      const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const commits = await this.gitlabClient.getCommits(project.gitlabPath, {
        path: filePath,
        since: sinceDate,
        perPage: limit,
      });

      // 分析提交
      const analyzedCommits = commits.map(commit => ({
        sha: commit.short_id,
        message: commit.title,
        author: commit.author_name,
        date: commit.committed_date,
        isHighImpact: this.isHighImpactCommit(commit.title),
      }));

      // 生成摘要
      const summary = this.generateHistorySummary(analyzedCommits);

      // 提取近期重要变更
      const recentChanges = analyzedCommits
        .filter(c => c.isHighImpact)
        .slice(0, 5)
        .map(c => `[${c.sha}] ${c.message} by ${c.author}`);

      return {
        commits: analyzedCommits,
        summary,
        recentChanges,
      };
    } catch (error) {
      logger.error('Git history analysis failed:', error);
      throw new Error(`Git history analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 判断是否为高影响提交
   */
  private isHighImpactCommit(message: string): boolean {
    const highImpactPatterns = [
      /\b(breaking|breaking change)\b/i,
      /\b(api|interface)\b.*\b(change|update|modify)\b/i,
      /\b(remove|delete|drop)\b.*\b(api|interface|method)\b/i,
      /\brefactor\b.*\b(core|main|base)\b/i,
      /\bfeat!\b/,
      /\bBREAKING CHANGE\b/,
    ];

    return highImpactPatterns.some(pattern => pattern.test(message));
  }

  /**
   * 生成历史摘要
   */
  private generateHistorySummary(commits: Array<{ isHighImpact: boolean; message: string }>): string {
    const total = commits.length;
    const highImpact = commits.filter(c => c.isHighImpact).length;

    // 统计提交类型
    const typeCount: Record<string, number> = {};
    for (const commit of commits) {
      const match = commit.message.match(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/);
      const type = match ? match[1] : 'other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    const typeSummary = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `共 ${total} 次提交，其中 ${highImpact} 次高影响变更。主要变更类型: ${typeSummary}`;
  }
}

/**
 * 创建检索服务实例
 */
export function createRetrievalService(config: { gitlabClient: GitLabClient }): RetrievalService {
  return new RetrievalService(config);
}
