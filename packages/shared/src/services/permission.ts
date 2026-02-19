/**
 * 用户权限服务
 */

import { db } from '@zhixing/db';
import { users, userDomains, userProjects, domains, projects } from '@zhixing/db/schema';
import { eq, and } from 'drizzle-orm';
import type { UserRole } from '../types/index.js';

export interface Permission {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

/**
 * 权限服务
 */
export class PermissionService {
  /**
   * 检查用户是否有公司级权限
   */
  async hasCompanyPermission(userId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return false;
    }

    return user.role === 'admin';
  }

  /**
   * 检查用户是否有领域级权限
   */
  async hasDomainPermission(userId: string, domainId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return false;
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 领域管理员检查
    if (user.role === 'domain_admin') {
      const [userDomain] = await db
        .select()
        .from(userDomains)
        .where(and(
          eq(userDomains.userId, userId),
          eq(userDomains.domainId, domainId)
        ))
        .limit(1);

      return !!userDomain;
    }

    return false;
  }

  /**
   * 检查用户是否有项目级权限
   */
  async hasProjectPermission(userId: string, projectId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return false;
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 检查用户项目关联
    const [userProject] = await db
      .select()
      .from(userProjects)
      .where(and(
        eq(userProjects.userId, userId),
        eq(userProjects.projectId, projectId)
      ))
      .limit(1);

    if (userProject) {
      return true;
    }

    // 领域管理员检查
    if (user.role === 'domain_admin') {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

      if (project) {
        return this.hasDomainPermission(userId, project.domainId);
      }
    }

    return false;
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string, resourceId: string, resourceType: 'company' | 'domain' | 'project'): Promise<Permission> {
    const hasAccess = await (resourceType === 'company'
      ? this.hasCompanyPermission(userId)
      : resourceType === 'domain'
        ? this.hasDomainPermission(userId, resourceId)
        : this.hasProjectPermission(userId, resourceId));

    if (!hasAccess) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canManageUsers: false,
      };
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canManageUsers: false,
      };
    }

    // 根据角色返回权限
    const isAdmin = user.role === 'admin';
    const isDomainAdmin = user.role === 'domain_admin';
    const isProjectAdmin = user.role === 'project_admin';

    return {
      canRead: true,
      canWrite: isAdmin || isDomainAdmin || isProjectAdmin,
      canDelete: isAdmin,
      canManageUsers: isAdmin || isDomainAdmin,
    };
  }
}

// 导出单例
export const permissionService = new PermissionService();
