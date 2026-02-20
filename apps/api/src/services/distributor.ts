/**
 * Spec 分发引擎服务
 * 实现 CLAUDE.md 生成和 GitLab 推送
 */
import postgres from 'postgres'
import { GitLabClient } from '@zhixing/gitlab-client'
import { compilerService } from './compiler.js'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'
const sql = postgres(DATABASE_URL, { max: 10, idle_timeout: 20 })

// GitLab 配置
const gitlabConfig = {
  url: process.env.GITLAB_URL || 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN || '',
}

export interface DistributionTask {
  projectId: string
  triggerReason: string
}

export interface DistributionResult {
  projectId: string
  status: 'success' | 'failed'
  commitSha?: string
  errorMessage?: string
}

export const distributorService = {
  /**
   * 分发 Spec 到项目
   * 生成 CLAUDE.md 并推送到 GitLab
   */
  async distribute(params: DistributionTask): Promise<DistributionResult> {
    const { projectId, triggerReason } = params

    try {
      // 1. 获取项目信息
      const projects = await sql`
        SELECT id, name, gitlab_path FROM projects WHERE id = ${projectId}
      `

      if (projects.length === 0) {
        throw new Error('项目不存在')
      }

      const project = projects[0]
      const gitlabPath = project.gitlab_path as string

      // 2. 生成 CLAUDE.md
      const claudeMd = await compilerService.generateClaudeMd(projectId)

      // 3. 推送到 GitLab
      const gitlab = new GitLabClient(gitlabConfig)

      // 提取 commit message
      const commitMessage = `chore: 更新 CLAUDE.md\n\n${triggerReason}\n\n由知行平台自动分发`

      // 推送文件到 GitLab
      const result = await gitlab.commitFile(
        gitlabPath,
        'CLAUDE.md',
        claudeMd,
        commitMessage,
        'main'
      )

      // 4. 记录分发日志
      const commitSha = result.last_commit?.id || result.content?.head_commit?.id

      await sql`
        INSERT INTO distribution_logs (project_id, trigger_reason, status, gitlab_commit_sha)
        VALUES (${projectId}, ${triggerReason}, 'success', ${commitSha})
      `

      return {
        projectId,
        status: 'success',
        commitSha,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'

      // 记录失败日志
      await sql`
        INSERT INTO distribution_logs (project_id, trigger_reason, status, error_message)
        VALUES (${projectId}, ${triggerReason}, 'failed', ${errorMessage})
      `

      return {
        projectId,
        status: 'failed',
        errorMessage,
      }
    }
  },

  /**
   * 分发到所有受影响的项目
   */
  async distributeToAllAffected(ruleId: string, triggerReason: string): Promise<DistributionResult[]> {
    // 获取规则信息
    const rules = await sql`
      SELECT level, domain_id, project_id FROM spec_rules WHERE id = ${ruleId}
    `

    if (rules.length === 0) {
      throw new Error('规则不存在')
    }

    const rule = rules[0]
    const level = rule.level as string
    const domainId = rule.domain_id as string | null
    const projectId = rule.project_id as string | null

    let affectedProjects: string[] = []

    if (level === 'company') {
      // 公司级规则影响所有项目
      const allProjects = await sql`SELECT id FROM projects`
      affectedProjects = allProjects.map((p: any) => p.id as string)
    } else if (level === 'domain' && domainId) {
      // 领域级规则影响该领域的项目和订阅了该领域的项目
      const domainProjects = await sql`
        SELECT id FROM projects
        WHERE domain_id = ${domainId}
        OR subscriptions::jsonb ? ${domainId}
      `
      affectedProjects = domainProjects.map((p: any) => p.id as string)
    } else if (level === 'project' && projectId) {
      // 项目级规则只影响该项目
      affectedProjects = [projectId]
    }

    // 去重
    affectedProjects = [...new Set(affectedProjects)]

    // 分发到所有受影响的项目
    const results: DistributionResult[] = []
    for (const pid of affectedProjects) {
      // 带重试逻辑
      const result = await this.distributeWithRetry({
        projectId: pid,
        triggerReason,
      })
      results.push(result)
    }

    return results
  },

  /**
   * 带重试的分发
   */
  async distributeWithRetry(
    params: DistributionTask,
    maxRetries = 3
  ): Promise<DistributionResult> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.distribute(params)

        if (result.status === 'success') {
          return result
        }

        // 失败但还有机会重试
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // 指数退避
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误')

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    return {
      projectId: params.projectId,
      status: 'failed',
      errorMessage: lastError?.message || `重试 ${maxRetries} 次后仍失败`,
    }
  },

  /**
   * 获取分发历史
   */
  async getDistributionHistory(projectId: string, limit = 10) {
    const history = await sql`
      SELECT id, project_id, trigger_reason, status, gitlab_commit_sha, error_message, created_at
      FROM distribution_logs
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return history
  },
}
