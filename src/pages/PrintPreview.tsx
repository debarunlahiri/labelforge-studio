import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import { renderToCanvas } from '../utils/labelRenderer'
import SearchableSelect from '../components/SearchableSelect'
import type { Printer } from '../types'

type PaperSizeId = string
type Placement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
type LabelsPerPage = '1' | '2' | '3' | '4' | 'multiple'
type PageLayout = 'portrait' | 'landscape'

const PAPER_SIZES: Record<PaperSizeId, { width: number; height: number; unit: string; label: string }> = {
  A4: { width: 210, height: 297, unit: 'mm', label: 'A4 (210 x 297 mm)' },
  Letter: { width: 215.9, height: 279.4, unit: 'mm', label: 'Letter (215.9 x 279.4 mm)' },
  Legal: { width: 215.9, height: 355.6, unit: 'mm', label: 'Legal (215.9 x 355.6 mm)' },
  A5: { width: 148, height: 210, unit: 'mm', label: 'A5 (148 x 210 mm)' },
  A6: { width: 105, height: 148, unit: 'mm', label: 'A6 (105 x 148 mm)' },
  'Label 4" x 6"': { width: 101.6, height: 152.4, unit: 'mm', label: 'Label 4" x 6" (101.6 x 152.4 mm)' },
  'Label 4" x 4"': { width: 101.6, height: 101.6, unit: 'mm', label: 'Label 4" x 4" (101.6 x 101.6 mm)' },
  'Label 4" x 3"': { width: 101.6, height: 76.2, unit: 'mm', label: 'Label 4" x 3" (101.6 x 76.2 mm)' },
  'Label 4" x 2"': { width: 101.6, height: 50.8, unit: 'mm', label: 'Label 4" x 2" (101.6 x 50.8 mm)' },
  'Label 4" x 1.5"': { width: 101.6, height: 38.1, unit: 'mm', label: 'Label 4" x 1.5" (101.6 x 38.1 mm)' },
  'Label 4" x 1"': { width: 101.6, height: 25.4, unit: 'mm', label: 'Label 4" x 1" (101.6 x 25.4 mm)' },
  'Label 3" x 5"': { width: 76.2, height: 127, unit: 'mm', label: 'Label 3" x 5" (76.2 x 127 mm)' },
  'Label 3" x 3"': { width: 76.2, height: 76.2, unit: 'mm', label: 'Label 3" x 3" (76.2 x 76.2 mm)' },
  'Label 3" x 2"': { width: 76.2, height: 50.8, unit: 'mm', label: 'Label 3" x 2" (76.2 x 50.8 mm)' },
  'Label 3" x 1.5"': { width: 76.2, height: 38.1, unit: 'mm', label: 'Label 3" x 1.5" (76.2 x 38.1 mm)' },
  'Label 3" x 1"': { width: 76.2, height: 25.4, unit: 'mm', label: 'Label 3" x 1" (76.2 x 25.4 mm)' },
  'Label 2.25" x 1.25"': { width: 57.15, height: 31.75, unit: 'mm', label: 'Label 2.25" x 1.25" (57.15 x 31.75 mm)' },
  'Label 2" x 3"': { width: 50.8, height: 76.2, unit: 'mm', label: 'Label 2" x 3" (50.8 x 76.2 mm)' },
  'Label 2" x 2"': { width: 50.8, height: 50.8, unit: 'mm', label: 'Label 2" x 2" (50.8 x 50.8 mm)' },
  'Label 2" x 1.5"': { width: 50.8, height: 38.1, unit: 'mm', label: 'Label 2" x 1.5" (50.8 x 38.1 mm)' },
  'Label 2" x 1"': { width: 50.8, height: 25.4, unit: 'mm', label: 'Label 2" x 1" (50.8 x 25.4 mm)' },
  'Label 2" x 0.5"': { width: 50.8, height: 12.7, unit: 'mm', label: 'Label 2" x 0.5" (50.8 x 12.7 mm)' },
  'Label 1.5" x 1"': { width: 38.1, height: 25.4, unit: 'mm', label: 'Label 1.5" x 1" (38.1 x 25.4 mm)' },
  'Label 1" x 2"': { width: 25.4, height: 50.8, unit: 'mm', label: 'Label 1" x 2" (25.4 x 50.8 mm)' },
  'Label 1" x 1"': { width: 25.4, height: 25.4, unit: 'mm', label: 'Label 1" x 1" (25.4 x 25.4 mm)' },
  'Label 1" x 0.5"': { width: 25.4, height: 12.7, unit: 'mm', label: 'Label 1" x 0.5" (25.4 x 12.7 mm)' },
  'Label 100 x 150 mm': { width: 100, height: 150, unit: 'mm', label: 'Label 100 x 150 mm' },
  'Label 100 x 100 mm': { width: 100, height: 100, unit: 'mm', label: 'Label 100 x 100 mm' },
  'Label 100 x 70 mm': { width: 100, height: 70, unit: 'mm', label: 'Label 100 x 70 mm' },
  'Label 100 x 50 mm': { width: 100, height: 50, unit: 'mm', label: 'Label 100 x 50 mm' },
  'Label 100 x 40 mm': { width: 100, height: 40, unit: 'mm', label: 'Label 100 x 40 mm' },
  'Label 100 x 30 mm': { width: 100, height: 30, unit: 'mm', label: 'Label 100 x 30 mm' },
  'Label 90 x 60 mm': { width: 90, height: 60, unit: 'mm', label: 'Label 90 x 60 mm' },
  'Label 80 x 50 mm': { width: 80, height: 50, unit: 'mm', label: 'Label 80 x 50 mm' },
  'Label 70 x 50 mm': { width: 70, height: 50, unit: 'mm', label: 'Label 70 x 50 mm' },
  'Label 70 x 30 mm': { width: 70, height: 30, unit: 'mm', label: 'Label 70 x 30 mm' },
  'Label 60 x 40 mm': { width: 60, height: 40, unit: 'mm', label: 'Label 60 x 40 mm' },
  'Label 50 x 50 mm': { width: 50, height: 50, unit: 'mm', label: 'Label 50 x 50 mm' },
  'Label 50 x 30 mm': { width: 50, height: 30, unit: 'mm', label: 'Label 50 x 30 mm' },
  'Label 50 x 25 mm': { width: 50, height: 25, unit: 'mm', label: 'Label 50 x 25 mm' },
  'Label 50 x 20 mm': { width: 50, height: 20, unit: 'mm', label: 'Label 50 x 20 mm' },
  'Label 40 x 30 mm': { width: 40, height: 30, unit: 'mm', label: 'Label 40 x 30 mm' },
  'Label 40 x 20 mm': { width: 40, height: 20, unit: 'mm', label: 'Label 40 x 20 mm' },
  'Label 30 x 20 mm': { width: 30, height: 20, unit: 'mm', label: 'Label 30 x 20 mm' },
  'Label 20 x 10 mm': { width: 20, height: 10, unit: 'mm', label: 'Label 20 x 10 mm' },
  'Label 6" x 4"': { width: 152.4, height: 101.6, unit: 'mm', label: 'Label 6" x 4" (152.4 x 101.6 mm)' },
  'Label 8" x 6"': { width: 203.2, height: 152.4, unit: 'mm', label: 'Label 8" x 6" (203.2 x 152.4 mm)' },
  'Label 8" x 4"': { width: 203.2, height: 101.6, unit: 'mm', label: 'Label 8" x 4" (203.2 x 101.6 mm)' },
  Custom: { width: 210, height: 297, unit: 'mm', label: 'Custom' },
}

const PLACEMENT_OPTIONS: { value: Placement; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center-left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

const LABELS_PER_PAGE_OPTIONS: { value: LabelsPerPage; label: string }[] = [
  { value: '1', label: 'One per page' },
  { value: '2', label: 'Two per page' },
  { value: '3', label: 'Three per page' },
  { value: '4', label: 'Four per page' },
  { value: 'multiple', label: 'Multiple per page' },
]

function toPxAtDpi(value: number, unit: string, dpi: number): number {
  switch (unit) {
    case 'mm':
      return (value * dpi) / 25.4
    case 'cm':
      return (value * dpi) / 2.54
    case 'in':
      return value * dpi
    case 'pt':
      return (value * dpi) / 72
    case 'px':
    default:
      return value
  }
}

function toScreenPx(value: number, unit: string): number {
  return toPxAtDpi(value, unit, 96)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampCopies(value: number): number {
  return clamp(Number(value) || 1, 1, 9999)
}

type Margins = { top: number; bottom: number; left: number; right: number }

function getSingleLabelPositionPx(
  placement: Placement,
  paperWidthPx: number,
  paperHeightPx: number,
  labelWidthPx: number,
  labelHeightPx: number,
  margins: Margins,
): { x: number; y: number } {
  const availableWidthPx = Math.max(0, paperWidthPx - margins.left - margins.right)
  const availableHeightPx = Math.max(0, paperHeightPx - margins.top - margins.bottom)

  const xMap: Record<string, number> = {
    left: 0,
    center: (availableWidthPx - labelWidthPx) / 2,
    right: availableWidthPx - labelWidthPx,
  }
  const yMap: Record<string, number> = {
    top: 0,
    center: (availableHeightPx - labelHeightPx) / 2,
    bottom: availableHeightPx - labelHeightPx,
  }

  if (placement === 'center') {
    return { x: margins.left + xMap.center, y: margins.top + yMap.center }
  }

  const [vertical, horizontal] = placement.split('-') as [string, string]
  return {
    x: margins.left + (xMap[horizontal] ?? xMap.center),
    y: margins.top + (yMap[vertical] ?? yMap.center),
  }
}

function getGridLayout(
  labelsPerPage: LabelsPerPage,
  availableWidthPx: number,
  availableHeightPx: number,
  labelWidthPx: number,
  labelHeightPx: number,
  gapXPx: number,
  gapYPx: number,
): { cols: number; rows: number } {
  switch (labelsPerPage) {
    case '2':
      return { cols: 2, rows: 1 }
    case '3':
      return { cols: 3, rows: 1 }
    case '4':
      return { cols: 2, rows: 2 }
    case 'multiple': {
      const cols = Math.max(1, Math.floor((availableWidthPx + gapXPx) / (labelWidthPx + gapXPx)))
      const rows = Math.max(1, Math.floor((availableHeightPx + gapYPx) / (labelHeightPx + gapYPx)))
      return { cols, rows }
    }
    default:
      return { cols: 1, rows: 1 }
  }
}

function getGridLabelPositionsPx(
  labelsPerPage: LabelsPerPage,
  paperWidthPx: number,
  paperHeightPx: number,
  labelWidthPx: number,
  labelHeightPx: number,
  gapXPx: number,
  gapYPx: number,
  margins: Margins,
): { x: number; y: number }[] {
  const availableWidthPx = Math.max(0, paperWidthPx - margins.left - margins.right)
  const availableHeightPx = Math.max(0, paperHeightPx - margins.top - margins.bottom)

  const { cols, rows } = getGridLayout(
    labelsPerPage,
    availableWidthPx,
    availableHeightPx,
    labelWidthPx,
    labelHeightPx,
    gapXPx,
    gapYPx,
  )
  const totalWidth = cols * labelWidthPx + Math.max(0, cols - 1) * gapXPx
  const totalHeight = rows * labelHeightPx + Math.max(0, rows - 1) * gapYPx
  const startX = margins.left + (availableWidthPx - totalWidth) / 2
  const startY = margins.top + (availableHeightPx - totalHeight) / 2

  const positions: { x: number; y: number }[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: startX + col * (labelWidthPx + gapXPx),
        y: startY + row * (labelHeightPx + gapYPx),
      })
    }
  }
  return positions
}

async function composePageOntoCanvas(
  targetCanvas: HTMLCanvasElement,
  labelCanvas: HTMLCanvasElement,
  paperSize: { width: number; height: number; unit: string },
  labelSize: { width: number; height: number; unit: string },
  labelsPerPage: LabelsPerPage,
  placement: Placement,
  applyBorder: boolean,
  dpi: number,
  gapX: number,
  gapY: number,
  spacingUnit: string,
  margins: Margins,
): Promise<void> {
  const pageWidthPx = Math.round(toPxAtDpi(paperSize.width, paperSize.unit, dpi))
  const pageHeightPx = Math.round(toPxAtDpi(paperSize.height, paperSize.unit, dpi))
  const labelWidthPx = Math.round(toPxAtDpi(labelSize.width, labelSize.unit, dpi))
  const labelHeightPx = Math.round(toPxAtDpi(labelSize.height, labelSize.unit, dpi))
  const gapXPx = Math.round(toPxAtDpi(gapX, spacingUnit, dpi))
  const gapYPx = Math.round(toPxAtDpi(gapY, spacingUnit, dpi))
  const marginsPx = {
    top: Math.round(toPxAtDpi(margins.top, spacingUnit, dpi)),
    bottom: Math.round(toPxAtDpi(margins.bottom, spacingUnit, dpi)),
    left: Math.round(toPxAtDpi(margins.left, spacingUnit, dpi)),
    right: Math.round(toPxAtDpi(margins.right, spacingUnit, dpi)),
  }
  const borderWidthPx = Math.max(1, Math.round(toPxAtDpi(0.5, 'mm', dpi)))

  targetCanvas.width = pageWidthPx
  targetCanvas.height = pageHeightPx
  const ctx = targetCanvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context')

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, pageWidthPx, pageHeightPx)

  const positions =
    labelsPerPage === '1'
      ? [getSingleLabelPositionPx(placement, pageWidthPx, pageHeightPx, labelWidthPx, labelHeightPx, marginsPx)]
      : getGridLabelPositionsPx(labelsPerPage, pageWidthPx, pageHeightPx, labelWidthPx, labelHeightPx, gapXPx, gapYPx, marginsPx)

  for (const pos of positions) {
    ctx.drawImage(labelCanvas, pos.x, pos.y, labelWidthPx, labelHeightPx)

    if (applyBorder) {
      ctx.strokeStyle = 'black'
      ctx.lineWidth = borderWidthPx
      ctx.strokeRect(pos.x, pos.y, labelWidthPx, labelHeightPx)
    }
  }
}

async function renderComposedPage(
  labelCanvas: HTMLCanvasElement,
  paperSize: { width: number; height: number; unit: string },
  labelSize: { width: number; height: number; unit: string },
  labelsPerPage: LabelsPerPage,
  placement: Placement,
  applyBorder: boolean,
  dpi: number,
  gapX: number,
  gapY: number,
  spacingUnit: string,
  margins: Margins,
): Promise<string> {
  const canvas = document.createElement('canvas')
  await composePageOntoCanvas(
    canvas,
    labelCanvas,
    paperSize,
    labelSize,
    labelsPerPage,
    placement,
    applyBorder,
    dpi,
    gapX,
    gapY,
    spacingUnit,
    margins,
  )
  return canvas.toDataURL('image/png')
}

function CustomDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find((option) => option.value === value)?.label || placeholder

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <span>{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                option.value === value ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PrintPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTemplate, loadTemplate, versions, loadVersions } = useTemplateStore()
  const { objects, loadObjects, clearObjects, zoom, setZoom, setCanvasSize } = useDesignerStore()

  const previewWrapRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [copies, setCopies] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [printers, setPrinters] = useState<Printer[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [printerLanguage, setPrinterLanguage] = useState<'pdf' | 'zpl' | 'epl' | 'tspl'>('pdf')
  const [statusMessage, setStatusMessage] = useState('')

  const [paperSizeId, setPaperSizeId] = useState<PaperSizeId>('Artboard')
  const [customPaperWidth, setCustomPaperWidth] = useState(210)
  const [customPaperHeight, setCustomPaperHeight] = useState(297)
  const [customPaperUnit, setCustomPaperUnit] = useState('mm')
  const [pageLayout, setPageLayout] = useState<PageLayout>('portrait')
  const [labelsPerPage, setLabelsPerPage] = useState<LabelsPerPage>('1')
  const [placement, setPlacement] = useState<Placement>('center')
  const [applyBorder, setApplyBorder] = useState(false)
  const [gapX, setGapX] = useState(0)
  const [gapY, setGapY] = useState(0)
  const [spacingUnit, setSpacingUnit] = useState('mm')
  const [marginTop, setMarginTop] = useState(0)
  const [marginBottom, setMarginBottom] = useState(0)
  const [marginLeft, setMarginLeft] = useState(0)
  const [marginRight, setMarginRight] = useState(0)

  const [labelCanvas, setLabelCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isRenderingLabel, setIsRenderingLabel] = useState(false)
  const [isRenderingPreview, setIsRenderingPreview] = useState(false)

  const paperSize = useMemo(() => {
    let selectedSize: { width: number; height: number; unit: string }
    if (paperSizeId === 'Artboard') {
      selectedSize = {
        width: currentTemplate?.label_width || 1,
        height: currentTemplate?.label_height || 1,
        unit: currentTemplate?.unit || 'mm',
      }
    } else if (paperSizeId === 'Custom') {
      selectedSize = { width: customPaperWidth, height: customPaperHeight, unit: customPaperUnit }
    } else {
      selectedSize = PAPER_SIZES[paperSizeId]
    }

    const shortEdge = Math.min(selectedSize.width, selectedSize.height)
    const longEdge = Math.max(selectedSize.width, selectedSize.height)
    return pageLayout === 'landscape'
      ? { ...selectedSize, width: longEdge, height: shortEdge }
      : { ...selectedSize, width: shortEdge, height: longEdge }
  }, [paperSizeId, customPaperWidth, customPaperHeight, customPaperUnit, currentTemplate, pageLayout])

  const labelSize = useMemo(
    () => ({
      width: currentTemplate?.label_width || 0,
      height: currentTemplate?.label_height || 0,
      unit: currentTemplate?.unit || 'mm',
    }),
    [currentTemplate],
  )

  const selectedPrinterDetails = useMemo(
    () => printers.find((printer) => printer.id === selectedPrinter),
    [printers, selectedPrinter],
  )

  const loadPrinters = async () => {
    try {
      const settings = await window.electronAPI?.settings.getAll() || {}
      const data = (await window.electronAPI?.printers.list()) || []
      setPrinters(data)
      const preferred = data.find((printer: Printer) =>
        printer.driver_name === settings.default_printer_name || printer.name === settings.default_printer_name
      )
      if (data.length > 0) setSelectedPrinter((current) => current || preferred?.id || data[0].id)
      const method = settings.print_method === 'driver' ? 'pdf' : settings.print_method
      if (['pdf', 'zpl', 'epl', 'tspl'].includes(method)) {
        setPrinterLanguage(method as 'pdf' | 'zpl' | 'epl' | 'tspl')
      }
    } catch (error: any) {
      setStatusMessage(`Could not load printers: ${error.message}`)
    }
  }

  useEffect(() => {
    if (id) {
      loadTemplate(id)
      loadVersions(id)
      loadPrinters()
    }
    return () => clearObjects()
  }, [id])

  useEffect(() => {
    if (!currentTemplate) return
    setPageLayout(currentTemplate.label_width > currentTemplate.label_height ? 'landscape' : 'portrait')
    setCanvasSize(
      toScreenPx(currentTemplate.label_width, currentTemplate.unit),
      toScreenPx(currentTemplate.label_height, currentTemplate.unit),
    )
    const currentVersion =
      versions.find((version) => version.id === currentTemplate.current_version_id) || versions[0]
    if (!currentVersion) return
    try {
      const canvas = JSON.parse(currentVersion.template_json)
      if (canvas.objects) loadObjects(canvas.objects)
    } catch (error: any) {
      setStatusMessage(`Could not load preview data: ${error.message}`)
    }
  }, [currentTemplate, versions])

  useEffect(() => {
    if (!currentTemplate) return
    let canceled = false
    setIsRenderingLabel(true)
    renderToCanvas(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
      .then((canvas) => {
        if (!canceled) setLabelCanvas(canvas)
      })
      .catch((error: any) => {
        if (!canceled) setStatusMessage(`Could not render label: ${error.message}`)
      })
      .finally(() => {
        if (!canceled) setIsRenderingLabel(false)
      })
    return () => {
      canceled = true
    }
  }, [objects, currentTemplate])

  useEffect(() => {
    if (!labelCanvas || !currentTemplate || !previewCanvasRef.current) return
    let canceled = false
    setIsRenderingPreview(true)
    composePageOntoCanvas(
      previewCanvasRef.current,
      labelCanvas,
      paperSize,
      labelSize,
      labelsPerPage,
      placement,
      applyBorder,
      96,
      gapX,
      gapY,
      spacingUnit,
      { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
    )
      .then(() => {
        if (!canceled) setIsRenderingPreview(false)
      })
      .catch((error: any) => {
        if (!canceled) setStatusMessage(`Could not render preview: ${error.message}`)
        if (!canceled) setIsRenderingPreview(false)
      })
    return () => {
      canceled = true
    }
  }, [
    labelCanvas,
    paperSize,
    labelSize,
    labelsPerPage,
    placement,
    applyBorder,
    gapX,
    gapY,
    spacingUnit,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    currentTemplate,
  ])

  const margins = useMemo(
    () => ({ top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }),
    [marginTop, marginBottom, marginLeft, marginRight],
  )

  const labelPositions = useMemo(() => {
    const pageWidthPx = toScreenPx(paperSize.width, paperSize.unit)
    const pageHeightPx = toScreenPx(paperSize.height, paperSize.unit)
    const labelWidthPx = toScreenPx(labelSize.width, labelSize.unit)
    const labelHeightPx = toScreenPx(labelSize.height, labelSize.unit)
    const gapXPx = toScreenPx(gapX, spacingUnit)
    const gapYPx = toScreenPx(gapY, spacingUnit)
    const marginsPx = {
      top: toScreenPx(margins.top, spacingUnit),
      bottom: toScreenPx(margins.bottom, spacingUnit),
      left: toScreenPx(margins.left, spacingUnit),
      right: toScreenPx(margins.right, spacingUnit),
    }
    if (labelsPerPage === '1') {
      return [getSingleLabelPositionPx(placement, pageWidthPx, pageHeightPx, labelWidthPx, labelHeightPx, marginsPx)]
    }
    return getGridLabelPositionsPx(
      labelsPerPage,
      pageWidthPx,
      pageHeightPx,
      labelWidthPx,
      labelHeightPx,
      gapXPx,
      gapYPx,
      marginsPx,
    )
  }, [labelsPerPage, placement, paperSize, labelSize, gapX, gapY, spacingUnit, margins])

  const visibleObjects = useMemo(() => objects.filter((object) => object.visible), [objects])

  const fitPreviewToPane = () => {
    if (!previewWrapRef.current || !paperSize.width || !paperSize.height) return
    const rect = previewWrapRef.current.getBoundingClientRect()
    const pageScreenWidth = toScreenPx(paperSize.width, paperSize.unit)
    const pageScreenHeight = toScreenPx(paperSize.height, paperSize.unit)
    const availableWidth = Math.max(240, rect.width - 96)
    const availableHeight = Math.max(240, rect.height - 96)
    const nextZoom = Math.min(availableWidth / (pageScreenWidth + 40), availableHeight / (pageScreenHeight + 40), 2)
    setZoom(Math.max(0.1, Number(nextZoom.toFixed(2))))
  }

  useEffect(() => {
    const frame = requestAnimationFrame(fitPreviewToPane)
    return () => cancelAnimationFrame(frame)
  }, [paperSize.width, paperSize.height, paperSize.unit])

  const handleDetectPrinters = async () => {
    setIsDiscovering(true)
    setStatusMessage('Detecting printers...')
    try {
      const detected = (await window.electronAPI?.printers.discover()) || []
      for (const printer of detected) {
        await window.electronAPI?.printers.registerDiscovered(printer)
      }
      await loadPrinters()
      setStatusMessage(
        detected.length
          ? `Detected ${detected.length} printer${detected.length === 1 ? '' : 's'}.`
          : 'No new printers were detected.',
      )
    } catch (error: any) {
      setStatusMessage(`Printer detection failed: ${error.message}`)
    } finally {
      setIsDiscovering(false)
    }
  }

  const handlePrint = async () => {
    if (!currentTemplate) return
    if (!selectedPrinter) {
      setStatusMessage('Select a printer before printing.')
      return
    }

    const safeCopies = clampCopies(copies)
    setCopies(safeCopies)
    setIsPrinting(true)
    setStatusMessage('Sending print job...')
    try {
      let result
      if (printerLanguage === 'pdf') {
        if (!labelCanvas) throw new Error('Preview is not ready yet.')
        const printLabelCanvas = await renderToCanvas(
          objects,
          currentTemplate.label_width,
          currentTemplate.label_height,
          currentTemplate.dpi,
          currentTemplate.unit,
        )
        const dataUrl = await renderComposedPage(
          printLabelCanvas,
          paperSize,
          labelSize,
          labelsPerPage,
          placement,
          applyBorder,
          currentTemplate.dpi,
          gapX,
          gapY,
          spacingUnit,
          margins,
        )
        result = await window.electronAPI?.app.printImage({
          dataUrl,
          printerName: selectedPrinterDetails?.driver_name || selectedPrinterDetails?.name,
          copies: safeCopies,
          width: paperSize.width,
          height: paperSize.height,
          unit: paperSize.unit,
        })
      } else {
        result = await window.electronAPI?.printJobs.create({
          template_id: currentTemplate.id,
          template_version_id: currentTemplate.current_version_id || versions[0]?.id,
          printer_id: selectedPrinter,
          requested_by: 'current_user',
          copies: safeCopies,
          printer_language: printerLanguage,
        })
      }
      if (result?.success === false) throw new Error(result.error || 'Print failed')
      setStatusMessage('Print job sent successfully.')
    } catch (error: any) {
      setStatusMessage(`Print failed: ${error.message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  const paperSizeOptions = useMemo(() => [
    {
      value: 'Artboard',
      label: currentTemplate
        ? `Artboard (${currentTemplate.label_width} x ${currentTemplate.label_height} ${currentTemplate.unit})`
        : 'Artboard size',
    },
    ...Object.entries(PAPER_SIZES).map(([value, item]) => ({ value: value as PaperSizeId, label: item.label })),
  ], [currentTemplate])

  if (!currentTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-[var(--text-secondary)]">Loading template...</div>
      </div>
    )
  }

  const labelSizeText = `${currentTemplate.label_width}${currentTemplate.unit} x ${currentTemplate.label_height}${currentTemplate.unit}`
  const pageScreenWidth = toScreenPx(paperSize.width, paperSize.unit)
  const pageScreenHeight = toScreenPx(paperSize.height, paperSize.unit)

  const labelCount = labelPositions.length
  const totalLabels = labelCount * clampCopies(copies)

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-slate-200">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div ref={previewWrapRef} className="h-full min-h-0 overflow-auto px-12 py-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="relative" style={{ width: pageScreenWidth * zoom, height: pageScreenHeight * zoom }}>
              <canvas
                ref={previewCanvasRef}
                className="block bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/20"
                style={{
                  width: pageScreenWidth,
                  height: pageScreenHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              />
              {(isRenderingLabel || isRenderingPreview || !labelCanvas) && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                  {isRenderingLabel || isRenderingPreview ? 'Rendering preview...' : 'Could not render preview'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex w-[420px] min-w-[420px] flex-col border-l border-slate-200 bg-white text-slate-950 shadow-[-8px_0_18px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between px-7 py-6">
          <h1 className="text-base font-semibold">Print</h1>
          <div className="text-sm font-semibold text-slate-600">{totalLabels} label{totalLabels === 1 ? '' : 's'} total</div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6">
          <section className="space-y-5">
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <label className="text-sm font-semibold text-slate-600">Destination</label>
              <div>
                {printers.length === 0 ? (
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No registered printers
                  </div>
                ) : (
                  <select
                    value={selectedPrinter}
                    onChange={(event) => setSelectedPrinter(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {printers.map((printer) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <label className="text-sm font-semibold text-slate-600">Copies</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={copies}
                onChange={(event) => setCopies(clampCopies(Number(event.target.value)))}
                className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <label className="text-sm font-semibold text-slate-600">Layout</label>
              <select
                value={pageLayout}
                onChange={(event) => setPageLayout(event.target.value as PageLayout)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <label className="text-sm font-semibold text-slate-600">Colour</label>
              <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option>Colour</option>
                <option>Black and white</option>
              </select>
            </div>
          </section>

          <section className="mt-7 border-t border-slate-200 pt-5">
            <button className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-700">
              <span>More settings</span>
              <span className="text-lg leading-none">⌄</span>
            </button>
            <div className="mt-4 space-y-6">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Paper & Label</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <label className="text-sm font-semibold text-slate-600">Paper size</label>
                    <SearchableSelect
                      value={paperSizeId}
                      options={paperSizeOptions}
                      placeholder="Select paper size"
                      searchPlaceholder="Search paper or label sizes..."
                      onChange={(value) => setPaperSizeId(value as PaperSizeId)}
                    />
                  </div>

                  {paperSizeId === 'Custom' && (
                    <>
                      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Width</label>
                        <input
                          type="number"
                          min={1}
                          value={customPaperWidth}
                          onChange={(event) => setCustomPaperWidth(Math.max(1, Number(event.target.value) || 1))}
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Height</label>
                        <input
                          type="number"
                          min={1}
                          value={customPaperHeight}
                          onChange={(event) => setCustomPaperHeight(Math.max(1, Number(event.target.value) || 1))}
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Unit</label>
                        <CustomDropdown
                          value={customPaperUnit}
                          options={[
                            { value: 'mm', label: 'mm' },
                            { value: 'cm', label: 'cm' },
                            { value: 'in', label: 'in' },
                          ]}
                          onChange={(value) => setCustomPaperUnit(value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4">
                    <label className="text-sm font-semibold text-slate-600">Label size</label>
                    <div className="space-y-1 text-sm text-slate-700">
                      <div>{labelSizeText}</div>
                      <div>{currentTemplate.dpi} DPI</div>
                      <div>{visibleObjects.length} visible item{visibleObjects.length === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Layout</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <label className="text-sm font-semibold text-slate-600">Labels per page</label>
                    <CustomDropdown
                      value={labelsPerPage}
                      options={LABELS_PER_PAGE_OPTIONS}
                      onChange={(value) => setLabelsPerPage(value)}
                    />
                  </div>

                  {labelsPerPage === '1' && (
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                      <label className="text-sm font-semibold text-slate-600">Placement</label>
                      <CustomDropdown
                        value={placement}
                        options={PLACEMENT_OPTIONS}
                        onChange={(value) => setPlacement(value)}
                      />
                    </div>
                  )}

                  {labelsPerPage !== '1' && (
                    <>
                      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Horizontal gap</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={gapX}
                            onChange={(event) => setGapX(Math.max(0, Number(event.target.value) || 0))}
                            className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <span className="text-sm text-slate-600">{spacingUnit}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                        <label className="text-sm font-semibold text-slate-600">Vertical gap</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={gapY}
                            onChange={(event) => setGapY(Math.max(0, Number(event.target.value) || 0))}
                            className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                          <span className="text-sm text-slate-600">{spacingUnit}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Margins</h3>
                  <select
                    value={spacingUnit}
                    onChange={(event) => setSpacingUnit(event.target.value)}
                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                    <option value="px">px</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Top</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={marginTop}
                        onChange={(event) => setMarginTop(Math.max(0, Number(event.target.value) || 0))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="text-sm text-slate-600">{spacingUnit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Bottom</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={marginBottom}
                        onChange={(event) => setMarginBottom(Math.max(0, Number(event.target.value) || 0))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="text-sm text-slate-600">{spacingUnit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Left</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={marginLeft}
                        onChange={(event) => setMarginLeft(Math.max(0, Number(event.target.value) || 0))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="text-sm text-slate-600">{spacingUnit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Right</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={marginRight}
                        onChange={(event) => setMarginRight(Math.max(0, Number(event.target.value) || 0))}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="text-sm text-slate-600">{spacingUnit}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Appearance</h3>
                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                  <label className="text-sm font-semibold text-slate-600">Border</label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyBorder}
                      onChange={(event) => setApplyBorder(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Apply border around labels</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-800">Print Options</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <label className="text-sm font-semibold text-slate-600">Scale</label>
                    <select
                      value={Math.round(zoom * 100)}
                      onChange={(event) => setZoom(Number(event.target.value) / 100)}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value={25}>25%</option>
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100%</option>
                      <option value={150}>150%</option>
                      <option value={200}>200%</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                    <label className="text-sm font-semibold text-slate-600">Format</label>
                    <select
                      value={printerLanguage}
                      onChange={(event) => setPrinterLanguage(event.target.value as any)}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="pdf">Auto / PDF</option>
                      <option value="zpl">ZPL</option>
                      <option value="epl">EPL</option>
                      <option value="tspl">TSPL</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 text-sm">
                <div className="font-semibold text-slate-600">Details</div>
                <div className="space-y-1 text-slate-600">
                  <div>{selectedPrinterDetails?.status || 'No printer selected'}</div>
                </div>
              </div>

              <button
                onClick={handleDetectPrinters}
                disabled={isDiscovering}
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isDiscovering ? 'Detecting...' : 'Detect Printers'}
              </button>
            </div>
          </section>

          {statusMessage && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-blue-500 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting || !selectedPrinter || isRenderingLabel || !labelCanvas}
            className="rounded-full border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPrinting ? 'Sending...' : 'Print'}
          </button>
        </div>
      </aside>
    </div>
  )
}
