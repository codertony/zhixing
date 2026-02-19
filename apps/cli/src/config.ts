/**
 * CLI 配置管理
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface CliConfig {
  apiBaseUrl: string
  gitlabUrl: string
  defaultDomain?: string
  mcpServers: {
    cognitive?: string
    spec?: string
  }
}

const CONFIG_DIR = join(homedir(), '.zhixing')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const DEFAULT_CONFIG: CliConfig = {
  apiBaseUrl: process.env.ZHIXING_API_BASE || 'http://localhost:3001',
  gitlabUrl: process.env.GITLAB_URL || 'https://gitlab.com',
  mcpServers: {
    cognitive: process.env.ZHIXING_COGNITIVE_MCP || 'http://localhost:3002',
    spec: process.env.ZHIXING_SPEC_MCP || 'http://localhost:3001',
  },
}

/**
 * 加载配置
 */
export function loadConfig(): CliConfig {
  if (existsSync(CONFIG_FILE)) {
    try {
      const content = readFileSync(CONFIG_FILE, 'utf-8')
      const saved = JSON.parse(content)
      return { ...DEFAULT_CONFIG, ...saved }
    } catch {
      return DEFAULT_CONFIG
    }
  }
  return DEFAULT_CONFIG
}

/**
 * 保存配置
 */
export function saveConfig(config: Partial<CliConfig>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  const current = loadConfig()
  const merged = { ...current, ...config }
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2))
}

/**
 * 获取 MCP 配置路径
 */
export function getMcpConfigPath(): string {
  const claudeMcpDir = join(homedir(), '.claude')
  if (!existsSync(claudeMcpDir)) {
    mkdirSync(claudeMcpDir, { recursive: true })
  }
  return join(claudeMcpDir, 'mcp.json')
}

/**
 * 读取 MCP 配置
 */
export function readMcpConfig(): Record<string, unknown> {
  const path = getMcpConfigPath()
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * 写入 MCP 配置
 */
export function writeMcpConfig(config: Record<string, unknown>): void {
  const path = getMcpConfigPath()
  writeFileSync(path, JSON.stringify(config, null, 2))
}
