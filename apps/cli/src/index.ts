#!/usr/bin/env node
/**
 * 知行平台 CLI 智能体
 */
import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('zhixing')
  .description('知行平台 CLI 智能体')
  .version('0.0.1')

// init 命令
program
  .command('init')
  .description('初始化项目，生成 CLAUDE.md')
  .action(async () => {
    console.log(chalk.blue('正在初始化项目...'))
    console.log(chalk.green('项目初始化完成'))
  })

// ask 命令
program
  .command('ask <question>')
  .description('向认知层提问')
  .action(async (question: string) => {
    console.log(chalk.blue(`问题: ${question}`))
    console.log(chalk.yellow('正在查询认知层...'))
  })

// skill 命令组
const skillCmd = program.command('skill').description('Skill 管理')

skillCmd
  .command('list')
  .description('列出可用 Skill')
  .action(async () => {
    console.log(chalk.blue('可用 Skill 列表:'))
    console.log('- search_code: 代码搜索')
    console.log('- get_spec_rules: 获取 Spec 规则')
  })

skillCmd
  .command('add <name>')
  .description('订阅 Skill')
  .action(async (name: string) => {
    console.log(chalk.green(`已订阅 Skill: ${name}`))
  })

program.parse()
