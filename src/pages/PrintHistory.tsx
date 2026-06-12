import { useEffect, useState } from 'react'

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-600',
  Printing: 'bg-blue-100 text-blue-700',
}

export default function PrintHistory() {
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const data = await window.electronAPI?.printJobs.list() || []
      setJobs(data)
    } catch {}
  }

  const handleCancel = async (id: string) => {
    if (confirm('Cancel this print job?')) {
      await window.electronAPI?.printJobs.cancel(id)
      loadJobs()
    }
  }

  const handleRetry = async (id: string) => {
    await window.electronAPI?.printJobs.retry(id)
    loadJobs()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Print History</h1>
        <button
          onClick={loadJobs}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Job ID</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Template</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Printer</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Copies</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Created</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)]">
                    No print jobs yet
                  </td>
                </tr>
              ) : (
                jobs.map((job: any) => (
                  <tr key={job.id} className="border-b border-[var(--border-color)] hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{job.id.substring(0, 8)}</td>
                    <td className="px-4 py-3">{job.template_id?.substring(0, 8)}</td>
                    <td className="px-4 py-3">{job.printer_id?.substring(0, 8)}</td>
                    <td className="px-4 py-3">{job.copies}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(job.status === 'Pending' || job.status === 'Queued') && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                        {job.status === 'Failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}