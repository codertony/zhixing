import { describe, it, expect } from 'vitest'
import * as schema from './index.js'

describe('database schema', () => {
  it('应该导出所有表', () => {
    expect(schema.specRules).toBeDefined()
    expect(schema.specOverrides).toBeDefined()
    expect(schema.projects).toBeDefined()
    expect(schema.skills).toBeDefined()
    expect(schema.users).toBeDefined()
    expect(schema.domains).toBeDefined()
  })
})
