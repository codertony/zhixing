/**
 * 认证中间件
 */

import { db, projects } from '@zhixing/db';
import { eq } from 'drizzle-orm';

/**
 * 验证项目 Token
 * 简化实现：直接返回项目 ID（生产环境应该使用 JWT 或其他验证方式）
 */
export async function verifyProjectToken(token: string | undefined): Promise<string | null> {
  if (!token) {
    return null;
  }

  try {
    // 简化实现：假设 token 就是项目 ID
    // 生产环境应该验证 JWT 或查询数据库验证 token
    const projectId = token;

    // 验证项目是否存在
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project) {
      return projectId;
    }

    return null;
  } catch (error) {
    console.error('验证项目 Token 失败:', error);
    return null;
  }
}
