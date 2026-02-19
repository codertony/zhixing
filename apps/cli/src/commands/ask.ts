/**
 * zhixing ask 命令
 * 调用认知层 MCP API，输出问答结果至终端
 */

import { Command } from 'commander'
import chalk from 'chalk'
import axios from 'axios'
import { loadConfig } from '../config.js'
import { detectProjectId } from '../utils/git.js'

const config = loadConfig()

export const askCommand = new Command('ask')
  .description('向认知层提问，获取代码语义问答结果')
  .argument('<question>', '问题内容')
  .option('-p, --project <id>', '指定项目 ID')
  .option('-l, --limit <number>', '返回结果数量', '5')
  .option('-t, --type <type>', '搜索类型: code | document | all', 'all')
  .action(async (question, options) => {
    console.log(chalk.bold(`\n🔍 ${question}\n`))

    // 检测项目 ID
    const projectId = options.project || await detectProjectId()
    if (!projectId) {
      console.error(chalk.red('错误: 无法确定项目 ID'))
      console.log(chalk.gray('提示: 请在项目目录内执行，或使用 -p 指定项目 ID'))
      process.exit(1)
    }

    try {
      const response = await axios.post(`${config.apiBaseUrl}/api/search`, {
        query: question,
        projectId,
        limit: parseInt(options.limit),
        fileType: options.type,
      })

      const { results, hasHighConfidence } = response.data

      if (results.length === 0) {
        console.log(chalk.yellow('未找到相关结果'))
        console.log(chalk.gray('提示: 尝试使用不同的关键词，或检查项目是否已索引'))
        return
      }

      // 显示置信度提示
      if (!hasHighConfidence) {
        console.log(chalk.yellow('⚠️ 未找到高置信度匹配，以下是次相关结果:\n'))
      } else {
        console.log(chalk.green(`找到 ${results.length} 个相关结果:\n`))
      }

      // 显示结果
      results.forEach((result: {
        name: string
        type: string
        filePath: string
        startLine: number
        endLine: number
        language: string
        signature?: string
        content: string
        score: number
      }, index: number) => {
        console.log(chalk.bold(`${index + 1}. ${result.name}`))
        console.log(chalk.gray(`   类型: ${result.type} | 语言: ${result.language}`))
        console.log(chalk.gray(`   文件: ${result.filePath}:${result.startLine}-${result.endLine}`))
        if (result.signature) {
          console.log(chalk.cyan(`   ${result.signature}`))
        }
        console.log(chalk.gray(`   相关度: ${(result.score * 100).toFixed(1)}%`))
        console.log(chalk.white(`\n   ${result.content.substring(0, 300)}...\n`))
      })

      console.log(chalk.gray('提示: 使用 --limit 参数调整返回结果数量'))
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(chalk.red(`请求失败: ${error.message}`))
      } else {
        console.error(chalk.red('发生错误:'), error)
      }
      process.exit(1)
    }
  })
