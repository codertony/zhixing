/**
 * GitLab 错误类
 */

export class GitLabError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'GitLabError';
  }
}

/**
 * 判断是否为 GitLab 错误
 */
export function isGitLabError(error: unknown): error is GitLabError {
  return error instanceof GitLabError;
}
