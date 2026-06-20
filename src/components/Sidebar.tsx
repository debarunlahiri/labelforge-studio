import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faClipboardList,
  faGear,
  faGaugeHigh,
  faPlus,
  faPrint,
  faTableCells,
  faTags,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

type MenuItem = { path: string; label: string; description: string; icon: IconDefinition }

const designItems: MenuItem[] = [
  { path: '/app/templates', label: 'Design Library', description: 'Browse and manage label designs', icon: faTags },
  { path: '/app/templates/new', label: 'New Design', description: 'Create a new label design', icon: faPlus },
]

const printerItems: MenuItem[] = [
  { path: '/app/print', label: 'Print', description: 'Choose a design and print it', icon: faPrint },
  { path: '/app/print-history', label: 'Print History', description: 'Review previous print jobs', icon: faClipboardList },
  { path: '/app/printers', label: 'Printer Setup', description: 'Detect, add, and manage printers', icon: faTableCells },
]

function NavigationMenu({
  label,
  icon,
  items,
  active,
}: {
  label: string
  icon: IconDefinition
  items: MenuItem[]
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors ${
          active ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <FontAwesomeIcon icon={icon} className={active ? 'text-blue-300' : 'text-slate-500'} fixedWidth />
        <span>{label}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`ml-1 text-[9px] transition-transform ${open ? 'rotate-180' : ''}`} />
        {active && <span className="absolute inset-x-3 -bottom-4 h-0.5 rounded-full bg-blue-400" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[1000] mt-3 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-2xl">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
              }`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FontAwesomeIcon icon={item.icon} fixedWidth />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-500">{item.description}</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const dashboardActive = location.pathname.startsWith('/app/dashboard')
  const settingsActive = location.pathname.startsWith('/app/settings')
  const designActive = location.pathname.startsWith('/app/templates')
  const printerActive = ['/app/print', '/app/print-history', '/app/printers'].some((path) => location.pathname.startsWith(path))
  const linkClass = (active: boolean) =>
    `relative flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors ${
      active ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
    }`

  return (
    <aside className="flex h-[72px] shrink-0 items-center border-b border-slate-800 bg-[var(--sidebar-bg)] px-5 text-[var(--sidebar-text)] shadow-sm">
      <div className="flex h-12 shrink-0 cursor-pointer items-center gap-3 border-r border-slate-800 pr-5" onClick={() => (window.location.href = '/')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-950/30">LF</div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">LabelForge</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Studio</span>
        </div>
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-visible px-5">
        <NavLink to="/app/dashboard" className={linkClass(dashboardActive)}>
          <FontAwesomeIcon icon={faGaugeHigh} className={dashboardActive ? 'text-blue-300' : 'text-slate-500'} fixedWidth />
          Dashboard
          {dashboardActive && <span className="absolute inset-x-3 -bottom-4 h-0.5 rounded-full bg-blue-400" />}
        </NavLink>
        <NavigationMenu label="Design" icon={faTags} items={designItems} active={designActive} />
        <NavigationMenu label="Printers" icon={faPrint} items={printerItems} active={printerActive} />
        <NavLink to="/app/settings" className={linkClass(settingsActive)}>
          <FontAwesomeIcon icon={faGear} className={settingsActive ? 'text-blue-300' : 'text-slate-500'} fixedWidth />
          Settings
          {settingsActive && <span className="absolute inset-x-3 -bottom-4 h-0.5 rounded-full bg-blue-400" />}
        </NavLink>
      </nav>
    </aside>
  )
}
