import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import SearchableSelect from '../../components/SearchableSelect'
import type { NewTemplateData } from './types'

type NewTemplateWizardProps = {
  data: NewTemplateData
  setData: Dispatch<SetStateAction<NewTemplateData>>
  onCancel: () => void
  onCreate: () => void
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

export const PRESET_SIZES = [
  { label: 'Custom', width: 0, height: 0, unit: '', dpi: 0 },
  { label: 'A4 Label Sheet', width: 210, height: 297, unit: 'mm', dpi: 300 },
  { label: 'Letter Label Sheet', width: 215.9, height: 279.4, unit: 'mm', dpi: 300 },
  { label: 'Legal Label Sheet', width: 215.9, height: 355.6, unit: 'mm', dpi: 300 },
  { label: 'A5 Label Sheet', width: 148, height: 210, unit: 'mm', dpi: 300 },
  { label: 'A6 Label Sheet', width: 105, height: 148, unit: 'mm', dpi: 300 },
  { label: '4" x 6" Shipping Label', width: 101.6, height: 152.4, unit: 'mm', dpi: 203 },
  { label: '4" x 4" Label', width: 101.6, height: 101.6, unit: 'mm', dpi: 203 },
  { label: '4" x 3" Label', width: 101.6, height: 76.2, unit: 'mm', dpi: 203 },
  { label: '4" x 2" Label', width: 101.6, height: 50.8, unit: 'mm', dpi: 203 },
  { label: '4" x 1.5" Label', width: 101.6, height: 38.1, unit: 'mm', dpi: 203 },
  { label: '4" x 1" Label', width: 101.6, height: 25.4, unit: 'mm', dpi: 203 },
  { label: '3" x 5" Label', width: 76.2, height: 127, unit: 'mm', dpi: 203 },
  { label: '3" x 3" Label', width: 76.2, height: 76.2, unit: 'mm', dpi: 203 },
  { label: '3" x 2" Label', width: 76.2, height: 50.8, unit: 'mm', dpi: 203 },
  { label: '3" x 1.5" Label', width: 76.2, height: 38.1, unit: 'mm', dpi: 203 },
  { label: '3" x 1" Label', width: 76.2, height: 25.4, unit: 'mm', dpi: 203 },
  { label: '2.25" x 1.25" Label', width: 57.15, height: 31.75, unit: 'mm', dpi: 203 },
  { label: '2" x 3" Label', width: 50.8, height: 76.2, unit: 'mm', dpi: 203 },
  { label: '2" x 2" Label', width: 50.8, height: 50.8, unit: 'mm', dpi: 203 },
  { label: '2" x 1.5" Label', width: 50.8, height: 38.1, unit: 'mm', dpi: 203 },
  { label: '2" x 1" Label', width: 50.8, height: 25.4, unit: 'mm', dpi: 203 },
  { label: '2" x 0.5" Label', width: 50.8, height: 12.7, unit: 'mm', dpi: 203 },
  { label: '1.5" x 1" Label', width: 38.1, height: 25.4, unit: 'mm', dpi: 203 },
  { label: '1" x 2" Label', width: 25.4, height: 50.8, unit: 'mm', dpi: 203 },
  { label: '1" x 1" Label', width: 25.4, height: 25.4, unit: 'mm', dpi: 203 },
  { label: '1" x 0.5" Label', width: 25.4, height: 12.7, unit: 'mm', dpi: 203 },
  { label: '100 x 150 mm Label', width: 100, height: 150, unit: 'mm', dpi: 300 },
  { label: '100 x 100 mm Label', width: 100, height: 100, unit: 'mm', dpi: 300 },
  { label: '100 x 70 mm Label', width: 100, height: 70, unit: 'mm', dpi: 300 },
  { label: '100 x 50 mm Label', width: 100, height: 50, unit: 'mm', dpi: 300 },
  { label: '100 x 40 mm Label', width: 100, height: 40, unit: 'mm', dpi: 300 },
  { label: '100 x 30 mm Label', width: 100, height: 30, unit: 'mm', dpi: 300 },
  { label: '90 x 60 mm Label', width: 90, height: 60, unit: 'mm', dpi: 300 },
  { label: '80 x 50 mm Label', width: 80, height: 50, unit: 'mm', dpi: 300 },
  { label: '70 x 50 mm Label', width: 70, height: 50, unit: 'mm', dpi: 300 },
  { label: '70 x 30 mm Label', width: 70, height: 30, unit: 'mm', dpi: 300 },
  { label: '60 x 40 mm Label', width: 60, height: 40, unit: 'mm', dpi: 300 },
  { label: '50 x 50 mm Label', width: 50, height: 50, unit: 'mm', dpi: 300 },
  { label: '50 x 30 mm Label', width: 50, height: 30, unit: 'mm', dpi: 300 },
  { label: '50 x 25 mm Label', width: 50, height: 25, unit: 'mm', dpi: 300 },
  { label: '50 x 20 mm Label', width: 50, height: 20, unit: 'mm', dpi: 300 },
  { label: '40 x 30 mm Label', width: 40, height: 30, unit: 'mm', dpi: 300 },
  { label: '40 x 20 mm Label', width: 40, height: 20, unit: 'mm', dpi: 300 },
  { label: '30 x 20 mm Label', width: 30, height: 20, unit: 'mm', dpi: 300 },
  { label: '20 x 10 mm Label', width: 20, height: 10, unit: 'mm', dpi: 300 },
  { label: '6" x 4" Label', width: 152.4, height: 101.6, unit: 'mm', dpi: 203 },
  { label: '8" x 6" Label', width: 203.2, height: 152.4, unit: 'mm', dpi: 203 },
  { label: '8" x 4" Label', width: 203.2, height: 101.6, unit: 'mm', dpi: 203 },
  { label: '512 x 512 px', width: 512, height: 512, unit: 'px', dpi: 300 },
  { label: '1024 x 1024 px', width: 1024, height: 1024, unit: 'px', dpi: 300 },
]

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      {children}
    </div>
  )
}

function toMm(value: number, unit: string): number {
  switch (unit) {
    case 'mm':
      return value
    case 'cm':
      return value * 10
    case 'in':
      return value * 25.4
    case 'px':
      return (value * 25.4) / 96
    default:
      return value
  }
}

function ArtboardPreview({ width, height, unit }: { width: number; height: number; unit: string }) {
  const widthMm = toMm(width, unit)
  const heightMm = toMm(height, unit)

  const maxPreviewWidth = 260
  const maxPreviewHeight = 340
  const scale = Math.min(maxPreviewWidth / Math.max(widthMm, 1), maxPreviewHeight / Math.max(heightMm, 1), 8)
  const previewWidth = widthMm * scale
  const previewHeight = heightMm * scale

  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="text-sm font-semibold text-slate-700">Preview</div>
      <div className="flex flex-1 items-center justify-center py-6">
        <div className="relative">
          <div
            className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] ring-1 ring-black/10"
            style={{ width: previewWidth, height: previewHeight }}
          />
          <div
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-slate-500"
            style={{ whiteSpace: 'nowrap' }}
          >
            {width} {unit}
          </div>
          <div
            className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500"
            style={{ whiteSpace: 'nowrap' }}
          >
            {height} {unit}
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400">Artboard size preview</div>
    </div>
  )
}

export default function NewTemplateWizard({
  data,
  setData,
  onCancel,
  onCreate,
}: NewTemplateWizardProps) {
  const [detectedPrinters, setDetectedPrinters] = useState<any[]>([])
  const [isDetectingPrinters, setIsDetectingPrinters] = useState(false)

  const detectPrinters = async () => {
    setIsDetectingPrinters(true)
    try {
      setDetectedPrinters(await window.electronAPI?.printers.discover() || [])
    } finally {
      setIsDetectingPrinters(false)
    }
  }

  useEffect(() => {
    detectPrinters()
  }, [])

  const update = <Key extends keyof NewTemplateData>(key: Key, value: NewTemplateData[Key]) => {
    setData((current) => ({ ...current, [key]: value }))
  }

  const handlePresetChange = (presetLabel: string) => {
    const preset = PRESET_SIZES.find((item) => item.label === presetLabel)
    if (!preset || preset.label === 'Custom') return
    setData((current) => ({
      ...current,
      label_width: preset.width,
      label_height: preset.height,
      unit: preset.unit,
      dpi: preset.dpi,
    }))
  }

  const currentPreset = PRESET_SIZES.find(
    (item) =>
      item.width === data.label_width &&
      item.height === data.label_height &&
      item.unit === data.unit &&
      item.dpi === data.dpi,
  )

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6 sm:p-8">
      <div className="w-full max-w-4xl rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-lg sm:p-8">
        <h2 className="mb-8 text-xl font-bold text-slate-900">New Template</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <ArtboardPreview width={data.label_width} height={data.label_height} unit={data.unit} />

          <div className="space-y-6">
            <Field label="Template Name *">
              <input
                type="text"
                value={data.name}
                onChange={(event) => update('name', event.target.value)}
                className={inputClass}
                placeholder="Product Label"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={data.description}
                onChange={(event) => update('description', event.target.value)}
                className={`${inputClass} resize-y`}
                rows={2}
                placeholder="Optional description"
              />
            </Field>

            <Field label="Preset size">
              <SearchableSelect
                value={currentPreset?.label || 'Custom'}
                options={PRESET_SIZES.map((preset) => ({ value: preset.label, label: preset.label }))}
                placeholder="Select a preset size"
                searchPlaceholder="Search sizes..."
                onChange={(value) => handlePresetChange(value)}
              />
            </Field>

            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Width *">
                <input
                  type="number"
                  value={data.label_width}
                  onChange={(event) => update('label_width', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Height *">
                <input
                  type="number"
                  value={data.label_height}
                  onChange={(event) => update('label_height', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Unit">
                <select
                  value={data.unit}
                  onChange={(event) => update('unit', event.target.value)}
                  className={inputClass}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                  <option value="px">px</option>
                </select>
              </Field>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
              <Field label="DPI">
                <select
                  value={data.dpi}
                  onChange={(event) => update('dpi', Number(event.target.value))}
                  className={inputClass}
                >
                  <option value={203}>203 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </Field>
              <Field label="Detected printer">
                <SearchableSelect
                  value={data.printer_type}
                  onChange={(value) => update('printer_type', value)}
                  placeholder={isDetectingPrinters ? 'Detecting printers…' : 'Select a detected printer'}
                  searchPlaceholder="Search detected printers..."
                  disabled={isDetectingPrinters}
                  options={detectedPrinters
                    .map((printer) => ({
                      value: printer.driver_name || printer.name,
                      label: printer.name,
                      description: `${printer.connection_type || 'driver'} · ${printer.status || 'unknown'}`,
                    }))
                    .filter((option, index, all) =>
                      Boolean(option.value) && all.findIndex((item) => item.value === option.value) === index
                    )}
                />
                <button type="button" onClick={detectPrinters} disabled={isDetectingPrinters} className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50">
                  {isDetectingPrinters ? 'Detecting…' : 'Detect again'}
                </button>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCreate}
                disabled={!data.name.trim()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
