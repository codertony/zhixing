/**
 * 代码分块服务
 * 按函数/类边界分块，支持智能合并小代码块
 */

import type { CodeBlock, ParseResult } from './code-parser.js';

/**
 * 代码分片定义
 */
export interface CodeChunk {
  id: string;
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
  metadata: {
    blockCount: number;
    estimatedTokens: number;
  };
}

/**
 * 分块配置选项
 */
export interface ChunkerOptions {
  maxChunkSize?: number;     // 最大分片大小（字符数）
  minChunkSize?: number;     // 最小分片大小
  maxChunkTokens?: number;   // 最大 token 数（用于 Embedding）
  overlapLines?: number;     // 相邻分片重叠行数
}

/**
 * 默认配置
 * OpenAI Embedding 最大 8192 tokens，预留余量
 */
const DEFAULT_OPTIONS: ChunkerOptions = {
  maxChunkSize: 6000,        // 约 1500 tokens
  minChunkSize: 100,
  maxChunkTokens: 4000,
  overlapLines: 2,
};

/**
 * 估算 token 数（近似值：1 token ≈ 4 字符）
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * 生成唯一 ID
 */
function generateChunkId(filePath: string, startLine: number, name: string): string {
  const hash = Buffer.from(`${filePath}:${startLine}:${name}`).toString('base64url');
  return hash.substring(0, 32);
}

/**
 * 代码分块器
 */
export class CodeChunker {
  private options: ChunkerOptions;

  constructor(options: ChunkerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 对解析结果进行分块
   */
  chunk(parseResult: ParseResult): CodeChunk[] {
    const { filePath, language, blocks } = parseResult;
    const chunks: CodeChunk[] = [];

    // 按开始行号排序
    const sortedBlocks = [...blocks].sort((a, b) => a.startLine - b.startLine);

    // 策略：优先按顶级块（类/接口/独立函数）分块
    // 如果块太大，再考虑拆分
    let currentChunk: CodeBlock[] = [];

    for (const block of sortedBlocks) {
      // 如果是顶级块（类、接口、独立函数），先处理累积的块
      if (this.isTopLevelBlock(block)) {
        if (currentChunk.length > 0) {
          chunks.push(this.createChunk(currentChunk, filePath, language));
          currentChunk = [];
        }
      }

      currentChunk.push(block);

      // 检查当前累积的块是否超过大小限制
      const currentSize = currentChunk.reduce((sum, b) => sum + b.content.length, 0);
      if (currentSize > (this.options.maxChunkSize || 6000)) {
        chunks.push(this.createChunk(currentChunk, filePath, language));
        currentChunk = [];
      }
    }

    // 处理剩余块
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(currentChunk, filePath, language));
    }

    return chunks;
  }

  /**
   * 批量分块多个文件
   */
  chunkBatch(parseResults: ParseResult[]): CodeChunk[] {
    const allChunks: CodeChunk[] = [];
    for (const result of parseResults) {
      const chunks = this.chunk(result);
      allChunks.push(...chunks);
    }
    return allChunks;
  }

  /**
   * 判断是否顶级块
   */
  private isTopLevelBlock(block: CodeBlock): boolean {
    return block.type === 'class' ||
           block.type === 'interface' ||
           (block.type === 'function' && !block.parent);
  }

  /**
   * 创建代码分片
   */
  private createChunk(blocks: CodeBlock[], filePath: string, language: string): CodeChunk {
    // 合并块内容
    const sortedBlocks = [...blocks].sort((a, b) => a.startLine - b.startLine);
    const firstBlock = sortedBlocks[0];
    const lastBlock = sortedBlocks[sortedBlocks.length - 1];

    // 构建分片内容
    const contents: string[] = [];
    for (const block of sortedBlocks) {
      let blockContent = '';
      if (block.docstring) {
        blockContent += block.docstring + '\n';
      }
      blockContent += block.content;
      contents.push(blockContent);
    }

    const mergedContent = contents.join('\n\n');

    // 提取主块名称（通常是类名或主函数名）
    const mainBlock = sortedBlocks.find(b => this.isTopLevelBlock(b)) || firstBlock;

    return {
      id: generateChunkId(filePath, firstBlock.startLine, mainBlock.name),
      content: mergedContent,
      filePath,
      startLine: firstBlock.startLine,
      endLine: lastBlock.endLine,
      language,
      type: mainBlock.type,
      name: mainBlock.name,
      parent: mainBlock.parent,
      signature: mainBlock.signature,
      docstring: mainBlock.docstring,
      metadata: {
        blockCount: blocks.length,
        estimatedTokens: estimateTokens(mergedContent),
      },
    };
  }

  /**
   * 智能分块：处理超大文件
   * 当文件太大时，按逻辑边界拆分
   */
  smartChunk(parseResult: ParseResult): CodeChunk[] {
    const chunks = this.chunk(parseResult);

    // 检查是否有超大分片需要进一步拆分
    const result: CodeChunk[] = [];
    for (const chunk of chunks) {
      if (chunk.metadata.estimatedTokens > (this.options.maxChunkTokens || 4000)) {
        // 拆分为多个小分片
        const subChunks = this.splitLargeChunk(chunk);
        result.push(...subChunks);
      } else {
        result.push(chunk);
      }
    }

    return result;
  }

  /**
   * 拆分大分片
   */
  private splitLargeChunk(chunk: CodeChunk): CodeChunk[] {
    const lines = chunk.content.split('\n');
    const chunks: CodeChunk[] = [];
    const targetLines = Math.floor(lines.length / Math.ceil(chunk.metadata.estimatedTokens / (this.options.maxChunkTokens || 4000)));

    let currentLines: string[] = [];
    let currentStartLine = chunk.startLine;

    for (let i = 0; i < lines.length; i++) {
      currentLines.push(lines[i]);

      if (currentLines.length >= targetLines) {
        const content = currentLines.join('\n');
        chunks.push({
          ...chunk,
          id: generateChunkId(chunk.filePath, currentStartLine, `${chunk.name}_part${chunks.length}`),
          content,
          startLine: currentStartLine,
          endLine: currentStartLine + currentLines.length - 1,
          metadata: {
            blockCount: 1,
            estimatedTokens: estimateTokens(content),
          },
        });
        currentStartLine += currentLines.length;
        currentLines = [];
      }
    }

    // 处理剩余行
    if (currentLines.length > 0) {
      const content = currentLines.join('\n');
      chunks.push({
        ...chunk,
        id: generateChunkId(chunk.filePath, currentStartLine, `${chunk.name}_part${chunks.length}`),
        content,
        startLine: currentStartLine,
        endLine: currentStartLine + currentLines.length - 1,
        metadata: {
          blockCount: 1,
          estimatedTokens: estimateTokens(content),
        },
      });
    }

    return chunks;
  }
}

/**
 * 创建代码分块器实例
 */
export function createCodeChunker(options?: ChunkerOptions): CodeChunker {
  return new CodeChunker(options);
}
