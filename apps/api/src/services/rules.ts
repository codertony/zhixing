/**
 * Spec 规则服务
 * 使用原始 SQL 避免 Drizzle 类型冲突
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'

// 数据库连接状态
let isConnected = false
let connectionError: Error | null = null

// 创建数据库连接
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
})

// 测试数据库连接
async function checkConnection(): Promise<boolean> {
  if (isConnected) return true
  try {
    await sql`SELECT 1`
    isConnected = true
    connectionError = null
    return true
  } catch (error) {
    isConnected = false
    connectionError = error as Error
    return false
  }
}

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

// 模拟数据（当数据库不可用时使用）
const mockRules = [
  {
    id: 'mock-1',
    level: 'company',
    content: '# 公司级规范\n\n这是示例公司规范（数据库未连接）',
    version: 1,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const rulesService = {
  /**
   * 检查数据库连接状态
   */
  async healthCheck(): Promise<{ connected: boolean; error?: string }> {
    const connected = await checkConnection()
    return {
      connected,
      error: connectionError ? connectionError.message : undefined,
    }
  },

  /**
   * 获取规则列表
   */
  async findMany(params: FindManyParams) {
    const connected = await checkConnection()
    const { level, domainId, projectId, page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    // 如果数据库未连接，返回模拟数据
    if (!connected) {
      return {
        data: mockRules,
        total: mockRules.length,
        page,
        limit,
        totalPages: 1,
        _warning: '数据库未连接，显示模拟数据',
      }
    }

    try {
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
    } catch (error) {
      console.error('查询规则失败:', error)
      throw new Error('获取规则列表失败')
    }
  },

  /**
   * 根据 ID 获取规则
   */
  async findById(id: string) {
    const connected = await checkConnection()
    if (!connected) {
      return mockRules.find(r => r.id === id) || null
    }

    try {
      const result = await sql`
        SELECT * FROM spec_rules WHERE id = ${id}
      `
      return result[0] || null
    } catch (error) {
      console.error('查询规则失败:', error)
      throw new Error('获取规则失败')
    }
  },

  /**
   * 创建规则
   */
  async create(input: CreateRuleInput) {
    const connected = await checkConnection()
    if (!connected) {
      throw new Error('数据库未连接，无法创建规则')
    }

    try {
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
    } catch (error) {
      console.error('创建规则失败:', error)
      throw new Error('创建规则失败')
    }
  },

  /**
   * 更新规则
   */
  async update(id: string, input: UpdateRuleInput) {
    const connected = await checkConnection()
    if (!connected) {
      throw new Error('数据库未连接，无法更新规则')
    }

    try {
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
    } catch (error) {
      console.error('更新规则失败:', error)
      throw new Error('更新规则失败')
    }
  },

  /**
   * 删除规则
   */
  async delete(id: string): Promise<void> {
    const connected = await checkConnection()
    if (!connected) {
      throw new Error('数据库未连接，无法删除规则')
    }

    try {
      await sql`DELETE FROM spec_rules WHERE id = ${id}`
    } catch (error) {
      console.error('删除规则失败:', error)
      throw new Error('删除规则失败')
    }
  },

  /**
   * 获取规则版本历史
   */
  async getVersionHistory(ruleId: string) {
    const connected = await checkConnection()
    if (!connected) {
      return []
    }

    try {
      const history = await sql`
        SELECT id, rule_id, version, content, created_by, created_at
        FROM rule_versions
        WHERE rule_id = ${ruleId}
        ORDER BY version DESC
      `
      return history
    } catch (error) {
      console.error('获取版本历史失败:', error)
      throw new Error('获取版本历史失败')
    }
  },
}
