/**
 * Git 工具函数
 */

import { execSync } from 'child_process'
import axios from 'axios'
import { loadConfig } from '../config.js'

const config = loadConfig()

/**
 * 检测当前目录的项目 ID
 */
export async function detectProjectId(): Promise<string | null> {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    // 解析 GitLab 路径
    const match = remoteUrl.match(/[:/]([^/]+\/[^/]+)\.git$/)
    if (match) {
      const path = match[1]
      // 从 API 获取项目 ID
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}/api/projects/by-path/${encodeURIComponent(path)}`
        )
        return response.data.id
      } catch {
        return path // 返回路径作为备用 ID
      }
    }
  } catch {
    // 不是 git 仓库
  }
  return null
}

/**
 * 获取当前分支
 */
export function getCurrentBranch(): string | null {
  try {
    return execSync('git branch --show-current', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * 获取最近 commit SHA
 */
export function getLastCommitSha(): string | null {
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}
