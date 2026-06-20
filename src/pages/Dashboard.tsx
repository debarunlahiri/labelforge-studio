import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight, faCheck, faClockRotateLeft, faFileCirclePlus, faLayerGroup,
  faPenRuler, faPrint, faTableCells, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface DashboardCard {
  title: string
  value: number
  icon: IconDefinition
  color: string
  surface: string
  description: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalTemplates: 0, approvedTemplates: 0, draftTemplates: 0,
    availablePrinters: 0, failedPrintJobs: 0, todayPrintCount: 0,
  })
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const templates = await window.electronAPI?.templates.list() || []
        const printers = await window.electronAPI?.printers.list() || []
        const printJobs = await window.electronAPI?.printJobs.list() || []
        setStats({
          totalTemplates: templates.length,
          approvedTemplates: templates.filter((item: any) => item.status === 'Approved').length,
          draftTemplates: templates.filter((item: any) => item.status === 'Draft').length,
          availablePrinters: printers.filter((item: any) => item.status === 'available').length,
          failedPrintJobs: printJobs.filter((item: any) => item.status === 'Failed').length,
          todayPrintCount: printJobs.filter((item: any) => item.created_at?.startsWith(new Date().toISOString().split('T')[0])).length,
        })
        setRecentTemplates(templates.slice(0, 5))
      } catch {}
    }
    loadDashboardData()
  }, [])

  const cards: DashboardCard[] = [
    { title: 'Total Designs', value: stats.totalTemplates, icon: faLayerGroup, color: 'bg-blue-600', surface: 'from-blue-50', description: 'Saved label designs' },
    { title: 'Approved', value: stats.approvedTemplates, icon: faCheck, color: 'bg-emerald-500', surface: 'from-emerald-50', description: 'Production ready' },
    { title: 'Drafts', value: stats.draftTemplates, icon: faPenRuler, color: 'bg-amber-500', surface: 'from-amber-50', description: 'Work in progress' },
    { title: 'Printers Online', value: stats.availablePrinters, icon: faPrint, color: 'bg-violet-600', surface: 'from-violet-50', description: 'Ready to print' },
    { title: 'Failed Jobs', value: stats.failedPrintJobs, icon: faTriangleExclamation, color: 'bg-rose-500', surface: 'from-rose-50', description: 'Needs attention' },
    { title: "Today's Prints", value: stats.todayPrintCount, icon: faTableCells, color: 'bg-cyan-500', surface: 'from-cyan-50', description: 'Jobs created today' },
  ]

  const statusColors: Record<string, string> = {
    Draft: 'bg-amber-100 text-amber-700', 'Pending Approval': 'bg-orange-100 text-orange-700',
    Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-rose-100 text-rose-700',
    Archived: 'bg-slate-100 text-slate-600',
  }

  const actions = [
    { label: 'Create Design', description: 'Start a new label', icon: faFileCirclePlus, path: '/app/templates/new', color: 'bg-blue-50 text-blue-600' },
    { label: 'Design Library', description: 'Open saved designs', icon: faLayerGroup, path: '/app/templates', color: 'bg-violet-50 text-violet-600' },
    { label: 'Print Labels', description: 'Start a print job', icon: faPrint, path: '/app/print', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Print History', description: 'Review job activity', icon: faClockRotateLeft, path: '/app/print-history', color: 'bg-amber-50 text-amber-600' },
    { label: 'Manage Printers', description: 'Configure devices', icon: faTableCells, path: '/app/printers', color: 'bg-cyan-50 text-cyan-600' },
  ]

  return (
    <div className="mx-auto max-w-[1700px] space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-7 text-white shadow-xl shadow-slate-200">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-48 top-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Production workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to LabelForge Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Design labels, manage printers, and monitor production from one workspace.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/app/templates')} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Browse Designs</button>
            <button onClick={() => navigate('/app/templates/new')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-950/30 hover:bg-blue-500">
              <FontAwesomeIcon icon={faFileCirclePlus} /> Create New Design
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.title} className={`group rounded-xl border border-slate-200 bg-gradient-to-br ${card.surface} to-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">{card.title}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{card.description}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color} text-sm text-white shadow-sm`}><FontAwesomeIcon icon={card.icon} /></div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold text-slate-900">Recent Designs</h2><p className="mt-1 text-xs text-slate-500">Continue where you left off.</p></div>
            <button onClick={() => navigate('/app/templates')} className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700">View all <FontAwesomeIcon icon={faArrowRight} /></button>
          </div>
          {recentTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">No designs yet. Create your first label design.</div>
          ) : (
            <div className="space-y-3">
              {recentTemplates.map((item: any) => (
                <button key={item.id} onClick={() => navigate(`/app/templates/${item.id}/edit`)} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600"><FontAwesomeIcon icon={faLayerGroup} /></div>
                    <div className="min-w-0"><span className="block truncate font-semibold text-slate-900">{item.name}</span><span className="mt-0.5 block text-xs text-slate-500">{item.label_width}{item.unit} × {item.label_height}{item.unit} · {item.dpi} DPI</span></div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusColors[item.status] || 'bg-slate-100 text-slate-600'}`}>{item.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2><p className="mt-1 text-xs text-slate-500">Common production tasks in one click.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <button key={action.label} onClick={() => navigate(action.path)} className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.color}`}><FontAwesomeIcon icon={action.icon} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{action.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{action.description}</span></span>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
