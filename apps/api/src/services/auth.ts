/**
 * 用户权限服务
 * 实现公司级/领域级/项目级角色绑定
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'
const sql = postgres(DATABASE_URL, { max: 10, idle_timeout: 20 })

export type UserRole = 'admin' | 'domain_admin' | 'project_admin' | 'developer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
}

export const authService = {
  /**
   * 创建用户
   */
  async createUser(input: CreateUserInput): Promise<User> {
    // 检查邮箱是否已存在
    const existing = await sql`
      SELECT id FROM users WHERE email = ${input.email}
    `
    if (existing.length > 0) {
      throw new Error('邮箱已存在')
    }

    const result = await sql`
      INSERT INTO users (name, email, role)
      VALUES (${input.name}, ${input.email}, ${input.role})
      RETURNING id, name, email, role, created_at, updated_at
    `

    const user = result[0]
    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      role: user.role as UserRole,
      createdAt: user.created_at as string,
      updatedAt: user.updated_at as string,
    }
  },

  /**
   * 根据 ID 获取用户
   */
  async findById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const user = result[0]
    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      role: user.role as UserRole,
      createdAt: user.created_at as string,
      updatedAt: user.updated_at as string,
    }
  },

  /**
   * 获取所有用户
   */
  async findMany(params: { page?: number; limit?: number } = {}): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    const data = await sql`
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`SELECT COUNT(*) as total FROM users`
    const total = parseInt(countResult[0]?.total as string) || 0

    return {
      data: data.map((user: any) => ({
        id: user.id as string,
        name: user.name as string,
        email: user.email as string,
        role: user.role as UserRole,
        createdAt: user.created_at as string,
        updatedAt: user.updated_at as string,
      })),
      total,
    }
  },

  /**
   * 绑定用户到领域（domain_admin）
   */
  async bindUserToDomain(userId: string, domainId: string): Promise<void> {
    await sql`
      INSERT INTO user_domains (user_id, domain_id)
      VALUES (${userId}, ${domainId})
      ON CONFLICT DO NOTHING
    `
  },

  /**
   * 绑定用户到项目（project_admin/developer）
   */
  async bindUserToProject(userId: string, projectId: string): Promise<void> {
    await sql`
      INSERT INTO user_projects (user_id, project_id)
      VALUES (${userId}, ${projectId})
      ON CONFLICT DO NOTHING
    `
  },

  /**
   * 检查用户是否是领域管理员
   */
  async isDomainAdmin(userId: string, domainId: string): Promise<boolean> {
    const user = await this.findById(userId)
    if (!user) return false

    // admin 拥有所有权限
    if (user.role === 'admin') return true

    // 检查是否是该领域的 domain_admin
    const result = await sql`
      SELECT id FROM user_domains
      WHERE user_id = ${userId} AND domain_id = ${domainId}
    `

    return result.length > 0 && user.role === 'domain_admin'
  },

  /**
   * 检查用户是否是项目成员
   */
  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const user = await this.findById(userId)
    if (!user) return false

    // admin 和 domain_admin 拥有所有权限
    if (user.role === 'admin' || user.role === 'domain_admin') return true

    // 检查是否是该项目的成员
    const result = await sql`
      SELECT id FROM user_projects
      WHERE user_id = ${userId} AND project_id = ${projectId}
    `

    return result.length > 0
  },

  /**
   * 获取用户的领域权限列表
   */
  async getUserDomains(userId: string): Promise<string[]> {
    const result = await sql`
      SELECT domain_id FROM user_domains
      WHERE user_id = ${userId}
    `
    return result.map((r: any) => r.domain_id as string)
  },

  /**
   * 获取用户的项目权限列表
   */
  async getUserProjects(userId: string): Promise<string[]> {
    const result = await sql`
      SELECT project_id FROM user_projects
      WHERE user_id = ${userId}
    `
    return result.map((r: any) => r.project_id as string)
  },
}
