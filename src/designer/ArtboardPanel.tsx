import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExpand, faRulerCombined } from '@fortawesome/free-solid-svg-icons'
import type { Template } from '../types'

interface ArtboardPanelProps {
  template: Template
  onUpdate: (updates: Partial<Pick<Template, 'label_width' | 'label_height' | 'unit' | 'dpi'>>) => void
}

const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-900 transition-colors focus:border-blue-400 focus:bg-white'

function stopDesignerInputPropagation(event: React.SyntheticEvent) {
  event.stopPropagation()
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-semibold text-slate-700">{label}</span>
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
    <aside
      className="designer-side-panel flex w-[380px] min-w-0 shrink-0 flex-col border-l border-[var(--border-color)] bg-slate-50"
      onKeyDownCapture={stopDesignerInputPropagation}
      onMouseDownCapture={stopDesignerInputPropagation}
      onPointerDownCapture={stopDesignerInputPropagation}
    >
      <div className="flex min-h-[72px] shrink-0 items-center gap-3 border-b border-[var(--border-color)] bg-white px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FontAwesomeIcon icon={faExpand} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">Artboard</div>
          <div className="whitespace-normal break-words text-[11px] leading-4 text-slate-600">Template size and resolution</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex h-11 items-center gap-2 border-b border-slate-200 px-5">
            <FontAwesomeIcon icon={faRulerCombined} className="text-[11px] text-slate-400" fixedWidth />
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Size</h3>
          </div>
          <div className="space-y-6 px-5 py-4">
            <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-x-5 gap-y-6">
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

            <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-x-5 gap-y-6">
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

            <div className="mt-2 whitespace-normal break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
              Changing the artboard resizes the template. Existing items keep their current positions.
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
