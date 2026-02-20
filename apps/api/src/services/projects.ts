/**
 * 项目注册与领域订阅服务
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'
const sql = postgres(DATABASE_URL, { max: 10, idle_timeout: 20 })

export interface FindManyParams {
  domainId?: string
  page?: number
  limit?: number
}

export interface CreateProjectInput {
  name: string
  gitlabPath: string
  domainId: string
  subscriptions: string[]
  createdBy: string
}

export const projectsService = {
  /**
   * 获取项目列表
   */
  async findMany(params: FindManyParams) {
    const { domainId, page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    let whereClause = ''
    if (domainId) {
      whereClause = `WHERE domain_id = '${domainId}'`
    }

    const data = await sql`
      SELECT id, name, gitlab_path, domain_id, subscriptions, created_at, updated_at
      FROM projects
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM projects ${sql.unsafe(whereClause)}
    `

    const total = parseInt(countResult[0]?.total as string) || 0

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  /**
   * 根据 ID 获取项目
   */
  async findById(id: string) {
    const result = await sql`
      SELECT id, name, gitlab_path, domain_id, subscriptions, created_at, updated_at
      FROM projects
      WHERE id = ${id}
    `
    return result[0] || null
  },

  /**
   * 创建项目
   */
  async create(input: CreateProjectInput) {
    // 检查 gitlabPath 是否已存在
    const existing = await sql`
      SELECT id FROM projects WHERE gitlab_path = ${input.gitlabPath}
    `
    if (existing.length > 0) {
      throw new Error('GitLab 路径已存在')
    }

    const result = await sql`
      INSERT INTO projects (name, gitlab_path, domain_id, subscriptions)
      VALUES (${input.name}, ${input.gitlabPath}, ${input.domainId}, ${JSON.stringify(input.subscriptions)})
      RETURNING *
    `

    return result[0]
  },

  /**
   * 更新领域订阅
   */
  async updateSubscriptions(id: string, subscriptions: string[]) {
    const result = await sql`
      UPDATE projects
      SET subscriptions = ${JSON.stringify(subscriptions)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error('项目不存在')
    }

    return result[0]
  },

  /**
   * 删除项目
   */
  async delete(id: string): Promise<void> {
    await sql`DELETE FROM projects WHERE id = ${id}`
  },
}
