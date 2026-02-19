import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline'
import { rulesApi } from '../../services/api'

interface Rule {
  id: string
  level: string
  content: string
  version: number
  createdAt: string
  updatedAt: string
}

export default function RulesCompany() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [formData, setFormData] = useState({ content: '' })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await rulesApi.getRules({ level: 'company' })
      setRules(response.data)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await rulesApi.createRule({
        level: 'company',
        content: formData.content,
      })
      setShowModal(false)
      setFormData({ content: '' })
      fetchRules()
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingRule) return
    try {
      await rulesApi.updateRule(editingRule.id, {
        content: formData.content,
      })
      setShowModal(false)
      setEditingRule(null)
      setFormData({ content: '' })
      fetchRules()
    } catch (error) {
      console.error('Failed to update rule:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条规则吗？')) return
    try {
      await rulesApi.deleteRule(id)
      fetchRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  const openEditModal = (rule: Rule) => {
    setEditingRule(rule)
    setFormData({ content: rule.content })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingRule(null)
    setFormData({ content: '' })
    setShowModal(true)
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">公司级规则</h1>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新时间
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
                  <div className="text-sm text-gray-900 max-w-2xl truncate">
                    {rule.content}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">v{rule.version}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {new Date(rule.updatedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  暂无规则，点击"新建规则"添加
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRule ? '编辑规则' : '新建规则'}
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="label">规则内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ content: e.target.value })}
                  rows={10}
                  className="textarea"
                  placeholder="输入规则内容..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={editingRule ? handleUpdate : handleCreate}
                className="btn-primary"
              >
                {editingRule ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
