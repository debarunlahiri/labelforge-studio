import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import { renderToPNG, renderToPDF, renderToZPL, renderToEPL, renderToTSPL } from '../utils/labelRenderer'
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject, LineObject as LineObjType, ImageObject } from '../types'
import SearchableSelect from '../components/SearchableSelect'
import BarcodeRenderer from '../designer/BarcodeRenderer'
import ImageRenderer from '../designer/ImageRenderer'
import ShapeRenderer from '../designer/ShapeRenderer'
import RichTextRenderer from '../designer/RichTextRenderer'

const UNIT_TO_PX: Record<string, number> = {
  mm: 3.78,
  cm: 37.8,
  in: 96,
  px: 1,
  pt: 1.33,
}

function mmToPx(mm: number, unit: string = 'mm', dpi: number = 300): number {
  const factor = UNIT_TO_PX[unit] || 3.78
  return mm * factor * (dpi / 300)
}

export default function PrintPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTemplate, loadTemplate, versions, loadVersions } = useTemplateStore()
  const { objects, loadObjects, clearObjects, zoom, setZoom, canvasWidth, canvasHeight, setCanvasSize } = useDesignerStore()

  const [copies, setCopies] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printers, setPrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [printerLanguage, setPrinterLanguage] = useState<'pdf' | 'zpl' | 'epl' | 'tspl'>('pdf')

  useEffect(() => {
    if (id) {
      loadTemplate(id)
      loadVersions(id)
      loadPrinters()
    }
    return () => {
      clearObjects()
    }
  }, [id])

  const loadPrinters = async () => {
    try {
      const data = await window.electronAPI?.printers.list() || []
      setPrinters(data)
      if (data.length > 0) setSelectedPrinter((current) => current || data[0].id)
    } catch {}
  }

  useEffect(() => {
    if (currentTemplate && id) {
      setCanvasSize(
        mmToPx(currentTemplate.label_width, currentTemplate.unit, currentTemplate.dpi),
        mmToPx(currentTemplate.label_height, currentTemplate.unit, currentTemplate.dpi)
      )
      const currentVersion = versions.find(v => v.id === currentTemplate.current_version_id) || versions[0]
      if (currentVersion) {
        try {
          const canvas = JSON.parse(currentVersion.template_json)
          if (canvas.objects) {
            loadObjects(canvas.objects)
          }
        } catch {}
      }
    }
  }, [currentTemplate])

  const handleExportPNG = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    try {
      const dataUrl = await renderToPNG(
        objects,
        currentTemplate.label_width,
        currentTemplate.label_height,
        currentTemplate.dpi,
        currentTemplate.unit
      )
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${currentTemplate.name || 'label'}.png`
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    try {
      const blob = await renderToPDF(
        objects,
        currentTemplate.label_width,
        currentTemplate.label_height,
        currentTemplate.dpi,
        currentTemplate.unit,
        currentTemplate.name || 'label'
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentTemplate.name || 'label'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPrinterLanguage = () => {
    if (!currentTemplate) return
    let content = ''
    let extension = 'txt'

    switch (printerLanguage) {
      case 'zpl':
        content = renderToZPL(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.unit)
        extension = 'zpl'
        break
      case 'epl':
        content = renderToEPL(objects, currentTemplate.label_width, currentTemplate.label_height)
        extension = 'epl'
        break
      case 'tspl':
        content = renderToTSPL(objects, currentTemplate.label_width, currentTemplate.label_height)
        extension = 'tspl'
        break
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentTemplate.name || 'label'}.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = async () => {
    if (!currentTemplate || !selectedPrinter) return
    setIsPrinting(true)
    try {
      const result = await window.electronAPI?.printJobs.create({
        template_id: currentTemplate.id,
        template_version_id: currentTemplate.current_version_id || versions[0]?.id,
        printer_id: selectedPrinter,
        requested_by: 'current_user',
        copies,
        printer_language: printerLanguage === 'pdf' ? undefined : printerLanguage,
      })
      if (result?.success === false) throw new Error(result.error || 'Print failed')
      alert('Print job sent successfully.')
    } catch (error: any) {
      alert(`Print failed: ${error.message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  const renderObject = (obj: LabelObject) => {
    switch (obj.type) {
      case 'text': {
        const textObj = obj as TextObject
        return <RichTextRenderer key={obj.id} object={textObj} />
      }
      case 'barcode': {
        const bcObj = obj as BarcodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            value={bcObj.value}
            barcodeType={bcObj.barcodeType}
            width={obj.width}
            height={obj.height}
            options={{
              showHumanReadable: bcObj.showHumanReadable,
              moduleWidth: bcObj.moduleWidth,
              barcodeHeight: bcObj.barcodeHeight,
              quietZone: bcObj.quietZone,
              foregroundColor: bcObj.foregroundColor,
              backgroundColor: bcObj.backgroundColor,
            }}
          />
        )
      }
      case 'qrcode': {
        const qrObj = obj as QRCodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            value={qrObj.value}
            barcodeType={qrObj.barcodeType || 'QRCode'}
            width={obj.width}
            height={obj.height}
            options={{
              errorCorrectionLevel: qrObj.errorCorrectionLevel,
              quietZone: qrObj.quietZone,
              foregroundColor: qrObj.foregroundColor,
              backgroundColor: qrObj.backgroundColor,
            }}
          />
        )
      }
      case 'shape': {
        const shapeObj = obj as ShapeObject
        return <ShapeRenderer key={obj.id} object={shapeObj} stroke={shapeObj.borderColor} strokeWidth={shapeObj.borderWidth} />
      }
      case 'line': {
        const lineObj = obj as LineObjType
        return (
          <Line
            key={obj.id}
            points={[obj.x, obj.y, obj.x + lineObj.endX, obj.y + lineObj.endY]}
            stroke={lineObj.lineColor}
            strokeWidth={lineObj.lineThickness}
          />
        )
      }
      case 'image': {
        const image = obj as ImageObject
        return (
          <ImageRenderer
            key={obj.id}
            source={image.source}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            rotation={obj.rotation}
            opacity={obj.opacity}
            maintainAspectRatio={image.maintainAspectRatio}
            fitMode={image.fitMode}
            cropX={image.cropX}
            cropY={image.cropY}
            flipHorizontal={image.flipHorizontal}
            flipVertical={image.flipVertical}
          />
        )
      }
      default:
        return (
          <Rect
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill="#E0E0E0"
            stroke="#999"
            strokeWidth={1}
          />
        )
    }
  }

  if (!currentTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-[var(--text-secondary)]">Loading template...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
            Back
          </button>
          <h1 className="text-lg font-semibold">{currentTemplate.name} - Print Preview</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Copies:</label>
            <input
              type="number"
              min={1}
              max={9999}
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Zoom:</label>
            <select
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Printer:</label>
            <SearchableSelect
              value={selectedPrinter}
              onChange={setSelectedPrinter}
              placeholder="Select printer..."
              searchPlaceholder="Search printers..."
              className="w-56"
              options={printers.map((printer: any) => ({
                value: printer.id,
                label: printer.name,
                description: `${printer.printer_type || 'Unknown'} · ${printer.connection_type || 'driver'}`,
              }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Language:</label>
            <select
              value={printerLanguage}
              onChange={(e) => setPrinterLanguage(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="zpl">ZPL</option>
              <option value="epl">EPL</option>
              <option value="tspl">TSPL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="flex items-center justify-center min-h-full">
          <div className="bg-white shadow-lg" style={{ padding: '20px' }}>
            <Stage width={canvasWidth * zoom + 40} height={canvasHeight * zoom + 40} scale={{ x: zoom, y: zoom }}>
              <Layer offsetX={-20} offsetY={-20}>
                <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="white" />
                {objects.filter(o => o.visible).map(renderObject)}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-color)] bg-white px-4 py-3">
        <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>{currentTemplate.label_width}{currentTemplate.unit} x {currentTemplate.label_height}{currentTemplate.unit}</span>
          <span>{currentTemplate.dpi} DPI</span>
          <span>{objects.length} {objects.length === 1 ? 'item' : 'items'}</span>
          <span>{copies} cop{copies === 1 ? 'y' : 'ies'}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting || !selectedPrinter}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
          <button
            onClick={handleExportPrinterLanguage}
            disabled={isExporting || printerLanguage === 'pdf'}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : `Export ${printerLanguage.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
