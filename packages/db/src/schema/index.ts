/**
 * 数据库 Schema 定义
 * 使用 Drizzle ORM
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  json,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Spec 规则表
 */
export const specRules = pgTable('spec_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  level: varchar('level', { length: 20 }).notNull(), // company | domain | project
  domainId: uuid('domain_id'),
  projectId: uuid('project_id'),
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Override 记录表
 */
export const specOverrides = pgTable('spec_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id')
    .notNull()
    .references(() => specRules.id),
  projectId: uuid('project_id').notNull(),
  reason: text('reason').notNull(),
  operatorId: uuid('operator_id').notNull(),
  commitSha: varchar('commit_sha', { length: 40 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 领域表
 */
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * 项目注册表
 */
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  gitlabPath: varchar('gitlab_path', { length: 500 }).notNull().unique(),
  domainId: uuid('domain_id')
    .notNull()
    .references(() => domains.id),
  subscriptions: json('subscriptions').notNull().$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Skill 表
 */
export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 30 }).notNull(), // mcp_tool | prompt_template | openspec_template
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  visibility: varchar('visibility', { length: 20 }).notNull(), // company | domain | private
  domainId: uuid('domain_id').references(() => domains.id),
  version: integer('version').notNull().default(1),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * 项目 Skill 订阅表
 */
export const projectSkills = pgTable('project_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 合规上报记录表
 */
export const complianceReports = pgTable('compliance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  scanTime: timestamp('scan_time').notNull(),
  rules: json('rules').notNull().$type<unknown[]>(),
  overrideEvents: json('override_events').notNull().$type<unknown[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 分发记录表
 */
export const distributionLogs = pgTable('distribution_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  triggerReason: varchar('trigger_reason', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // pending | success | failed
  gitlabCommitSha: varchar('gitlab_commit_sha', { length: 40 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 用户表
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull(), // admin | domain_admin | project_admin | developer
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * 用户领域关联表
 */
export const userDomains = pgTable('user_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  domainId: uuid('domain_id')
    .notNull()
    .references(() => domains.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 用户项目关联表
 */
export const userProjects = pgTable('user_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 规则版本历史表
 */
export const ruleVersions = pgTable('rule_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id')
    .notNull()
    .references(() => specRules.id),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * 高频 Override 标记表
 */
export const highFrequencyOverrides = pgTable('high_frequency_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id')
    .notNull()
    .references(() => specRules.id),
  overrideCount: integer('override_count').notNull(),
  timeWindowStart: timestamp('time_window_start').notNull(),
  timeWindowEnd: timestamp('time_window_end').notNull(),
  markedAt: timestamp('marked_at').notNull().defaultNow(),
})

// 导出所有表类型
export type SpecRule = typeof specRules.$inferSelect
export type NewSpecRule = typeof specRules.$inferInsert
export type SpecOverride = typeof specOverrides.$inferSelect
export type NewSpecOverride = typeof specOverrides.$inferInsert
export type Domain = typeof domains.$inferSelect
export type NewDomain = typeof domains.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type ProjectSkill = typeof projectSkills.$inferSelect
export type NewProjectSkill = typeof projectSkills.$inferInsert
export type ComplianceReport = typeof complianceReports.$inferSelect
export type NewComplianceReport = typeof complianceReports.$inferInsert
export type DistributionLog = typeof distributionLogs.$inferSelect
export type NewDistributionLog = typeof distributionLogs.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserDomain = typeof userDomains.$inferSelect
export type NewUserDomain = typeof userDomains.$inferInsert
export type UserProject = typeof userProjects.$inferSelect
export type NewUserProject = typeof userProjects.$inferInsert
export type RuleVersion = typeof ruleVersions.$inferSelect
export type NewRuleVersion = typeof ruleVersions.$inferInsert
export type HighFrequencyOverride = typeof highFrequencyOverrides.$inferSelect
export type NewHighFrequencyOverride = typeof highFrequencyOverrides.$inferInsert
