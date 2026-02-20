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
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])
  const [formData, setFormData] = useState({
    projectId: '',
    triggerReason: 'manual',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLogs()
    fetchProjects()
  }, [])

  const fetchLogs = async () => {
    try {
      // TODO: 实现获取分发记录API
      setLogs([])
    } catch (error) {
      console.error('获取分发记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data.data || [])
        if (data.data.data?.length > 0) {
          setFormData(prev => ({ ...prev, projectId: data.data.data[0].id }))
        }
      }
    } catch (error) {
      console.error('获取项目失败:', error)
    }
  }

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.projectId) {
      alert('请选择项目')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/distribution/push/${formData.projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerReason: formData.triggerReason }),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        alert('分发任务已触发')
        fetchLogs()
      } else {
        alert(data.error || '触发失败')
      }
    } catch (error) {
      console.error('触发分发失败:', error)
      alert('触发分发失败，请检查API是否实现')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">加载中...</div>

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">分发状态</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
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

      {/* 手动触发分发弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">手动触发分发</h3>
            </div>
            <form onSubmit={handleTrigger}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择项目
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">请选择项目</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p className="mt-1 text-sm text-red-500">暂无项目，请先注册项目</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    触发原因
                  </label>
                  <select
                    value={formData.triggerReason}
                    onChange={(e) => setFormData({ ...formData, triggerReason: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="manual">手动触发</option>
                    <option value="test">测试分发</option>
                  </select>
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
                  disabled={submitting || projects.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '触发中...' : '触发分发'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
