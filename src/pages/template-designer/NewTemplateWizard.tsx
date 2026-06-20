import type { Dispatch, SetStateAction } from 'react'
import type { NewTemplateData } from './types'

type NewTemplateWizardProps = {
  data: NewTemplateData
  setData: Dispatch<SetStateAction<NewTemplateData>>
  onCancel: () => void
  onCreate: () => void
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

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

export default function NewTemplateWizard({
  data,
  setData,
  onCancel,
  onCreate,
}: NewTemplateWizardProps) {
  const update = <Key extends keyof NewTemplateData>(key: Key, value: NewTemplateData[Key]) => {
    setData((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6 sm:p-8">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-lg sm:p-8">
        <h2 className="mb-8 text-xl font-bold text-slate-900">New Template</h2>
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
            <Field label="Printer Type">
              <input
                type="text"
                value={data.printer_type}
                onChange={(event) => update('printer_type', event.target.value)}
                className={inputClass}
                placeholder="e.g., Zebra"
              />
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
  )
}
