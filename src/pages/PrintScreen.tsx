import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrintTimeInput from './PrintTimeInput'
import SearchableSelect from '../components/SearchableSelect'
import PageHero from '../components/PageHero'
import { faPrint } from '@fortawesome/free-solid-svg-icons'

interface PrintJob {
  id: string
  template_id: string
  template_name?: string
  printer_name?: string
  copies: number
  status: string
  created_at: string
  error_message: string | null
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Queued: 'bg-blue-100 text-blue-700 border-blue-300',
  Rendering: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  Sending: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  Printing: 'bg-green-100 text-green-700 border-green-300',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Failed: 'bg-red-100 text-red-700 border-red-300',
  Cancelled: 'bg-gray-100 text-gray-600 border-gray-300',
  Retrying: 'bg-orange-100 text-orange-700 border-orange-300',
  Paused: 'bg-slate-100 text-slate-700 border-slate-300',
}

export default function PrintScreen() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<any[]>([])
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [copies, setCopies] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [showPrintInputDialog, setShowPrintInputDialog] = useState(false)
  const [printTimeValues, setPrintTimeValues] = useState<Record<string, string>>({})
  const [printTimeFields] = useState<Array<{id: string; label: string; type: string; required: boolean; options?: string[]}>>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const t = await window.electronAPI?.templates.list() || []
      setTemplates(t)
      const p = await window.electronAPI?.printers.list() || []
      setPrinters(p)
    } catch {}
  }

  const handleDetectPrinters = async () => {
    setIsDiscovering(true)
    try {
      const detected = await window.electronAPI?.printers.discover() || []
      for (const printer of detected) {
        await window.electronAPI?.printers.registerDiscovered(printer)
      }
      await loadData()
    } finally {
      setIsDiscovering(false)
    }
  }

  const handlePrint = async () => {
    if (!selectedTemplate || !selectedPrinter) return
    setIsPrinting(true)
    try {
      const template = templates.find((t: any) => t.id === selectedTemplate)
      const templateVersions = await window.electronAPI?.templateVersions.list(selectedTemplate) || []
      const versionId = template?.current_version_id || templateVersions[0]?.id
      if (!versionId) throw new Error('Save this design once before printing')
      const result = await window.electronAPI?.printJobs.create({
        template_id: selectedTemplate,
        template_version_id: versionId,
        printer_id: selectedPrinter,
        requested_by: 'current_user',
        copies,
      })
      if (result?.success === false) {
        throw new Error(result.error || 'Printer rejected the job')
      }
      alert('Print job submitted successfully!')
      navigate('/app/print-history')
    } catch (error: any) {
      alert(`Print failed: ${error.message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  const onPrintClick = () => {
    if (printTimeFields.length > 0) {
      setShowPrintInputDialog(true)
    } else {
      handlePrint()
    }
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHero
          eyebrow="Production workflow"
          title="Print Labels"
          description="Select a design, choose a printer, and prepare the next production job."
          icon={faPrint}
          accent="emerald"
        />

        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Select Template</h2>
          {templates.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              No designs available. Please create a design first.
            </div>
          ) : (
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a template...</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.label_width}{t.unit} x {t.label_height}{t.unit} @ {t.dpi} DPI)
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Printer</h2>
            <button
              onClick={handleDetectPrinters}
              disabled={isDiscovering}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {isDiscovering ? 'Detecting...' : 'Detect Printers'}
            </button>
          </div>
          {printers.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
              No printers available. Please register a printer first.
            </div>
          ) : (
            <SearchableSelect
              value={selectedPrinter}
              onChange={setSelectedPrinter}
              placeholder="Select a printer..."
              searchPlaceholder="Search registered printers..."
              options={printers.map((printer: any) => ({
                value: printer.id,
                label: printer.name,
                description: `${printer.printer_type || 'Unknown'} · ${printer.connection_type || 'driver'} · ${printer.status}`,
              }))}
            />
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Print Options</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Number of Copies</label>
              <input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Print-Time Fields</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Print-time fields will be available when data sources are configured on the template.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => selectedTemplate && navigate(`/app/templates/${selectedTemplate}/preview`)}
            disabled={!selectedTemplate}
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Preview
          </button>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onPrintClick}
            disabled={!selectedTemplate || !selectedPrinter || isPrinting}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
        </div>
      </div>

      {showPrintInputDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Print-Time Input</h2>
            <PrintTimeInput
              fields={printTimeFields}
              onSubmit={(values) => { setPrintTimeValues(values); setShowPrintInputDialog(false); handlePrint() }}
              onCancel={() => setShowPrintInputDialog(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
