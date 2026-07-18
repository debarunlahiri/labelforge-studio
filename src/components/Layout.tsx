import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()
  const isDesigner = /^\/app\/templates\/(?:new|[^/]+\/edit)/.test(location.pathname)
  const isPrintPreview = /^\/app\/templates\/[^/]+\/preview/.test(location.pathname)
  const fullWorkspace = isDesigner || isPrintPreview

  useEffect(() => {
    window.electronAPI?.settings.getAll().then((settings: Record<string, string>) => {
      document.documentElement.classList.toggle('interface-compact', settings.interface_compact === 'true')
      document.documentElement.classList.toggle('reduce-motion', settings.interface_reduce_motion === 'true')
      document.documentElement.classList.toggle('high-contrast', settings.interface_high_contrast === 'true')
    }).catch(() => undefined)
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className={`min-h-0 flex-1 bg-[radial-gradient(circle_at_top_right,_#dbeafe_0,_transparent_28%),var(--content-bg)] ${fullWorkspace ? 'overflow-hidden p-0' : 'overflow-auto p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
