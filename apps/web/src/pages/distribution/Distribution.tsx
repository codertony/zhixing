import { useState, useEffect } from 'react'
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon, LinkIcon } from '@heroicons/react/24/outline'
import { distributionApi } from '../../services/api'

interface DistributionLog {
  id: string
  projectId: string
  projectName: string
  triggerReason: string
  status: 'pending' | 'success' | 'failed'
  gitlabCommitSha?: string
  errorMessage?: string
  createdAt: string
}

export default function Distribution() {
  const [logs, setLogs] = useState<DistributionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await distributionApi.getLogs()
      setLogs(response.data)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // 模拟数据
      setLogs([
        {
          id: '1',
          projectId: '1',
          projectName: 'api-gateway',
          triggerReason: '规则变更：新增 API 命名规范',
          status: 'success',
          gitlabCommitSha: 'abc123',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          projectId: '2',
          projectName: 'order-service',
          triggerReason: '规则变更：更新错误码规范',
          status: 'failed',
          errorMessage: 'GitLab API 超时',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '3',
          projectId: '3',
          projectName: 'user-service',
          triggerReason: '手动触发',
          status: 'success',
          gitlabCommitSha: 'def456',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge-success flex items-center"><CheckCircleIcon className="h-3 w-3 mr-1" />成功</span>
      case 'failed':
        return <span className="badge-error flex items-center"><XCircleIcon className="h-3 w-3 mr-1" />失败</span>
      default:
        return <span className="badge-warning flex items-center"><ClockIcon className="h-3 w-3 mr-1" />进行中</span>
    }
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分发状态</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="select"
          >
            <option value="all">全部状态</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
          </select>
          <button onClick={fetchLogs} className="btn-secondary flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            刷新
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">触发原因</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.projectName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                  {log.triggerReason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(log.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {log.gitlabCommitSha && (
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                      title="查看 GitLab 提交"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {log.gitlabCommitSha.substring(0, 7)}
                    </a>
                  )}
                  {log.errorMessage && (
                    <span className="text-red-600 text-xs" title={log.errorMessage}>
                      查看错误
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无分发记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
