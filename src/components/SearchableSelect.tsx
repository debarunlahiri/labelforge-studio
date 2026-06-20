import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
}

type SearchableSelectProps = {
  value: string
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder?: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export default function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  onChange,
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 0, openUpward: false })
  const selected = options.find((option) => option.value === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = normalizedQuery
    ? options.filter((option) => `${option.label} ${option.description || ''}`.toLowerCase().includes(normalizedQuery))
    : options

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const availableBelow = window.innerHeight - rect.bottom
      const openUpward = availableBelow < 300 && rect.top > availableBelow
      setMenuPosition({
        left: rect.left,
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        width: rect.width,
        openUpward,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current)
          setQuery('')
        }}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        <span className="text-xs text-slate-400">⌄</span>
      </button>

      {open && !disabled && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[1000] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            transform: menuPosition.openUpward ? 'translateY(-100%)' : undefined,
          }}
        >
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
          <div className="max-h-64 overscroll-contain overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-500">No matches found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${
                    option.value === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{option.label}</span>
                    {option.description && <span className="block truncate text-[11px] text-slate-500">{option.description}</span>}
                  </span>
                  {option.value === value && <span className="text-sm">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
