#!/usr/bin/env node

/**
 * 知行 CLI - zhixing
 * AI 编程智能体命令行工具
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { initCommand } from './commands/init.js'
import { askCommand } from './commands/ask.js'
import { skillCommand } from './commands/skill.js'

// 配置加载函数（内联实现以避免模块导入问题）
function loadConfig() {
  return {
    apiUrl: process.env.ZHIXING_API_URL || 'http://localhost:3000',
    projectId: process.env.ZHIXING_PROJECT_ID,
  }
}

const program = new Command()

// 加载配置
const config = loadConfig()

// 设置 CLI 基本信息
program
  .name('zhixing')
  .description('知行 AI 编程智能体 CLI - ZhiXing CogniAction OS')
  .version('0.1.0')
  .option('-v, --verbose', '启用详细输出')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts()
    if (options.verbose) {
      console.log(chalk.gray('详细模式已启用'))
    }
  })

// 注册命令
program.addCommand(initCommand)
program.addCommand(askCommand)
program.addCommand(skillCommand)

// 帮助信息增强
program.on('--help', () => {
  console.log('')
  console.log(chalk.bold('示例:'))
  console.log('  $ zhixing init                    # 初始化当前项目')
  console.log('  $ zhixing ask "订单模块在哪里"     # 认知层问答')
  console.log('  $ zhixing skill list              # 列出可用 Skill')
  console.log('  $ zhixing skill add code-review   # 订阅 Skill')
  console.log('')
  console.log(chalk.bold('文档:'))
  console.log('  https://zhixing.docs.local/cli')
})

// 解析命令行参数
program.parse()
