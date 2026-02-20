/**
 * 项目注册与领域订阅路由
 * POST /api/projects, PUT /api/projects/:id/subscriptions
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { projectsService } from '../services/projects.js'

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  gitlabPath: z.string().min(1).max(500),
  domainId: z.string().uuid(),
  subscriptions: z.array(z.string().uuid()).default([]),
})

const updateSubscriptionsSchema = z.object({
  subscriptions: z.array(z.string().uuid()),
})

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function projectsRoutes(app: FastifyInstance) {
  // 获取所有项目
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { domainId, page = '1', limit = '20' } =
        request.query as Record<string, string>

      const result = await projectsService.findMany({
        domainId,
        page: parseInt(page),
        limit: parseInt(limit),
      })

      return reply.send({ success: true, data: result })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取项目列表失败' })
    }
  })

  // 获取单个项目
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const project = await projectsService.findById(id)

      if (!project) {
        return reply.status(404).send({ success: false, error: '项目不存在' })
      }

      return reply.send({ success: true, data: project })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取项目失败' })
    }
  })

  // 注册新项目
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user || { id: '00000000-0000-0000-0000-000000000000', role: 'admin' }

      const data = createProjectSchema.parse(request.body)

      const project = await projectsService.create({
        ...data,
        createdBy: user.id,
      })

      return reply.status(201).send({ success: true, data: project })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '创建项目失败' })
    }
  })

  // 更新领域订阅
  app.put('/:id/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const data = updateSubscriptionsSchema.parse(request.body)

      // 检查项目是否存在
      const existing = await projectsService.findById(id)
      if (!existing) {
        return reply.status(404).send({ success: false, error: '项目不存在' })
      }

      const project = await projectsService.updateSubscriptions(id, data.subscriptions)

      return reply.send({ success: true, data: project })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '更新订阅失败' })
    }
  })

  // 删除项目
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)

      const existing = await projectsService.findById(id)
      if (!existing) {
        return reply.status(404).send({ success: false, error: '项目不存在' })
      }

      await projectsService.delete(id)

      return reply.send({ success: true, message: '项目已删除' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '删除项目失败' })
    }
  })
}
