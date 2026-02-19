/**
 * 数据库 Migration 初始化脚本
 * 用于手动创建数据库表结构
 */

import { db } from './connection';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('开始执行数据库迁移...');

  try {
    // 创建 uuid-ossp 扩展（用于生成 UUID）
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 创建用户表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建领域表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS domains (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建用户领域关联表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_domains (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        domain_id UUID NOT NULL REFERENCES domains(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建项目表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        gitlab_path VARCHAR(500) NOT NULL UNIQUE,
        domain_id UUID NOT NULL REFERENCES domains(id),
        subscriptions JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建用户项目关联表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        project_id UUID NOT NULL REFERENCES projects(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建 Spec 规则表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spec_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        level VARCHAR(20) NOT NULL,
        domain_id UUID,
        project_id UUID,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建规则版本历史表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rule_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rule_id UUID NOT NULL REFERENCES spec_rules(id),
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建 Override 记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spec_overrides (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rule_id UUID NOT NULL REFERENCES spec_rules(id),
        project_id UUID NOT NULL,
        reason TEXT NOT NULL,
        operator_id UUID NOT NULL REFERENCES users(id),
        commit_sha VARCHAR(40) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建高频 Override 标记表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS high_frequency_overrides (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        rule_id UUID NOT NULL REFERENCES spec_rules(id),
        override_count INTEGER NOT NULL,
        time_window_start TIMESTAMP NOT NULL,
        time_window_end TIMESTAMP NOT NULL,
        marked_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建 Skill 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(30) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        visibility VARCHAR(20) NOT NULL,
        domain_id UUID REFERENCES domains(id),
        version INTEGER NOT NULL DEFAULT 1,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建项目 Skill 订阅表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id),
        skill_id UUID NOT NULL REFERENCES skills(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建合规上报记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS compliance_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id),
        scan_time TIMESTAMP NOT NULL,
        rules JSONB NOT NULL,
        override_events JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建分发记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS distribution_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id),
        trigger_reason VARCHAR(200) NOT NULL,
        status VARCHAR(20) NOT NULL,
        gitlab_commit_sha VARCHAR(40),
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 创建索引
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_spec_rules_level ON spec_rules(level);
      CREATE INDEX IF NOT EXISTS idx_spec_rules_domain_id ON spec_rules(domain_id);
      CREATE INDEX IF NOT EXISTS idx_spec_rules_project_id ON spec_rules(project_id);
      CREATE INDEX IF NOT EXISTS idx_projects_gitlab_path ON projects(gitlab_path);
      CREATE INDEX IF NOT EXISTS idx_distribution_logs_project_id ON distribution_logs(project_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_reports_project_id ON compliance_reports(project_id);
    `);

    console.log('✓ 数据库迁移完成');
  } catch (error) {
    console.error('✗ 数据库迁移失败:', error);
    throw error;
  }
}

// 执行迁移
runMigration()
  .then(() => {
    console.log('迁移脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
