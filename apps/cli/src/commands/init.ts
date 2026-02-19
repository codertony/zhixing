/**
 * zhixing init 命令
 * 检测当前 git 仓库、拉取项目 Spec、生成 CLAUDE.md、写入 MCP 配置
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import inquirer from 'inquirer'
import axios from 'axios'
import { loadConfig, readMcpConfig, writeMcpConfig } from '../config.js'

const config = loadConfig()

async function detectGitRepo(): Promise<{ path: string; name: string } | null> {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    // 解析 GitLab 路径
    const match = remoteUrl.match(/[:/]([^/]+\/[^/]+)\.git$/)
    if (match) {
      return {
        path: match[1],
        name: match[1].split('/').pop() || '',
      }
    }
  } catch {
    // 不是 git 仓库或没有 origin
  }
  return null
}

async function fetchProjectSpec(gitlabPath: string): Promise<{ content: string; version: string } | null> {
  try {
    const response = await axios.get(`${config.apiBaseUrl}/api/projects/by-path/${encodeURIComponent(gitlabPath)}/spec`)
    return response.data
  } catch (error) {
    console.error(chalk.yellow('警告: 无法从平台拉取 Spec，将使用默认模板'))
    return null
  }
}

function generateClaudeMd(spec: { content: string; version: string } | null): string {
  const header = `# CLAUDE.md\n\n> 本文件由知行平台自动生成\n> 版本: ${spec?.version || '1.0.0'}\n> 生成时间: ${new Date().toISOString()}\n\n`

  if (spec?.content) {
    return header + spec.content
  }

  return header + `# 项目规范

## 概述

本项目遵循知行平台的企业级开发规范。

## 编码规范

- 使用 TypeScript/JavaScript 进行开发
- 遵循 ESLint 配置
- 编写单元测试

## 架构决策

- 微服务架构
- RESTful API 设计
- 数据库优先设计

## 知识订阅

- 公司级规范
- 所属领域规范

`
}

function checkLocalVersion(): { exists: boolean; version: string | null } {
  if (existsSync('CLAUDE.md')) {
    const content = readFileSync('CLAUDE.md', 'utf-8')
    const match = content.match(/版本:\s*(.+)/)
    return {
      exists: true,
      version: match?.[1]?.trim() || null,
    }
  }
  return { exists: false, version: null }
}

function setupMcpConfig(projectId: string): void {
  const mcpConfig = readMcpConfig()

  // 添加认知层 MCP Server
  mcpConfig.mcpServers = {
    ...mcpConfig.mcpServers,
    'zhixing-cognitive': {
      command: 'npx',
      args: ['-y', '@zhixing/mcp-server'],
      env: {
        PROJECT_ID: projectId,
        ZHIXING_API_BASE: config.apiBaseUrl,
      },
    },
  }

  writeMcpConfig(mcpConfig)
  console.log(chalk.green('✓ MCP 配置已更新'))
}

export const initCommand = new Command('init')
  .description('初始化当前项目，拉取 Spec 并生成 CLAUDE.md')
  .option('-f, --force', '强制覆盖现有 CLAUDE.md')
  .option('--no-mcp', '跳过 MCP 配置更新')
  .action(async (options) => {
    console.log(chalk.bold('🚀 初始化知行项目...\n'))

    // 1. 检测 git 仓库
    const gitRepo = await detectGitRepo()
    if (!gitRepo) {
      console.error(chalk.red('错误: 当前目录不是 Git 仓库或没有配置 origin'))
      console.log(chalk.gray('提示: 请先执行 git init 并添加 origin remote'))
      process.exit(1)
    }

    console.log(chalk.blue(`检测到 Git 仓库: ${gitRepo.path}`))

    // 2. 从平台拉取 Spec
    const spec = await fetchProjectSpec(gitRepo.path)

    // 3. 检查本地版本
    const localVersion = checkLocalVersion()
    if (localVersion.exists && !options.force) {
      console.log(chalk.yellow(`\n本地 CLAUDE.md 已存在 (版本: ${localVersion.version || 'unknown'})`))
      console.log(chalk.gray(`平台版本: ${spec?.version || '1.0.0'}`))

      const { shouldOverwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldOverwrite',
          message: '是否覆盖本地文件?',
          default: false,
        },
      ])

      if (!shouldOverwrite) {
        console.log(chalk.gray('已取消'))
        return
      }
    }

    // 4. 生成 CLAUDE.md
    const claudeMd = generateClaudeMd(spec)
    writeFileSync('CLAUDE.md', claudeMd)
    console.log(chalk.green('✓ CLAUDE.md 已生成'))

    // 5. 配置 MCP
    if (options.mcp) {
      setupMcpConfig(gitRepo.path)
    }

    console.log(chalk.green('\n✅ 初始化完成!'))
    console.log(chalk.gray('\n下一步:'))
    console.log(chalk.gray('  1. 查看 CLAUDE.md 了解项目规范'))
    console.log(chalk.gray('  2. 运行 zhixing ask "<问题>" 查询代码知识'))
    console.log(chalk.gray('  3. 运行 zhixing skill list 查看可用 Skill'))
  })
