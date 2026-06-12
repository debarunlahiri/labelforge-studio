import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▣' },
  { path: '/templates', label: 'Templates', icon: '▦' },
  { path: '/print', label: 'Print', icon: '⎙' },
  { path: '/print-history', label: 'Print History', icon: '⊞' },
  { path: '/printers', label: 'Printers', icon: '⌨' },
  { path: '/users', label: 'Users', icon: '囻' },
  { path: '/global-variables', label: 'Variables', icon: '✕' },
  { path: '/audit-logs', label: 'Audit Logs', icon: '☰' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
      <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">
          LF
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">LabelForge</span>
          <span className="text-[10px] text-slate-400">Studio v1.0</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive || location.pathname.startsWith(item.path)
                  ? 'bg-[var(--sidebar-active)] text-white'
                  : 'text-slate-300 hover:bg-[var(--sidebar-hover)] hover:text-white'
              }`
            }
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white">
            {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{user?.full_name || user?.username || 'User'}</span>
            <span className="text-[10px] text-slate-400">{user?.roles?.[0] || 'No role'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}