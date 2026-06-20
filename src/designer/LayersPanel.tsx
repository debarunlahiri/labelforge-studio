import { Fragment, useEffect, useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBarcode,
  faCalendarDays,
  faDatabase,
  faEye,
  faEyeSlash,
  faFolder,
  faFolderOpen,
  faGripVertical,
  faHashtag,
  faImage,
  faLock,
  faMinus,
  faQrcode,
  faShapes,
  faTag,
  faTextHeight,
  faUnlock,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { LabelObject } from '../types'

interface LayersPanelProps {
  objects: LabelObject[]
  selectedObjectId: string | null
  onSelect: (id: string | null) => void
  onToggleSelect: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onReorder: (orderedTopToBottom: LabelObject[], movedId: string) => void
  onLayerPreview: (id: string) => void
  selectedObjectIds: string[]
  onRename: (id: string, name: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onGroupSelected: () => void
  onUngroup: (groupId: string) => void
  onSelectGroup: (ids: string[]) => void
}

const typeIcons: Record<string, IconDefinition> = {
  text: faTextHeight,
  barcode: faBarcode,
  qrcode: faQrcode,
  image: faImage,
  shape: faShapes,
  line: faMinus,
  datetime: faCalendarDays,
  counter: faHashtag,
  rfid: faTag,
  database: faDatabase,
}

const getDisplayObjects = (objects: LabelObject[]) => [...objects].reverse()

export default function LayersPanel({
  objects,
  selectedObjectId,
  onSelect,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onReorder,
  onLayerPreview,
  selectedObjectIds,
  onRename,
  onRenameGroup,
  onGroupSelected,
  onUngroup,
  onSelectGroup,
}: LayersPanelProps) {
  const [layerItems, setLayerItems] = useState<LabelObject[]>(() => getDisplayObjects(objects))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const latestItemsRef = useRef(layerItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    const nextItems = getDisplayObjects(objects)
    setLayerItems(nextItems)
    latestItemsRef.current = nextItems
  }, [objects])

  const handleReorder = (nextItems: LabelObject[]) => {
    setLayerItems(nextItems)
    latestItemsRef.current = nextItems
    if (draggingId) onLayerPreview(draggingId)
  }

  const handleDragStart = (obj: LabelObject) => {
    setDraggingId(obj.id)
    onSelect(obj.id)
    onLayerPreview(obj.id)
  }

  const handleDragEnd = (obj: LabelObject) => {
    setDraggingId(null)
    onReorder(latestItemsRef.current, obj.id)
  }

  const groups = layerItems.reduce<Record<string, LabelObject[]>>((result, object) => {
    if (object.groupId) {
      ;(result[object.groupId] ||= []).push(object)
    }
    return result
  }, {})

  const commitRename = (object: LabelObject) => {
    const nextName = editingName.trim()
    if (nextName && nextName !== object.name) onRename(object.id, nextName)
    setEditingId(null)
  }

  const commitGroupRename = (groupId: string) => {
    const nextName = editingGroupName.trim()
    if (nextName) onRenameGroup(groupId, nextName)
    setEditingGroupId(null)
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-r border-[var(--border-color)] bg-white">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-color)] px-5">
        <div>
          <div className="text-sm font-semibold text-slate-900">Layers</div>
          <div className="text-[11px] text-[var(--text-secondary)]">{objects.length} {objects.length === 1 ? 'item' : 'items'}</div>
        </div>
        <button
          type="button"
          disabled={selectedObjectIds.length < 2}
          onClick={onGroupSelected}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Group selected layers"
        >
          <FontAwesomeIcon icon={faFolder} />
          Group
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="mx-5 mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs leading-5 text-[var(--text-secondary)]">
            No layers yet.
            <br />
            Add text, barcodes, shapes, or images from the toolbar.
          </div>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={layerItems}
            onReorder={handleReorder}
            className="space-y-1.5 p-3"
          >
            {layerItems.map((obj) => {
              const group = obj.groupId ? groups[obj.groupId] : null
              const isFirstGroupItem = Boolean(group && group[0]?.id === obj.id)
              const isCollapsed = Boolean(obj.groupId && collapsedGroups.has(obj.groupId))
              if (obj.groupId && !isFirstGroupItem && isCollapsed) return null
              const isSelected = selectedObjectIds.includes(obj.id)
              const isDragging = draggingId === obj.id
              return (
                <Fragment key={`layer-wrapper-${obj.id}`}>
                {obj.groupId && isFirstGroupItem && (
                  <div
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                    onClick={() => onSelectGroup(group!.map((item) => item.id))}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setCollapsedGroups((current) => {
                          const next = new Set(current)
                          if (next.has(obj.groupId!)) next.delete(obj.groupId!)
                          else next.add(obj.groupId!)
                          return next
                        })
                      }}
                      className="text-slate-500"
                    >
                      <FontAwesomeIcon icon={isCollapsed ? faFolder : faFolderOpen} />
                    </button>
                    {editingGroupId === obj.groupId ? (
                      <input
                        autoFocus
                        value={editingGroupName}
                        onChange={(event) => setEditingGroupName(event.target.value)}
                        onBlur={() => commitGroupRename(obj.groupId!)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitGroupRename(obj.groupId!)
                          if (event.key === 'Escape') setEditingGroupId(null)
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="h-7 min-w-0 flex-1 rounded border border-blue-400 bg-white px-2 text-xs outline-none"
                      />
                    ) : (
                      <span
                        className="min-w-0 flex-1 truncate"
                        onDoubleClick={(event) => {
                          event.stopPropagation()
                          setEditingGroupId(obj.groupId!)
                          setEditingGroupName(obj.groupName || 'Group')
                        }}
                        title="Double-click to rename group"
                      >
                        {obj.groupName || 'Group'}
                      </span>
                    )}
                    <span className="text-[10px] font-normal text-slate-500">{group!.length} layers</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onUngroup(obj.groupId!)
                      }}
                      className="rounded px-1.5 py-1 text-[10px] font-medium hover:bg-white"
                    >
                      Ungroup
                    </button>
                  </div>
                )}
                <Reorder.Item
                  as="div"
                  key={obj.id}
                  value={obj}
                  layout
                  initial={false}
                  whileDrag={{
                    scale: 1.03,
                    zIndex: 20,
                    boxShadow: '0 18px 35px rgba(15, 23, 42, 0.18)',
                  }}
                  animate={{
                    scale: isDragging ? 1.01 : 1,
                    boxShadow: isSelected
                      ? '0 10px 22px rgba(37, 99, 235, 0.12)'
                      : '0 1px 2px rgba(15, 23, 42, 0.04)',
                  }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  className={`group grid cursor-grab grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs active:cursor-grabbing ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white text-[var(--text-primary)] hover:border-blue-200 hover:bg-slate-50'
                  }`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey) onToggleSelect(obj.id)
                    else if (obj.groupId) onSelectGroup(groups[obj.groupId].map((item) => item.id))
                    else onSelect(obj.id)
                  }}
                  onDragStart={() => handleDragStart(obj)}
                  onDragEnd={() => handleDragEnd(obj)}
                >
                  <span className="text-slate-300 transition-colors group-hover:text-slate-500">
                    <FontAwesomeIcon icon={faGripVertical} />
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] shadow-sm ring-1 ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 ring-blue-200'
                        : 'bg-slate-50 text-slate-600 ring-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={typeIcons[obj.type] || faShapes} />
                  </span>
                  <div className={`min-w-0 ${obj.groupId ? 'pl-3' : ''}`}>
                    {editingId === obj.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onBlur={() => commitRename(obj)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitRename(obj)
                          if (event.key === 'Escape') setEditingId(null)
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="h-7 w-full rounded border border-blue-400 bg-white px-2 text-xs font-semibold outline-none"
                      />
                    ) : (
                      <div
                        className="whitespace-normal break-words font-semibold leading-4"
                        onDoubleClick={(event) => {
                          event.stopPropagation()
                          setEditingId(obj.id)
                          setEditingName(obj.name)
                        }}
                        title="Double-click to rename"
                      >
                        {obj.name}
                      </div>
                    )}
                    <div className="mt-0.5 whitespace-normal break-words text-[10px] capitalize leading-4 text-slate-500">{obj.type}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveUp(obj.id)
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] text-slate-500 hover:bg-blue-100 hover:text-blue-700"
                        title="Move layer up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveDown(obj.id)
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] text-slate-500 hover:bg-blue-100 hover:text-blue-700"
                        title="Move layer down"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex w-9 justify-end gap-1 text-[10px] text-slate-400">
                      {obj.locked ? <FontAwesomeIcon icon={faLock} /> : <FontAwesomeIcon icon={faUnlock} className="opacity-0 group-hover:opacity-60" />}
                      {obj.visible ? <FontAwesomeIcon icon={faEye} className="opacity-0 group-hover:opacity-60" /> : <FontAwesomeIcon icon={faEyeSlash} />}
                    </div>
                  </div>
                </Reorder.Item>
                </Fragment>
              )
            })}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}
