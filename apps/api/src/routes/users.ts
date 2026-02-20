/**
 * 用户权限路由
 * 用户管理和权限绑定
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authService, type UserRole } from '../services/auth.js'

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  role: z.enum(['admin', 'domain_admin', 'project_admin', 'developer'] as const),
})

const bindDomainSchema = z.object({
  domainId: z.string().uuid(),
})

const bindProjectSchema = z.object({
  projectId: z.string().uuid(),
})

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function usersRoutes(app: FastifyInstance) {
  // 获取所有用户
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = '1', limit = '20' } = request.query as Record<string, string>

      const result = await authService.findMany({
        page: parseInt(page),
        limit: parseInt(limit),
      })

      return reply.send({ success: true, data: result })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取用户列表失败' })
    }
  })

  // 获取单个用户
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const user = await authService.findById(id)

      if (!user) {
        return reply.status(404).send({ success: false, error: '用户不存在' })
      }

      return reply.send({ success: true, data: user })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取用户失败' })
    }
  })

  // 创建用户
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createUserSchema.parse(request.body)

      const user = await authService.createUser({
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
      })

      return reply.status(201).send({ success: true, data: user })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      if (error instanceof Error && error.message === '邮箱已存在') {
        return reply.status(409).send({ success: false, error: error.message })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '创建用户失败' })
    }
  })

  // 绑定用户到领域
  app.post('/:id/domains', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const data = bindDomainSchema.parse(request.body)

      // 检查用户是否存在
      const user = await authService.findById(id)
      if (!user) {
        return reply.status(404).send({ success: false, error: '用户不存在' })
      }

      await authService.bindUserToDomain(id, data.domainId)

      return reply.send({ success: true, message: '用户已绑定到领域' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '绑定领域失败' })
    }
  })

  // 绑定用户到项目
  app.post('/:id/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const data = bindProjectSchema.parse(request.body)

      // 检查用户是否存在
      const user = await authService.findById(id)
      if (!user) {
        return reply.status(404).send({ success: false, error: '用户不存在' })
      }

      await authService.bindUserToProject(id, data.projectId)

      return reply.send({ success: true, message: '用户已绑定到项目' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '绑定项目失败' })
    }
  })
}
