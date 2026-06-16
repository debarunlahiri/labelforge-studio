import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTemplateStore } from '../store/templateStore'
import type { TemplateVersion } from '../types'

const statusColors: Record<string, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Pending Approval': 'bg-orange-100 text-orange-700 border-orange-300',
  Approved: 'bg-green-100 text-green-700 border-green-300',
  Rejected: 'bg-red-100 text-red-700 border-red-300',
}

type ObjStatus = 'added' | 'removed' | 'modified' | 'unchanged'

const objStatusStyles: Record<ObjStatus, string> = {
  added: 'bg-green-50 border-green-200',
  removed: 'bg-red-50 border-red-200',
  modified: 'bg-yellow-50 border-yellow-200',
  unchanged: 'bg-white',
}

const objStatusBadgeStyles: Record<ObjStatus, string> = {
  added: 'bg-green-100 text-green-700 border-green-300',
  removed: 'bg-red-100 text-red-700 border-red-300',
  modified: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  unchanged: 'bg-gray-100 text-gray-600 border-gray-300',
}

const objStatusLabels: Record<ObjStatus, string> = {
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: 'Unchanged',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTemplateJson(jsonStr: string): any {
  try { return JSON.parse(jsonStr) } catch { return { objects: [], width: 0, height: 0, unit: 'mm', dpi: 203 } }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectStatus(id: string, map1: Map<string, any>, map2: Map<string, any>): ObjStatus {
  const in1 = map1.has(id)
  const in2 = map2.has(id)
  if (!in1 && in2) return 'added'
  if (in1 && !in2) return 'removed'
  if (JSON.stringify(map1.get(id)) !== JSON.stringify(map2.get(id))) return 'modified'
  return 'unchanged'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectBreakdown(objects: any[]): string {
  if (!objects || objects.length === 0) return '0 objects'
  const counts: Record<string, number> = {}
  objects.forEach(o => { counts[o.type] = (counts[o.type] || 0) + 1 })
  return `${objects.length} object${objects.length !== 1 ? 's' : ''}: ${Object.entries(counts).map(([t, c]) => `${c} ${t}`).join(', ')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKeyProps(obj: any): string {
  switch (obj.type) {
    case 'text': return `value="${obj.value ?? ''}" ${obj.fontFamily ?? ''} ${obj.fontSize ?? ''}pt${obj.bold ? ' bold' : ''}${obj.italic ? ' italic' : ''}`
    case 'barcode': return `value="${obj.value ?? ''}" barcodeType=${obj.barcodeType ?? ''}`
    case 'qrcode': return `value="${obj.value ?? ''}"`
    case 'shape': return `shapeType=${obj.shapeType ?? ''} fill=${obj.fill ?? 'none'}`
    case 'line': return `to=(${obj.x2 ?? 0},${obj.y2 ?? 0})`
    case 'datetime': return `format="${obj.format ?? ''}"`
    case 'counter': return `start=${obj.startValue ?? 0} step=${obj.stepValue ?? 1}`
    case 'database': return `field="${obj.field ?? ''}"`
    case 'rfid': return `data="${obj.data ?? ''}"`
    case 'image': return `src="${obj.src ?? ''}"`
    default: return ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChangedPropKeys(o1: any, o2: any): string[] {
  const changed: string[] = []
  const allKeys = new Set([...Object.keys(o1), ...Object.keys(o2)])
  for (const key of allKeys) {
    if (JSON.stringify(o1[key]) !== JSON.stringify(o2[key])) changed.push(key)
  }
  return changed
}

export default function TemplateVersions() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTemplate, versions, loadTemplate, loadVersions, submitForApproval, approveVersion, rejectVersion } = useTemplateStore()
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showDiff, setShowDiff] = useState(false)
  const [diffVersions, setDiffVersions] = useState<{ v1: TemplateVersion | null; v2: TemplateVersion | null }>({ v1: null, v2: null })
  const [rejectingVersionId, setRejectingVersionId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (id) {
      loadTemplate(id)
      loadVersions(id)
    }
  }, [id])

  const canApprove = true

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((v) => v !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const handleCompare = () => {
    if (selectedVersions.length !== 2) return
    const v1 = versions.find((v) => v.id === selectedVersions[0]) || null
    const v2 = versions.find((v) => v.id === selectedVersions[1]) || null
    setDiffVersions({ v1, v2 })
    setShowDiff(true)
  }

  const handleSubmitForApproval = async (versionId: string) => {
    await submitForApproval(versionId)
    if (id) loadVersions(id)
  }

  const handleApprove = async (versionId: string) => {
    await approveVersion(versionId)
    if (id) loadVersions(id)
  }

  const handleReject = async (versionId: string) => {
    await rejectVersion(versionId, rejectReason)
    setRejectingVersionId(null)
    setRejectReason('')
    if (id) loadVersions(id)
  }

  const handleResubmit = async (versionId: string) => {
    await submitForApproval(versionId)
    if (id) loadVersions(id)
  }

  const handleRevert = async (version: TemplateVersion) => {
    if (!id) return
    try {
      await window.electronAPI?.templateVersions.save(id, {
        template_json: version.template_json,
        change_comment: `Reverted to version ${version.version_number}`,
      })
      if (id) loadVersions(id)
    } catch {}
  }

  const handleDelete = async (versionId: string) => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this version?')) return
    try {
      await window.electronAPI?.templateVersions.delete(versionId)
      loadVersions(id)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/templates')}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm hover:bg-slate-50"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold">
          {currentTemplate ? `${currentTemplate.name} - Version History` : 'Version History'}
        </h1>
      </div>

      {selectedVersions.length === 2 && (
        <button
          onClick={handleCompare}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Compare Selected Versions
        </button>
      )}

      {showDiff && diffVersions.v1 && diffVersions.v2 && (() => {
        const t1 = parseTemplateJson(diffVersions.v1!.template_json)
        const t2 = parseTemplateJson(diffVersions.v2!.template_json)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map1 = new Map<string, any>((t1.objects || []).map((o: any) => [o.id, o]))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map2 = new Map<string, any>((t2.objects || []).map((o: any) => [o.id, o]))
        const allIds = [...new Set([...map1.keys(), ...map2.keys()])]
        const sortedIds = [...allIds].sort((a, b) => {
          const sa = getObjectStatus(a, map1, map2)
          const sb = getObjectStatus(b, map1, map2)
          const order: Record<ObjStatus, number> = { removed: 0, added: 1, modified: 2, unchanged: 3 }
          return order[sa] !== order[sb] ? order[sa] - order[sb] : ((map1.get(a) || map2.get(a))?.name ?? '').localeCompare((map1.get(b) || map2.get(b))?.name ?? '')
        })

        const renderVersionPanel = (v: TemplateVersion, t: typeof t1, label: string) => (
          <div className="rounded-lg border border-[var(--border-color)] bg-white p-4 flex-1">
            <div className="text-sm font-semibold mb-2">{label}</div>
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <div>Created: {new Date(v.created_at).toLocaleString()}</div>
              <div>
                Status: <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${statusColors[v.status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>{v.status}</span>
              </div>
              <div>Canvas: {t.width ?? '—'} &times; {t.height ?? '—'} {t.unit || 'mm'}</div>
              <div>DPI: {t.dpi ?? '—'}</div>
              <div>{getObjectBreakdown(t.objects || [])}</div>
            </div>
          </div>
        )

        return (
          <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Comparing v{diffVersions.v1!.version_number} &rarr; v{diffVersions.v2!.version_number}
              </h2>
              <button
                onClick={() => setShowDiff(false)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex gap-4">
              {renderVersionPanel(diffVersions.v1!, t1, `Version ${diffVersions.v1!.version_number}`)}
              {renderVersionPanel(diffVersions.v2!, t2, `Version ${diffVersions.v2!.version_number}`)}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                Object Comparison
                <span className="ml-2 text-[10px] font-normal">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200 mr-1 align-middle" />Removed
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-50 border border-green-200 ml-3 mr-1 align-middle" />Added
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-50 border border-yellow-200 ml-3 mr-1 align-middle" />Modified
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-white border border-gray-200 ml-3 mr-1 align-middle" />Unchanged
                </span>
              </h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {sortedIds.length === 0 && (
                  <div className="text-xs text-[var(--text-secondary)] py-4 text-center">No objects in either version.</div>
                )}
                {sortedIds.map(id => {
                  const status = getObjectStatus(id, map1, map2)
                  const o1 = map1.get(id)
                  const o2 = map2.get(id)
                  const obj = o2 || o1
                  const changedProps = status === 'modified' ? getChangedPropKeys(o1, o2) : []

                  return (
                    <div
                      key={id}
                      className={`rounded-lg border px-3 py-2 ${objStatusStyles[status]}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${objStatusBadgeStyles[status]}`}>
                          {objStatusLabels[status]}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {obj?.name || obj?.id}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] bg-slate-100 rounded px-1.5 py-0.5">
                          {obj?.type}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          pos=({obj?.x ?? 0}, {obj?.y ?? 0}) size=({obj?.width ?? 0} &times; {obj?.height ?? 0})
                        </span>
                        {obj && getKeyProps(obj) && (
                          <span className="text-[10px] text-[var(--text-secondary)] truncate">
                            {getKeyProps(obj)}
                          </span>
                        )}
                      </div>
                      {changedProps.length > 0 && (
                        <div className="mt-1 text-[10px] text-yellow-700">
                          Changed: {changedProps.join(', ')}
                          <div className="mt-0.5 grid grid-cols-2 gap-2">
                            <div className="text-red-600">
                              v{diffVersions.v1!.version_number}: {changedProps.map(p => `${p}=${JSON.stringify(o1[p] ?? null)}`).join(', ')}
                            </div>
                            <div className="text-green-600">
                              v{diffVersions.v2!.version_number}: {changedProps.map(p => `${p}=${JSON.stringify(o2[p] ?? null)}`).join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {rejectingVersionId && (
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Reject Version</h2>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
            rows={3}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => { setRejectingVersionId(null); setRejectReason('') }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleReject(rejectingVersionId)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-slate-50 text-left text-xs font-semibold text-[var(--text-secondary)]">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Change Comment</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Approved By</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.id} className="border-b border-[var(--border-color)] last:border-b-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => handleSelectVersion(version.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-sm">v{version.version_number}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[version.status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                    {version.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                  {version.change_comment || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {new Date(version.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {version.created_by}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {version.approved_by ? `${version.approved_by} (${new Date(version.approved_at!).toLocaleDateString()})` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {version.status === 'Draft' && (
                      <>
                        <button
                          onClick={() => navigate(`/app/templates/${id}/edit?version=${version.id}`)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-blue-50 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSubmitForApproval(version.id)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-orange-50 hover:text-orange-600"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => handleDelete(version.id)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-red-50 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {version.status === 'Pending Approval' && canApprove && (
                      <>
                        <button
                          onClick={() => handleApprove(version.id)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-green-50 hover:text-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingVersionId(version.id)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-red-50 hover:text-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {version.status === 'Approved' && (
                      <>
                        <button
                          onClick={() => { setDiffVersions({ v1: version, v2: version }); setShowDiff(true) }}
                          className="rounded px-2 py-1 text-[11px] hover:bg-blue-50 hover:text-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleRevert(version)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-yellow-50 hover:text-yellow-600"
                        >
                          Revert
                        </button>
                      </>
                    )}
                    {version.status === 'Rejected' && (
                      <>
                        <button
                          onClick={() => { setDiffVersions({ v1: version, v2: version }); setShowDiff(true) }}
                          className="rounded px-2 py-1 text-[11px] hover:bg-blue-50 hover:text-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleResubmit(version.id)}
                          className="rounded px-2 py-1 text-[11px] hover:bg-orange-50 hover:text-orange-600"
                        >
                          Resubmit
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                  No versions found for this template.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
