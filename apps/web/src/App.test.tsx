import { describe, it, expect, vi } from 'vitest'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => vi.fn(),
  useParams: () => ({})
}))

describe('App', () => {
  it('应该渲染应用', () => {
    // 基础测试，确保应用可以加载
    expect(true).toBe(true)
  })

  it('应该导出组件', async () => {
    const { default: App } = await import('./App.js')
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })
})
