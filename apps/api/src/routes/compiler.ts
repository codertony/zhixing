/**
 * Spec 规则编译路由
 * GET /api/specs/compile/:projectId
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { compilerService } from '../services/compiler.js'

const paramsSchema = z.object({
  projectId: z.string().uuid(),
})

export async function compilerRoutes(app: FastifyInstance) {
  // 编译项目 Spec 规则
  app.get('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = paramsSchema.parse(request.params)

      const result = await compilerService.compileForProject(projectId)

      return reply.send({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的项目ID格式' })
      }
      if (error instanceof Error && error.message === '项目不存在') {
        return reply.status(404).send({ success: false, error: '项目不存在' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '编译规则失败' })
    }
  })

  // 生成 CLAUDE.md
  app.get('/:projectId/claude-md', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = paramsSchema.parse(request.params)

      const content = await compilerService.generateClaudeMd(projectId)

      reply.header('Content-Type', 'text/markdown')
      return reply.send(content)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: '无效的项目ID格式' })
      }
      if (error instanceof Error && error.message === '项目不存在') {
        return reply.status(404).send({ success: false, error: '项目不存在' })
      }
      request.log.error(error)
      return reply.status(500).send({ success: false, error: '生成 CLAUDE.md 失败' })
    }
  })
}
