/**
 * GitLab API 客户端
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  GitLabConfig,
  GitLabRepository,
  GitLabFile,
  GitLabCommit,
  GitLabBranch,
  GitLabUser,
  CreateFileOptions,
  UpdateFileOptions,
  GetFileOptions,
} from './types';
import { GitLabError } from './errors';

/**
 * GitLab API 客户端
 */
export class GitLabClient {
  private client: AxiosInstance;
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;

    const axiosConfig: AxiosRequestConfig = {
      baseURL: `${config.baseUrl}/api/v4`,
      headers: {
        'Private-Token': config.token,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout ?? 30000,
    };

    this.client = axios.create(axiosConfig);

    // 响应拦截器 - 错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new GitLabError(
            data?.message || `GitLab API error: ${status}`,
            status,
            data
          );
        }
        throw error;
      }
    );
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<GitLabUser> {
    const response = await this.client.get('/user');
    return response.data;
  }

  /**
   * 获取仓库信息
   */
  async getRepository(projectPath: string): Promise<GitLabRepository> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(`/projects/${encodedPath}`);
    return response.data;
  }

  /**
   * 获取仓库文件
   */
  async getFile(
    projectPath: string,
    filePath: string,
    options?: GetFileOptions
  ): Promise<GitLabFile> {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFilePath = encodeURIComponent(filePath);
    const ref = options?.ref ?? 'main';

    const response = await this.client.get(
      `/projects/${encodedPath}/repository/files/${encodedFilePath}`,
      { params: { ref } }
    );

    return response.data;
  }

  /**
   * 创建文件
   */
  async createFile(
    projectPath: string,
    filePath: string,
    options: CreateFileOptions
  ): Promise<GitLabCommit> {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFilePath = encodeURIComponent(filePath);

    const response = await this.client.post(
      `/projects/${encodedPath}/repository/files/${encodedFilePath}`,
      {
        branch: options.branch,
        content: options.content,
        commit_message: options.commitMessage,
        encoding: options.encoding ?? 'text',
        author_email: options.authorEmail,
        author_name: options.authorName,
      }
    );

    return response.data;
  }

  /**
   * 更新文件
   */
  async updateFile(
    projectPath: string,
    filePath: string,
    options: UpdateFileOptions
  ): Promise<GitLabCommit> {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFilePath = encodeURIComponent(filePath);

    const response = await this.client.put(
      `/projects/${encodedPath}/repository/files/${encodedFilePath}`,
      {
        branch: options.branch,
        content: options.content,
        commit_message: options.commitMessage,
        encoding: options.encoding ?? 'text',
        author_email: options.authorEmail,
        author_name: options.authorName,
        last_commit_id: options.lastCommitId,
      }
    );

    return response.data;
  }

  /**
   * 删除文件
   */
  async deleteFile(
    projectPath: string,
    filePath: string,
    options: {
      branch: string;
      commitMessage: string;
      authorEmail?: string;
      authorName?: string;
    }
  ): Promise<void> {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFilePath = encodeURIComponent(filePath);

    await this.client.delete(
      `/projects/${encodedPath}/repository/files/${encodedFilePath}`,
      {
        data: {
          branch: options.branch,
          commit_message: options.commitMessage,
          author_email: options.authorEmail,
          author_name: options.authorName,
        },
      }
    );
  }

  /**
   * 获取分支列表
   */
  async getBranches(projectPath: string): Promise<GitLabBranch[]> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(
      `/projects/${encodedPath}/repository/branches`
    );
    return response.data;
  }

  /**
   * 获取提交列表
   */
  async getCommits(
    projectPath: string,
    options?: {
      refName?: string;
      since?: string;
      until?: string;
      path?: string;
      perPage?: number;
      page?: number;
    }
  ): Promise<GitLabCommit[]> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(
      `/projects/${encodedPath}/repository/commits`,
      {
        params: {
          ref_name: options?.refName,
          since: options?.since,
          until: options?.until,
          path: options?.path,
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      }
    );
    return response.data;
  }

  /**
   * 获取单个提交信息
   */
  async getCommit(projectPath: string, sha: string): Promise<GitLabCommit> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(
      `/projects/${encodedPath}/repository/commits/${sha}`
    );
    return response.data;
  }

  /**
   * 获取文件树
   */
  async getTree(
    projectPath: string,
    options?: {
      path?: string;
      ref?: string;
      recursive?: boolean;
      perPage?: number;
      page?: number;
    }
  ): Promise<GitLabFile[]> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(
      `/projects/${encodedPath}/repository/tree`,
      {
        params: {
          path: options?.path,
          ref: options?.ref ?? 'main',
          recursive: options?.recursive ?? false,
          per_page: options?.perPage ?? 20,
          page: options?.page ?? 1,
        },
      }
    );
    return response.data;
  }

  /**
   * 获取文件差异
   */
  async getDiff(
    projectPath: string,
    from: string,
    to: string
  ): Promise<unknown> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.client.get(
      `/projects/${encodedPath}/repository/compare`,
      {
        params: { from, to },
      }
    );
    return response.data;
  }

  /**
   * 推送 CLAUDE.md 文件
   */
  async pushClaudeMd(
    projectPath: string,
    content: string,
    options?: {
      branch?: string;
      commitMessage?: string;
    }
  ): Promise<GitLabCommit> {
    const branch = options?.branch ?? 'main';
    const commitMessage =
      options?.commitMessage ?? 'docs: update CLAUDE.md from ZhiXing Platform';

    // 检查文件是否存在
    let exists = false;
    try {
      await this.getFile(projectPath, 'CLAUDE.md', { ref: branch });
      exists = true;
    } catch (error) {
      if (error instanceof GitLabError && error.statusCode === 404) {
        exists = false;
      } else {
        throw error;
      }
    }

    if (exists) {
      return this.updateFile(projectPath, 'CLAUDE.md', {
        branch,
        content,
        commitMessage,
      });
    } else {
      return this.createFile(projectPath, 'CLAUDE.md', {
        branch,
        content,
        commitMessage,
      });
    }
  }
}

/**
 * 创建 GitLab 客户端实例
 */
export function createGitLabClient(config?: Partial<GitLabConfig>): GitLabClient {
  const defaultConfig: GitLabConfig = {
    baseUrl: process.env.GITLAB_URL ?? 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN ?? '',
    timeout: 30000,
  };

  return new GitLabClient({
    ...defaultConfig,
    ...config,
  });
}
