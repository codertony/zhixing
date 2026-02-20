/**
 * Spec 规则路由
 * GET/POST/PUT/DELETE /api/specs/rules
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { rulesService } from '../services/rules.js'

// 验证模式
const createRuleSchema = z.object({
  level: z.enum(['company', 'domain', 'project']),
  domainId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  content: z.string().min(1),
})

const updateRuleSchema = z.object({
  content: z.string().min(1),
})

const paramsSchema = z.object({
  id: z.string().uuid(),
})

// 扩展 Fastify 请求类型以支持用户
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      role: string
    }
  }
}

export async function rulesRoutes(app: FastifyInstance) {
  // 获取所有规则（支持分页和过滤）
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { level, domainId, projectId, page = '1', limit = '20' } =
        request.query as Record<string, string>

      const result = await rulesService.findMany({
        level: level as any,
        domainId,
        projectId,
        page: parseInt(page),
        limit: parseInt(limit),
      })

      return reply.send({ success: true, data: result })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取规则列表失败' })
    }
  })

  // 获取单个规则
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = paramsSchema.parse(request.params)
      const rule = await rulesService.findById(id)

      if (!rule) {
        return reply.status(404).send({ success: false, error: '规则不存在' })
      }

      return reply.send({ success: true, data: rule })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取规则失败' })
    }
  })

  // 创建规则
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // TODO: 权限检查 - 只有特定角色可以创建公司级/领域级规则
      const user = request.user || { id: '00000000-0000-0000-0000-000000000000', role: 'admin' }

      const data = createRuleSchema.parse(request.body)

      // 权限校验
      if (data.level === 'company' && user.role !== 'admin') {
        return reply.status(403).send({ success: false, error: '无权创建公司级规则' })
      }

      if (data.level === 'domain' && !['admin', 'domain_admin'].includes(user.role)) {
        return reply.status(403).send({ success: false, error: '无权创建领域级规则' })
      }

      const rule = await rulesService.create({
        ...data,
        createdBy: user.id,
      })

      return reply.status(201).send({ success: true, data: rule })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '创建规则失败' })
    }
  })

  // 更新规则
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user || { id: '00000000-0000-0000-0000-000000000000', role: 'admin' }
      const { id } = paramsSchema.parse(request.params)
      const data = updateRuleSchema.parse(request.body)

      // 获取现有规则进行权限检查
      const existingRule = await rulesService.findById(id)
      if (!existingRule) {
        return reply.status(404).send({ success: false, error: '规则不存在' })
      }

      // 权限校验
      if (existingRule.level === 'company' && user.role !== 'admin') {
        return reply.status(403).send({ success: false, error: '无权更新公司级规则' })
      }

      const rule = await rulesService.update(id, {
        ...data,
        updatedBy: user.id,
      })

      return reply.send({ success: true, data: rule })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '更新规则失败' })
    }
  })

  // 删除规则
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user || { id: '00000000-0000-0000-0000-000000000000', role: 'admin' }
      const { id } = paramsSchema.parse(request.params)

      // 获取现有规则进行权限检查
      const existingRule = await rulesService.findById(id)
      if (!existingRule) {
        return reply.status(404).send({ success: false, error: '规则不存在' })
      }

      // 权限校验
      if (existingRule.level === 'company' && user.role !== 'admin') {
        return reply.status(403).send({ success: false, error: '无权删除公司级规则' })
      }

      if (existingRule.level === 'domain' && !['admin', 'domain_admin'].includes(user.role)) {
        return reply.status(403).send({ success: false, error: '无权删除领域级规则' })
      }

      await rulesService.delete(id)

      return reply.send({ success: true, message: '规则已删除' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '删除规则失败' })
    }
  })
}
