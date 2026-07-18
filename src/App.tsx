import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Layout from './components/Layout'

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
const Help = lazy(() => import('./pages/Help'))

function StartupRoute() {
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.settings.getAll()
      .then((settings: Record<string, string>) => {
        if (settings.reopen_last_template === 'true' && settings.last_edited_template_id) {
          setDestination(`/app/templates/${settings.last_edited_template_id}/edit`)
          return
        }
        const page = ['dashboard', 'templates', 'print', 'printers'].includes(settings.start_page)
          ? settings.start_page
          : 'dashboard'
        setDestination(`/app/${page}`)
      })
      .catch(() => setDestination('/app/dashboard'))
  }, [])

  return destination ? <Navigate to={destination} replace /> : <div className="flex h-full items-center justify-center text-slate-500">Opening Label Maker…</div>
}

function OpenTemplateFileBridge() {
  const navigate = useNavigate()
  const openedFilesRef = useRef(new Set<string>())

  useEffect(() => {
    const openTemplateFile = async (filePath: string | null | undefined) => {
      if (!filePath || openedFilesRef.current.has(filePath)) return
      openedFilesRef.current.add(filePath)

      try {
        const content = await window.electronAPI?.app.readFile(filePath)
        if (!content) throw new Error('File could not be read')

        const data = JSON.parse(content)
        const imported = await window.electronAPI?.templates.importTemplate(data)
        if (imported?.success && imported?.template?.id) {
          await window.electronAPI?.settings.set(`template_file_path_${imported.template.id}`, filePath)
          navigate(`/app/templates/${imported.template.id}/edit`)
        } else {
          throw new Error(imported?.error || 'Template could not be imported')
        }
      } catch (error) {
        console.error('Failed to open Label Maker template file:', error)
      } finally {
        await window.electronAPI?.app.clearPendingOpenTemplateFile(filePath)
      }
    }

    window.electronAPI?.app.getPendingOpenTemplateFile?.().then(openTemplateFile)
    return window.electronAPI?.app.onOpenTemplateFile?.(openTemplateFile)
  }, [navigate])

  return null
}

function App() {
  return (
    <HashRouter>
      <OpenTemplateFileBridge />
      <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="text-[var(--text-secondary)]">Loading...</div></div>}>
        <Routes>
          <Route path="/" element={<StartupRoute />} />
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
            <Route path="help" element={<Help />} />
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
