/**
 * 向量存储服务
 * 基于 Qdrant 实现代码和文档的向量存储与检索
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '@zhixing/shared';

/**
 * 向量存储配置
 */
export interface VectorStoreConfig {
  url?: string;
  apiKey?: string;
  dimension?: number;
}

/**
 * 向量点（存储单元）
 */
export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    language: string;
    type: string;
    name: string;
    parent?: string;
    signature?: string;
    docstring?: string;
    namespace: string;  // 领域命名空间
    projectId: string;
    domainId: string;
    indexedAt: string;
    [key: string]: unknown;
  };
}

/**
 * 检索结果
 */
export interface SearchResult {
  id: string;
  score: number;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  type: string;
  name: string;
  parent?: string;
  signature?: string;
  docstring?: string;
  namespace: string;
}

/**
 * 检索参数
 */
export interface SearchParams {
  vector: number[];
  namespace: string;
  projectId?: string;
  subscribedDomains?: string[];
  limit?: number;
  scoreThreshold?: number;
  filter?: {
    language?: string[];
    type?: string[];
    filePath?: string;
  };
}

/**
 * 集合配置
 */
const COLLECTION_CONFIG = {
  name: 'code_embeddings',
  dimension: 1536,  // text-embedding-3-small 的维度
  distance: 'Cosine' as const,
};

/**
 * 向量存储服务
 */
export class VectorStore {
  private client: QdrantClient;
  private dimension: number;

  constructor(config?: VectorStoreConfig) {
    const url = config?.url ?? process.env.QDRANT_URL ?? 'http://localhost:6333';
    const apiKey = config?.apiKey ?? process.env.QDRANT_API_KEY;
    this.dimension = config?.dimension ?? COLLECTION_CONFIG.dimension;

    this.client = new QdrantClient({
      url,
      apiKey,
    });
  }

  /**
   * 初始化集合（如果不存在）
   */
  async initCollection(): Promise<void> {
    try {
      // 检查集合是否存在
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === COLLECTION_CONFIG.name
      );

      if (!exists) {
        logger.info(`Creating Qdrant collection: ${COLLECTION_CONFIG.name}`);
        await this.client.createCollection(COLLECTION_CONFIG.name, {
          vectors: {
            size: this.dimension,
            distance: COLLECTION_CONFIG.distance,
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        // 创建索引以加速命名空间查询
        await this.client.createPayloadIndex(COLLECTION_CONFIG.name, {
          field_name: 'namespace',
          field_schema: 'keyword',
        });

        await this.client.createPayloadIndex(COLLECTION_CONFIG.name, {
          field_name: 'projectId',
          field_schema: 'keyword',
        });

        await this.client.createPayloadIndex(COLLECTION_CONFIG.name, {
          field_name: 'domainId',
          field_schema: 'keyword',
        });

        logger.info(`Collection ${COLLECTION_CONFIG.name} created successfully`);
      } else {
        logger.info(`Collection ${COLLECTION_CONFIG.name} already exists`);
      }
    } catch (error) {
      logger.error('Failed to initialize Qdrant collection:', error);
      throw error;
    }
  }

  /**
   * 存储向量点
   */
  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;

    try {
      await this.client.upsert(COLLECTION_CONFIG.name, {
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });

      logger.info(`Upserted ${points.length} points to Qdrant`);
    } catch (error) {
      logger.error('Failed to upsert points:', error);
      throw error;
    }
  }

  /**
   * 语义检索
   * 支持跨领域检索隔离
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    const {
      vector,
      namespace,
      projectId,
      subscribedDomains = [],
      limit = 10,
      scoreThreshold = 0.7,
      filter,
    } = params;

    try {
      // 构建过滤条件
      const mustConditions: unknown[] = [
        { key: 'namespace', match: { value: namespace } },
      ];

      // 跨领域检索：只允许查询已订阅的领域
      if (subscribedDomains.length > 0) {
        mustConditions.push({
          key: 'domainId',
          match: { any: subscribedDomains },
        });
      }

      // 项目过滤
      if (projectId) {
        mustConditions.push({
          key: 'projectId',
          match: { value: projectId },
        });
      }

      // 额外过滤条件
      if (filter?.language?.length) {
        mustConditions.push({
          key: 'language',
          match: { any: filter.language },
        });
      }

      if (filter?.type?.length) {
        mustConditions.push({
          key: 'type',
          match: { any: filter.type },
        });
      }

      const response = await this.client.search(COLLECTION_CONFIG.name, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        filter: { must: mustConditions },
        with_payload: true,
      });

      return response.map((point) => ({
        id: String(point.id),
        score: point.score,
        content: (point.payload?.content as string) ?? '',
        filePath: (point.payload?.filePath as string) ?? '',
        startLine: (point.payload?.startLine as number) ?? 0,
        endLine: (point.payload?.endLine as number) ?? 0,
        language: (point.payload?.language as string) ?? '',
        type: (point.payload?.type as string) ?? '',
        name: (point.payload?.name as string) ?? '',
        parent: point.payload?.parent as string | undefined,
        signature: point.payload?.signature as string | undefined,
        docstring: point.payload?.docstring as string | undefined,
        namespace: (point.payload?.namespace as string) ?? '',
      }));
    } catch (error) {
      logger.error('Vector search failed:', error);
      throw error;
    }
  }

  /**
   * 删除项目的所有向量
   */
  async deleteByProject(projectId: string): Promise<void> {
    try {
      await this.client.delete(COLLECTION_CONFIG.name, {
        filter: {
          must: [{ key: 'projectId', match: { value: projectId } }],
        },
      });

      logger.info(`Deleted all vectors for project: ${projectId}`);
    } catch (error) {
      logger.error(`Failed to delete vectors for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 删除指定文件的向量
   */
  async deleteByFile(filePath: string, projectId: string): Promise<void> {
    try {
      await this.client.delete(COLLECTION_CONFIG.name, {
        filter: {
          must: [
            { key: 'filePath', match: { value: filePath } },
            { key: 'projectId', match: { value: projectId } },
          ],
        },
      });

      logger.info(`Deleted vectors for file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete vectors for file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 获取集合统计信息
   */
  async getCollectionStats(): Promise<{
    pointsCount: number;
    vectorsCount: number;
  }> {
    try {
      const info = await this.client.getCollection(COLLECTION_CONFIG.name);
      return {
        pointsCount: info.points_count ?? 0,
        vectorsCount: info.vectors_count ?? 0,
      };
    } catch (error) {
      logger.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      logger.error('Qdrant health check failed:', error);
      return false;
    }
  }
}

/**
 * 创建向量存储服务实例
 */
export function createVectorStore(config?: VectorStoreConfig): VectorStore {
  return new VectorStore(config);
}
