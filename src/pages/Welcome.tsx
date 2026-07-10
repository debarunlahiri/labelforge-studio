import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import appLogoUrl from '../assets/app_logo.png'

const navigation = [
  { label: 'Dashboard', path: '/app/dashboard', icon: dashboardIcon },
  { label: 'Templates', path: '/app/templates', icon: templatesIcon },
  { label: 'Printers', path: '/app/printers', icon: printerIcon },
  { label: 'Settings', path: '/app/settings', icon: settingsIcon },
]

const quickActions = [
  {
    label: 'Create New',
    description: 'Start a new label template',
    icon: plusIcon,
    color: 'blue',
    onClick: 'new',
  },
  {
    label: 'Open File',
    description: 'Import a .lfx template',
    icon: folderOpenIcon,
    color: 'emerald',
    onClick: 'open',
  },
  {
    label: 'Browse Templates',
    description: 'View and manage all templates',
    icon: templatesIcon,
    color: 'violet',
    onClick: 'browse',
  },
  {
    label: 'Quick Print',
    description: 'Print using an existing template',
    icon: printerIcon,
    color: 'amber',
    onClick: 'print',
  },
]

export default function Welcome() {
  const navigate = useNavigate()
  const [isOpening, setIsOpening] = useState(false)
  const [recentTemplates, setRecentTemplates] = useState<any[]>([])

  useEffect(() => {
    console.log('[Welcome] electronAPI available:', !!window.electronAPI)
    loadRecent()
  }, [])

  const loadRecent = async () => {
    try {
      const templates = await window.electronAPI?.templates.list() || []
      setRecentTemplates(templates.slice(0, 6))
    } catch {}
  }

  const handleNew = () => navigate('/app/templates/new')
  const handleBrowse = () => navigate('/app/templates')
  const handlePrint = () => navigate('/app/print')

  const handleOpen = async () => {
    setIsOpening(true)
    try {
      const result = await window.electronAPI?.app.selectFile({
        title: 'Open LabelForge Template',
        filters: [
          { name: 'LabelForge Template', extensions: ['lfx'] },
          { name: 'Legacy LabelForge JSON', extensions: ['lfx.json'] },
          { name: 'JSON', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (result) {
        const content = await window.electronAPI?.app.readFile(result)
        if (content) {
          const data = JSON.parse(content)
          const imported = await window.electronAPI?.templates.importTemplate(data)
          if (imported?.success && imported?.template) {
            navigate(`/app/templates/${imported.template.id}/edit`)
          }
        }
      }
    } catch (e) {
      console.error('Failed to open file:', e)
    }
    setIsOpening(false)
  }

  const handleTemplate = (id: string) => navigate(`/app/templates/${id}/edit`)

  const handleAction = (action: string) => {
    if (action === 'new') handleNew()
    if (action === 'open') handleOpen()
    if (action === 'browse') handleBrowse()
    if (action === 'print') handlePrint()
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      {/* Top navigation */}
      <header className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src={appLogoUrl} alt="LabelForge Studio" className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-blue-600/20" />
          <span className="text-lg font-bold text-white">LabelForge Studio</span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <span className="h-4 w-4">{item.icon()}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500"
        >
          New Template
        </button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Design, manage, and print labels
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-400">
              Everything you need to create professional labels for production, manufacturing, shipping, and retail.
            </p>
          </div>

          {/* Quick actions */}
          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action.onClick)}
                disabled={action.onClick === 'open' && isOpening}
                className={`group flex flex-col items-start gap-4 rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-left transition-all hover:-translate-y-1 hover:border-${action.color}-500/50 hover:bg-slate-800/60 hover:shadow-xl hover:shadow-${action.color}-500/10 disabled:opacity-50`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${action.color}-500/10 text-${action.color}-400 transition-colors group-hover:bg-${action.color}-500/20`}
                >
                  <span className="h-6 w-6">{action.icon()}</span>
                </div>
                <div>
                  <div className="text-base font-semibold text-white">{action.label}</div>
                  <div className="mt-1 text-sm text-slate-400">{action.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Recent templates */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent Templates</h2>
                <p className="text-sm text-slate-400">Pick up where you left off</p>
              </div>
              <button
                onClick={handleBrowse}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10"
              >
                View all
              </button>
            </div>

            {recentTemplates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentTemplates.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplate(t.id)}
                    className="group flex flex-col rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-left transition-all hover:border-blue-500/50 hover:bg-slate-800"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <span className="h-5 w-5">{templateIcon()}</span>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {t.label_width}
                      {t.unit} x {t.label_height}
                      {t.unit} · {t.dpi} DPI
                    </div>
                    {t.updated_at && (
                      <div className="mt-3 text-[11px] text-slate-500">
                        Updated {formatDate(t.updated_at)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/50 text-slate-400">
                  <span className="h-6 w-6">{templateIcon()}</span>
                </div>
                <div className="text-slate-300">No templates yet</div>
                <div className="mt-1 text-sm text-slate-500">Create your first label template to get started</div>
                <button
                  onClick={handleNew}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Create Template
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>LabelForge Studio</div>
            <div className="flex gap-4">
              <button onClick={() => navigate('/app/settings')} className="hover:text-slate-300">Settings</button>
              <button onClick={() => navigate('/app/printers')} className="hover:text-slate-300">Printers</button>
              <button onClick={() => navigate('/app/print-history')} className="hover:text-slate-300">Print History</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    Draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {status || 'Draft'}
    </span>
  )
}

function formatDate(value: string) {
  try {
    const date = new Date(value)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return value
  }
}

function dashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function templatesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m3-.75v-4.5m0 4.5h.75m-7.5-4.5H6m1.5 0v4.5m0-4.5h-.75m.75 0H9m-1.5 4.5v-4.5m0 4.5h.75" />
    </svg>
  )
}

function printerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m7.5 0v-.688c0-.864-.564-1.625-1.396-1.857a25.54 25.54 0 00-2.9-.347M9.6 5.04c.652 0 1.305.04 1.952.127m-1.952 0a25.54 25.54 0 012.9.347c.832.232 1.396.993 1.396 1.857v.688m-7.5 0V5.76c0-.864.564-1.625 1.396-1.857a25.54 25.54 0 012.9-.347" />
    </svg>
  )
}

function settingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.645.87l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.87l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function plusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function folderOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.226-.026.34-.026h15.812c.114 0 .228.009.34.026m-16.492 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.492 0L3.32 6.876c.396-.622 1.095-.999 1.844-.999h14.672c.75 0 1.448.377 1.844.999M3.75 9.776h16.5" />
    </svg>
  )
}

function templateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m10.5-8.25H18a2.25 2.25 0 012.25 2.25v8.25A2.25 2.25 0 0118 21h-7.5A2.25 2.25 0 018.25 18.75V9.75A2.25 2.25 0 0110.5 7.5h.75m6-3h-7.5v3h7.5V4.5z" />
    </svg>
  )
}
