/**
 * 平台常量定义
 */

// API 版本
export const API_VERSION = 'v1';

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 分发重试次数
export const MAX_RETRY_COUNT = 3;

// 向量检索 Top-K
export const DEFAULT_TOP_K = 10;

// 规则层级优先级（数字越大优先级越高）
export const SPEC_LEVEL_PRIORITY = {
  company: 1,
  domain: 2,
  project: 3,
} as const;

// 高频 override 阈值
export const HIGH_FREQUENCY_OVERRIDE_THRESHOLD = 5;
export const OVERRIDE_TIME_WINDOW_DAYS = 30;

// 环境变量名称
export const ENV_KEYS = {
  DATABASE_URL: 'DATABASE_URL',
  QDRANT_URL: 'QDRANT_URL',
  ANTHROPIC_BASE_URL: 'ANTHROPIC_BASE_URL',
  OPENAI_BASE_URL: 'OPENAI_BASE_URL',
  GITLAB_TOKEN: 'GITLAB_TOKEN',
  GITLAB_URL: 'GITLAB_URL',
} as const;
