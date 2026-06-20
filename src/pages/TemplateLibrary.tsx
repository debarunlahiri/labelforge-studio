import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxArchive,
  faClockRotateLeft,
  faCopy,
  faDownload,
  faFileImport,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useTemplateStore } from '../store/templateStore'
import TemplateThumbnail from '../components/TemplateThumbnail'
import PageHero from '../components/PageHero'
import { useConfirm } from '../hooks/useConfirm'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Archived', label: 'Archived' },
]

const statusColors: Record<string, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Pending Approval': 'bg-orange-100 text-orange-700 border-orange-300',
  Approved: 'bg-green-100 text-green-700 border-green-300',
  Rejected: 'bg-red-100 text-red-700 border-red-300',
  Archived: 'bg-gray-100 text-gray-600 border-gray-300',
  Locked: 'bg-slate-100 text-slate-700 border-slate-300',
}

function CardActionTooltip({ label, align = 'center' }: { label: string; align?: 'center' | 'right' }) {
  return (
    <span className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover/action:block ${
      align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
    }`}>
      {label}
      <span className={`absolute top-full border-4 border-transparent border-t-slate-950 ${
        align === 'right' ? 'right-3' : 'left-1/2 -translate-x-1/2'
      }`} />
    </span>
  )
}

export default function TemplateLibrary() {
  const { confirm, dialog: confirmDialog } = useConfirm()
  const navigate = useNavigate()
  const { templates, filters, setFilters, loadTemplates, deleteTemplate, archiveTemplate, duplicateTemplate, clearCurrentTemplate } = useTemplateStore()
  const [search, setSearch] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || '')

  useEffect(() => {
    loadTemplates()
  }, [filters])

  const handleSearch = (value: string) => {
    setSearch(value)
    setFilters({ search: value })
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setFilters({ status: value })
  }

  const handleNewTemplate = () => {
    clearCurrentTemplate()
    navigate('/app/templates/new')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm({ title: 'Delete design?', message: 'This design and its saved versions will be permanently deleted.' })) {
      await deleteTemplate(id)
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await duplicateTemplate(id)
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await confirm({ title: 'Archive design?', message: 'This design will be moved to the archive.', confirmLabel: 'Archive', danger: false })) {
      await archiveTemplate(id)
    }
  }

  const handleExport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const data = await window.electronAPI?.templates.exportTemplate(id)
      if (data) {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.template?.name || 'template'}.lfx.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
  }

  const handleImport = async () => {
    try {
      const filePath = await window.electronAPI?.app.selectFile({
        title: 'Import Template',
        filters: [{ name: 'LabelForge Template', extensions: ['json', 'lfx'] }],
      })
      if (!filePath) return
      const response = await fetch(`file://${filePath}`)
      const data = await response.json()
      const result = await window.electronAPI?.templates.importTemplate(data)
      if (result?.success) {
        await loadTemplates()
      }
    } catch {}
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHero
        eyebrow="Design workspace"
        title="Design Library"
        description="Create, organize, and reuse production-ready label designs."
        icon={faPenToSquare}
        accent="violet"
        actions={<>
          <button
            onClick={handleImport}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faFileImport} />
            Import
          </button>
          <button
            onClick={handleNewTemplate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
          >
            <FontAwesomeIcon icon={faPlus} />
            New Template
          </button>
        </>}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="flex h-10 min-w-64 flex-1 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by template name or description"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="h-10 min-w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-6xl text-slate-300">▦</div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">No templates found</h3>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Create your first label template to get started
          </p>
          <button
            onClick={handleNewTemplate}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              onClick={() => navigate(`/app/templates/${template.id}/edit`)}
            >
              <TemplateThumbnail template={template} />
              <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{template.description}</p>
                  )}
                </div>
                <span className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[template.status] || 'bg-gray-100 text-gray-600'}`}>
                  {template.status}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="rounded-md bg-slate-100 px-2.5 py-1">
                  {template.label_width}{template.unit} × {template.label_height}{template.unit}
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1">
                  {template.dpi} DPI
                </span>
                {template.printer_type && (
                  <span className="rounded bg-slate-100 px-2 py-0.5">
                    {template.printer_type}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                <span>Updated {new Date(template.updated_at || template.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/templates/${template.id}/edit`) }}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    aria-label="Edit design"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                    <CardActionTooltip label="Edit Design" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/templates/${template.id}/versions`) }}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                    aria-label="Version history"
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                    <CardActionTooltip label="Version History" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicate(template.id, e)}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                    aria-label="Duplicate design"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    <CardActionTooltip label="Duplicate Design" />
                  </button>
                  <button
                    onClick={(e) => handleExport(template.id, e)}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                    aria-label="Export design"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <CardActionTooltip label="Export Design" />
                  </button>
                  <button
                    onClick={(e) => handleArchive(template.id, e)}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                    aria-label="Archive design"
                  >
                    <FontAwesomeIcon icon={faBoxArchive} />
                    <CardActionTooltip label="Archive Design" align="right" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="group/action relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700"
                    aria-label="Delete design"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <CardActionTooltip label="Delete Design" align="right" />
                  </button>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDialog}
    </div>
  )
}
