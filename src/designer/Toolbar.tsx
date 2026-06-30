import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBarcode,
  faAlignCenter,
  faAlignLeft,
  faAlignRight,
  faArrowDown,
  faArrowUp,
  faCalendarDays,
  faDatabase,
  faExpand,
  faFloppyDisk,
  faGrip,
  faHashtag,
  faImage,
  faFileExport,
  faChevronDown,
  faMinus,
  faPlus,
  faPrint,
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
  onSaveAs: () => void
  onExport: (format: 'labelforge' | 'pdf' | 'jpeg' | 'png') => void
  onPrint: () => void
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

const exportFormats = [
  { value: 'labelforge', label: 'LabelForge Studio' },
  { value: 'pdf', label: 'PDF' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
] satisfies Array<{ value: 'labelforge' | 'pdf' | 'jpeg' | 'png'; label: string }>

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

function ToolbarTooltip({ label, description }: { label: string; description: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-max max-w-56 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-left text-white shadow-xl group-hover:block">
      <span className="block text-[11px] font-semibold">{label}</span>
      <span className="mt-0.5 block text-[10px] font-normal leading-4 text-slate-300">{description}</span>
    </span>
  )
}

export default function Toolbar({
  onSave, onSaveAs, onExport, onPrint, isSaving, onAddObject, onToggleGrid, onToggleSnap,
  showGrid, snapToGrid, zoom, onZoom, onZoomFit, onDelete,
  hasSelection, templateName, onToggleDataSource, showDataSource,
  onToggleArtboard, showArtboard, onUndo, onRedo, canUndo, canRedo, onAlign,
}: ToolbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const shortcutModifier = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘'
    : 'Ctrl'

  useEffect(() => {
    if (!exportMenuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [exportMenuOpen])

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
          className="group relative inline-flex h-8 items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          aria-label="Save template"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {isSaving ? 'Saving...' : 'Save'}
          <ToolbarTooltip label="Save Template" description={`Save to the template's file and database. Shortcut: ${shortcutModifier}+S.`} />
        </button>
        <button
          onClick={onSaveAs}
          disabled={isSaving}
          className="group relative inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          aria-label="Save template as"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          Save As
          <ToolbarTooltip label="Save As" description={`Choose a new file name or location. Shortcut: ${shortcutModifier}+Shift+S.`} />
        </button>
        <div ref={exportMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen((open) => !open)}
            disabled={isSaving}
            className="group relative inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            aria-label="Export design"
            aria-haspopup="menu"
            aria-expanded={exportMenuOpen}
          >
            <FontAwesomeIcon icon={faFileExport} />
            Export
            <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-500" />
            <ToolbarTooltip label="Export Design" description="Choose a file format for this design." />
          </button>
          {exportMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-xl" role="menu">
              {exportFormats.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false)
                    onExport(format.value)
                  }}
                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  {format.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onPrint}
          className="group relative inline-flex h-8 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
          aria-label="Print design"
        >
          <FontAwesomeIcon icon={faPrint} />
          Print
          <ToolbarTooltip label="Print Design" description="Open print preview and printer selection." />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`group relative ${toolButtonClass}`}
          aria-label="Undo"
        >
          <FontAwesomeIcon icon={faUndo} />
          <ToolbarTooltip label="Undo" description={`Reverse the last designer change. Shortcut: ${shortcutModifier}+Z.`} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`group relative ${toolButtonClass}`}
          aria-label="Redo"
        >
          <FontAwesomeIcon icon={faRedo} />
          <ToolbarTooltip label="Redo" description={`Restore the most recently undone change. Shortcut: ${shortcutModifier}+Shift+Z.`} />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
          {objectTypes.map((obj) => (
            <button
              key={obj.type}
              onClick={() => onAddObject(obj.type)}
              className="group relative inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white hover:shadow-sm"
              aria-label={`Add ${obj.label}`}
            >
              <FontAwesomeIcon icon={obj.icon} />
              <ToolbarTooltip label={`Add ${obj.label}`} description={`Insert a new ${obj.label.toLowerCase()} item onto the label.`} />
            </button>
          ))}
        </div>
        {hasSelection && onAlign && (
          <>
            <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
            <button onClick={() => onAlign('alignLeft')} className={`group relative ${toolButtonClass}`} aria-label="Align Left">
              <FontAwesomeIcon icon={faAlignLeft} />
              <ToolbarTooltip label="Align Left" description="Move the selected item to the left edge of the artboard." />
            </button>
            <button onClick={() => onAlign('alignCenterHorizontal')} className={`group relative ${toolButtonClass}`} aria-label="Center Horizontally">
              <FontAwesomeIcon icon={faAlignCenter} />
              <ToolbarTooltip label="Center Horizontally" description="Center the selected item between the artboard's left and right edges." />
            </button>
            <button onClick={() => onAlign('alignRight')} className={`group relative ${toolButtonClass}`} aria-label="Align Right">
              <FontAwesomeIcon icon={faAlignRight} />
              <ToolbarTooltip label="Align Right" description="Move the selected item to the right edge of the artboard." />
            </button>
            <button onClick={() => onAlign('alignTop')} className={`group relative ${toolButtonClass}`} aria-label="Align Top">
              <FontAwesomeIcon icon={faArrowUp} />
              <ToolbarTooltip label="Align Top" description="Move the selected item to the top edge of the artboard." />
            </button>
            <button onClick={() => onAlign('alignCenterVertical')} className={`group relative ${toolButtonClass}`} aria-label="Center Vertically">
              <FontAwesomeIcon icon={faAlignCenter} rotation={90} />
              <ToolbarTooltip label="Center Vertically" description="Center the selected item between the artboard's top and bottom edges." />
            </button>
            <button onClick={() => onAlign('alignBottom')} className={`group relative ${toolButtonClass}`} aria-label="Align Bottom">
              <FontAwesomeIcon icon={faArrowDown} />
              <ToolbarTooltip label="Align Bottom" description="Move the selected item to the bottom edge of the artboard." />
            </button>
          </>
        )}
        {hasSelection && (
          <button
            onClick={onDelete}
            className="group relative inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            aria-label="Delete selected item"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
            <ToolbarTooltip label="Delete Item" description="Remove the selected item from the label. Shortcut: Delete." />
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <button
          onClick={() => onZoom(-0.1)}
          className={`group relative ${toolButtonClass}`}
          aria-label="Zoom out"
        >
          <FontAwesomeIcon icon={faMinus} />
          <ToolbarTooltip label="Zoom Out" description="Reduce the artboard magnification by 10%." />
        </button>
        <span className="min-w-[54px] rounded-md bg-slate-50 px-2 py-1 text-center text-xs font-medium text-slate-700">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => onZoom(0.1)}
          className={`group relative ${toolButtonClass}`}
          aria-label="Zoom in"
        >
          <FontAwesomeIcon icon={faPlus} />
          <ToolbarTooltip label="Zoom In" description="Increase the artboard magnification by 10%." />
        </button>
        <button
          onClick={onZoomFit}
          className={`group relative ${toolButtonClass} gap-1.5 px-3`}
          aria-label="Fit artboard to screen"
        >
          <FontAwesomeIcon icon={faExpand} />
          Fit
          <ToolbarTooltip label="Fit to Screen" description="Resize the view so the complete artboard fits in the workspace." />
        </button>
        <div className="mx-1 h-7 w-px bg-[var(--border-color)]" />
        <button
          onClick={onToggleGrid}
          className={`group relative ${toolButtonClass} ${showGrid ? activeButtonClass : ''}`}
          aria-label="Toggle grid"
        >
          <FontAwesomeIcon icon={faGrip} className="mr-1" />
          Grid
          <ToolbarTooltip label="Grid" description="Show or hide the positioning grid on the artboard." />
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
                className={`group relative ${toolButtonClass} ${showArtboard ? activeButtonClass : ''}`}
                aria-label="Open artboard settings"
              >
                <FontAwesomeIcon icon={faExpand} className="mr-1" />
                Artboard
                <ToolbarTooltip label="Artboard Settings" description="Edit the label dimensions, unit, and print resolution." />
              </button>
            )}
            <button
              onClick={onToggleDataSource}
              className={`group relative ${toolButtonClass} ${showDataSource ? activeButtonClass : ''}`}
              aria-label="Open data sources"
            >
              <FontAwesomeIcon icon={faDatabase} className="mr-1" />
              Data
              <ToolbarTooltip label="Data Sources" description="Configure dynamic data and map fields to label items." />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
