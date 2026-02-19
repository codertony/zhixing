import { useState, useEffect } from 'react'
import { FunnelIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { complianceApi } from '../../services/api'

interface Override {
  id: string
  ruleId: string
  ruleContent: string
  projectId: string
  projectName: string
  reason: string
  operatorName: string
  commitSha: string
  createdAt: string
}

interface FilterState {
  ruleId: string
  projectId: string
  startDate: string
  endDate: string
}

export default function Overrides() {
  const [overrides, setOverrides] = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>({
    ruleId: '',
    projectId: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchOverrides()
  }, [])

  const fetchOverrides = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter.ruleId) params.ruleId = filter.ruleId
      if (filter.projectId) params.projectId = filter.projectId
      if (filter.startDate) params.startDate = filter.startDate
      if (filter.endDate) params.endDate = filter.endDate

      const response = await complianceApi.getOverrides(Object.keys(params).length > 0 ? params : undefined)
      setOverrides(response.data)
    } catch (error) {
      console.error('Failed to fetch overrides:', error)
      // 模拟数据
      setOverrides([
        {
          id: '1',
          ruleId: 'rule-1',
          ruleContent: '所有 API 必须使用 RESTful 规范',
          projectId: '1',
          projectName: 'api-gateway',
          reason: '遗留系统兼容，计划下一版本迁移',
          operatorName: '张三',
          commitSha: 'abc123',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchOverrides()
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Override 事件</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            筛选
          </button>
          <button onClick={fetchOverrides} className="btn-secondary flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            刷新
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">规则 ID</label>
              <input
                type="text"
                value={filter.ruleId}
                onChange={(e) => setFilter({ ...filter, ruleId: e.target.value })}
                className="input"
                placeholder="规则 ID"
              />
            </div>
            <div>
              <label className="label">项目</label>
              <input
                type="text"
                value={filter.projectId}
                onChange={(e) => setFilter({ ...filter, projectId: e.target.value })}
                className="input"
                placeholder="项目 ID"
              />
            </div>
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleFilter} className="btn-primary">
              应用筛选
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规则内容</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Override 原因</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {overrides.map((override) => (
              <tr key={override.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-900 max-w-md">{override.ruleContent}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {override.projectName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                  {override.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {override.operatorName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(override.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {overrides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无 Override 记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
