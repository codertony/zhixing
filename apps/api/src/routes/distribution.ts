/**
 * Spec 分发路由
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { distributorService } from '../services/distributor.js'

const distributeSchema = z.object({
  projectId: z.string().uuid(),
  triggerReason: z.string().min(1),
})

const paramsSchema = z.object({
  projectId: z.string().uuid(),
})

export async function distributionRoutes(app: FastifyInstance) {
  // 手动触发分发
  app.post('/distribute', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = distributeSchema.parse(request.body)

      const result = await distributorService.distribute(data)

      if (result.status === 'failed') {
        return reply.status(500).send({
          success: false,
          error: result.errorMessage,
        })
      }

      return reply.send({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: '请求参数错误',
          details: error.errors,
        })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '分发失败' })
    }
  })

  // 获取项目分发历史
  app.get('/history/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = paramsSchema.parse(request.params)
      const { limit = '10' } = request.query as Record<string, string>

      const history = await distributorService.getDistributionHistory(
        projectId,
        parseInt(limit)
      )

      return reply.send({ success: true, data: history })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的ID格式' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '获取历史失败' })
    }
  })
}
