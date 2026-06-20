import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown,
  faArrowUp,
  faClone,
  faCopy,
  faFolder,
  faFolderOpen,
  faLayerGroup,
  faPaste,
  faTrash,
  faCropSimple,
  faImage,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { DesignerContextMenuState } from './types'

type ContextAction = 'copy' | 'paste' | 'duplicate' | 'delete'
type StackAction = 'front' | 'back' | 'forward' | 'backward'
export type ImageContextAction = 'fit' | 'fill' | 'stretch' | 'portrait' | 'landscape' | 'flip-horizontal' | 'flip-vertical' | 'reset'

type ObjectContextMenuProps = {
  menu: Exclude<DesignerContextMenuState, null>
  onAction: (action: ContextAction) => void
  onStackAction: (objectId: string, action: StackAction) => void
  canGroup: boolean
  canUngroup: boolean
  selectionCount: number
  onGroup: () => void
  onUngroup: () => void
  isImage?: boolean
  onImageAction?: (action: ImageContextAction) => void
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: IconDefinition
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={`flex h-8 w-full items-center gap-3 px-3 text-left text-xs font-medium transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
      onClick={onClick}
    >
      <span className={`flex w-4 justify-center ${danger ? 'text-red-500' : 'text-slate-400'}`}>
        <FontAwesomeIcon icon={icon} fixedWidth />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  )
}

export default function ObjectContextMenu({
  menu,
  onAction,
  onStackAction,
  canGroup,
  canUngroup,
  selectionCount,
  onGroup,
  onUngroup,
  isImage,
  onImageAction,
}: ObjectContextMenuProps) {
  return (
    <div
      className="fixed z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-xs shadow-2xl shadow-slate-900/20 ring-1 ring-black/5"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {selectionCount > 1 ? `${selectionCount} selected items` : 'Item actions'}
      </div>
      <ContextMenuItem icon={faCopy} label="Copy" onClick={() => onAction('copy')} />
      <ContextMenuItem icon={faPaste} label="Paste" onClick={() => onAction('paste')} />
      <ContextMenuItem icon={faClone} label="Duplicate" onClick={() => onAction('duplicate')} />
      {isImage && onImageAction && (
        <>
          <div className="my-1 border-t border-slate-100" />
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Image</div>
          <ContextMenuItem icon={faImage} label="Fit Entire Image" onClick={() => onImageAction('fit')} />
          <ContextMenuItem icon={faCropSimple} label="Fill Frame and Crop" onClick={() => onImageAction('fill')} />
          <ContextMenuItem icon={faCropSimple} label="Stretch to Frame" onClick={() => onImageAction('stretch')} />
          <ContextMenuItem icon={faImage} label="Portrait Frame" onClick={() => onImageAction('portrait')} />
          <ContextMenuItem icon={faImage} label="Landscape Frame" onClick={() => onImageAction('landscape')} />
          <ContextMenuItem icon={faRotate} label="Flip Horizontal" onClick={() => onImageAction('flip-horizontal')} />
          <ContextMenuItem icon={faRotate} label="Flip Vertical" onClick={() => onImageAction('flip-vertical')} />
          <ContextMenuItem icon={faRotate} label="Reset Image Adjustments" onClick={() => onImageAction('reset')} />
        </>
      )}
      {(canGroup || canUngroup) && <div className="my-1 border-t border-slate-100" />}
      {canGroup && <ContextMenuItem icon={faFolder} label="Group Selected" onClick={onGroup} />}
      {canUngroup && <ContextMenuItem icon={faFolderOpen} label="Ungroup" onClick={onUngroup} />}
      <div className="my-1 border-t border-slate-100" />
      <ContextMenuItem icon={faLayerGroup} label="Bring to Front" onClick={() => onStackAction(menu.objectId, 'front')} />
      <ContextMenuItem icon={faArrowUp} label="Bring Forward" onClick={() => onStackAction(menu.objectId, 'forward')} />
      <ContextMenuItem icon={faArrowDown} label="Send Backward" onClick={() => onStackAction(menu.objectId, 'backward')} />
      <ContextMenuItem icon={faLayerGroup} label="Send to Back" onClick={() => onStackAction(menu.objectId, 'back')} />
      <div className="my-1 border-t border-slate-100" />
      <ContextMenuItem icon={faTrash} label="Delete" danger onClick={() => onAction('delete')} />
    </div>
  )
}
