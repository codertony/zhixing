import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { projectsApi } from '../../services/api'

interface Project {
  id: string
  name: string
  gitlabPath: string
  domainId: string
  subscriptions: string[]
  createdAt: string
}

interface Domain {
  id: string
  name: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: '', gitlabPath: '', domainId: '' })
  const [subscriptions, setSubscriptions] = useState<string[]>([])

  useEffect(() => {
    fetchProjects()
    fetchDomains()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getProjects()
      setProjects(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    try {
      // 模拟领域数据
      setDomains([
        { id: '1', name: '金融' },
        { id: '2', name: '采购' },
        { id: '3', name: '订单' },
      ])
    } catch (error) {
      console.error('Failed to fetch domains:', error)
    }
  }

  const handleCreate = async () => {
    try {
      await projectsApi.createProject(formData)
      setShowModal(false)
      setFormData({ name: '', gitlabPath: '', domainId: '' })
      fetchProjects()
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleUpdateSubscriptions = async () => {
    if (!selectedProject) return
    try {
      await projectsApi.updateSubscriptions(selectedProject.id, { subscriptions })
      setShowSubscriptionModal(false)
      setSelectedProject(null)
      fetchProjects()
    } catch (error) {
      console.error('Failed to update subscriptions:', error)
    }
  }

  const openSubscriptionModal = (project: Project) => {
    setSelectedProject(project)
    setSubscriptions(project.subscriptions || [])
    setShowSubscriptionModal(true)
  }

  const toggleSubscription = (domainId: string) => {
    setSubscriptions(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    )
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          注册项目
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GitLab 路径</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属领域</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订阅领域</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {project.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.gitlabPath}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {domains.find(d => d.id === project.domainId)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.subscriptions?.length || 0} 个领域
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openSubscriptionModal(project)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="管理订阅"
                  >
                    <GlobeAltIcon className="h-5 w-5" />
                  </button>
                  <button className="text-blue-600 hover:text-blue-900 mr-4">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无项目，点击"注册项目"添加
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">注册新项目</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="label">项目名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="例如：订单服务"
                />
              </div>
              <div>
                <label className="label">GitLab 路径 *</label>
                <input
                  type="text"
                  value={formData.gitlabPath}
                  onChange={(e) => setFormData({ ...formData, gitlabPath: e.target.value })}
                  className="input"
                  placeholder="例如：group/project-name"
                />
              </div>
              <div>
                <label className="label">所属领域 *</label>
                <select
                  value={formData.domainId}
                  onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                  className="select"
                >
                  <option value="">请选择</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={!formData.name || !formData.gitlabPath || !formData.domainId}
              >
                注册
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">管理领域订阅</h3>
              <p className="text-sm text-gray-500 mt-1">项目：{selectedProject.name}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">选择该项目需要订阅的其他领域知识：</p>
              <div className="space-y-2">
                {domains
                  .filter(d => d.id !== selectedProject.domainId)
                  .map((domain) => (
                    <label key={domain.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subscriptions.includes(domain.id)}
                        onChange={() => toggleSubscription(domain.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">{domain.name}</span>
                    </label>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowSubscriptionModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleUpdateSubscriptions} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
