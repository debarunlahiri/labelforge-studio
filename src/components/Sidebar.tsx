import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList,
  faDatabase,
  faFileLines,
  faGear,
  faGaugeHigh,
  faChevronDown,
  faPrint,
  faTableCells,
  faTags,
} from '@fortawesome/free-solid-svg-icons'

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: faGaugeHigh },
  { path: '/app/templates', label: 'Templates', icon: faTags },
  { path: '/app/global-variables', label: 'Variables', icon: faDatabase },
  { path: '/app/audit-logs', label: 'Audit Logs', icon: faFileLines },
  { path: '/app/settings', label: 'Settings', icon: faGear },
]

const printingItems = [
  { path: '/app/print', label: 'Print', icon: faPrint },
  { path: '/app/print-history', label: 'Print History', icon: faClipboardList },
  { path: '/app/printers', label: 'Printers', icon: faTableCells },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-[var(--sidebar-bg)] p-3 text-[var(--sidebar-text)]">
      <div
        className="mx-2 mb-4 flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/20 px-4 py-4"
        onClick={() => (window.location.href = "/")}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white shadow-sm shadow-blue-950/30">
          LF
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold leading-tight">
            LabelForge
          </span>
          <span className="mt-0.5 text-[11px] text-slate-400">Studio v1.0</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mb-1.5 flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                isActive || location.pathname.startsWith(item.path)
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`
            }
          >
            <span className="flex w-5 justify-center text-sm text-slate-400">
              <FontAwesomeIcon icon={item.icon} fixedWidth />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="mb-1.5">
          <div
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm ${
              printingItems.some((item) =>
                location.pathname.startsWith(item.path),
              )
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-300"
            }`}
          >
            <span className="flex w-5 justify-center text-sm text-slate-400">
              <FontAwesomeIcon icon={faPrint} fixedWidth />
            </span>
            <span className="flex-1">Printing</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="text-[10px] text-slate-500"
            />
          </div>
          <div className="mt-1.5 space-y-1.5 pl-5">
            {printingItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                    isActive || location.pathname.startsWith(item.path)
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                  }`
                }
              >
                <span className="flex w-5 justify-center text-xs text-slate-500">
                  <FontAwesomeIcon icon={item.icon} fixedWidth />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/20 p-3">
        <div className="text-xs font-medium text-slate-300">Offline desktop mode</div>
        <div className="mt-1 text-[10px] text-slate-500">No sign-in required</div>
      </div>
    </aside>
  );
}
