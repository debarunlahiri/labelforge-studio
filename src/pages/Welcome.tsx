import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
      setRecentTemplates(templates.slice(0, 5))
    } catch {}
  }

  const handleNew = async () => {
    navigate('/app/templates/new')
  }

  const handleOpen = async () => {
    setIsOpening(true)
    try {
      const result = await window.electronAPI?.app.selectFile({
        title: 'Open LabelForge Template',
        filters: [
          { name: 'LabelForge Template', extensions: ['lfx.json'] },
          { name: 'JSON', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (result) {
        const content = await window.electronAPI?.app.readFile(result)
        if (content) {
          const data = JSON.parse(content)
          const imported = await window.electronAPI?.templates.import(data)
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

  const handleTemplate = (id: string) => {
    navigate(`/app/templates/${id}/edit`)
  }

  const handleBrowseAll = () => {
    navigate('/app/templates')
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8">
      <div className="w-full max-w-2xl px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-3xl font-bold text-white shadow-lg shadow-[var(--color-primary)]/30">
            LF
          </div>
          <h1 className="text-3xl font-bold text-white">LabelForge Studio</h1>
          <p className="mt-2 text-slate-400">Design, manage, and print labels</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <button
            onClick={handleNew}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-slate-600 bg-slate-800/50 p-9 text-center transition-all hover:border-[var(--color-primary)] hover:bg-slate-800 hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)]/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Create New</div>
              <div className="mt-1 text-sm text-slate-400">Start a new label template</div>
            </div>
          </button>

          <button
            onClick={handleOpen}
            disabled={isOpening}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-slate-600 bg-slate-800/50 p-9 text-center transition-all hover:border-emerald-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.226-.026.34-.026h15.812c.114 0 .228.009.34.026m-16.492 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.492 0L3.32 6.876c.396-.622 1.095-.999 1.844-.999h14.672c.75 0 1.448.377 1.844.999M3.75 9.776h16.5" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Open File</div>
              <div className="mt-1 text-sm text-slate-400">Import a .lfx.json template</div>
            </div>
          </button>
        </div>

        {recentTemplates.length > 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Recent Templates</h2>
              <button onClick={handleBrowseAll} className="text-xs text-[var(--color-primary)] hover:underline">View all</button>
            </div>
            <div className="space-y-2.5">
              {recentTemplates.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplate(t.id)}
                  className="flex w-full items-center justify-between rounded-lg px-5 py-3.5 text-left transition-colors hover:bg-slate-700/50"
                >
                  <div>
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.label_width}{t.unit} x {t.label_height}{t.unit} | {t.dpi} DPI</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.status === 'Approved' ? 'bg-green-900/30 text-green-400' :
                      t.status === 'Draft' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {recentTemplates.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-600 p-10 text-center">
            <div className="text-slate-400 mb-2">No templates yet</div>
            <button onClick={handleNew} className="text-sm text-[var(--color-primary)] hover:underline">Create your first label template</button>
          </div>
        )}
      </div>
    </div>
  )
}
