import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline'
import { rulesApi, projectsApi } from '../../services/api'

interface Project {
  id: string
  name: string
  gitlabPath: string
}

interface Rule {
  id: string
  level: string
  projectId: string
  content: string
  version: number
  updatedAt: string
}

interface Override {
  ruleId: string
  reason: string
}

export default function RulesProject() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [formData, setFormData] = useState({ content: '', projectId: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchRules(selectedProject)
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getProjects()
      setProjects(response.data)
      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setLoading(false)
    }
  }

  const fetchRules = async (projectId: string) => {
    try {
      const response = await rulesApi.getRules({ level: 'project', projectId })
      setRules(response.data)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setRules([])
    }
  }

  const handleCreate = async () => {
    try {
      await rulesApi.createRule({
        level: 'project',
        projectId: formData.projectId,
        content: formData.content,
      })
      setShowModal(false)
      setFormData({ content: '', projectId: '' })
      fetchRules(selectedProject)
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const handleOverride = async () => {
    if (!selectedRule) return
    try {
      // 调用 override API
      console.log('Override rule:', selectedRule.id, 'reason:', overrideReason)
      setShowOverrideModal(false)
      setOverrideReason('')
      setSelectedRule(null)
    } catch (error) {
      console.error('Failed to override rule:', error)
    }
  }

  const openOverrideModal = (rule: Rule) => {
    setSelectedRule(rule)
    setOverrideReason('')
    setShowOverrideModal(true)
  }

  const openCreateModal = () => {
    setFormData({ content: '', projectId: selectedProject })
    setShowModal(true)
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">项目级规则</h1>

      {/* 项目选择 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <label className="label">选择项目</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="select max-w-md"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.gitlabPath})
            </option>
          ))}
        </select>
      </div>

      {/* 规则列表 */}
      {selectedProject && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              项目规则
            </h2>
            <button onClick={openCreateModal} className="btn-primary flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              新建规则
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规则内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    版本
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-2xl truncate">{rule.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">v{rule.version}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openOverrideModal(rule)}
                        className="text-orange-600 hover:text-orange-900 mr-4"
                        title="声明 Override"
                      >
                        <ArrowUpOnSquareIcon className="h-5 w-5" />
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
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      暂无规则，点击"新建规则"添加
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">新建项目规则</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="label">规则内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="textarea"
                  placeholder="输入规则内容..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">声明 Override</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="label">规则内容</label>
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                  {selectedRule?.content.substring(0, 200)}...
                </div>
              </div>
              <div className="mb-4">
                <label className="label">Override 原因 *</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={4}
                  className="textarea"
                  placeholder="说明为什么需要覆盖这条规则..."
                  required
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowOverrideModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleOverride}
                className="btn-primary"
                disabled={!overrideReason.trim()}
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
