import { useState, useEffect } from 'react'

interface Rule {
  id: string
  level: string
  content: string
  version: number
  createdAt: string
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('all')

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

  if (loading) return <div className="p-4">加载中...</div>

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Spec 规则管理</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
                    {rule.level}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">版本 {rule.version}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(rule.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-900">
                {rule.content.substring(0, 100)}...
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
