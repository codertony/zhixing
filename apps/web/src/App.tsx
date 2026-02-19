import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RulesCompany from './pages/rules/RulesCompany'
import RulesDomain from './pages/rules/RulesDomain'
import RulesProject from './pages/rules/RulesProject'
import Projects from './pages/projects/Projects'
import Distribution from './pages/distribution/Distribution'
import Overrides from './pages/compliance/Overrides'
import Skills from './pages/skills/Skills'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rules/company" element={<RulesCompany />} />
          <Route path="rules/domain" element={<RulesDomain />} />
          <Route path="rules/project" element={<RulesProject />} />
          <Route path="projects" element={<Projects />} />
          <Route path="distribution" element={<Distribution />} />
          <Route path="compliance/overrides" element={<Overrides />} />
          <Route path="skills" element={<Skills />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
