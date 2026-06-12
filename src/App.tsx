import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TemplateLibrary from './pages/TemplateLibrary'
import TemplateDesigner from './pages/TemplateDesigner'
import PrintScreen from './pages/PrintScreen'
import PrintHistory from './pages/PrintHistory'
import PrinterStatus from './pages/PrinterStatus'
import UserManagement from './pages/UserManagement'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import GlobalVariables from './pages/GlobalVariables'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="templates" element={<TemplateLibrary />} />
          <Route path="templates/new" element={<TemplateDesigner />} />
          <Route path="templates/:id/edit" element={<TemplateDesigner />} />
          <Route path="print" element={<PrintScreen />} />
          <Route path="print-history" element={<PrintHistory />} />
          <Route path="printers" element={<PrinterStatus />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="global-variables" element={<GlobalVariables />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App