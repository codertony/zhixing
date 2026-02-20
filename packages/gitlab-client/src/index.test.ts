import { describe, it, expect } from 'vitest'
import { GitLabClient } from './index.js'

describe('GitLabClient', () => {
  it('应该创建实例', () => {
    const client = new GitLabClient({
      url: 'https://gitlab.com',
      token: 'test-token'
    })
    expect(client).toBeDefined()
  })
})
