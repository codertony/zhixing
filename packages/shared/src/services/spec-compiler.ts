/**
 * Spec 规则编译服务
 * 负责合并三层规则（公司级 + 领域级 + 项目级）
 */

import { db } from '@zhixing/db';
import { specRules, specOverrides, projects, domains } from '@zhixing/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * 编译后的规则
 */
export interface CompiledRule {
  id: string;
  level: 'company' | 'domain' | 'project';
  content: string;
  source: string;
  overridden?: boolean;
  overrideReason?: string;
}

/**
 * 编译结果
 */
export interface CompilationResult {
  rules: CompiledRule[];
  metadata: {
    projectId: string;
    projectName: string;
    domainId: string;
    domainName: string;
    subscriptions: string[];
    compiledAt: string;
    totalRules: number;
    overriddenRules: number;
  };
}

/**
 * Spec 编译器
 */
export class SpecCompiler {
  /**
   * 为项目编译完整的规则集
   */
  async compileForProject(projectId: string): Promise<CompilationResult> {
    // 获取项目信息
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // 获取领域信息
    const [domain] = await db.select().from(domains).where(eq(domains.id, project.domainId)).limit(1);

    if (!domain) {
      throw new Error(`Domain not found: ${project.domainId}`);
    }

    // 收集所有规则
    const rules: CompiledRule[] = [];
    let overriddenCount = 0;

    // 1. 获取公司级规则
    const companyRules = await db
      .select()
      .from(specRules)
      .where(eq(specRules.level, 'company'));

    for (const rule of companyRules) {
      // 检查是否被 override
      const [override] = await db
        .select()
        .from(specOverrides)
        .where(and(
          eq(specOverrides.ruleId, rule.id),
          eq(specOverrides.projectId, projectId)
        ))
        .limit(1);

      if (override) {
        overriddenCount++;
        continue; // 跳过被 override 的公司级规则
      }

      rules.push({
        id: rule.id,
        level: 'company',
        content: rule.content,
        source: 'company',
      });
    }

    // 2. 获取领域级规则（项目所属领域 + 订阅领域）
    const subscribedDomainIds = project.subscriptions as string[];
    const allDomainIds = [project.domainId, ...subscribedDomainIds];

    const domainRules = await db
      .select()
      .from(specRules)
      .where(and(
        eq(specRules.level, 'domain'),
        inArray(specRules.domainId, allDomainIds)
      ));

    for (const rule of domainRules) {
      // 检查是否被 override
      const [override] = await db
        .select()
        .from(specOverrides)
        .where(and(
          eq(specOverrides.ruleId, rule.id),
          eq(specOverrides.projectId, projectId)
        ))
        .limit(1);

      if (override) {
        overriddenCount++;
        continue;
      }

      rules.push({
        id: rule.id,
        level: 'domain',
        content: rule.content,
        source: domain.name,
        domainId: rule.domainId!,
      });
    }

    // 3. 获取项目级规则
    const projectRules = await db
      .select()
      .from(specRules)
      .where(and(
        eq(specRules.level, 'project'),
        eq(specRules.projectId, projectId)
      ));

    for (const rule of projectRules) {
      rules.push({
        id: rule.id,
        level: 'project',
        content: rule.content,
        source: project.name,
      });
    }

    return {
      rules,
      metadata: {
        projectId,
        projectName: project.name,
        domainId: project.domainId,
        domainName: domain.name,
        subscriptions: project.subscriptions as string[],
        compiledAt: new Date().toISOString(),
        totalRules: rules.length,
        overriddenRules: overriddenCount,
      },
    };
  }

  /**
   * 生成 CLAUDE.md 内容
   */
  async generateClaudeMd(projectId: string): Promise<string> {
    const compilation = await this.compileForProject(projectId);

    let content = `# 项目规范 (CLAUDE.md)

> 此文件由知行平台自动生成
> 生成时间: ${compilation.metadata.compiledAt}
> 项目: ${compilation.metadata.projectName}
> 领域: ${compilation.metadata.domainName}

## 概述

- 总规则数: ${compilation.metadata.totalRules}
- 已覆盖规则: ${compilation.metadata.overriddenRules}

---

`;

    // 按层级分组
    const companyRules = compilation.rules.filter(r => r.level === 'company');
    const domainRules = compilation.rules.filter(r => r.level === 'domain');
    const projectRules = compilation.rules.filter(r => r.level === 'project');

    // 公司级规则
    if (companyRules.length > 0) {
      content += `## 公司级规范\n\n`;
      for (const rule of companyRules) {
        content += `### 规则 ${rule.id}\n\n${rule.content}\n\n---\n\n`;
      }
    }

    // 领域级规则
    if (domainRules.length > 0) {
      content += `## 领域级规范\n\n`;
      for (const rule of domainRules) {
        content += `### 规则 ${rule.id} (来源: ${rule.source})\n\n${rule.content}\n\n---\n\n`;
      }
    }

    // 项目级规则
    if (projectRules.length > 0) {
      content += `## 项目级规范\n\n`;
      for (const rule of projectRules) {
        content += `### 规则 ${rule.id}\n\n${rule.content}\n\n---\n\n`;
      }
    }

    // 订阅领域
    if (compilation.metadata.subscriptions.length > 0) {
      content += `## 订阅领域\n\n`;
      for (const domainId of compilation.metadata.subscriptions) {
        content += `- ${domainId}\n`;
      }
    }

    return content;
  }
}

// 导出单例
export const specCompiler = new SpecCompiler();
