import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API 方法
export const rulesApi = {
  getRules: (params?: { level?: string; domainId?: string; projectId?: string }) =>
    api.get('/api/specs/rules', { params }),
  getRule: (id: string) => api.get(`/api/specs/rules/${id}`),
  createRule: (data: unknown) => api.post('/api/specs/rules', data),
  updateRule: (id: string, data: unknown) => api.put(`/api/specs/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/api/specs/rules/${id}`),
  getHistory: (id: string) => api.get(`/api/specs/rules/${id}/history`),
}

export const projectsApi = {
  getProjects: () => api.get('/api/projects'),
  getProject: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: unknown) => api.post('/api/projects', data),
  updateProject: (id: string, data: unknown) => api.put(`/api/projects/${id}`, data),
  updateSubscriptions: (id: string, data: unknown) =>
    api.put(`/api/projects/${id}/subscriptions`, data),
  updateSkills: (id: string, data: unknown) => api.post(`/api/projects/${id}/skills`, data),
}

export const distributionApi = {
  getLogs: () => api.get('/api/distribution/logs'),
  triggerDistribution: (projectId: string) =>
    api.post('/api/distribution/trigger', { projectId }),
}

export const complianceApi = {
  getOverrides: (params?: { ruleId?: string; projectId?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/compliance/overrides', { params }),
  getAdoptionRate: () => api.get('/api/compliance/adoption-rate'),
}

export const skillsApi = {
  getSkills: (params?: { type?: string; visibility?: string; domainId?: string }) =>
    api.get('/api/skills', { params }),
  getSkill: (id: string) => api.get(`/api/skills/${id}`),
  createSkill: (data: unknown) => api.post('/api/skills', data),
  updateSkill: (id: string, data: unknown) => api.put(`/api/skills/${id}`, data),
  deleteSkill: (id: string) => api.delete(`/api/skills/${id}`),
}

export const cognitiveApi = {
  search: (data: { query: string; projectId: string; limit?: number }) =>
    api.post('/api/search', data),
  analyzeGitHistory: (data: { projectId: string; filePath?: string }) =>
    api.post('/api/git-history', data),
  indexProject: (data: { projectId: string; type: 'full' | 'incremental' | 'docs' }) =>
    api.post(`/api/index/${data.type}`, { projectId: data.projectId }),
}
