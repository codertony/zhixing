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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Option } = Select
const { TextArea } = Input

interface Rule {
  id: string
  level: 'company' | 'domain' | 'project'
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

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('all')

  useEffect(() => {
    fetchRules()
  }, [levelFilter])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const params = levelFilter !== 'all' ? `?level=${levelFilter}` : ''
      const res = await fetch(`/api/specs/rules${params}`)
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

  const handleCreate = async (values: { level: string; content: string }) => {
    try {
      const url = editingRule
        ? `/api/specs/rules/${editingRule.id}`
        : '/api/specs/rules'
      const method = editingRule ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          createdBy: 'user-1',
        }),
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
    form.setFieldsValue({
      level: rule.level,
      content: rule.content,
    })
    setModalVisible(true)
  }

  const openCreateModal = () => {
    setEditingRule(null)
    form.resetFields()
    setModalVisible(true)
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
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip placement="topLeft" title={content}>
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        </Tooltip>
      ),
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
            <Button type="text" icon={<HistoryOutlined />} />
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
        width={600}
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
            <Select placeholder="选择层级">
              <Option value="company">公司级</Option>
              <Option value="domain">领域级</Option>
              <Option value="project">项目级</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="规则内容 (Markdown)"
            rules={[{ required: true, message: '请输入规则内容' }]}
          >
            <TextArea
              rows={10}
              placeholder={`# 规则标题\n\n## 适用范围\n- 适用项目：所有项目\n\n## 规范内容\n1. 第一条规范\n2. 第二条规范\n\n## 检查方式\n- 自动化检查\n- 人工审查`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
