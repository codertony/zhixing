/**
 * 代码索引服务
 * 协调代码拉取、解析、分块、Embedding 和存储
 */

import { GitLabClient } from '@zhixing/gitlab-client';
import { db, projects, domains } from '@zhixing/db';
import { eq } from 'drizzle-orm';
import { logger } from '@zhixing/shared';
import { createCodeParser, type ParseResult } from './code-parser.js';
import { createCodeChunker, type CodeChunk } from './code-chunker.js';
import { createEmbeddingService } from './embedding.js';
import { createVectorStore, type VectorPoint } from './vector-store.js';

/**
 * 索引配置
 */
export interface IndexerConfig {
  gitlabClient: GitLabClient;
}

/**
 * 索引结果
 */
export interface IndexResult {
  projectId: string;
  filesIndexed: number;
  chunksIndexed: number;
  errors: string[];
  duration: number;
}

/**
 * 增量索引参数
 */
export interface IncrementalIndexParams {
  projectId: string;
  sinceCommit?: string;
}

/**
 * 支持的代码文件扩展名
 */
const CODE_EXTENSIONS = ['.java', '.js', '.jsx', '.ts', '.tsx'];

/**
 * 支持的文档文件扩展名
 */
const DOC_EXTENSIONS = ['.md', '.mdx', '.yaml', '.yml', '.json'];

/**
 * 代码索引服务
 */
export class CodeIndexer {
  private gitlabClient: GitLabClient;
  private parser = createCodeParser();
  private chunker = createCodeChunker();
  private embedding = createEmbeddingService();
  private vectorStore = createVectorStore();

  constructor(config: IndexerConfig) {
    this.gitlabClient = config.gitlabClient;
  }

  /**
   * 初始化向量存储
   */
  async initialize(): Promise<void> {
    await this.vectorStore.initCollection();
  }

  /**
   * 全量索引项目代码
   */
  async fullIndex(projectId: string): Promise<IndexResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info(`Starting full index for project: ${projectId}`);

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

      // 清除现有索引
      await this.vectorStore.deleteByProject(projectId);
      logger.info(`Cleared existing index for project: ${projectId}`);

      // 获取文件树
      const tree = await this.gitlabClient.getTree(project.gitlabPath, {
        recursive: true,
        perPage: 100,
      });

      // 过滤代码文件
      const codeFiles = tree.filter((item: { type: string; path: string }) =>
        item.type === 'blob' && CODE_EXTENSIONS.some(ext => item.path.toLowerCase().endsWith(ext))
      );

      logger.info(`Found ${codeFiles.length} code files to index`);

      // 解析所有文件
      const parseResults: ParseResult[] = [];
      for (const file of codeFiles) {
        try {
          const result = await this.indexFile(project.gitlabPath, file.path);
          if (result) {
            parseResults.push(result);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to index ${file.path}: ${message}`);
          logger.error(`Failed to index ${file.path}:`, error);
        }
      }

      // 分块
      const chunks = this.chunker.chunkBatch(parseResults);
      logger.info(`Created ${chunks.length} chunks from ${parseResults.length} files`);

      // 创建 Embedding 并存储
      await this.storeChunks(chunks, projectId, project.domainId, project.domain?.name || 'default');

      const duration = Date.now() - startTime;

      logger.info(`Full index completed for ${projectId}: ${parseResults.length} files, ${chunks.length} chunks in ${duration}ms`);

      return {
        projectId,
        filesIndexed: parseResults.length,
        chunksIndexed: chunks.length,
        errors,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Full index failed for ${projectId}:`, error);
      throw new Error(`Full index failed: ${message}`);
    }
  }

  /**
   * 增量索引
   * 对比 git commit diff，只重新索引变更文件
   */
  async incrementalIndex(params: IncrementalIndexParams): Promise<IndexResult> {
    const { projectId, sinceCommit } = params;
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info(`Starting incremental index for project: ${projectId}`);

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

      // 如果没有指定 sinceCommit，获取最近提交
      const fromCommit = sinceCommit || await this.getLastIndexedCommit(projectId);
      const toCommit = 'HEAD';

      if (!fromCommit) {
        logger.info('No previous index found, falling back to full index');
        return this.fullIndex(projectId);
      }

      // 获取变更文件列表
      const diff = await this.gitlabClient.getDiff(project.gitlabPath, fromCommit, toCommit);
      const changedFiles = (diff as { diffs?: Array<{ new_path: string; deleted_file: boolean }> }).diffs || [];

      // 过滤出代码文件
      const codeChanges = changedFiles.filter((f: { new_path: string; deleted_file: boolean }) =>
        CODE_EXTENSIONS.some(ext => f.new_path.toLowerCase().endsWith(ext))
      );

      logger.info(`Found ${codeChanges.length} changed code files`);

      // 处理变更文件
      const parseResults: ParseResult[] = [];
      for (const change of codeChanges) {
        try {
          // 删除已删除文件的索引
          if (change.deleted_file) {
            await this.vectorStore.deleteByFile(change.new_path, projectId);
            continue;
          }

          // 重新索引变更文件
          const result = await this.indexFile(project.gitlabPath, change.new_path);
          if (result) {
            parseResults.push(result);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to index ${change.new_path}: ${message}`);
          logger.error(`Failed to index ${change.new_path}:`, error);
        }
      }

      // 分块并存储
      if (parseResults.length > 0) {
        const chunks = this.chunker.chunkBatch(parseResults);
        await this.storeChunks(chunks, projectId, project.domainId, project.domain?.name || 'default');

        logger.info(`Incremental index completed: ${parseResults.length} files, ${chunks.length} chunks`);
      }

      const duration = Date.now() - startTime;

      return {
        projectId,
        filesIndexed: parseResults.length,
        chunksIndexed: 0,
        errors,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Incremental index failed for ${projectId}:`, error);
      throw new Error(`Incremental index failed: ${message}`);
    }
  }

  /**
   * 索引单个文件
   */
  private async indexFile(projectPath: string, filePath: string): Promise<ParseResult | null> {
    try {
      // 获取文件内容
      const file = await this.gitlabClient.getFile(projectPath, filePath);
      const content = Buffer.from(file.content, 'base64').toString('utf-8');

      // 解析代码
      const result = this.parser.parse(filePath, content);
      return result;
    } catch (error) {
      logger.error(`Failed to parse file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 存储代码分片
   */
  private async storeChunks(
    chunks: CodeChunk[],
    projectId: string,
    domainId: string,
    domainName: string
  ): Promise<void> {
    const namespace = `domain:${domainName}`;

    // 分批处理（避免内存溢出）
    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // 创建 Embedding
      const texts = batch.map(c => c.content);
      const embeddings = await this.embedding.embedBatch(texts, batchSize);

      // 构建向量点
      const points: VectorPoint[] = batch.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index].embedding,
        payload: {
          content: chunk.content,
          filePath: chunk.filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          language: chunk.language,
          type: chunk.type,
          name: chunk.name,
          parent: chunk.parent,
          signature: chunk.signature,
          docstring: chunk.docstring,
          namespace,
          projectId,
          domainId,
          indexedAt: new Date().toISOString(),
        },
      }));

      // 存储到向量数据库
      await this.vectorStore.upsertPoints(points);

      logger.info(`Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}: ${batch.length} chunks`);
    }
  }

  /**
   * 获取上次索引的 commit SHA
   */
  private async getLastIndexedCommit(projectId: string): Promise<string | null> {
    // 从数据库中查询上次索引记录
    // 简化实现：暂时返回 null，触发全量索引
    return null;
  }

  /**
   * 获取索引统计
   */
  async getStats(): Promise<{ pointsCount: number; vectorsCount: number }> {
    return this.vectorStore.getCollectionStats();
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ vectorStore: boolean }> {
    return {
      vectorStore: await this.vectorStore.healthCheck(),
    };
  }
}

/**
 * 创建代码索引服务实例
 */
export function createCodeIndexer(config: IndexerConfig): CodeIndexer {
  return new CodeIndexer(config);
}
