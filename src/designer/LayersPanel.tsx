import type { LabelObject } from '../types'

interface LayersPanelProps {
  objects: LabelObject[]
  selectedObjectId: string | null
  onSelect: (id: string | null) => void
}

const typeIcons: Record<string, string> = {
  text: 'T',
  barcode: '|||',
  qrcode: 'QR',
  image: '▣',
  shape: '□',
  line: '—',
  datetime: '_tD',
  counter: '#',
  rfid: 'RF',
  database: 'DB',
}

export default function LayersPanel({ objects, selectedObjectId, onSelect }: LayersPanelProps) {
  return (
    <div className="w-52 border-r border-[var(--border-color)] bg-white flex flex-col">
      <div className="flex h-8 items-center border-b border-[var(--border-color)] px-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Layers</span>
        <span className="ml-auto text-[10px] text-[var(--text-secondary)]">{objects.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-3 text-center text-[11px] text-[var(--text-secondary)]">
            No objects yet. Add objects from the toolbar.
          </div>
        ) : (
          [...objects].reverse().map((obj) => (
            <div
              key={obj.id}
              className={`flex cursor-pointer items-center gap-2 border-b border-[var(--border-color)] px-3 py-1.5 text-xs transition-colors ${
                selectedObjectId === obj.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-slate-50 text-[var(--text-primary)]'
              }`}
              onClick={() => onSelect(obj.id)}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-mono">
                {typeIcons[obj.type] || '?'}
              </span>
              <span className="flex-1 truncate">{obj.name}</span>
              {obj.locked && <span className="text-[10px] text-slate-400">🔒</span>}
              {!obj.visible && <span className="text-[10px] text-slate-400">👁‍🗨</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}