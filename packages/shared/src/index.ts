/**
 * 共享类型和工具函数
 */

// 常用类型定义
export type Nullable<T> = T | null
export type Optional<T> = T | undefined

// 分页参数
export interface PaginationParams {
  page: number
  limit: number
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API 响应包装
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 通用工具函数
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// OpenAI Embeddings 封装
export class OpenAIEmbeddings {
  private apiKey: string
  private baseURL: string
  private model: string

  constructor(config: {
    apiKey: string
    baseURL?: string
    model?: string
  }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || 'https://api.openai.com/v1'
    this.model = config.model || 'text-embedding-ada-002'
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`)
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> }
    return data.data[0].embedding
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`)
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> }
    return data.data.map((item) => item.embedding)
  }
}
