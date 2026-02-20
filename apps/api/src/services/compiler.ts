/**
 * Spec 规则编译服务
 * 实现三层规则编译：公司级 + 领域级 + 项目级
 * 显式 override 优先
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zhixing'
const sql = postgres(DATABASE_URL, { max: 10, idle_timeout: 20 })

export interface CompiledRule {
  ruleId: string
  level: 'company' | 'domain' | 'project'
  source: string
  content: string
  version: number
  isOverride: boolean
  overrideReason?: string
}

export interface CompileResult {
  projectId: string
  projectName: string
  domainId: string
  subscriptions: string[]
  rules: CompiledRule[]
  compiledAt: string
}

export const compilerService = {
  /**
   * 编译项目的 Spec 规则
   * 合并公司级 + 领域级 + 项目级规则，显式 override 优先
   */
  async compileForProject(projectId: string): Promise<CompileResult> {
    // 获取项目信息
    const projects = await sql`
      SELECT id, name, domain_id, subscriptions
      FROM projects
      WHERE id = ${projectId}
    `

    if (projects.length === 0) {
      throw new Error('项目不存在')
    }

    const project = projects[0]
    const domainId = project.domain_id as string
    const subscriptions = (project.subscriptions as string[]) || []

    // 1. 获取公司级规则
    const companyRules = await sql`
      SELECT id, content, version
      FROM spec_rules
      WHERE level = 'company'
      ORDER BY created_at ASC
    `

    // 2. 获取领域级规则（项目所属领域 + 订阅的领域）
    const domainIds = [domainId, ...subscriptions.filter((id: string) => id !== domainId)]
    const domainRules = domainIds.length > 0
      ? await sql`
          SELECT id, domain_id, content, version
          FROM spec_rules
          WHERE level = 'domain' AND domain_id IN ${sql(domainIds)}
          ORDER BY created_at ASC
        `
      : []

    // 3. 获取项目级规则
    const projectRules = await sql`
      SELECT id, content, version
      FROM spec_rules
      WHERE level = 'project' AND project_id = ${projectId}
      ORDER BY created_at ASC
    `

    // 4. 获取项目的 override 记录
    const overrides = await sql`
      SELECT rule_id, reason
      FROM spec_overrides
      WHERE project_id = ${projectId}
    `
    const overrideMap = new Map(overrides.map((o: any) => [o.rule_id, o.reason]))

    // 5. 编译规则（合并三层，显式 override 优先）
    const ruleMap = new Map<string, CompiledRule>()

    // 先添加公司级规则
    for (const rule of companyRules) {
      ruleMap.set(rule.id as string, {
        ruleId: rule.id as string,
        level: 'company',
        source: 'company',
        content: rule.content as string,
        version: rule.version as number,
        isOverride: false,
      })
    }

    // 再添加领域级规则（会覆盖同 ID 的公司级规则）
    for (const rule of domainRules) {
      const ruleId = rule.id as string
      const existing = ruleMap.get(ruleId)

      ruleMap.set(ruleId, {
        ruleId,
        level: 'domain',
        source: `domain:${rule.domain_id}`,
        content: rule.content as string,
        version: rule.version as number,
        isOverride: existing !== undefined,
        overrideReason: overrideMap.get(ruleId),
      })
    }

    // 最后添加项目级规则（会覆盖上层规则）
    for (const rule of projectRules) {
      const ruleId = rule.id as string
      const existing = ruleMap.get(ruleId)

      ruleMap.set(ruleId, {
        ruleId,
        level: 'project',
        source: `project:${projectId}`,
        content: rule.content as string,
        version: rule.version as number,
        isOverride: existing !== undefined,
        overrideReason: overrideMap.get(ruleId),
      })
    }

    return {
      projectId,
      projectName: project.name as string,
      domainId,
      subscriptions,
      rules: Array.from(ruleMap.values()),
      compiledAt: new Date().toISOString(),
    }
  },

  /**
   * 生成 CLAUDE.md 格式的 Spec 文档
   */
  async generateClaudeMd(projectId: string): Promise<string> {
    const compiled = await this.compileForProject(projectId)

    let output = `# ${compiled.projectName} - Spec 规则\n\n`
    output += `编译时间: ${compiled.compiledAt}\n\n`
    output += `订阅领域: ${compiled.subscriptions.join(', ') || '无'}\n\n`
    output += `---\n\n`

    // 按层级分组
    const companyRules = compiled.rules.filter((r) => r.level === 'company')
    const domainRules = compiled.rules.filter((r) => r.level === 'domain')
    const projectRules = compiled.rules.filter((r) => r.level === 'project')

    // 公司级规则
    if (companyRules.length > 0) {
      output += `## 公司级规则\n\n`
      for (const rule of companyRules) {
        output += `### ${rule.ruleId}\n\n`
        if (rule.isOverride) {
          output += `> **注意**: 此规则已被覆盖\n> ${rule.overrideReason || ''}\n\n`
        }
        output += `${rule.content}\n\n`
      }
    }

    // 领域级规则
    if (domainRules.length > 0) {
      output += `## 领域级规则\n\n`
      for (const rule of domainRules) {
        output += `### ${rule.ruleId}\n\n`
        if (rule.isOverride) {
          output += `> **注意**: 此规则覆盖了公司级规则\n> ${rule.overrideReason || ''}\n\n`
        }
        output += `${rule.content}\n\n`
      }
    }

    // 项目级规则
    if (projectRules.length > 0) {
      output += `## 项目级规则\n\n`
      for (const rule of projectRules) {
        output += `### ${rule.ruleId}\n\n`
        if (rule.isOverride) {
          output += `> **注意**: 此规则覆盖了上层规则\n> ${rule.overrideReason || ''}\n\n`
        }
        output += `${rule.content}\n\n`
      }
    }

    return output
  },
}
