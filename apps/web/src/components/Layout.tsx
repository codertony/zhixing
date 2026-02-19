import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  PuzzlePieceIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: '概览', href: '/dashboard', icon: HomeIcon },
  {
    name: '规则管理',
    icon: DocumentTextIcon,
    children: [
      { name: '公司级规则', href: '/rules/company' },
      { name: '领域级规则', href: '/rules/domain' },
      { name: '项目级规则', href: '/rules/project' },
    ],
  },
  { name: '项目管理', href: '/projects', icon: FolderIcon },
  { name: '分发状态', href: '/distribution', icon: ArrowPathIcon },
  { name: '合规追踪', href: '/compliance/overrides', icon: ShieldCheckIcon },
  { name: 'Skill 仓库', href: '/skills', icon: PuzzlePieceIcon },
]

export default function Layout() {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['规则管理']))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMenu = (name: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedMenus(newExpanded)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
        <span className="ml-2 text-lg font-semibold">知行平台</span>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">知行平台</h1>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedMenus.has(item.name)
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `block px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
