import { useEffect, useState } from 'react'
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
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject, ImageObject } from '../types'
import { barcodeSymbologyGroups, qrSymbologyGroups } from './symbologies'
import SearchableSelect from '../components/SearchableSelect'
import { applyStyleRange, shiftRunsForTextChange, styleAt, type TextStyle } from './richText'

interface PropertiesPanelProps {
  object: LabelObject
  onUpdate: (updates: Partial<LabelObject>) => void
  onDelete: () => void
  textSelection?: { start: number; end: number }
  onTextSelectionChange?: (selection: { start: number; end: number }) => void
}

const shapeTypes = ['rectangle', 'roundedRectangle', 'circle', 'ellipse', 'triangle', 'polygon']
const fontFamilies = [
  'Arial', 'Arial Black', 'Arial Narrow', 'Avenir Next', 'Baskerville', 'Bookman',
  'Calibri', 'Cambria', 'Candara', 'Century Gothic', 'Charter', 'Comic Sans MS',
  'Copperplate', 'Courier New', 'Didot', 'Futura', 'Garamond', 'Geneva', 'Georgia',
  'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Hoefler Text', 'Impact', 'Inter',
  'Lucida Grande', 'Menlo', 'Monaco', 'Montserrat', 'Noto Sans', 'Noto Serif',
  'Optima', 'Palatino', 'Roboto', 'Rockwell', 'Segoe UI', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
]

const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-900 transition-colors focus:border-blue-400 focus:bg-white'

const labelClass = 'mb-2 block text-[11px] font-semibold text-slate-700'

function Section({ title, icon, children }: { title: string; icon: IconDefinition; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex h-11 items-center gap-2 border-b border-slate-200 px-5">
        <FontAwesomeIcon icon={icon} className="text-[11px] text-slate-400" fixedWidth />
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      </div>
      <div className="space-y-5 px-5 py-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
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
  const [draftValue, setDraftValue] = useState(String(Number.isFinite(value) ? Number(value.toFixed(2)) : 0))

  useEffect(() => {
    setDraftValue(String(Number.isFinite(value) ? Number(value.toFixed(2)) : 0))
  }, [value])

  const commitValue = () => {
    const nextValue = Number(draftValue)
    setDraftValue(String(Number.isFinite(nextValue) ? Number(nextValue.toFixed(2)) : Number(value.toFixed(2))))
  }

  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        value={draftValue}
        onBlur={commitValue}
        onChange={(e) => {
          const nextValue = e.target.value
          setDraftValue(nextValue)
          if (nextValue === '' || nextValue === '-' || nextValue === '.' || nextValue === '-.') return
          const numericValue = Number(nextValue)
          if (Number.isFinite(numericValue)) onChange(numericValue)
        }}
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
  const [draftValue, setDraftValue] = useState(String(Number.isFinite(value) ? Number(value.toFixed(2)) : 0))

  useEffect(() => {
    setDraftValue(String(Number.isFinite(value) ? Number(value.toFixed(2)) : 0))
  }, [value])

  const commitValue = () => {
    const nextValue = Number(draftValue)
    setDraftValue(String(Number.isFinite(nextValue) ? Number(nextValue.toFixed(2)) : Number(value.toFixed(2))))
  }

  return (
    <label className="flex h-8 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white">
      <span className="flex h-full w-8 shrink-0 items-center justify-center border-r border-slate-200 text-[10px] font-semibold text-slate-500">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={draftValue}
        onBlur={commitValue}
        onChange={(e) => {
          const nextValue = e.target.value
          setDraftValue(nextValue)
          if (nextValue === '' || nextValue === '-' || nextValue === '.' || nextValue === '-.') return
          const numericValue = Number(nextValue)
          if (Number.isFinite(numericValue)) onChange(numericValue)
        }}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-900 outline-none"
      />
    </label>
  )
}

function ToggleButton({
  active,
  icon,
  label,
  description,
  tooltipAlign = 'left',
  onClick,
}: {
  active: boolean
  icon: IconDefinition
  label: string
  description: string
  tooltipAlign?: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-8 flex-1 items-center justify-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
      <PropertyTooltip label={label} description={description} align={tooltipAlign} />
    </button>
  )
}

function FormatButton({
  active,
  children,
  label,
  description,
  tooltipAlign = 'left',
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  label: string
  description: string
  tooltipAlign?: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-8 min-w-9 items-center justify-center rounded-md border text-xs transition-colors ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
      <PropertyTooltip label={label} description={description} align={tooltipAlign} />
    </button>
  )
}

function PropertyTooltip({
  label,
  description,
  align = 'left',
}: {
  label: string
  description: string
  align?: 'left' | 'right'
}) {
  return (
    <span
      className={`pointer-events-none absolute top-full z-50 mt-2 hidden w-44 rounded-md bg-slate-900 px-3 py-2 text-left text-white shadow-xl group-hover:block ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      <span className="block text-[11px] font-semibold">{label}</span>
      <span className="mt-0.5 block text-[10px] font-normal leading-4 text-slate-300">{description}</span>
    </span>
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

function formatItemType(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase())
}

function getItemTypeName(object: LabelObject) {
  if (object.type === 'shape') {
    return formatItemType((object as ShapeObject).shapeType || 'Shape')
  }

  const names: Record<LabelObject['type'], string> = {
    text: 'Text',
    barcode: 'Barcode',
    qrcode: 'QR Code',
    image: 'Image',
    shape: 'Shape',
    line: 'Line',
    datetime: 'Date & Time',
    counter: 'Counter',
    database: 'Database Field',
    rfid: 'RFID',
  }

  return names[object.type]
}

function stopDesignerInputPropagation(event: React.SyntheticEvent) {
  event.stopPropagation()
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

export default function PropertiesPanel({ object, onUpdate, onDelete, textSelection: externalTextSelection, onTextSelectionChange }: PropertiesPanelProps) {
  const [localTextSelection, setLocalTextSelection] = useState({ start: 0, end: 0 })
  const textSelection = externalTextSelection ?? localTextSelection
  const setTextSelection = onTextSelectionChange ?? setLocalTextSelection
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value } as any)
  }
  const itemTypeName = getItemTypeName(object)
  const itemName = object.name?.trim() || itemTypeName
  const updateTextStyle = (text: TextObject, updates: Partial<TextStyle>) => {
    if (textSelection.start !== textSelection.end) {
      onUpdate({ styleRuns: applyStyleRange(text, textSelection.start, textSelection.end, updates) } as Partial<TextObject>)
    } else {
      onUpdate(updates as Partial<TextObject>)
    }
  }

  return (
    <aside
      className="designer-side-panel flex w-[380px] min-w-0 shrink-0 flex-col border-l border-[var(--border-color)] bg-slate-50"
      onKeyDownCapture={stopDesignerInputPropagation}
      onMouseDownCapture={stopDesignerInputPropagation}
      onPointerDownCapture={stopDesignerInputPropagation}
    >
      <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-white px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-blue-700">
            <FontAwesomeIcon icon={getObjectIcon(object.type)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="whitespace-normal break-words text-sm font-semibold leading-5 text-slate-900">{itemName}</div>
            <div className="whitespace-normal break-words text-[11px] leading-4 text-slate-600">{itemTypeName}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <Section title={itemName} icon={faGear}>
          <Field label="Name">
            <input
              type="text"
              value={object.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-4">
            <ToggleButton
              active={object.visible}
              icon={object.visible ? faEye : faEyeSlash}
              label={object.visible ? 'Visible' : 'Hidden'}
              description={`Show or hide ${itemName} on the label.`}
              onClick={() => handleChange('visible', !object.visible)}
            />
            <ToggleButton
              active={object.locked}
              icon={object.locked ? faLock : faLockOpen}
              label={object.locked ? 'Locked' : 'Unlocked'}
              description={`Lock ${itemName} to prevent accidental movement or resizing.`}
              tooltipAlign="right"
              onClick={() => handleChange('locked', !object.locked)}
            />
          </div>
        </Section>

        <Section title="Transform" icon={faRulerCombined}>
          <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-4">
            <CompactNumberField label="X" value={object.x} step={0.1} onChange={(value) => handleChange('x', value)} />
            <CompactNumberField label="Y" value={object.y} step={0.1} onChange={(value) => handleChange('y', value)} />
            <CompactNumberField label="W" value={object.width} step={0.1} onChange={(value) => handleChange('width', value)} />
            <CompactNumberField label="H" value={object.height} step={0.1} onChange={(value) => handleChange('height', value)} />
          </div>

          <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-4">
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
                  onSelect={(event) => setTextSelection({
                    start: event.currentTarget.selectionStart,
                    end: event.currentTarget.selectionEnd,
                  })}
                  onChange={(e) => onUpdate({
                    value: e.target.value,
                    styleRuns: shiftRunsForTextChange(textObj.styleRuns, textObj.value, e.target.value),
                  } as Partial<TextObject>)}
                  className={`${inputClass} h-14 resize-none py-2`}
                />
              </Field>

              <div className="designer-panel-grid grid min-w-0 grid-cols-[minmax(0,1fr)_88px] gap-4">
                <Field label="Font">
                  <SearchableSelect
                    value={textObj.fontFamily}
                    onChange={(value) => updateTextStyle(textObj, { fontFamily: value })}
                    placeholder="Select font..."
                    searchPlaceholder="Search fonts..."
                    options={fontFamilies.map((font) => ({ value: font, label: font }))}
                  />
                </Field>
                <NumberField label="Size" value={textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).fontSize : textObj.fontSize || 14} onChange={(value) => updateTextStyle(textObj, { fontSize: value })} />
              </div>

              <div className="flex gap-2">
                <FormatButton active={textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).bold : textObj.bold} label="Bold" description="Toggle bold styling for the selected text." onClick={() => updateTextStyle(textObj, { bold: !(textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).bold : textObj.bold) })}>
                  <FontAwesomeIcon icon={faBold} />
                </FormatButton>
                <FormatButton active={textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).italic : textObj.italic} label="Italic" description="Toggle italic styling for the selected text." onClick={() => updateTextStyle(textObj, { italic: !(textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).italic : textObj.italic) })}>
                  <FontAwesomeIcon icon={faItalic} />
                </FormatButton>
                <FormatButton active={textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).underline : textObj.underline} label="Underline" description="Toggle underline styling for the selected text." tooltipAlign="right" onClick={() => updateTextStyle(textObj, { underline: !(textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).underline : textObj.underline) })}>
                  <FontAwesomeIcon icon={faUnderline} />
                </FormatButton>
              </div>

              <ColorField label="Text color" value={textSelection.start !== textSelection.end ? styleAt(textObj, textSelection.start).textColor : textObj.textColor} onChange={(value) => updateTextStyle(textObj, { textColor: value })} />

              <Field label="Alignment">
                <div className="grid grid-cols-3 gap-2">
                  <FormatButton active={textObj.horizontalAlign === 'left'} label="Align Left" description="Align text to the left side of the item." onClick={() => handleChange('horizontalAlign', 'left')}>
                    <FontAwesomeIcon icon={faAlignLeft} />
                  </FormatButton>
                  <FormatButton active={textObj.horizontalAlign === 'center'} label="Align Center" description="Center text horizontally inside the item." onClick={() => handleChange('horizontalAlign', 'center')}>
                    <FontAwesomeIcon icon={faAlignCenter} />
                  </FormatButton>
                  <FormatButton active={textObj.horizontalAlign === 'right'} label="Align Right" description="Align text to the right side of the item." tooltipAlign="right" onClick={() => handleChange('horizontalAlign', 'right')}>
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
                description="Show or hide the barcode value beneath the bars."
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
                  {shapeTypes.map((type) => <option key={type} value={type}>{formatItemType(type)}</option>)}
                </select>
              </Field>

              <ColorField label="Fill" value={shapeObj.fillColor} onChange={(value) => handleChange('fillColor', value)} />
              <ColorField label="Border" value={shapeObj.borderColor} onChange={(value) => handleChange('borderColor', value)} />

              <div className="designer-panel-grid grid min-w-0 grid-cols-2 gap-4">
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
            {(() => {
              const image = object as ImageObject
              return <>
            <Field label="Image source">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const source = String(reader.result || '')
                    const probe = new window.Image()
                    probe.onload = () => {
                      const image = object as ImageObject
                      const updates: Partial<ImageObject> = { source, sourceType: 'embedded' }
                      if (image.maintainAspectRatio && probe.naturalWidth && probe.naturalHeight) {
                        updates.height = image.width * (probe.naturalHeight / probe.naturalWidth)
                      }
                      onUpdate(updates)
                    }
                    probe.src = source
                  }
                  reader.readAsDataURL(file)
                  event.target.value = ''
                }}
              />
            </Field>
            <Field label="Or image URL">
              <input
                type="url"
                value={(object as ImageObject).sourceType === 'url' ? (object as ImageObject).source : ''}
                onChange={(event) => onUpdate({ source: event.target.value, sourceType: 'url' } as Partial<ImageObject>)}
                className={inputClass}
                placeholder="https://example.com/image.png"
              />
            </Field>
            <Field label="Fit and crop">
              <select
                value={image.fitMode || 'contain'}
                onChange={(event) => onUpdate({
                  fitMode: event.target.value as ImageObject['fitMode'],
                  maintainAspectRatio: event.target.value !== 'stretch',
                } as Partial<ImageObject>)}
                className={inputClass}
              >
                <option value="contain">Fit entire image</option>
                <option value="cover">Fill frame and crop</option>
                <option value="stretch">Stretch to frame</option>
              </select>
            </Field>
            {(image.fitMode || 'contain') === 'cover' && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Field label={`Horizontal crop focus: ${Math.round(image.cropX ?? 50)}%`}>
                  <input type="range" min={0} max={100} value={image.cropX ?? 50} onChange={(event) => handleChange('cropX', Number(event.target.value))} className="w-full" />
                </Field>
                <Field label={`Vertical crop focus: ${Math.round(image.cropY ?? 50)}%`}>
                  <input type="range" min={0} max={100} value={image.cropY ?? 50} onChange={(event) => handleChange('cropY', Number(event.target.value))} className="w-full" />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onUpdate({ width: Math.min(image.width, image.height), height: Math.max(image.width, image.height) })} className="h-9 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50">Portrait</button>
              <button type="button" onClick={() => onUpdate({ width: Math.max(image.width, image.height), height: Math.min(image.width, image.height) })} className="h-9 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50">Landscape</button>
              <button type="button" onClick={() => handleChange('flipHorizontal', !image.flipHorizontal)} className={`h-9 rounded-md border text-xs font-semibold ${image.flipHorizontal ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>Flip horizontal</button>
              <button type="button" onClick={() => handleChange('flipVertical', !image.flipVertical)} className={`h-9 rounded-md border text-xs font-semibold ${image.flipVertical ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>Flip vertical</button>
            </div>
            <button type="button" onClick={() => onUpdate({ fitMode: 'contain', cropX: 50, cropY: 50, flipHorizontal: false, flipVertical: false, rotation: 0 } as Partial<ImageObject>)} className="h-9 w-full rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset image adjustments</button>
            <ToggleButton
              active={(object as any).maintainAspectRatio ?? true}
              icon={faLock}
              label="Maintain aspect ratio"
              description="Keep the image proportions unchanged while resizing."
              onClick={() => handleChange('maintainAspectRatio', !((object as any).maintainAspectRatio ?? true))}
            />
            {(object as ImageObject).source && (
              <button
                type="button"
                onClick={() => onUpdate({ source: '', sourceType: 'embedded' } as Partial<ImageObject>)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Remove image
              </button>
            )}
              </>
            })()}
          </Section>
        )}

        <div>
          <button
            onClick={onDelete}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete {itemName}
          </button>
        </div>
      </div>
    </aside>
  )
}
