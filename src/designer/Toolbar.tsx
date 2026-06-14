import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBarcode,
  faCalendarDays,
  faDatabase,
  faExpand,
  faFloppyDisk,
  faGrip,
  faHashtag,
  faImage,
  faMinus,
  faPlus,
  faQrcode,
  faRedo,
  faShapes,
  faSlash,
  faTrash,
  faT,
  faUndo,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

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
  onToggleArtboard?: () => void
  showArtboard?: boolean
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onAlign?: (action: string) => void
}

const objectTypes = [
  { type: 'text', label: 'Text', icon: faT },
  { type: 'barcode', label: 'Barcode', icon: faBarcode },
  { type: 'qrcode', label: 'QR Code', icon: faQrcode },
  { type: 'shape', label: 'Shape', icon: faShapes },
  { type: 'line', label: 'Line', icon: faSlash },
  { type: 'image', label: 'Image', icon: faImage },
  { type: 'datetime', label: 'Date/Time', icon: faCalendarDays },
  { type: 'counter', label: 'Counter', icon: faHashtag },
] satisfies Array<{ type: string; label: string; icon: IconDefinition }>

const toolButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-transparent px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-35'

const activeButtonClass = 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'

export default function Toolbar({
  onSave, isSaving, onAddObject, onToggleGrid, onToggleSnap,
  showGrid, snapToGrid, zoom, onZoom, onZoomFit, onDelete,
  hasSelection, templateName, onToggleDataSource, showDataSource,
  onToggleArtboard, showArtboard, onUndo, onRedo, canUndo, canRedo, onAlign,
}: ToolbarProps) {
  return (
    <div className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] bg-white px-6 py-3 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="mr-1 min-w-36 max-w-56">
          <div className="truncate text-sm font-semibold text-slate-900">{templateName}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Template designer</div>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex h-8 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={toolButtonClass}
          title="Undo (Ctrl+Z)"
        >
          <FontAwesomeIcon icon={faUndo} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={toolButtonClass}
          title="Redo (Ctrl+Shift+Z)"
        >
          <FontAwesomeIcon icon={faRedo} />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
          {objectTypes.map((obj) => (
            <button
              key={obj.type}
              onClick={() => onAddObject(obj.type)}
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-white hover:shadow-sm"
            title={`Add ${obj.label}`}
          >
              <FontAwesomeIcon icon={obj.icon} />
            </button>
          ))}
        </div>
        {hasSelection && onAlign && (
          <>
            <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
            <button onClick={() => onAlign('alignLeft')} className={toolButtonClass} title="Align Left">L</button>
            <button onClick={() => onAlign('alignCenterHorizontal')} className={toolButtonClass} title="Center Horizontally">C</button>
            <button onClick={() => onAlign('alignRight')} className={toolButtonClass} title="Align Right">R</button>
            <button onClick={() => onAlign('alignTop')} className={toolButtonClass} title="Align Top">T</button>
            <button onClick={() => onAlign('alignCenterVertical')} className={toolButtonClass} title="Center Vertically">M</button>
            <button onClick={() => onAlign('alignBottom')} className={toolButtonClass} title="Align Bottom">B</button>
          </>
        )}
        {hasSelection && (
          <button
            onClick={onDelete}
            className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            title="Delete selected (Del)"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <button
          onClick={() => onZoom(-0.1)}
          className={toolButtonClass}
          title="Zoom Out"
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span className="min-w-[54px] rounded-md bg-slate-50 px-2 py-1 text-center text-xs font-medium text-slate-700">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => onZoom(0.1)}
          className={toolButtonClass}
          title="Zoom In"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button
          onClick={onZoomFit}
          className={toolButtonClass}
          title="Fit to screen"
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <button
          onClick={onToggleGrid}
          className={`${toolButtonClass} ${showGrid ? activeButtonClass : ''}`}
          title="Toggle Grid"
        >
          <FontAwesomeIcon icon={faGrip} className="mr-1" />
          Grid
        </button>
        <button
          onClick={onToggleSnap}
          className={`${toolButtonClass} ${snapToGrid ? activeButtonClass : ''}`}
          title="Toggle Snap"
        >
          Snap
        </button>
        {onToggleDataSource && (
          <>
            <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
            {onToggleArtboard && (
              <button
                onClick={onToggleArtboard}
                className={`${toolButtonClass} ${showArtboard ? activeButtonClass : ''}`}
                title="Artboard size"
              >
                <FontAwesomeIcon icon={faExpand} className="mr-1" />
                Artboard
              </button>
            )}
            <button
              onClick={onToggleDataSource}
              className={`${toolButtonClass} ${showDataSource ? activeButtonClass : ''}`}
              title="Data Sources"
            >
              <FontAwesomeIcon icon={faDatabase} className="mr-1" />
              Data
            </button>
          </>
        )}
      </div>
    </div>
  )
}
