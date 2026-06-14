import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExpand, faRulerCombined } from '@fortawesome/free-solid-svg-icons'
import type { Template } from '../types'

interface ArtboardPanelProps {
  template: Template
  onUpdate: (updates: Partial<Pick<Template, 'label_width' | 'label_height' | 'unit' | 'dpi'>>) => void
}

const inputClass =
  'h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 transition-colors focus:border-blue-400 focus:bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export default function ArtboardPanel({ template, onUpdate }: ArtboardPanelProps) {
  const updateNumber = (key: 'label_width' | 'label_height', value: string) => {
    const next = Math.max(1, Number(value) || 1)
    onUpdate({ [key]: next })
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[var(--border-color)] bg-white">
      <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-[var(--border-color)] bg-white px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FontAwesomeIcon icon={faExpand} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">Artboard</div>
          <div className="truncate text-[11px] text-slate-500">Template size and resolution</div>
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 px-5">
          <FontAwesomeIcon icon={faRulerCombined} className="text-[11px] text-slate-400" fixedWidth />
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Size</h3>
        </div>
        <div className="space-y-3.5 px-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width">
              <input
                type="number"
                min={1}
                step={0.1}
                value={template.label_width}
                onChange={(e) => updateNumber('label_width', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Height">
              <input
                type="number"
                min={1}
                step={0.1}
                value={template.label_height}
                onChange={(e) => updateNumber('label_height', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Unit">
              <select
                value={template.unit}
                onChange={(e) => onUpdate({ unit: e.target.value })}
                className={inputClass}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">in</option>
                <option value="px">px</option>
              </select>
            </Field>
            <Field label="DPI">
              <select
                value={template.dpi}
                onChange={(e) => onUpdate({ dpi: Number(e.target.value) })}
                className={inputClass}
              >
                <option value={203}>203</option>
                <option value={300}>300</option>
                <option value={600}>600</option>
              </select>
            </Field>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
            Changing the artboard resizes the template. Existing objects keep their current positions.
          </div>
        </div>
      </section>
    </aside>
  )
}
