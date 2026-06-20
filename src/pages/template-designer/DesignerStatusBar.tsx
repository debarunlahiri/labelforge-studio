import type { Template } from '../../types'
import type { AutoSaveStatus } from './types'

type DesignerStatusBarProps = {
  template: Template | null | undefined
  objectCount: number
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  autoSaveStatus: AutoSaveStatus
  lastSavedAt: string | null
  filePath: string | null
}

export default function DesignerStatusBar({
  template,
  objectCount,
  zoom,
  showGrid,
  snapToGrid,
  autoSaveStatus,
  lastSavedAt,
  filePath,
}: DesignerStatusBarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--border-color)] bg-white px-4 text-[11px] text-[var(--text-secondary)]">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Width: {template?.label_width || 0}{template?.unit || 'mm'}</span>
        <span>Height: {template?.label_height || 0}{template?.unit || 'mm'}</span>
        <span>DPI: {template?.dpi || 300}</span>
        <span>Status: {template?.status || 'Draft'}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span title={filePath || 'This template has not been saved to a file'}>
          File: {filePath ? filePath.split(/[\\/]/).pop() : 'Database only'}
        </span>
        <span>Items: {objectCount}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>{showGrid ? 'Grid: On' : 'Grid: Off'}</span>
        <span>{snapToGrid ? 'Snap: On' : 'Snap: Off'}</span>
        {autoSaveStatus === 'pending' && <span className="text-amber-600">Unsaved changes</span>}
        {autoSaveStatus === 'saving' && <span className="text-blue-600">Auto-saving...</span>}
        {autoSaveStatus === 'error' && <span className="text-red-600">Auto-save failed</span>}
        {lastSavedAt && !['pending', 'saving', 'error'].includes(autoSaveStatus) && (
          <span>Saved: {lastSavedAt}</span>
        )}
      </div>
    </div>
  )
}
