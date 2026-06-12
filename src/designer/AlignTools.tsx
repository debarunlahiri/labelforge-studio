import type { LabelObject } from '../types'

interface AlignToolsProps {
  onAlign: (action: string) => void
}

const alignActions = [
  { action: 'alignLeft', label: '←', title: 'Align Left' },
  { action: 'alignRight', label: '→', title: 'Align Right' },
  { action: 'alignTop', label: '↑', title: 'Align Top' },
  { action: 'alignBottom', label: '↓', title: 'Align Bottom' },
  { action: 'alignCenterHorizontal', label: '↔', title: 'Align Center Horizontal' },
  { action: 'alignCenterVertical', label: '↕', title: 'Align Center Vertical' },
  { action: 'distributeHorizontally', label: '⋯', title: 'Distribute Horizontally' },
  { action: 'distributeVertically', label: '⋮', title: 'Distribute Vertically' },
]

export default function AlignTools({ onAlign }: AlignToolsProps) {
  return (
    <div className="flex items-center gap-1">
      {alignActions.map(({ action, label, title }) => (
        <button
          key={action}
          onClick={() => onAlign(action)}
          className="flex h-7 w-7 items-center justify-center rounded text-sm hover:bg-slate-100 transition-colors"
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  )
}