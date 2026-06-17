import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import Welcome from './pages/Welcome'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const TemplateLibrary = lazy(() => import('./pages/TemplateLibrary'))
const TemplateDesigner = lazy(() => import('./pages/TemplateDesigner'))
const PrintScreen = lazy(() => import('./pages/PrintScreen'))
const PrintHistory = lazy(() => import('./pages/PrintHistory'))
const PrinterStatus = lazy(() => import('./pages/PrinterStatus'))
const Settings = lazy(() => import('./pages/Settings'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const GlobalVariables = lazy(() => import('./pages/GlobalVariables'))
const PrintPreview = lazy(() => import('./pages/PrintPreview'))
const TemplateVersions = lazy(() => import('./pages/TemplateVersions'))

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="text-[var(--text-secondary)]">Loading...</div></div>}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route
            path="/app"
            element={<Layout />}
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="templates" element={<TemplateLibrary />} />
            <Route path="templates/new" element={<TemplateDesigner />} />
            <Route path="templates/:id/edit" element={<TemplateDesigner />} />
            <Route path="templates/:id/versions" element={<TemplateVersions />} />
            <Route path="print" element={<PrintScreen />} />
            <Route path="print-history" element={<PrintHistory />} />
            <Route path="printers" element={<PrinterStatus />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="global-variables" element={<GlobalVariables />} />
            <Route path="templates/:id/preview" element={<PrintPreview />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
