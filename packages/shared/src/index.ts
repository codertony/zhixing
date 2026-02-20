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
