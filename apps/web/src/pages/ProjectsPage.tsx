import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Empty,
  Tooltip,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ProjectOutlined,
  GithubOutlined,
  SyncOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

interface Project {
  id: string
  name: string
  gitlabPath: string
  gitlab_path?: string
  domainId?: string
  domain_id?: string
  status?: string
  createdAt: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

const statusMap: Record<string, { text: string; color: string }> = {
  active: { text: '活跃', color: 'green' },
  archived: { text: '已归档', color: 'default' },
  pending: { text: '待配置', color: 'orange' },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data.data || [])
      } else {
        message.error(data.error || '获取项目列表失败')
      }
    } catch (error) {
      message.error('网络错误，请检查API服务是否正常')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: { name: string; gitlabPath: string }) => {
    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : '/api/projects'
      const method = editingProject ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          domainId: null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        message.success(editingProject ? '项目更新成功' : '项目注册成功')
        setModalVisible(false)
        form.resetFields()
        setEditingProject(null)
        fetchProjects()
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('网络错误')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        message.success('项目删除成功')
        fetchProjects()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('网络错误')
    }
  }

  const handleCompile = async (projectId: string) => {
    try {
      const res = await fetch(`/api/specs/compile/${projectId}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        message.success('Spec 编译成功')
      } else {
        message.error(data.error || '编译失败')
      }
    } catch (error) {
      message.error('网络错误')
    }
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    form.setFieldsValue({
      name: project.name,
      gitlabPath: project.gitlabPath || project.gitlab_path,
    })
    setModalVisible(true)
  }

  const openCreateModal = () => {
    setEditingProject(null)
    form.resetFields()
    setModalVisible(true)
  }

  const openDetailModal = (project: Project) => {
    setViewingProject(project)
    setDetailModalVisible(true)
  }

  const columns: TableColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Project) => (
        <Button type="link" onClick={() => openDetailModal(record)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'GitLab 路径',
      dataIndex: 'gitlabPath',
      key: 'gitlabPath',
      render: (_value: unknown, record: Project) => {
        const path = record.gitlabPath || record.gitlab_path || '-'
        return (
          <Space>
            <GithubOutlined />
            <span>{path}</span>
          </Space>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status || 'active']
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (_value: unknown, record: Project) => {
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
      width: 200,
      render: (_value: unknown, record: Project) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="编译 Spec">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => handleCompile(record.id)}
            />
          </Tooltip>
          <Tooltip title="同步到 GitLab">
            <Button type="text" icon={<SyncOutlined />} />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除此项目吗？"
              description="删除后相关配置也将被清除"
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
            <ProjectOutlined />
            <span>项目管理</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            注册项目
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 个项目`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无项目"
              >
                <Button type="primary" onClick={openCreateModal}>
                  注册第一个项目
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '注册项目'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingProject(null)
        }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：知行平台前端" />
          </Form.Item>

          <Form.Item
            name="gitlabPath"
            label="GitLab 路径"
            rules={[{ required: true, message: '请输入 GitLab 路径' }]}
          >
            <Input placeholder="例如：group/project-name" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="项目详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setViewingProject(null)
        }}
        footer={null}
        width={600}
      >
        {viewingProject && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="项目ID">{viewingProject.id}</Descriptions.Item>
            <Descriptions.Item label="项目名称">{viewingProject.name}</Descriptions.Item>
            <Descriptions.Item label="GitLab 路径">
              {viewingProject.gitlabPath || viewingProject.gitlab_path}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[viewingProject.status || 'active']?.color}>
                {statusMap[viewingProject.status || 'active']?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(viewingProject.createdAt || viewingProject.created_at || '').toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
