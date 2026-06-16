import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardCard {
  title: string
  value: string | number
  icon: string
  color: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalTemplates: 0,
    approvedTemplates: 0,
    draftTemplates: 0,
    availablePrinters: 0,
    failedPrintJobs: 0,
    todayPrintCount: 0,
  })
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const templates = await window.electronAPI?.templates.list() || []
      const printers = await window.electronAPI?.printers.list() || []
      const printJobs = await window.electronAPI?.printJobs.list() || []

      setStats({
        totalTemplates: templates.length,
        approvedTemplates: templates.filter((t: any) => t.status === 'Approved').length,
        draftTemplates: templates.filter((t: any) => t.status === 'Draft').length,
        availablePrinters: printers.filter((p: any) => p.status === 'available').length,
        failedPrintJobs: printJobs.filter((j: any) => j.status === 'Failed').length,
        todayPrintCount: printJobs.filter((j: any) => {
          if (!j.created_at) return false
          return j.created_at.startsWith(new Date().toISOString().split('T')[0])
        }).length,
      })
      setRecentTemplates(templates.slice(0, 5))
    } catch {
    }
  }

  const cards: DashboardCard[] = [
    { title: 'Total Templates', value: stats.totalTemplates, icon: '▦', color: 'bg-blue-500' },
    { title: 'Approved', value: stats.approvedTemplates, icon: '✓', color: 'bg-green-500' },
    { title: 'Drafts', value: stats.draftTemplates, icon: '✎', color: 'bg-yellow-500' },
    { title: 'Printers', value: stats.availablePrinters, icon: '⌨', color: 'bg-purple-500' },
    { title: 'Failed Jobs', value: stats.failedPrintJobs, icon: '!', color: 'bg-red-500' },
    { title: "Today's Prints", value: stats.todayPrintCount, icon: '⎙', color: 'bg-cyan-500' },
  ]

  const statusColors: Record<string, string> = {
    Draft: 'bg-yellow-100 text-yellow-700',
    'Pending Approval': 'bg-orange-100 text-orange-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Archived: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome to LabelForge Studio
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Here's an overview of your label system
          </p>
        </div>
        <button
          onClick={() => navigate('/app/templates/new')}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          + Create New Label
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-[var(--border-color)] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} text-white text-lg`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{card.title}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Templates</h2>
            <button
              onClick={() => navigate('/app/templates')}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </button>
          </div>
          {recentTemplates.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              No templates yet. Create your first label template.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTemplates.map((t: any) => (
                <div
                  key={t.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border-color)] p-3 transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/app/templates/${t.id}/edit`)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--text-primary)]">{t.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t.label_width}{t.unit} x {t.label_height}{t.unit} | {t.dpi} DPI
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create New Label', icon: '+', path: '/app/templates/new', color: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Open Template Library', icon: '▦', path: '/app/templates', color: 'bg-purple-50 text-purple-600 border-purple-200' },
              { label: 'Print Labels', icon: '⎙', path: '/app/print', color: 'bg-green-50 text-green-600 border-green-200' },
              { label: 'View Print History', icon: '⊞', path: '/app/print-history', color: 'bg-orange-50 text-orange-600 border-orange-200' },
              { label: 'Manage Printers', icon: '⌨', path: '/app/printers', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:shadow-sm ${action.color}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 text-lg font-bold">
                  {action.icon}
                </span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
