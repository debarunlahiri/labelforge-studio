import { useEffect, useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBarcode,
  faCalendarDays,
  faDatabase,
  faEye,
  faEyeSlash,
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
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onReorder: (orderedTopToBottom: LabelObject[], movedId: string) => void
  onLayerPreview: (id: string) => void
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
  onMoveUp,
  onMoveDown,
  onReorder,
  onLayerPreview,
}: LayersPanelProps) {
  const [layerItems, setLayerItems] = useState<LabelObject[]>(() => getDisplayObjects(objects))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const latestItemsRef = useRef(layerItems)

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

  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-[var(--border-color)] bg-white">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-color)] px-5">
        <div>
          <div className="text-sm font-semibold text-slate-900">Layers</div>
          <div className="text-[11px] text-[var(--text-secondary)]">{objects.length} objects</div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Drag
        </span>
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
              const isSelected = selectedObjectId === obj.id
              const isDragging = draggingId === obj.id
              return (
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
                  className={`group flex cursor-grab items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs active:cursor-grabbing ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white text-[var(--text-primary)] hover:border-blue-200 hover:bg-slate-50'
                  }`}
                  onClick={() => onSelect(obj.id)}
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
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{obj.name}</div>
                    <div className="mt-0.5 truncate text-[10px] capitalize text-slate-500">{obj.type}</div>
                  </div>
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
                  <div className="flex w-8 justify-end gap-1 text-[10px] text-slate-400">
                    {obj.locked ? <FontAwesomeIcon icon={faLock} /> : <FontAwesomeIcon icon={faUnlock} className="opacity-0 group-hover:opacity-60" />}
                    {obj.visible ? <FontAwesomeIcon icon={faEye} className="opacity-0 group-hover:opacity-60" /> : <FontAwesomeIcon icon={faEyeSlash} />}
                  </div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}
