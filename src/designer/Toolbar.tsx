interface ToolbarProps {
  onSave: () => void
  isSaving: boolean
  onAddObject: (type: string) => void
  onToggleGrid: () => void
  onToggleSnap: () => void
  showGrid: boolean
  snapToGrid: boolean
  zoom: number
  onZoom: (delta: number) => void
  onZoomFit: () => void
  onDelete: () => void
  hasSelection: boolean
  templateName: string
  onToggleDataSource?: () => void
  showDataSource?: boolean
}

const objectTypes = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'barcode', label: 'Barcode', icon: '|||' },
  { type: 'qrcode', label: 'QR Code', icon: 'QR' },
  { type: 'shape', label: 'Shape', icon: '□' },
  { type: 'line', label: 'Line', icon: '—' },
  { type: 'image', label: 'Image', icon: '▣' },
  { type: 'datetime', label: 'Date/Time', icon: '_tD' },
  { type: 'counter', label: 'Counter', icon: '#' },
]

export default function Toolbar({
  onSave, isSaving, onAddObject, onToggleGrid, onToggleSnap,
  showGrid, snapToGrid, zoom, onZoom, onZoomFit, onDelete,
  hasSelection, templateName, onToggleDataSource, showDataSource,
}: ToolbarProps) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-[var(--border-color)] bg-white px-3">
      <div className="flex items-center gap-1">
        <span className="mr-2 text-sm font-semibold">{templateName}</span>
        <div className="h-5 w-px bg-[var(--border-color)]" />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded px-2 py-1 text-xs font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <div className="h-5 w-px bg-[var(--border-color)]" />
        {objectTypes.map((obj) => (
          <button
            key={obj.type}
            onClick={() => onAddObject(obj.type)}
            className="rounded px-2 py-1 text-xs hover:bg-slate-100 transition-colors"
            title={`Add ${obj.label}`}
          >
            <span className="font-mono text-sm">{obj.icon}</span>
          </button>
        ))}
        <div className="h-5 w-px bg-[var(--border-color)]" />
        {hasSelection && (
          <button
            onClick={onDelete}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            title="Delete selected (Del)"
          >
            Delete
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onZoom(-0.1)}
          className="rounded px-2 py-1 text-xs hover:bg-slate-100"
          title="Zoom Out"
        >
          −
        </button>
        <span className="min-w-[50px] text-center text-xs">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => onZoom(0.1)}
          className="rounded px-2 py-1 text-xs hover:bg-slate-100"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={onZoomFit}
          className="rounded px-2 py-1 text-xs hover:bg-slate-100"
          title="Fit to screen"
        >
          Fit
        </button>
        <div className="h-5 w-px bg-[var(--border-color)]" />
        <button
          onClick={onToggleGrid}
          className={`rounded px-2 py-1 text-xs ${showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'}`}
          title="Toggle Grid"
        >
          Grid
        </button>
        <button
          onClick={onToggleSnap}
          className={`rounded px-2 py-1 text-xs ${snapToGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'}`}
          title="Toggle Snap"
        >
          Snap
        </button>
        {onToggleDataSource && (
          <button
            onClick={onToggleDataSource}
            className={`rounded px-2 py-1 text-xs ${showDataSource ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'}`}
            title="Data Sources"
          >
            Data
          </button>
        )}
      </div>
    </div>
  )
}