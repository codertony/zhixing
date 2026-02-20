import { useState, useEffect } from 'react'

interface Rule {
  id: string
  level: string
  content: string
  version: number
  createdAt: string
  created_at?: string
}

const levelLabels: Record<string, string> = {
  company: '公司级',
  domain: '领域级',
  project: '项目级',
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    level: 'company',
    content: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [levelFilter])

  const fetchRules = async () => {
    try {
      const params = levelFilter !== 'all' ? `?level=${levelFilter}` : ''
      const res = await fetch(`/api/specs/rules${params}`)
      const data = await res.json()
      if (data.success) {
        setRules(data.data.data || [])
      }
    } catch (error) {
      console.error('获取规则失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/specs/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: 'user-1', // TODO: 使用实际用户ID
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setFormData({ level: 'company', content: '' })
        fetchRules()
      } else {
        alert(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建规则失败:', error)
      alert('创建规则失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">加载中...</div>

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Spec 规则管理</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + 新建规则
        </button>
      </div>

      {/* 过滤器 */}
      <div className="mb-4">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">全部层级</option>
          <option value="company">公司级</option>
          <option value="domain">领域级</option>
          <option value="project">项目级</option>
        </select>
      </div>

      {/* 规则列表 */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        {rules.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            暂无规则数据，点击"新建规则"创建第一条规则
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <li key={rule.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${rule.level === 'company' ? 'bg-red-100 text-red-800' : ''}
                      ${rule.level === 'domain' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${rule.level === 'project' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {levelLabels[rule.level] || rule.level}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">版本 {rule.version}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(() => {
                      const dateStr = rule.createdAt || rule.created_at
                      if (!dateStr) return '-'
                      try {
                        return new Date(dateStr).toLocaleString()
                      } catch {
                        return '-'
                      }
                    })()}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-900">
                  {rule.content.substring(0, 100)}...
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 新建规则弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">新建 Spec 规则</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    规则层级
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="company">公司级</option>
                    <option value="domain">领域级</option>
                    <option value="project">项目级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    规则内容 (Markdown)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="# 规则标题\n\n规则内容..."
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
