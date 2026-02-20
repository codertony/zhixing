import { describe, it, expect } from 'vitest'
import { generateId, sleep } from './index.js'

describe('shared utils', () => {
  describe('generateId', () => {
    it('应该生成唯一ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })
  })

  describe('sleep', () => {
    it('应该暂停指定时间', async () => {
      const start = Date.now()
      await sleep(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90)
    })
  })
})
