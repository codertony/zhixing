import { useState, useEffect } from 'react'

interface DistributionLog {
  id: string
  projectId: string
  triggerReason: string
  status: 'success' | 'failed' | 'pending'
  gitlabCommitSha?: string
  errorMessage?: string
  createdAt: string
}

export default function DistributionPage() {
  const [logs, setLogs] = useState<DistributionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      // 简化实现：显示空列表
      setLogs([])
    } catch (error) {
      console.error('获取分发记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4">加载中...</div>

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">分发状态</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          手动触发分发
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                项目
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                触发原因
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commit SHA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                时间
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无分发记录
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.projectId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.triggerReason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${log.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      ${log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}
                    >
                      {log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '进行中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.gitlabCommitSha ? log.gitlabCommitSha.substring(0, 8) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
