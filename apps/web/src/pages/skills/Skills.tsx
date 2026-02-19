import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, PuzzlePieceIcon, DocumentTextIcon, CommandLineIcon } from '@heroicons/react/24/outline'
import { skillsApi } from '../../services/api'

type SkillType = 'mcp_tool' | 'prompt_template' | 'openspec_template'
type SkillVisibility = 'company' | 'domain' | 'private'

interface Skill {
  id: string
  type: SkillType
  name: string
  description: string
  content: string
  visibility: SkillVisibility
  domainId?: string
  version: number
  createdAt: string
}

const skillTypeLabels: Record<SkillType, { label: string; icon: typeof PuzzlePieceIcon; color: string }> = {
  mcp_tool: { label: 'MCP Tool', icon: CommandLineIcon, color: 'text-blue-600 bg-blue-100' },
  prompt_template: { label: 'Prompt 模板', icon: DocumentTextIcon, color: 'text-green-600 bg-green-100' },
  openspec_template: { label: 'OpenSpec', icon: PuzzlePieceIcon, color: 'text-purple-600 bg-purple-100' },
}

const visibilityLabels: Record<SkillVisibility, string> = {
  company: '公司级',
  domain: '领域级',
  private: '私有',
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null)
  const [filter, setFilter] = useState<SkillType | 'all'>('all')
  const [formData, setFormData] = useState({
    type: 'mcp_tool' as SkillType,
    name: '',
    description: '',
    content: '',
    visibility: 'company' as SkillVisibility,
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : undefined
      const response = await skillsApi.getSkills(params)
      setSkills(response.data)
    } catch (error) {
      console.error('Failed to fetch skills:', error)
      // 模拟数据
      setSkills([
        {
          id: '1',
          type: 'mcp_tool',
          name: 'unit-test-generator',
          description: '自动生成单元测试代码',
          content: '{"tool": "generate_unit_test", "schema": {}}',
          visibility: 'company',
          version: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'prompt_template',
          name: 'code-review',
          description: '代码审查 Prompt 模板',
          content: '请审查以下代码...',
          visibility: 'domain',
          domainId: '1',
          version: 2,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await skillsApi.createSkill(formData)
      setShowModal(false)
      setFormData({
        type: 'mcp_tool',
        name: '',
        description: '',
        content: '',
        visibility: 'company',
      })
      fetchSkills()
    } catch (error) {
      console.error('Failed to create skill:', error)
    }
  }

  const getSkillTypeBadge = (type: SkillType) => {
    const config = skillTypeLabels[type]
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Skill 仓库</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="select"
          >
            <option value="all">全部类型</option>
            <option value="mcp_tool">MCP Tool</option>
            <option value="prompt_template">Prompt 模板</option>
            <option value="openspec_template">OpenSpec</option>
          </select>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            注册 Skill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <div key={skill.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              {getSkillTypeBadge(skill.type)}
              <span className="text-xs text-gray-500">v{skill.version}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{skill.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{skill.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{visibilityLabels[skill.visibility]}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingSkill(skill)}
                  className="text-gray-400 hover:text-gray-600"
                  title="查看"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button className="text-blue-600 hover:text-blue-900">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无 Skill，点击"注册 Skill"添加
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">注册 Skill</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="label">类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SkillType })}
                  className="select"
                >
                  <option value="mcp_tool">MCP Tool</option>
                  <option value="prompt_template">Prompt 模板</option>
                  <option value="openspec_template">OpenSpec 模板</option>
                </select>
              </div>
              <div>
                <label className="label">名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Skill 名称"
                />
              </div>
              <div>
                <label className="label">描述 *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="Skill 描述"
                />
              </div>
              <div>
                <label className="label">可见性</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as SkillVisibility })}
                  className="select"
                >
                  <option value="company">公司级</option>
                  <option value="domain">领域级</option>
                  <option value="private">私有</option>
                </select>
              </div>
              <div>
                <label className="label">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="textarea"
                  placeholder="Skill 内容（JSON 或模板内容）"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={!formData.name || !formData.description}
              >
                注册
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{viewingSkill.name}</h3>
                {getSkillTypeBadge(viewingSkill.type)}
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">{viewingSkill.description}</p>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{viewingSkill.content}</pre>
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>可见性: {visibilityLabels[viewingSkill.visibility]}</span>
                <span>版本: v{viewingSkill.version}</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setViewingSkill(null)} className="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
