/**
 * Spec 规则层级
 */
export type SpecLevel = 'company' | 'domain' | 'project';

/**
 * Skill 类型
 */
export type SkillType = 'mcp_tool' | 'prompt_template' | 'openspec_template';

/**
 * Skill 可见性
 */
export type SkillVisibility = 'company' | 'domain' | 'private';

/**
 * 分发状态
 */
export type DistributionStatus = 'pending' | 'success' | 'failed';

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'domain_admin' | 'project_admin' | 'developer';

/**
 * Spec 规则
 */
export interface SpecRule {
  id: string;
  level: SpecLevel;
  domainId?: string;
  projectId?: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Override 记录
 */
export interface SpecOverride {
  id: string;
  ruleId: string;
  projectId: string;
  reason: string;
  operatorId: string;
  commitSha: string;
  createdAt: Date;
}

/**
 * 项目
 */
export interface Project {
  id: string;
  name: string;
  gitlabPath: string;
  domainId: string;
  subscriptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill
 */
export interface Skill {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  content: string;
  visibility: SkillVisibility;
  domainId?: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 合规报告
 */
export interface ComplianceReport {
  id: string;
  projectId: string;
  scanTime: Date;
  rules: string[];
  overrideEvents: SpecOverride[];
  createdAt: Date;
}

/**
 * 分发记录
 */
export interface DistributionLog {
  id: string;
  projectId: string;
  triggerReason: string;
  status: DistributionStatus;
  gitlabCommitSha?: string;
  errorMessage?: string;
  createdAt: Date;
}

/**
 * 用户
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  domainIds?: string[];
  projectIds?: string[];
  createdAt: Date;
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
