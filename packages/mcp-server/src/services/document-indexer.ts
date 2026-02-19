/**
 * 文档索引服务
 * 支持 Markdown、OpenAPI 文档的索引
 */

import { GitLabClient } from '@zhixing/gitlab-client';
import { db, projects } from '@zhixing/db';
import { eq } from 'drizzle-orm';
import { logger } from '@zhixing/shared';
import { createEmbeddingService } from './embedding.js';
import { createVectorStore, type VectorPoint } from './vector-store.js';

/**
 * 文档类型
 */
export type DocumentType = 'markdown' | 'openapi' | 'api-doc';

/**
 * 文档块
 */
export interface DocumentChunk {
  id: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  docType: DocumentType;
  title?: string;
  section?: string;
  metadata: {
    estimatedTokens: number;
  };
}

/**
 * 文档索引结果
 */
export interface DocumentIndexResult {
  projectId: string;
  filesIndexed: number;
  chunksIndexed: number;
  errors: string[];
  duration: number;
}

/**
 * 支持的文档扩展名
 */
const DOC_EXTENSIONS = ['.md', '.mdx', '.yaml', '.yml'];

/**
 * OpenAPI 文件模式
 */
const OPENAPI_PATTERNS = ['openapi', 'swagger'];

/**
 * 文档索引服务
 */
export class DocumentIndexer {
  private gitlabClient: GitLabClient;
  private embedding = createEmbeddingService();
  private vectorStore = createVectorStore();

  constructor(config: { gitlabClient: GitLabClient }) {
    this.gitlabClient = config.gitlabClient;
  }

  /**
   * 索引项目文档
   */
  async indexProjectDocs(projectId: string): Promise<DocumentIndexResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info(`Starting document index for project: ${projectId}`);

    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
          domain: true,
        },
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 获取文件树
      const tree = await this.gitlabClient.getTree(project.gitlabPath, {
        recursive: true,
        perPage: 100,
      });

      // 过滤文档文件
      const docFiles = tree.filter((item: { type: string; path: string }) => {
        if (item.type !== 'blob') return false;
        const path = item.path.toLowerCase();
        return DOC_EXTENSIONS.some(ext => path.endsWith(ext));
      });

      logger.info(`Found ${docFiles.length} document files to index`);

      // 解析所有文档
      const chunks: DocumentChunk[] = [];
      for (const file of docFiles) {
        try {
          const fileChunks = await this.indexDocFile(
            project.gitlabPath,
            file.path,
            projectId
          );
          chunks.push(...fileChunks);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to index doc ${file.path}: ${message}`);
          logger.error(`Failed to index doc ${file.path}:`, error);
        }
      }

      // 存储文档分片
      if (chunks.length > 0) {
        await this.storeDocChunks(
          chunks,
          projectId,
          project.domainId,
          project.domain?.name || 'default'
        );
      }

      const duration = Date.now() - startTime;

      logger.info(`Document index completed: ${docFiles.length} files, ${chunks.length} chunks in ${duration}ms`);

      return {
        projectId,
        filesIndexed: docFiles.length,
        chunksIndexed: chunks.length,
        errors,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Document index failed:`, error);
      throw new Error(`Document index failed: ${message}`);
    }
  }

  /**
   * 索引单个文档文件
   */
  private async indexDocFile(
    projectPath: string,
    filePath: string,
    projectId: string
  ): Promise<DocumentChunk[]> {
    try {
      const file = await this.gitlabClient.getFile(projectPath, filePath);
      const content = Buffer.from(file.content, 'base64').toString('utf-8');
      const lines = content.split('\n');

      // 判断文档类型
      const docType = this.detectDocType(filePath, content);

      // 根据文档类型选择解析策略
      if (docType === 'openapi') {
        return this.parseOpenAPI(filePath, content, projectId);
      } else {
        return this.parseMarkdown(filePath, content, lines, projectId);
      }
    } catch (error) {
      logger.error(`Failed to parse doc file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * 检测文档类型
   */
  private detectDocType(filePath: string, content: string): DocumentType {
    const path = filePath.toLowerCase();

    // 检查是否是 OpenAPI 文件
    if (OPENAPI_PATTERNS.some(p => path.includes(p))) {
      return 'openapi';
    }

    // 检查内容是否符合 OpenAPI 规范
    if (content.includes('openapi:') || content.includes('"openapi"') || content.includes("'openapi'")) {
      return 'openapi';
    }

    return 'markdown';
  }

  /**
   * 解析 Markdown 文档
   */
  private parseMarkdown(
    filePath: string,
    content: string,
    lines: string[],
    projectId: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sections = this.extractMarkdownSections(content, lines);

    for (const section of sections) {
      // 估算 token 数，如果太大则进一步拆分
      const estimatedTokens = Math.ceil(section.content.length / 4);

      if (estimatedTokens > 3000) {
        // 拆分为多个小分片
        const subChunks = this.splitLargeSection(section, filePath);
        chunks.push(...subChunks);
      } else {
        chunks.push({
          id: this.generateChunkId(projectId, filePath, section.startLine),
          content: section.content,
          filePath,
          startLine: section.startLine,
          endLine: section.endLine,
          docType: 'markdown',
          title: section.title,
          section: section.heading,
          metadata: { estimatedTokens },
        });
      }
    }

    return chunks;
  }

  /**
   * 提取 Markdown 章节
   */
  private extractMarkdownSections(
    content: string,
    lines: string[]
  ): Array<{
    content: string;
    startLine: number;
    endLine: number;
    title?: string;
    heading?: string;
  }> {
    const sections: Array<{
      content: string;
      startLine: number;
      endLine: number;
      title?: string;
      heading?: string;
    }> = [];

    let currentSection: {
      content: string;
      startLine: number;
      endLine: number;
      title?: string;
      heading?: string;
    } | null = null;

    const headingRegex = /^(#{1,3})\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = headingRegex.exec(line);

      if (match) {
        // 保存上一节
        if (currentSection) {
          currentSection.endLine = i;
          currentSection.content = lines
            .slice(currentSection.startLine - 1, currentSection.endLine)
            .join('\n');
          sections.push(currentSection);
        }

        // 开始新节
        currentSection = {
          content: '',
          startLine: i + 1,
          endLine: i + 1,
          title: match[2].trim(),
          heading: line.trim(),
        };
      }
    }

    // 保存最后一节
    if (currentSection) {
      currentSection.endLine = lines.length;
      currentSection.content = lines
        .slice(currentSection.startLine - 1)
        .join('\n');
      sections.push(currentSection);
    }

    // 如果没有章节，整个文件作为一个分片
    if (sections.length === 0) {
      sections.push({
        content,
        startLine: 1,
        endLine: lines.length,
      });
    }

    return sections;
  }

  /**
   * 拆分为多个小分片
   */
  private splitLargeSection(
    section: {
      content: string;
      startLine: number;
      endLine: number;
      title?: string;
      heading?: string;
    },
    filePath: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = section.content.split('\n');
    const chunkSize = 50; // 每 50 行一个分片

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      const content = chunkLines.join('\n');

      chunks.push({
        id: this.generateChunkId(filePath, section.startLine + i, section.title || 'section'),
        content,
        filePath,
        startLine: section.startLine + i,
        endLine: Math.min(section.startLine + i + chunkLines.length - 1, section.endLine),
        docType: 'markdown',
        title: section.title,
        section: section.heading,
        metadata: {
          estimatedTokens: Math.ceil(content.length / 4),
        },
      });
    }

    return chunks;
  }

  /**
   * 解析 OpenAPI 文档
   */
  private parseOpenAPI(
    filePath: string,
    content: string,
    projectId: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    try {
      // 尝试解析为 JSON
      const spec = JSON.parse(content);
      const chunks_from_spec = this.extractOpenAPIChunks(spec, filePath, projectId);
      chunks.push(...chunks_from_spec);
    } catch {
      // 尝试解析为 YAML（简化处理，按行处理）
      const lines = content.split('\n');
      chunks.push({
        id: this.generateChunkId(projectId, filePath, 1),
        content,
        filePath,
        startLine: 1,
        endLine: lines.length,
        docType: 'openapi',
        title: 'OpenAPI Specification',
        metadata: {
          estimatedTokens: Math.ceil(content.length / 4),
        },
      });
    }

    return chunks;
  }

  /**
   * 从 OpenAPI 规范提取分片
   */
  private extractOpenAPIChunks(
    spec: Record<string, unknown>,
    filePath: string,
    projectId: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    // 提取 API 路径
    const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
    if (paths) {
      for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
          const content = JSON.stringify({ path, method, ...details }, null, 2);
          chunks.push({
            id: this.generateChunkId(projectId, filePath, `${method}_${path}`),
            content,
            filePath,
            startLine: 0,
            endLine: 0,
            docType: 'openapi',
            title: `${method.toUpperCase()} ${path}`,
            section: 'paths',
            metadata: {
              estimatedTokens: Math.ceil(content.length / 4),
            },
          });
        }
      }
    }

    // 提取组件/模型定义
    const components = spec.components as Record<string, unknown> | undefined;
    if (components) {
      const content = JSON.stringify(components, null, 2);
      chunks.push({
        id: this.generateChunkId(projectId, filePath, 'components'),
        content,
        filePath,
        startLine: 0,
        endLine: 0,
        docType: 'openapi',
        title: 'Components',
        section: 'components',
        metadata: {
          estimatedTokens: Math.ceil(content.length / 4),
        },
      });
    }

    return chunks;
  }

  /**
   * 存储文档分片
   */
  private async storeDocChunks(
    chunks: DocumentChunk[],
    projectId: string,
    domainId: string,
    domainName: string
  ): Promise<void> {
    const namespace = `domain:${domainName}:docs`;

    // 分批处理
    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const texts = batch.map(c => c.content);
      const embeddings = await this.embedding.embedBatch(texts, batchSize);

      const points: VectorPoint[] = batch.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index].embedding,
        payload: {
          content: chunk.content,
          filePath: chunk.filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          language: chunk.docType,
          type: 'document',
          name: chunk.title || 'Document',
          docType: chunk.docType,
          section: chunk.section,
          namespace,
          projectId,
          domainId,
          indexedAt: new Date().toISOString(),
        },
      }));

      await this.vectorStore.upsertPoints(points);

      logger.info(`Stored doc batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }
  }

  /**
   * 生成分片 ID
   */
  private generateChunkId(projectId: string, filePath: string, identifier: string | number): string {
    const hash = Buffer.from(`${projectId}:${filePath}:${identifier}`).toString('base64url');
    return hash.substring(0, 32);
  }
}

/**
 * 创建文档索引服务实例
 */
export function createDocumentIndexer(config: { gitlabClient: GitLabClient }): DocumentIndexer {
  return new DocumentIndexer(config);
}
