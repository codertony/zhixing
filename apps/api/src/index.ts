/**
 * 知行平台后端 API 服务
 */
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import dotenv from 'dotenv'
import { rulesRoutes } from './routes/rules.js'

dotenv.config()

async function main() {
  const app = Fastify({
    logger: true,
  })

  // 注册插件
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.API_CORS_ORIGIN || 'http://localhost:5173',
  })

  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // API 路由
  app.get('/', async () => {
    return {
      name: 'ZhiXing API',
      version: '0.0.1',
      description: '知行平台后端 API 服务',
    }
  })

  // 注册 Spec 规则路由
  await app.register(rulesRoutes, { prefix: '/api/specs/rules' })

  // 启动服务
  const PORT = parseInt(process.env.API_PORT || '3001')
  const HOST = process.env.API_HOST || '0.0.0.0'

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`API server running on http://${HOST}:${PORT}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()
