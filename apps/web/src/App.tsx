import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { ConfigProvider, Layout, Menu, theme as antdTheme } from 'antd'
import {
  FileTextOutlined,
  ProjectOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import RulesPage from './pages/RulesPage.js'
import ProjectsPage from './pages/ProjectsPage.js'
import DistributionPage from './pages/DistributionPage.js'
import { theme } from './theme.js'

const { Header, Content } = Layout

// 导航菜单组件
function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <FileTextOutlined />,
      label: 'Spec 规则',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/distribution',
      icon: <CloudUploadOutlined />,
      label: '分发状态',
    },
  ]

  return (
    <Menu
      theme="light"
      mode="horizontal"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
      style={{ flex: 1, minWidth: 0, marginLeft: 24 }}
    />
  )
}

// 布局组件
function AppLayout() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antdTheme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: colorBgContainer,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1677ff',
            whiteSpace: 'nowrap',
          }}
        >
          知行平台
        </div>
        <Navigation />
      </Header>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        <div
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Routes>
            <Route path="/" element={<RulesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/distribution" element={<DistributionPage />} />
          </Routes>
        </div>
      </Content>
    </Layout>
  )
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
