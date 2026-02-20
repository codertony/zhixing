import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import RulesPage from './pages/RulesPage.js'
import ProjectsPage from './pages/ProjectsPage.js'
import DistributionPage from './pages/DistributionPage.js'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">知行平台</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Spec 规则
                </Link>
                <Link to="/projects" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  项目管理
                </Link>
                <Link to="/distribution" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  分发状态
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 页面内容 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<RulesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/distribution" element={<DistributionPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
