import { useEffect, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faTableCells, faList, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons'
import bwipjs from 'bwip-js'
import type { SymbologyGroup, SymbologyOption } from './symbologies'
import { getBwipSymbology, getSampleValueForSymbology, isQrFamilySymbology } from './symbologies'

interface BarcodeSymbologyModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  groups: SymbologyGroup[]
}

type ViewMode = 'grid' | 'list'

function fallbackPreview(option: SymbologyOption): string {
  const seed = option.value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const bars = Array.from({ length: 28 }, (_, index) => {
    const width = ((seed + index * 7) % 3) + 1
    const x = 8 + index * 4
    const opacity = ((seed + index) % 5) === 0 ? 0.35 : 1
    return `<rect x="${x}" y="10" width="${width}" height="34" fill="#0f172a" opacity="${opacity}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="56" viewBox="0 0 128 56"><rect width="128" height="56" rx="6" fill="#fff"/><rect x="0.5" y="0.5" width="127" height="55" rx="5.5" fill="none" stroke="#e2e8f0"/>${bars}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function renderBarcodePreview(option: SymbologyOption): string {
  if (option.supported === false || !option.bwip) {
    return fallbackPreview(option)
  }
  try {
    const canvas = document.createElement('canvas')
    const bwipType = getBwipSymbology(option.value)
    const is2D = isQrFamilySymbology(option.value) || ['datamatrix', 'gs1datamatrix', 'azteccode', 'aztecrune', 'dotcode', 'hanxin', 'maxicode', 'pdf417', 'pdf417compact', 'pdf417truncated', 'micropdf417', 'codablockf', 'code16k', 'code49'].includes(bwipType)
    const opts: any = {
      bcid: bwipType,
      text: getSampleValueForSymbology(option.value),
      scale: is2D ? 2 : 1,
      height: is2D ? 40 : 24,
      includetext: false,
      barcolor: '000000',
      backgroundcolor: 'FFFFFF',
    }
    if (!is2D) {
      opts.width = 96
    }
    bwipjs.toCanvas(canvas, opts)
    return canvas.toDataURL('image/png')
  } catch {
    return fallbackPreview(option)
  }
}

function useBarcodePreview(option: SymbologyOption): string {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    const url = renderBarcodePreview(option)
    if (!cancelled) setDataUrl(url)
    return () => { cancelled = true }
  }, [option])

  return dataUrl
}

function SymbologyCard({
  option,
  selected,
  viewMode,
  onClick,
}: {
  option: SymbologyOption
  selected: boolean
  viewMode: ViewMode
  onClick: () => void
}) {
  const previewUrl = useBarcodePreview(option)
  const isUnsupported = option.supported === false

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isUnsupported}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
          selected
            ? 'border-blue-300 bg-blue-50 text-blue-800'
            : isUnsupported
              ? 'border-slate-100 bg-slate-50 text-slate-400'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-white">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="max-h-8 max-w-8 object-contain" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">{option.label}</span>
          {option.notes && <span className="block truncate text-[10px] text-slate-500">{option.notes}</span>}
        </span>
        {selected && <FontAwesomeIcon icon={faCheck} className="text-xs text-blue-600" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isUnsupported}
      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? 'border-blue-300 bg-blue-50 text-blue-800'
          : isUnsupported
            ? 'border-slate-100 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'
      }`}
    >
      <span className="flex h-16 w-full items-center justify-center rounded-lg border border-slate-100 bg-white">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="max-h-12 max-w-full object-contain" />
          ) : null}
      </span>
      <span className="w-full text-center">
        <span className="block text-[11px] font-medium leading-tight">{option.label}</span>
        {option.notes && <span className="block truncate text-[9px] text-slate-500">{option.notes}</span>}
      </span>
      {selected && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
        </span>
      )}
    </button>
  )
}

export default function BarcodeSymbologyModal({ isOpen, onClose, value, onChange, groups }: BarcodeSymbologyModalProps) {
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return groups
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(normalized) ||
            group.label.toLowerCase().includes(normalized) ||
            (option.notes && option.notes.toLowerCase().includes(normalized))
        ),
      }))
      .filter((group) => group.options.length > 0)
  }, [groups, query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Select Barcode Symbology</h2>
            <p className="text-xs text-slate-500">Choose the barcode type that matches your data and scanner requirements.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search barcode types..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FontAwesomeIcon icon={faTableCells} className="text-xs" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FontAwesomeIcon icon={faList} className="text-xs" />
              List
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="text-sm">No barcode types match your search.</span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <section key={group.label}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</h3>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                        : 'flex flex-col gap-2'
                    }
                  >
                    {group.options.map((option) => (
                      <SymbologyCard
                        key={option.value}
                        option={option}
                        selected={option.value === value}
                        viewMode={viewMode}
                        onClick={() => {
                          onChange(option.value)
                          onClose()
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <span className="text-xs text-slate-500">
            {filteredGroups.reduce((count, group) => count + group.options.length, 0)} types shown
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
