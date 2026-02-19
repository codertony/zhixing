/**
 * zhixing skill 命令
 * 列出平台可用 Skill 并订阅
 */

import { Command } from 'commander'
import chalk from 'chalk'
import axios from 'axios'
import inquirer from 'inquirer'
import { loadConfig, readMcpConfig, writeMcpConfig } from '../config.js'
import { detectProjectId } from '../utils/git.js'

const config = loadConfig()

// Skill 列表命令
const listCommand = new Command('list')
  .description('列出平台可用 Skill')
  .option('-t, --type <type>', '按类型过滤: mcp_tool | prompt_template | openspec_template')
  .action(async (options) => {
    try {
      const params = options.type ? { type: options.type } : undefined
      const response = await axios.get(`${config.apiBaseUrl}/api/skills`, { params })
      const skills = response.data

      if (skills.length === 0) {
        console.log(chalk.yellow('暂无可用 Skill'))
        return
      }

      console.log(chalk.bold(`\n📦 可用 Skill (${skills.length}):\n`))

      skills.forEach((skill: {
        name: string
        type: string
        description: string
        visibility: string
        version: number
      }) => {
        const typeColor = skill.type === 'mcp_tool' ? chalk.blue :
                          skill.type === 'prompt_template' ? chalk.green : chalk.magenta
        console.log(chalk.bold(`${skill.name}`) + chalk.gray(` v${skill.version}`))
        console.log(typeColor(`  [${skill.type}]`) + chalk.gray(` ${skill.visibility}`))
        console.log(chalk.gray(`  ${skill.description}\n`))
      })

      console.log(chalk.gray('提示: 使用 `zhixing skill add <name>` 订阅 Skill'))
    } catch (error) {
      console.error(chalk.red('获取 Skill 列表失败:'), error)
      process.exit(1)
    }
  })

// Skill 订阅命令
const addCommand = new Command('add')
  .description('订阅 Skill 到当前项目')
  .argument('<name>', 'Skill 名称')
  .action(async (name) => {
    try {
      // 获取项目 ID
      const projectId = await detectProjectId()
      if (!projectId) {
        console.error(chalk.red('错误: 无法确定项目 ID'))
        process.exit(1)
      }

      // 获取 Skill 详情
      const response = await axios.get(`${config.apiBaseUrl}/api/skills`)
      const skills = response.data
      const skill = skills.find((s: { name: string }) => s.name === name)

      if (!skill) {
        console.error(chalk.red(`错误: Skill "${name}" 不存在`))
        console.log(chalk.gray('使用 `zhixing skill list` 查看可用 Skill'))
        process.exit(1)
      }

      console.log(chalk.bold(`\n📦 Skill: ${skill.name}`))
      console.log(chalk.gray(`   ${skill.description}\n`))

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '确认订阅此 Skill?',
        default: true,
      }])

      if (!confirm) {
        console.log(chalk.gray('已取消'))
        return
      }

      // 调用 API 订阅 Skill
      await axios.post(`${config.apiBaseUrl}/api/projects/${projectId}/skills`, {
        skillId: skill.id,
      })

      // 更新本地 MCP 配置
      if (skill.type === 'mcp_tool') {
        const mcpConfig = readMcpConfig()
        const mcpServers = (mcpConfig.mcpServers as Record<string, unknown> | undefined) || {}
        mcpConfig.mcpServers = {
          ...mcpServers,
          [`skill-${skill.name}`]: {
            command: 'npx',
            args: ['-y', `@zhixing/skill-${skill.name}`],
          },
        }
        writeMcpConfig(mcpConfig)
      }

      console.log(chalk.green(`\n✓ Skill "${name}" 已订阅`))
      console.log(chalk.gray('重新启动 Claude Code 以使用新 Skill'))
    } catch (error) {
      console.error(chalk.red('订阅失败:'), error)
      process.exit(1)
    }
  })

// Skill 主命令
export const skillCommand = new Command('skill')
  .description('管理项目 Skill 订阅')
  .addCommand(listCommand)
  .addCommand(addCommand)
