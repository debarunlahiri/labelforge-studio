import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject } from '../types'

interface PropertiesPanelProps {
  object: LabelObject
  onUpdate: (updates: Partial<LabelObject>) => void
  onDelete: () => void
}

const barcodeTypes = [
  'Code128', 'Code39', 'EAN13', 'EAN8', 'UPCA', 'UPCE',
  'QRCode', 'DataMatrix', 'PDF417', 'ITF14', 'GS1128',
]

const shapeTypes = ['rectangle', 'roundedRectangle', 'circle', 'ellipse', 'triangle']

export default function PropertiesPanel({ object, onUpdate, onDelete }: PropertiesPanelProps) {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value } as any)
  }

  return (
    <div className="w-64 border-l border-[var(--border-color)] bg-white flex flex-col overflow-y-auto">
      <div className="flex h-8 items-center justify-between border-b border-[var(--border-color)] px-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Properties</span>
      </div>

      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Object</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[var(--text-secondary)]">Name</label>
              <input
                type="text"
                value={object.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[var(--text-secondary)]">Type</label>
              <span className="text-[11px] font-medium capitalize">{object.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[var(--text-secondary)]">Visible</label>
              <input
                type="checkbox"
                checked={object.visible}
                onChange={(e) => handleChange('visible', e.target.checked)}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[var(--text-secondary)]">Locked</label>
              <input
                type="checkbox"
                checked={object.locked}
                onChange={(e) => handleChange('locked', e.target.checked)}
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Position & Size</h3>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-[var(--text-secondary)]">X</label>
              <input
                type="number"
                value={object.x}
                onChange={(e) => handleChange('x', Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-1 py-0.5 text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Y</label>
              <input
                type="number"
                value={object.y}
                onChange={(e) => handleChange('y', Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-1 py-0.5 text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-[var(--text-secondary)]">W</label>
              <input
                type="number"
                value={object.width}
                onChange={(e) => handleChange('width', Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-1 py-0.5 text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-[var(--text-secondary)]">H</label>
              <input
                type="number"
                value={object.height}
                onChange={(e) => handleChange('height', Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-1 py-0.5 text-[11px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-[11px] text-[var(--text-secondary)]">Rotation</label>
            <input
              type="number"
              value={object.rotation}
              onChange={(e) => handleChange('rotation', Number(e.target.value))}
              className="w-20 rounded border border-slate-300 px-2 py-0.5 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-[11px] text-[var(--text-secondary)]">Opacity</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={object.opacity}
              onChange={(e) => handleChange('opacity', Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-[11px]">{object.opacity}</span>
          </div>
        </div>

        {object.type === 'text' && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Text</h3>
            {(() => {
              const textObj = object as TextObject
              return (
                <>
                  <textarea
                    value={textObj.value}
                    onChange={(e) => handleChange('value', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Font</label>
                    <select
                      value={textObj.fontFamily}
                      onChange={(e) => handleChange('fontFamily', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Size</label>
                    <input
                      type="number"
                      value={textObj.fontSize}
                      onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                      className="w-20 rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleChange('bold', !textObj.bold)}
                      className={`rounded px-2 py-0.5 text-xs font-bold ${textObj.bold ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => handleChange('italic', !textObj.italic)}
                      className={`rounded px-2 py-0.5 text-xs italic ${textObj.italic ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => handleChange('underline', !textObj.underline)}
                      className={`rounded px-2 py-0.5 text-xs ${textObj.underline ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}
                    >
                      U
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Color</label>
                    <input
                      type="color"
                      value={textObj.textColor}
                      onChange={(e) => handleChange('textColor', e.target.value)}
                      className="h-6 w-8 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textObj.textColor}
                      onChange={(e) => handleChange('textColor', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Align</label>
                    <select
                      value={textObj.horizontalAlign}
                      onChange={(e) => handleChange('horizontalAlign', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {object.type === 'barcode' && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Barcode</h3>
            {(() => {
              const bcObj = object as BarcodeObject
              return (
                <>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Type</label>
                    <select
                      value={bcObj.barcodeType}
                      onChange={(e) => handleChange('barcodeType', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    >
                      {barcodeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Value</label>
                    <input
                      type="text"
                      value={bcObj.value}
                      onChange={(e) => handleChange('value', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Show Text</label>
                    <input
                      type="checkbox"
                      checked={bcObj.showHumanReadable}
                      onChange={(e) => handleChange('showHumanReadable', e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {object.type === 'qrcode' && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">QR Code</h3>
            {(() => {
              const qrObj = object as QRCodeObject
              return (
                <>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Value</label>
                    <input
                      type="text"
                      value={qrObj.value}
                      onChange={(e) => handleChange('value', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Error Corr.</label>
                    <select
                      value={qrObj.errorCorrectionLevel}
                      onChange={(e) => handleChange('errorCorrectionLevel', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    >
                      <option value="L">Low</option>
                      <option value="M">Medium</option>
                      <option value="Q">Quartile</option>
                      <option value="H">High</option>
                    </select>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {object.type === 'shape' && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Shape</h3>
            {(() => {
              const shapeObj = object as ShapeObject
              return (
                <>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Type</label>
                    <select
                      value={shapeObj.shapeType}
                      onChange={(e) => handleChange('shapeType', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    >
                      {shapeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Fill</label>
                    <input
                      type="color"
                      value={shapeObj.fillColor}
                      onChange={(e) => handleChange('fillColor', e.target.value)}
                      className="h-6 w-8 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={shapeObj.fillColor}
                      onChange={(e) => handleChange('fillColor', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-[11px] text-[var(--text-secondary)]">Border</label>
                    <input
                      type="color"
                      value={shapeObj.borderColor}
                      onChange={(e) => handleChange('borderColor', e.target.value)}
                      className="h-6 w-8 cursor-pointer"
                    />
                    <input
                      type="number"
                      value={shapeObj.borderWidth}
                      onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                      className="w-16 rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                    />
                  </div>
                </>
              )
            })()}
          </div>
        )}

        <div className="border-t border-[var(--border-color)] pt-3">
          <button
            onClick={onDelete}
            className="w-full rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Delete Object
          </button>
        </div>
      </div>
    </div>
  )
}