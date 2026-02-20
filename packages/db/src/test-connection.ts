/**
 * 数据库连接测试脚本
 */
import { healthCheck, closeConnection } from './connection/index.js'

async function testConnection() {
  console.log('Testing database connection...')

  const isHealthy = await healthCheck()

  if (isHealthy) {
    console.log('Database connection is healthy')
  } else {
    console.error('Database connection failed')
    process.exit(1)
  }

  await closeConnection()
}

testConnection()
