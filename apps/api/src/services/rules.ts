/**
 * Spec 规则服务
 * 使用原始 SQL 避免 Drizzle 类型冲突
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'

// 创建数据库连接
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
})

export interface FindManyParams {
  level?: 'company' | 'domain' | 'project'
  domainId?: string
  projectId?: string
  page?: number
  limit?: number
}

export interface CreateRuleInput {
  level: 'company' | 'domain' | 'project'
  domainId?: string
  projectId?: string
  content: string
  createdBy: string
}

export interface UpdateRuleInput {
  content?: string
  updatedBy?: string
}

export const rulesService = {
  /**
   * 获取规则列表
   */
  async findMany(params: FindManyParams) {
    const { level, domainId, projectId, page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    // 构建查询条件
    const conditions: string[] = []
    if (level) conditions.push(`level = '${level}'`)
    if (domainId) conditions.push(`domain_id = '${domainId}'`)
    if (projectId) conditions.push(`project_id = '${projectId}'`)

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const data = await sql`
      SELECT * FROM spec_rules
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM spec_rules ${sql.unsafe(whereClause)}
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
   * 根据 ID 获取规则
   */
  async findById(id: string) {
    const result = await sql`
      SELECT * FROM spec_rules WHERE id = ${id}
    `
    return result[0] || null
  },

  /**
   * 创建规则
   */
  async create(input: CreateRuleInput) {
    const result = await sql`
      INSERT INTO spec_rules (level, domain_id, project_id, content, version, created_by)
      VALUES (${input.level}, ${input.domainId || null}, ${input.projectId || null}, ${input.content}, 1, ${input.createdBy})
      RETURNING *
    `

    const created = result[0]

    // 同时创建版本历史记录
    await sql`
      INSERT INTO rule_versions (rule_id, version, content, created_by)
      VALUES (${created.id}, 1, ${input.content}, ${input.createdBy})
    `

    return created
  },

  /**
   * 更新规则
   */
  async update(id: string, input: UpdateRuleInput) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('规则不存在')
    }

    const newVersion = (existing.version as number) + 1
    const content = input.content || (existing.content as string)
    const updatedBy = input.updatedBy || (existing.created_by as string)

    const result = await sql`
      UPDATE spec_rules
      SET content = ${content}, version = ${newVersion}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // 创建版本历史记录
    await sql`
      INSERT INTO rule_versions (rule_id, version, content, created_by)
      VALUES (${id}, ${newVersion}, ${content}, ${updatedBy})
    `

    return result[0]
  },

  /**
   * 删除规则
   */
  async delete(id: string): Promise<void> {
    await sql`DELETE FROM spec_rules WHERE id = ${id}`
  },
}
