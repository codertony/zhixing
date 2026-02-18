/**
 * 工具函数
 */

/**
 * 生成 UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * 解析分页参数
 */
export function parsePagination(params: {
  page?: string | number;
  pageSize?: string | number;
}): { page: number; pageSize: number } {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  return { page, pageSize };
}

/**
 * 计算总页数
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 验证 GitLab 路径格式
 */
export function isValidGitLabPath(path: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
  return pattern.test(path);
}

/**
 * 脱敏敏感信息
 */
export function maskSensitiveInfo(str: string, visibleChars = 4): string {
  if (str.length <= visibleChars) {
    return '*'.repeat(str.length);
  }
  return str.slice(0, visibleChars) + '*'.repeat(str.length - visibleChars);
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  throw lastError;
}
