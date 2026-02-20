import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Empty,
  Tooltip,
  Badge,
  Cascader,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Option } = Select
const { TextArea } = Input

interface Domain {
  id: string
  name: string
  code: string
}

interface Project {
  id: string
  name: string
  domainId?: string
  domain_id?: string
}

interface Rule {
  id: string
  level: 'company' | 'domain' | 'project'
  domainId?: string
  domain_id?: string
  projectId?: string
  project_id?: string
  content: string
  version: number
  createdAt: string
  created_at?: string
  createdBy?: string
  created_by?: string
}

const levelMap: Record<string, { text: string; color: string }> = {
  company: { text: '公司级', color: 'red' },
  domain: { text: '领域级', color: 'orange' },
  project: { text: '项目级', color: 'green' },
}

// 可展开内容组件
function ExpandableContent({ content, maxLines = 2 }: { content: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false)
  const lines = content.split('\n')
  const shouldTruncate = lines.length > maxLines
  const displayContent = expanded || !shouldTruncate ? content : lines.slice(0, maxLines).join('\n') + '...'

  return (
    <div>
      <span style={{ whiteSpace: 'pre-wrap' }}>{displayContent}</span>
      {shouldTruncate && (
        <Button
          type="link"
          size="small"
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '0 4px', height: 'auto', fontSize: '12px' }}
        >
          {expanded ? '收起' : '展开'}
        </Button>
      )}
    </div>
  )
}

// 计算文本差异
function computeDiff(oldText: string, newText: string): { type: 'added' | 'removed' | 'unchanged'; text: string }[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: { type: 'added' | 'removed' | 'unchanged'; text: string }[] = []

  let i = 0, j = 0
  while (i < oldLines.length || j < newLines.length) {
    const oldLine = oldLines[i]
    const newLine = newLines[j]

    if (oldLine === newLine) {
      result.push({ type: 'unchanged', text: oldLine })
      i++
      j++
    } else if (oldLines.slice(i).includes(newLine) && newLine !== undefined) {
      // 旧文本中有新增的行
      result.push({ type: 'removed', text: oldLine })
      i++
    } else if (newLines.slice(j).includes(oldLine) && oldLine !== undefined) {
      // 新文本中有删除的行
      result.push({ type: 'added', text: newLine })
      j++
    } else {
      // 修改的行
      if (oldLine !== undefined) {
        result.push({ type: 'removed', text: oldLine })
        i++
      }
      if (newLine !== undefined) {
        result.push({ type: 'added', text: newLine })
        j++
      }
    }
  }

  return result
}

// Diff 显示组件
function DiffViewer({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const diff = computeDiff(oldContent, newContent)

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' }}>
      {diff.map((item, index) => (
        <div
          key={index}
          style={{
            backgroundColor: item.type === 'added' ? '#e6f7ff' : item.type === 'removed' ? '#fff1f0' : 'transparent',
            color: item.type === 'added' ? '#096dd9' : item.type === 'removed' ? '#cf1322' : '#262626',
            padding: '2px 8px',
            borderLeft: `3px solid ${item.type === 'added' ? '#1890ff' : item.type === 'removed' ? '#ff4d4f' : 'transparent'}`,
            whiteSpace: 'pre-wrap',
          }}
        >
          {item.type === 'added' && '+ '}
          {item.type === 'removed' && '- '}
          {item.type === 'unchanged' && '  '}
          {item.text}
        </div>
      ))}
    </div>
  )
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('company')
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [ruleHistory, setRuleHistory] = useState<any[]>([])

  useEffect(() => {
    fetchRules()
    fetchDomains()
    fetchProjects()
  }, [levelFilter, domainFilter])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== 'all') {
        params.append('level', levelFilter)
      }
      if (domainFilter !== 'all') {
        params.append('domainId', domainFilter)
      }
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/specs/rules${queryString}`)
      const data = await res.json()
      if (data.success) {
        setRules(data.data.data || [])
      } else {
        message.error(data.error || '获取规则列表失败')
      }
    } catch (error) {
      message.error('网络错误，请检查API服务是否正常')
    } finally {
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      if (data.success) {
        setDomains(data.data.data || [])
      }
    } catch (error) {
      console.error('获取领域失败:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data.data || [])
      }
    } catch (error) {
      console.error('获取项目失败:', error)
    }
  }

  const handleCreate = async (values: any) => {
    try {
      const url = editingRule
        ? `/api/specs/rules/${editingRule.id}`
        : '/api/specs/rules'
      const method = editingRule ? 'PUT' : 'POST'

      // 根据层级构建请求体
      const body: any = {
        level: values.level,
        content: values.content,
        createdBy: 'user-1',
      }

      if (values.level === 'domain' && values.domainId) {
        body.domainId = values.domainId
      }

      if (values.level === 'project' && values.projectId) {
        // Cascader 返回的是数组 [domainId, projectId]
        const projectIdArray = values.projectId
        if (Array.isArray(projectIdArray) && projectIdArray.length >= 2) {
          body.domainId = projectIdArray[0]
          body.projectId = projectIdArray[1]
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        message.success(editingRule ? '规则更新成功' : '规则创建成功')
        setModalVisible(false)
        form.resetFields()
        setEditingRule(null)
        fetchRules()
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('网络错误')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/specs/rules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        message.success('规则删除成功')
        fetchRules()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('网络错误')
    }
  }

  const openEditModal = (rule: Rule) => {
    setEditingRule(rule)
    setSelectedLevel(rule.level)

    const initialValues: any = {
      level: rule.level,
      content: rule.content,
    }

    if (rule.level === 'domain') {
      initialValues.domainId = rule.domainId || rule.domain_id
    }

    if (rule.level === 'project') {
      const domainId = rule.domainId || rule.domain_id
      const projectId = rule.projectId || rule.project_id
      // Cascader 需要数组格式
      initialValues.projectId = domainId && projectId ? [domainId, projectId] : undefined
    }

    form.setFieldsValue(initialValues)
    setModalVisible(true)
  }

  const openCreateModal = () => {
    setEditingRule(null)
    setSelectedLevel('company')
    form.resetFields()
    form.setFieldsValue({ level: 'company' })
    setModalVisible(true)
  }

  const fetchRuleHistory = async (ruleId: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/specs/rules/${ruleId}/history`)
      const data = await res.json()
      if (data.success) {
        setRuleHistory(data.data || [])
      } else {
        message.error(data.error || '获取版本历史失败')
        setRuleHistory([])
      }
    } catch (error) {
      message.error('网络错误')
      setRuleHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const openHistoryModal = (rule: Rule) => {
    setHistoryModalVisible(true)
    fetchRuleHistory(rule.id)
  }

  const closeHistoryModal = () => {
    setHistoryModalVisible(false)
    setRuleHistory([])
  }

  // 构建级联选择器选项
  const getCascaderOptions = () => {
    return domains.map(domain => ({
      value: domain.id,
      label: domain.name,
      children: projects
        .filter(p => (p.domainId || p.domain_id) === domain.id)
        .map(project => ({
          value: project.id,
          label: project.name,
        })),
    }))
  }

  // 获取规则归属显示
  const getRuleLocation = (rule: Rule) => {
    if (rule.level === 'company') return '-'

    if (rule.level === 'domain') {
      const domainId = rule.domainId || rule.domain_id
      const domain = domains.find(d => d.id === domainId)
      return domain ? <Tag color="orange"><ApartmentOutlined /> {domain.name}</Tag> : '未知领域'
    }

    if (rule.level === 'project') {
      const projectId = rule.projectId || rule.project_id
      const project = projects.find(p => p.id === projectId)
      const domainId = rule.domainId || rule.domain_id
      const domain = domains.find(d => d.id === domainId)
      return (
        <Space>
          {domain && <Tag color="orange"><ApartmentOutlined /> {domain.name}</Tag>}
          {project && <Tag color="green">{project.name}</Tag>}
        </Space>
      )
    }

    return '-'
  }

  const columns: TableColumnsType<Rule> = [
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const config = levelMap[level] || { text: level, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '归属',
      key: 'location',
      width: 200,
      render: (_value: unknown, record: Rule) => getRuleLocation(record),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => <ExpandableContent content={content} maxLines={2} />,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version: number) => (
        <Badge count={`v${version}`} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
      render: (_value: unknown, record: Rule) => record.createdBy || record.created_by || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (_value: unknown, record: Rule) => {
        const dateStr = record.createdAt || record.created_at
        if (!dateStr) return '-'
        try {
          return new Date(dateStr).toLocaleString()
        } catch {
          return '-'
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_value: unknown, record: Rule) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="版本历史">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => openHistoryModal(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这条规则吗？"
              description="删除后不可恢复"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Spec 规则管理</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ width: 120 }}
              placeholder="全部层级"
            >
              <Option value="all">全部层级</Option>
              <Option value="company">公司级</Option>
              <Option value="domain">领域级</Option>
              <Option value="project">项目级</Option>
            </Select>
            <Select
              value={domainFilter}
              onChange={setDomainFilter}
              style={{ width: 160 }}
              placeholder="全部领域"
            >
              <Option value="all">全部领域</Option>
              {domains.map(domain => (
                <Option key={domain.id} value={domain.id}>
                  <ApartmentOutlined /> {domain.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建规则
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无规则数据"
              >
                <Button type="primary" onClick={openCreateModal}>
                  创建第一条规则
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingRule(null)
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ level: 'company' }}
        >
          <Form.Item
            name="level"
            label="规则层级"
            rules={[{ required: true, message: '请选择规则层级' }]}
          >
            <Select
              placeholder="选择层级"
              onChange={(value) => {
                setSelectedLevel(value)
                form.setFieldsValue({ domainId: undefined, projectId: undefined })
              }}
            >
              <Option value="company">公司级（全公司生效）</Option>
              <Option value="domain">领域级（特定领域生效）</Option>
              <Option value="project">项目级（特定项目生效）</Option>
            </Select>
          </Form.Item>

          {selectedLevel === 'domain' && (
            <Form.Item
              name="domainId"
              label="所属领域"
              rules={[{ required: true, message: '请选择所属领域' }]}
            >
              <Select placeholder="选择领域">
                {domains.map(domain => (
                  <Option key={domain.id} value={domain.id}>
                    <ApartmentOutlined /> {domain.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {selectedLevel === 'project' && (
            <Form.Item
              name="projectId"
              label="所属项目"
              rules={[{ required: true, message: '请选择所属项目' }]}
            >
              <Cascader
                options={getCascaderOptions()}
                placeholder="选择领域 / 项目"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="content"
            label="规则内容 (Markdown)"
            rules={[{ required: true, message: '请输入规则内容' }]}
          >
            <TextArea
              rows={10}
              placeholder={`# 规则标题

## 适用范围
- 适用项目：所有项目

## 规范内容
1. 第一条规范
2. 第二条规范

## 检查方式
- 自动化检查
- 人工审查`}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 版本历史弹窗 */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>版本历史</span>
          </Space>
        }
        open={historyModalVisible}
        onCancel={closeHistoryModal}
        footer={null}
        width={800}
      >
        <Table
          dataSource={ruleHistory}
          rowKey="id"
          loading={historyLoading}
          pagination={false}
          expandable={{
            expandedRowRender: (record: any, index: number) => {
              // 获取上一个版本的内容（按版本号排序后的下一个）
              const prevVersion = ruleHistory[index + 1]
              const oldContent = prevVersion?.content || ''
              const newContent = record.content || ''

              return (
                <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                  <div style={{ marginBottom: 12, fontWeight: 500, color: '#262626' }}>
                    {prevVersion ? (
                      <>
                        版本对比：
                        <Tag color="blue">v{prevVersion.version}</Tag>
                        <span style={{ margin: '0 8px' }}>→</span>
                        <Tag color="green">v{record.version}</Tag>
                      </>
                    ) : (
                      <>
                        初始版本：
                        <Tag color="green">v{record.version}</Tag>
                        <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
                          (无上一版本可对比)
                        </span>
                      </>
                    )}
                  </div>
                  <DiffViewer oldContent={oldContent} newContent={newContent} />
                </div>
              )
            },
            rowExpandable: () => true,
          }}
          columns={[
            {
              title: '版本',
              dataIndex: 'version',
              key: 'version',
              width: 80,
              render: (version: number) => (
                <Badge count={`v${version}`} style={{ backgroundColor: '#52c41a' }} />
              ),
            },
            {
              title: '内容摘要',
              dataIndex: 'content',
              key: 'content',
              render: (content: string) => <ExpandableContent content={content} maxLines={2} />,
            },
            {
              title: '修改人',
              dataIndex: 'created_by',
              key: 'created_by',
              width: 120,
            },
            {
              title: '修改时间',
              dataIndex: 'created_at',
              key: 'created_at',
              width: 180,
              render: (date: string) => {
                if (!date) return '-'
                try {
                  return new Date(date).toLocaleString()
                } catch {
                  return '-'
                }
              },
            },
          ]}
          locale={{
            emptyText: '暂无版本历史',
          }}
        />
      </Modal>
    </div>
  )
}
