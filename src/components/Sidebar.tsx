import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faClipboardList,
  faGear,
  faGaugeHigh,
  faBookOpen,
  faCircleQuestion,
  faKeyboard,
  faPenToSquare,
  faPlus,
  faPrint,
  faTags,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import appLogoUrl from '../assets/app_logo.png'
import { useTemplateStore } from '../store/templateStore'

type MenuItem = { path: string; label: string; description: string; icon: IconDefinition }

const designItems: MenuItem[] = [
  { path: '/app/templates', label: 'Design Library', description: 'Browse and manage label designs', icon: faTags },
  { path: '/app/templates/new', label: 'New Design', description: 'Create a new label design', icon: faPlus },
]

const printerItems: MenuItem[] = [
  { path: '/app/print-history', label: 'Print History', description: 'Review previous print jobs', icon: faClipboardList },
]

const helpItems: MenuItem[] = [
  { path: '/app/help?section=getting-started', label: 'Getting Started', description: 'Learn the Label Maker workflow', icon: faBookOpen },
  { path: '/app/help?section=designer', label: 'Template Designer', description: 'Create and edit label designs', icon: faTags },
  { path: '/app/help?section=printing', label: 'Printing & Printers', description: 'Prepare and send print jobs', icon: faPrint },
  { path: '/app/help?section=shortcuts', label: 'Keyboard Shortcuts', description: 'View shortcuts for your OS', icon: faKeyboard },
]

function NavigationMenu({
  label,
  icon,
  items,
  active,
  featuredItem,
  align = 'left',
}: {
  label: string
  icon: IconDefinition
  items: MenuItem[]
  active: boolean
  featuredItem?: MenuItem
  align?: 'left' | 'right'
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
        <div className={`absolute top-full z-[1000] mt-3 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {featuredItem && (
            <>
              <NavLink
                to={featuredItem.path}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-lg bg-blue-50 px-3 py-3 text-blue-800 transition-colors hover:bg-blue-100"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <FontAwesomeIcon icon={featuredItem.icon} fixedWidth />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{featuredItem.label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-blue-600">{featuredItem.description}</span>
                </span>
              </NavLink>
              <div className="mx-2 my-1.5 border-t border-slate-200" />
            </>
          )}
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
  const navigate = useNavigate()
  const currentTemplate = useTemplateStore((state) => state.currentTemplate)
  const templateRouteMatch = location.pathname.match(/^\/app\/templates\/([^/]+)\/(edit|preview|versions)$/)
  const routeTemplateId = templateRouteMatch?.[1]
  const templateMatchesCurrentRoute = !routeTemplateId || routeTemplateId === currentTemplate?.id
  const activeTemplateItem = currentTemplate?.id && templateMatchesCurrentRoute
    ? {
        path: `/app/templates/${currentTemplate.id}/edit`,
        label: currentTemplate.name || 'Current Design',
        description: 'Continue editing this design',
        icon: faPenToSquare,
      }
    : undefined
  const dashboardActive = location.pathname.startsWith('/app/dashboard')
  const settingsActive = location.pathname.startsWith('/app/settings')
  const designActive = location.pathname.startsWith('/app/templates')
  const printerActive = location.pathname.startsWith('/app/print-history')
  const helpActive = location.pathname.startsWith('/app/help')
  const linkClass = (active: boolean) =>
    `relative flex h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors ${
      active ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
    }`

  return (
    <aside className="flex h-[72px] shrink-0 items-center border-b border-slate-800 bg-[var(--sidebar-bg)] px-5 text-[var(--sidebar-text)] shadow-sm">
      <button
        type="button"
        className="flex h-12 shrink-0 items-center gap-3 border-r border-slate-800 pr-5 text-left"
        onClick={() => navigate('/')}
      >
        <img src={appLogoUrl} alt="Label Maker" className="h-9 w-9 rounded-lg object-cover shadow-lg shadow-blue-950/30" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Label Maker</span>
        </div>
      </button>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-visible px-5">
        <NavLink to="/app/dashboard" className={linkClass(dashboardActive)}>
          <FontAwesomeIcon icon={faGaugeHigh} className={dashboardActive ? 'text-blue-300' : 'text-slate-500'} fixedWidth />
          Dashboard
          {dashboardActive && <span className="absolute inset-x-3 -bottom-4 h-0.5 rounded-full bg-blue-400" />}
        </NavLink>
        <NavigationMenu label="Design" icon={faTags} items={designItems} active={designActive} featuredItem={activeTemplateItem} />
        <NavigationMenu label="Printers" icon={faPrint} items={printerItems} active={printerActive} />
        <NavLink to="/app/settings" className={linkClass(settingsActive)}>
          <FontAwesomeIcon icon={faGear} className={settingsActive ? 'text-blue-300' : 'text-slate-500'} fixedWidth />
          Settings
          {settingsActive && <span className="absolute inset-x-3 -bottom-4 h-0.5 rounded-full bg-blue-400" />}
        </NavLink>
      </nav>
      <div className="ml-auto border-l border-slate-800 pl-4">
        <NavigationMenu label="Help" icon={faCircleQuestion} items={helpItems} active={helpActive} align="right" />
      </div>
    </aside>
  )
}
