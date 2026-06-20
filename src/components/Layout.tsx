import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()
  const isDesigner = /^\/app\/templates\/(?:new|[^/]+\/edit)/.test(location.pathname)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className={`min-h-0 flex-1 bg-[radial-gradient(circle_at_top_right,_#dbeafe_0,_transparent_28%),var(--content-bg)] ${isDesigner ? 'overflow-hidden p-0' : 'overflow-auto p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
