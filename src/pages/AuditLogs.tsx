import { useEffect, useState } from 'react'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const data = await window.electronAPI?.auditLogs.list() || []
      setLogs(data)
    } catch {}
  }

  const filteredLogs = filter
    ? logs.filter((log: any) =>
        log.action?.toLowerCase().includes(filter.toLowerCase()) ||
        log.module?.toLowerCase().includes(filter.toLowerCase()) ||
        log.username?.toLowerCase().includes(filter.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <button
          onClick={loadLogs}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Action</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Module</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{log.username || '-'}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.module || '-'}</td>
                  <td className="px-4 py-3 text-xs font-mono">{log.entity_id?.substring(0, 8) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status || '-'}
                    </span>
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
