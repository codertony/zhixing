/**
 * 代码索引服务
 * 实现 GitLab 代码拉取、解析和 Embedding
 */

export interface CodeChunk {
  filePath: string
  content: string
  startLine: number
  endLine: number
  type: 'function' | 'class' | 'module'
  language: string
}

export const indexerService = {
  /**
   * 语义搜索
   */
  async search(_params: {
    query: string
    projectId?: string
    domainId?: string
    topK?: number
  }): Promise<Array<{ score: number; filePath: string; content: string; startLine: number; endLine: number }>> {
    // 这里应该调用 Qdrant 进行向量搜索
    // 简化实现：返回空结果
    return []
  },
}
