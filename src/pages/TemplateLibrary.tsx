import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplateStore } from '../store/templateStore'

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

export default function TemplateLibrary() {
  const navigate = useNavigate()
  const { templates, filters, setFilters, loadTemplates, deleteTemplate, archiveTemplate, duplicateTemplate } = useTemplateStore()
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id)
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await duplicateTemplate(id)
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to archive this template?')) {
      await archiveTemplate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Template Library</h1>
        <button
          onClick={() => navigate('/templates/new')}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          + New Template
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
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
            onClick={() => navigate('/templates/new')}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group cursor-pointer rounded-xl border border-[var(--border-color)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate(`/templates/${template.id}/edit`)}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{template.description}</p>
                  )}
                </div>
                <span className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[template.status] || 'bg-gray-100 text-gray-600'}`}>
                  {template.status}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {template.label_width}{template.unit} x {template.label_height}{template.unit}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {template.dpi} DPI
                </span>
                {template.printer_type && (
                  <span className="rounded bg-slate-100 px-2 py-0.5">
                    {template.printer_type}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicate(template.id, e)}
                    className="rounded px-2 py-1 text-[10px] hover:bg-blue-50 hover:text-blue-600"
                    title="Duplicate"
                  >
                    Copy
                  </button>
                  <button
                    onClick={(e) => handleArchive(template.id, e)}
                    className="rounded px-2 py-1 text-[10px] hover:bg-yellow-50 hover:text-yellow-600"
                    title="Archive"
                  >
                    Archive
                  </button>
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="rounded px-2 py-1 text-[10px] hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}