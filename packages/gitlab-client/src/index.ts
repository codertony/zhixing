/**
 * GitLab API 客户端
 */
import axios, { AxiosInstance } from 'axios'

export interface GitLabConfig {
  url: string
  token: string
}

export class GitLabClient {
  private client: AxiosInstance

  constructor(config: GitLabConfig) {
    this.client = axios.create({
      baseURL: `${config.url}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': config.token,
      },
    })
  }

  /**
   * 获取仓库文件内容
   */
  async getFile(projectId: string, filePath: string, ref = 'main') {
    const response = await this.client.get(
      `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
      {
        params: { ref },
      }
    )
    return response.data
  }

  /**
   * 提交文件到仓库
   */
  async commitFile(
    projectId: string,
    filePath: string,
    content: string,
    message: string,
    branch = 'main'
  ) {
    const response = await this.client.post(
      `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
      {
        branch,
        content,
        commit_message: message,
      }
    )
    return response.data
  }

  /**
   * 获取项目信息
   */
  async getProject(projectId: string) {
    const response = await this.client.get(
      `/projects/${encodeURIComponent(projectId)}`
    )
    return response.data
  }
}

export { GitLabClient as default }
