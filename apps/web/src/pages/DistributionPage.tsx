import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  Space,
  message,
  Empty,
  Timeline,
  Typography,
  Descriptions,
  Badge,
} from 'antd'
import {
  CloudUploadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Option } = Select
const { Text } = Typography

interface DistributionLog {
  id: string
  projectId: string
  project_id?: string
  projectName?: string
  triggerReason: string
  trigger_reason?: string
  status: 'success' | 'failed' | 'pending'
  gitlabCommitSha?: string
  gitlab_commit_sha?: string
  errorMessage?: string
  error_message?: string
  createdAt: string
  created_at?: string
}

interface Project {
  id: string
  name: string
}

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  success: { text: '成功', color: 'success', icon: <CheckCircleOutlined /> },
  failed: { text: '失败', color: 'error', icon: <CloseCircleOutlined /> },
  pending: { text: '进行中', color: 'processing', icon: <ClockCircleOutlined /> },
}

const triggerReasonMap: Record<string, string> = {
  manual: '手动触发',
  auto: '自动触发',
  webhook: 'Webhook',
  test: '测试分发',
}

export default function DistributionPage() {
  const [logs, setLogs] = useState<DistributionLog[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedLog, setSelectedLog] = useState<DistributionLog | null>(null)

  useEffect(() => {
    fetchLogs()
    fetchProjects()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      setLogs([])
    } catch (error) {
      message.error('获取分发记录失败')
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
      }
    } catch (error) {
      console.error('获取项目失败:', error)
    }
  }

  const handleTrigger = async (values: { projectId: string; triggerReason: string }) => {
    if (!values.projectId) {
      message.warning('请选择项目')
      return
    }
    try {
      const res = await fetch(`/api/distribution/push/${values.projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerReason: values.triggerReason }),
      })
      const data = await res.json()
      if (data.success) {
        message.success('分发任务已触发')
        setModalVisible(false)
        form.resetFields()
        fetchLogs()
      } else {
        message.error(data.error || '触发失败')
      }
    } catch (error) {
      message.error('触发分发失败，请检查API是否实现')
    }
  }

  const openDetailModal = (log: DistributionLog) => {
    setSelectedLog(log)
    setDetailModalVisible(true)
  }

  const columns: TableColumnsType<DistributionLog> = [
    {
      title: '项目',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId: string, record: DistributionLog) => {
        const projectName = record.projectName || projects.find(p => p.id === projectId)?.name || projectId
        return (
          <Button type="link" onClick={() => openDetailModal(record)}>
            {projectName}
          </Button>
        )
      },
    },
    {
      title: '触发原因',
      dataIndex: 'triggerReason',
      key: 'triggerReason',
      width: 120,
      render: (reason: string, record: DistributionLog) => {
        const triggerReason = reason || record.trigger_reason || 'manual'
        return triggerReasonMap[triggerReason] || triggerReason
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = statusMap[status] || statusMap.pending
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: 'Commit SHA',
      dataIndex: 'gitlabCommitSha',
      key: 'gitlabCommitSha',
      width: 140,
      render: (sha: string, record: DistributionLog) => {
        const commitSha = sha || record.gitlab_commit_sha
        if (!commitSha) return '-'
        return (
          <Space>
            <BranchesOutlined />
            <Text code copyable>{commitSha.substring(0, 8)}</Text>
          </Space>
        )
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (_value: unknown, record: DistributionLog) => {
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
      width: 100,
      render: (_value: unknown, record: DistributionLog) => (
        <Button type="link" onClick={() => openDetailModal(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <CloudUploadOutlined />
            <span>分发状态</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setModalVisible(true)}
          >
            手动触发分发
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无分发记录"
              >
                <Button type="primary" onClick={() => setModalVisible(true)}>
                  触发第一次分发
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title="手动触发分发"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTrigger}
          initialValues={{ triggerReason: 'manual' }}
        >
          <Form.Item
            name="projectId"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择要分发的项目">
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {projects.length === 0 && (
            <Text type="warning">
              暂无可用项目，请先<Button type="link" href="/projects">注册项目</Button>
            </Text>
          )}

          <Form.Item
            name="triggerReason"
            label="触发原因"
          >
            <Select>
              <Option value="manual">手动触发</Option>
              <Option value="test">测试分发</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分发详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedLog(null)
        }}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <>
            <Descriptions column={1} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="分发ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="项目">
                {selectedLog.projectName || projects.find(p => p.id === (selectedLog.projectId || selectedLog.project_id))?.name}
              </Descriptions.Item>
              <Descriptions.Item label="触发原因">
                {triggerReasonMap[selectedLog.triggerReason || selectedLog.trigger_reason || 'manual']}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={statusMap[selectedLog.status]?.color as any}
                  text={statusMap[selectedLog.status]?.text}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Commit SHA">
                {selectedLog.gitlabCommitSha || selectedLog.gitlab_commit_sha || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedLog.createdAt || selectedLog.created_at || '').toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Timeline
              items={[
                {
                  color: 'green',
                  children: '分发任务已创建',
                },
                {
                  color: selectedLog.status === 'pending' ? 'blue' : 'green',
                  children: '正在编译 Spec',
                },
                {
                  color: selectedLog.status === 'pending' ? 'gray' : selectedLog.status === 'success' ? 'green' : 'red',
                  children: selectedLog.status === 'pending' ? '等待推送' : selectedLog.status === 'success' ? '推送成功' : '推送失败',
                },
              ]}
            />

            {(selectedLog.errorMessage || selectedLog.error_message) && (
              <Text type="danger" style={{ display: 'block', marginTop: 16 }}>
                错误信息: {selectedLog.errorMessage || selectedLog.error_message}
              </Text>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
