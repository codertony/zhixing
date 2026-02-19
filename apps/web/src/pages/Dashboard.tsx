import { useEffect, useState } from 'react'
import {
  DocumentTextIcon,
  FolderIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Stats {
  totalRules: number
  totalProjects: number
  pendingDistributions: number
  recentOverrides: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // 使用模拟数据
      setStats({
        totalRules: 45,
        totalProjects: 12,
        pendingDistributions: 3,
        recentOverrides: 5,
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: '规则总数',
      value: stats?.totalRules ?? 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      href: '/rules/company',
    },
    {
      name: '注册项目',
      value: stats?.totalProjects ?? 0,
      icon: FolderIcon,
      color: 'bg-green-500',
      href: '/projects',
    },
    {
      name: '待分发',
      value: stats?.pendingDistributions ?? 0,
      icon: ArrowPathIcon,
      color: 'bg-yellow-500',
      href: '/distribution',
    },
    {
      name: '近期 Override',
      value: stats?.recentOverrides ?? 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      href: '/compliance/overrides',
    },
  ]

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">概览</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <a
            key={card.name}
            href={card.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">最近活动</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ArrowPathIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">项目 "api-gateway" 的规则已分发</p>
                <p className="text-xs text-gray-500">2 小时前</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">新增公司级规则 "API 命名规范"</p>
                <p className="text-xs text-gray-500">昨天</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-900">"order-service" 触发合规扫描</p>
                <p className="text-xs text-gray-500">2 天前</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">快速入口</h2>
          <div className="space-y-3">
            <a
              href="/rules/company"
              className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">管理公司级规则</span>
            </a>
            <a
              href="/projects"
              className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">注册新项目</span>
            </a>
            <a
              href="/distribution"
              className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">查看分发状态</span>
            </a>
            <a
              href="/compliance/overrides"
              className="flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-700">查看合规报告</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
