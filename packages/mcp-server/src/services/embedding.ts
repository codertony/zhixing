/**
 * Embedding 服务
 * 通过中转代理调用 OpenAI Embeddings API
 */

import OpenAI from 'openai';
import { logger } from '@zhixing/shared';

/**
 * Embedding 配置
 */
export interface EmbeddingConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Embedding 结果
 */
export interface EmbeddingResult {
  embedding: number[];
  text: string;
  tokenCount: number;
}

/**
 * Embedding 服务
 */
export class EmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor(config?: Partial<EmbeddingConfig>) {
    const apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    const baseURL = config?.baseURL ?? process.env.OPENAI_BASE_URL;
    this.model = config?.model ?? 'text-embedding-3-small';

    const clientConfig: OpenAI.ClientOptions = {
      apiKey,
      maxRetries: config?.maxRetries ?? 3,
      timeout: config?.timeout ?? 30000,
    };

    if (baseURL) {
      clientConfig.baseURL = baseURL;
    }

    this.client = new OpenAI(clientConfig);
  }

  /**
   * 创建单个文本的 Embedding
   */
  async embed(text: string): Promise<EmbeddingResult> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('Empty embedding response');
      }

      return {
        embedding,
        text,
        tokenCount: response.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      logger.error('Embedding creation failed:', error);
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 批量创建 Embedding
   * 注意：OpenAI API 有批量限制，需要分批处理
   */
  async embedBatch(texts: string[], batchSize: number = 100): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
        });

        for (let j = 0; j < response.data.length; j++) {
          const item = response.data[j];
          results.push({
            embedding: item.embedding,
            text: batch[item.index ?? j],
            tokenCount: 0, // 批量时无法获取单个 token 数
          });
        }

        logger.info(`Processed embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      } catch (error) {
        logger.error(`Batch embedding failed for items ${i}-${i + batch.length}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 估算 token 数（用于预检查）
   * 简单估算：1 token ≈ 4 字符
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 检查文本是否超过限制
   */
  isWithinLimit(text: string, maxTokens: number = 8192): boolean {
    return this.estimateTokens(text) <= maxTokens;
  }
}

/**
 * 创建 Embedding 服务实例
 */
export function createEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService {
  return new EmbeddingService(config);
}
