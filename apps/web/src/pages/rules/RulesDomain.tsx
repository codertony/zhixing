import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { rulesApi } from '../../services/api'

interface Domain {
  id: string
  name: string
  description: string
}

interface Rule {
  id: string
  level: string
  domainId: string
  content: string
  version: number
  updatedAt: string
}

export default function RulesDomain() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [formData, setFormData] = useState({ content: '', domainId: '' })

  useEffect(() => {
    fetchDomains()
  }, [])

  useEffect(() => {
    if (selectedDomain) {
      fetchRules(selectedDomain)
    }
  }, [selectedDomain])

  const fetchDomains = async () => {
    try {
      // 模拟数据，实际应从 API 获取
      setDomains([
        { id: '1', name: '金融', description: '金融业务领域' },
        { id: '2', name: '采购', description: '采购业务领域' },
        { id: '3', name: '订单', description: '订单业务领域' },
      ])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch domains:', error)
      setLoading(false)
    }
  }

  const fetchRules = async (domainId: string) => {
    try {
      const response = await rulesApi.getRules({ level: 'domain', domainId })
      setRules(response.data)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      setRules([])
    }
  }

  const handleCreate = async () => {
    try {
      await rulesApi.createRule({
        level: 'domain',
        domainId: formData.domainId,
        content: formData.content,
      })
      setShowModal(false)
      setFormData({ content: '', domainId: '' })
      fetchRules(selectedDomain)
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const openCreateModal = () => {
    setEditingRule(null)
    setFormData({ content: '', domainId: selectedDomain })
    setShowModal(true)
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">领域级规则</h1>

      {/* 领域选择 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <label className="label">选择领域</label>
        <div className="flex space-x-4">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                selectedDomain === domain.id
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* 规则列表 */}
      {selectedDomain && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {domains.find((d) => d.id === selectedDomain)?.name} 规则
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">新建领域规则</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="label">所属领域</label>
                <select
                  value={formData.domainId}
                  onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                  className="select"
                >
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  )
}
