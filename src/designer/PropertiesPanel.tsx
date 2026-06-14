import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAlignCenter,
  faAlignLeft,
  faAlignRight,
  faBarcode,
  faBold,
  faBorderAll,
  faEye,
  faEyeSlash,
  faFillDrip,
  faFont,
  faGear,
  faItalic,
  faLayerGroup,
  faLock,
  faLockOpen,
  faPalette,
  faQrcode,
  faRulerCombined,
  faTrash,
  faUnderline,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject } from '../types'
import { barcodeSymbologyGroups, qrSymbologyGroups } from './symbologies'

interface PropertiesPanelProps {
  object: LabelObject
  onUpdate: (updates: Partial<LabelObject>) => void
  onDelete: () => void
}

const shapeTypes = ['rectangle', 'roundedRectangle', 'circle', 'ellipse', 'triangle']

const inputClass =
  'h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 transition-colors focus:border-blue-400 focus:bg-white'

const labelClass = 'text-[10px] font-medium text-slate-500'

function Section({ title, icon, children }: { title: string; icon: IconDefinition; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="flex h-11 items-center gap-2 px-5">
        <FontAwesomeIcon icon={icon} className="text-[11px] text-slate-400" fixedWidth />
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      </div>
      <div className="space-y-3.5 px-5 pb-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  )
}

function CompactNumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}) {
  return (
    <label className="flex h-8 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white">
      <span className="flex h-full w-8 shrink-0 items-center justify-center border-r border-slate-200 text-[10px] font-semibold text-slate-500">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-900 outline-none"
      />
    </label>
  )
}

function ToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: IconDefinition
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 flex-1 items-center justify-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  )
}

function FormatButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 min-w-9 items-center justify-center rounded-md border text-xs transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </Field>
  )
}

function getObjectIcon(type: LabelObject['type']) {
  if (type === 'barcode') return faBarcode
  if (type === 'qrcode') return faQrcode
  if (type === 'text') return faFont
  return faLayerGroup
}

function SymbologySelect({
  value,
  groups,
  onChange,
}: {
  value: string
  groups: typeof barcodeSymbologyGroups
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}{option.supported === false ? ' (listed)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export default function PropertiesPanel({ object, onUpdate, onDelete }: PropertiesPanelProps) {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value } as any)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[var(--border-color)] bg-white">
      <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-white px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-blue-700">
            <FontAwesomeIcon icon={getObjectIcon(object.type)} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{object.name || 'Properties'}</div>
            <div className="truncate text-[11px] capitalize text-slate-500">{object.type} object</div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Delete object"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Object" icon={faGear}>
          <Field label="Name">
            <input
              type="text"
              value={object.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <ToggleButton
              active={object.visible}
              icon={object.visible ? faEye : faEyeSlash}
              label={object.visible ? 'Visible' : 'Hidden'}
              onClick={() => handleChange('visible', !object.visible)}
            />
            <ToggleButton
              active={object.locked}
              icon={object.locked ? faLock : faLockOpen}
              label={object.locked ? 'Locked' : 'Unlocked'}
              onClick={() => handleChange('locked', !object.locked)}
            />
          </div>
        </Section>

        <Section title="Transform" icon={faRulerCombined}>
          <div className="grid grid-cols-2 gap-2">
            <CompactNumberField label="X" value={object.x} step={0.1} onChange={(value) => handleChange('x', value)} />
            <CompactNumberField label="Y" value={object.y} step={0.1} onChange={(value) => handleChange('y', value)} />
            <CompactNumberField label="W" value={object.width} step={0.1} onChange={(value) => handleChange('width', value)} />
            <CompactNumberField label="H" value={object.height} step={0.1} onChange={(value) => handleChange('height', value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <CompactNumberField label="R" value={object.rotation} step={1} onChange={(value) => handleChange('rotation', value)} />
            <Field label="Opacity">
              <div className="flex h-7 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={object.opacity}
                  onChange={(e) => handleChange('opacity', Number(e.target.value))}
                  className="min-w-0 flex-1"
                />
                <span className="w-8 text-right text-[11px] font-medium text-slate-500">{Math.round(object.opacity * 100)}%</span>
              </div>
            </Field>
          </div>
        </Section>

        {object.type === 'text' && (() => {
          const textObj = object as TextObject
          return (
            <Section title="Text" icon={faFont}>
              <Field label="Content">
                <textarea
                  value={textObj.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className={`${inputClass} h-14 resize-none py-2`}
                />
              </Field>

              <div className="grid grid-cols-[1fr_72px] gap-2">
                <Field label="Font">
                  <select
                    value={textObj.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className={inputClass}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </Field>
                <NumberField label="Size" value={textObj.fontSize || 14} onChange={(value) => handleChange('fontSize', value)} />
              </div>

              <div className="flex gap-2">
                <FormatButton active={textObj.bold} onClick={() => handleChange('bold', !textObj.bold)}>
                  <FontAwesomeIcon icon={faBold} />
                </FormatButton>
                <FormatButton active={textObj.italic} onClick={() => handleChange('italic', !textObj.italic)}>
                  <FontAwesomeIcon icon={faItalic} />
                </FormatButton>
                <FormatButton active={textObj.underline} onClick={() => handleChange('underline', !textObj.underline)}>
                  <FontAwesomeIcon icon={faUnderline} />
                </FormatButton>
              </div>

              <ColorField label="Text color" value={textObj.textColor} onChange={(value) => handleChange('textColor', value)} />

              <Field label="Alignment">
                <div className="grid grid-cols-3 gap-2">
                  <FormatButton active={textObj.horizontalAlign === 'left'} onClick={() => handleChange('horizontalAlign', 'left')}>
                    <FontAwesomeIcon icon={faAlignLeft} />
                  </FormatButton>
                  <FormatButton active={textObj.horizontalAlign === 'center'} onClick={() => handleChange('horizontalAlign', 'center')}>
                    <FontAwesomeIcon icon={faAlignCenter} />
                  </FormatButton>
                  <FormatButton active={textObj.horizontalAlign === 'right'} onClick={() => handleChange('horizontalAlign', 'right')}>
                    <FontAwesomeIcon icon={faAlignRight} />
                  </FormatButton>
                </div>
              </Field>
            </Section>
          )
        })()}

        {object.type === 'barcode' && (() => {
          const bcObj = object as BarcodeObject
          return (
            <Section title="Barcode" icon={faBarcode}>
              <Field label="Symbology">
                <SymbologySelect
                  value={bcObj.barcodeType}
                  groups={barcodeSymbologyGroups}
                  onChange={(value) => handleChange('barcodeType', value)}
                />
              </Field>

              <Field label="Value">
                <input
                  type="text"
                  value={bcObj.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <ToggleButton
                active={bcObj.showHumanReadable}
                icon={faBarcode}
                label="Human-readable text"
                onClick={() => handleChange('showHumanReadable', !bcObj.showHumanReadable)}
              />
            </Section>
          )
        })()}

        {object.type === 'qrcode' && (() => {
          const qrObj = object as QRCodeObject
          return (
            <Section title="QR Code" icon={faQrcode}>
              <Field label="QR family">
                <SymbologySelect
                  value={qrObj.barcodeType || 'QRCode'}
                  groups={qrSymbologyGroups}
                  onChange={(value) => handleChange('barcodeType', value)}
                />
              </Field>

              <Field label="Value">
                <input
                  type="text"
                  value={qrObj.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Error correction">
                <select
                  value={qrObj.errorCorrectionLevel}
                  onChange={(e) => handleChange('errorCorrectionLevel', e.target.value)}
                  className={inputClass}
                >
                  <option value="L">Low</option>
                  <option value="M">Medium</option>
                  <option value="Q">Quartile</option>
                  <option value="H">High</option>
                </select>
              </Field>
            </Section>
          )
        })()}

        {object.type === 'shape' && (() => {
          const shapeObj = object as ShapeObject
          return (
            <Section title="Shape" icon={faPalette}>
              <Field label="Shape type">
                <select
                  value={shapeObj.shapeType}
                  onChange={(e) => handleChange('shapeType', e.target.value)}
                  className={inputClass}
                >
                  {shapeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <ColorField label="Fill" value={shapeObj.fillColor} onChange={(value) => handleChange('fillColor', value)} />
              <ColorField label="Border" value={shapeObj.borderColor} onChange={(value) => handleChange('borderColor', value)} />

              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Border width" value={shapeObj.borderWidth} onChange={(value) => handleChange('borderWidth', value)} />
                <NumberField label="Radius" value={shapeObj.cornerRadius} onChange={(value) => handleChange('cornerRadius', value)} />
              </div>
            </Section>
          )
        })()}

        {(object.type === 'line') && (
          <Section title="Line" icon={faBorderAll}>
            <ColorField label="Stroke" value={(object as any).lineColor || '#000000'} onChange={(value) => handleChange('lineColor', value)} />
            <NumberField label="Thickness" value={(object as any).lineThickness || 1} onChange={(value) => handleChange('lineThickness', value)} />
          </Section>
        )}

        {(object.type === 'image') && (
          <Section title="Image" icon={faFillDrip}>
            <ToggleButton
              active={(object as any).maintainAspectRatio ?? true}
              icon={faLock}
              label="Maintain aspect ratio"
              onClick={() => handleChange('maintainAspectRatio', !((object as any).maintainAspectRatio ?? true))}
            />
          </Section>
        )}

        <div className="p-4">
          <button
            onClick={onDelete}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete Object
          </button>
        </div>
      </div>
    </aside>
  )
}
