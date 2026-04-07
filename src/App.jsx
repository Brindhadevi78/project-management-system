import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectForm from './pages/ProjectForm'
import Tasks from './pages/Tasks'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Teams from './pages/Teams'
import Layout from './components/Layout'
import { TeamProvider } from './context/TeamContext'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">
      Loading...
    </div>
  )

  if (!user) return <Auth />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:projectId" element={<Tasks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TeamProvider>
          <AppRoutes />
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
