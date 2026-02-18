/**
 * 数据库连接管理
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// 创建 PostgreSQL 连接
const connection = postgres(DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// 创建 Drizzle ORM 实例
export const db = drizzle(connection, { schema });

// 导出连接以便关闭
export { connection };

/**
 * 关闭数据库连接
 */
export async function closeConnection(): Promise<void> {
  await connection.end();
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await connection`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
