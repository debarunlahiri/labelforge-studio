import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const location = useLocation()
  const isDesigner = /^\/app\/templates\/(?:new|[^/]+\/edit)/.test(location.pathname)

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={`min-h-0 flex-1 bg-[var(--content-bg)] ${isDesigner ? 'overflow-hidden p-0' : 'overflow-auto p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
