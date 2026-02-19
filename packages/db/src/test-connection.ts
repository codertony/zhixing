/**
 * 数据库连接测试脚本
 */

import { db, closeConnection, healthCheck } from './connection';

async function testConnection() {
  console.log('测试数据库连接...');

  try {
    const isHealthy = await healthCheck();

    if (isHealthy) {
      console.log('✓ 数据库连接正常');

      // 测试查询
      const result = await db.execute(sql`SELECT NOW() as current_time`);
      console.log('✓ 查询测试成功:', result[0]);

      return true;
    } else {
      console.error('✗ 数据库连接检查失败');
      return false;
    }
  } catch (error) {
    console.error('✗ 数据库连接测试失败:', error);
    return false;
  } finally {
    await closeConnection();
  }
}

import { sql } from 'drizzle-orm';

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
