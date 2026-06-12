import { useEffect, useState } from 'react'

export default function GlobalVariables() {
  const [variables, setVariables] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    variable_key: '',
    variable_value: '',
    data_type: 'string',
    description: '',
  })

  useEffect(() => {
    loadVariables()
  }, [])

  const loadVariables = async () => {
    try {
      const data = await window.electronAPI?.globalVariables.list() || []
      setVariables(data)
    } catch {}
  }

  const handleCreate = async () => {
    if (!formData.variable_key.trim()) return
    try {
      await window.electronAPI?.globalVariables.create(formData)
      setShowCreateForm(false)
      setFormData({ variable_key: '', variable_value: '', data_type: 'string', description: '' })
      loadVariables()
    } catch {}
  }

  const handleUpdate = async (id: string, value: string) => {
    await window.electronAPI?.globalVariables.update(id, { variable_value: value })
    loadVariables()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this variable?')) {
      await window.electronAPI?.globalVariables.delete(id)
      loadVariables()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Global Variables</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          + Add Variable
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Add Variable</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Key *</label>
              <input
                type="text"
                value={formData.variable_key}
                onChange={(e) => setFormData({ ...formData, variable_key: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g., company_name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Value</label>
              <input
                type="text"
                value={formData.variable_value}
                onChange={(e) => setFormData({ ...formData, variable_value: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data Type</label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.variable_key.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              Add Variable
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Key</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Value</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Description</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((v: any) => (
                <tr key={v.id} className="border-b border-[var(--border-color)] hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{v.variable_key}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={v.variable_value || ''}
                      onBlur={(e) => handleUpdate(v.id, e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{v.data_type}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{v.description || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}