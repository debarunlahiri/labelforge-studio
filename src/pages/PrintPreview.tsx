import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Group, Layer, Line, Rect, Stage } from 'react-konva'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import { renderToJPEG, renderToPDF, renderToPNG } from '../utils/labelRenderer'
import type { BarcodeObject, ImageObject, LabelObject, LineObject as LineObjType, Printer, QRCodeObject, ShapeObject, TextObject } from '../types'
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

function unitToPx(value: number, unit = 'mm', dpi = 300): number {
  const factor = UNIT_TO_PX[unit] || UNIT_TO_PX.mm
  return value * factor * (dpi / 300)
}

function clampCopies(value: number): number {
  return Math.max(1, Math.min(9999, Number(value) || 1))
}

function getLineVisualHeight(line: LineObjType): number {
  return Math.max(12, line.lineThickness || 1)
}

export default function PrintPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTemplate, loadTemplate, versions, loadVersions } = useTemplateStore()
  const { objects, loadObjects, clearObjects, zoom, setZoom, canvasWidth, canvasHeight, setCanvasSize } = useDesignerStore()

  const previewWrapRef = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [printers, setPrinters] = useState<Printer[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [printerLanguage, setPrinterLanguage] = useState<'pdf' | 'zpl' | 'epl' | 'tspl'>('pdf')
  const [statusMessage, setStatusMessage] = useState('')

  const visibleObjects = useMemo(() => objects.filter((object) => object.visible), [objects])
  const selectedPrinterDetails = useMemo(
    () => printers.find((printer) => printer.id === selectedPrinter),
    [printers, selectedPrinter],
  )

  const loadPrinters = async () => {
    try {
      const data = await window.electronAPI?.printers.list() || []
      setPrinters(data)
      if (data.length > 0) setSelectedPrinter((current) => current || data[0].id)
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
    setCanvasSize(
      unitToPx(currentTemplate.label_width, currentTemplate.unit, currentTemplate.dpi),
      unitToPx(currentTemplate.label_height, currentTemplate.unit, currentTemplate.dpi),
    )
    const currentVersion = versions.find((version) => version.id === currentTemplate.current_version_id) || versions[0]
    if (!currentVersion) return
    try {
      const canvas = JSON.parse(currentVersion.template_json)
      if (canvas.objects) loadObjects(canvas.objects)
    } catch (error: any) {
      setStatusMessage(`Could not load preview data: ${error.message}`)
    }
  }, [currentTemplate, versions])

  const fitPreviewToPane = () => {
    if (!previewWrapRef.current || !canvasWidth || !canvasHeight) return
    const rect = previewWrapRef.current.getBoundingClientRect()
    const availableWidth = Math.max(240, rect.width - 96)
    const availableHeight = Math.max(240, rect.height - 96)
    const nextZoom = Math.min(availableWidth / (canvasWidth + 40), availableHeight / (canvasHeight + 40), 2)
    setZoom(Math.max(0.1, Number(nextZoom.toFixed(2))))
  }

  useEffect(() => {
    const frame = requestAnimationFrame(fitPreviewToPane)
    return () => cancelAnimationFrame(frame)
  }, [canvasWidth, canvasHeight])

  const handleDetectPrinters = async () => {
    setIsDiscovering(true)
    setStatusMessage('Detecting printers...')
    try {
      const detected = await window.electronAPI?.printers.discover() || []
      for (const printer of detected) {
        await window.electronAPI?.printers.registerDiscovered(printer)
      }
      await loadPrinters()
      setStatusMessage(detected.length ? `Detected ${detected.length} printer${detected.length === 1 ? '' : 's'}.` : 'No new printers were detected.')
    } catch (error: any) {
      setStatusMessage(`Printer detection failed: ${error.message}`)
    } finally {
      setIsDiscovering(false)
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = () => reject(reader.error || new Error('Could not read exported file data.'))
      reader.readAsDataURL(blob)
    })
  }

  const saveBase64File = async (base64Content: string, filename: string, extension: string, mimeType: string) => {
    const result = await window.electronAPI?.app.saveFile({
      title: `Save ${extension.replace('.', '').toUpperCase()}`,
      defaultPath: filename,
      filters: [{ name: `${extension.replace('.', '').toUpperCase()} files`, extensions: [extension.replace('.', '')] }],
      extension,
      showDialog: true,
      base64Content,
      mimeType,
    })
    if (result?.success === false) {
      if (result.canceled) return null
      throw new Error(result.error || 'Could not save the file.')
    }
    return result?.filePath || filename
  }

  const handleExportPNG = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    setStatusMessage('Exporting PNG...')
    try {
      const dataUrl = await renderToPNG(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
      const filePath = await saveBase64File(dataUrl.split(',')[1] || '', `${currentTemplate.name || 'label'}.png`, '.png', 'image/png')
      setStatusMessage(filePath ? `PNG saved to ${filePath}.` : 'PNG export cancelled.')
    } catch (error: any) {
      setStatusMessage(`PNG export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJPEG = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    setStatusMessage('Exporting JPEG...')
    try {
      const dataUrl = await renderToJPEG(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
      const filePath = await saveBase64File(dataUrl.split(',')[1] || '', `${currentTemplate.name || 'label'}.jpg`, '.jpg', 'image/jpeg')
      setStatusMessage(filePath ? `JPEG saved to ${filePath}.` : 'JPEG export cancelled.')
    } catch (error: any) {
      setStatusMessage(`JPEG export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    setStatusMessage('Exporting PDF...')
    try {
      const blob = await renderToPDF(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit, currentTemplate.name || 'label')
      const filePath = await saveBase64File(await blobToBase64(blob), `${currentTemplate.name || 'label'}.pdf`, '.pdf', 'application/pdf')
      setStatusMessage(filePath ? `PDF saved to ${filePath}.` : 'PDF export cancelled.')
    } catch (error: any) {
      setStatusMessage(`PDF export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportLabelForge = async () => {
    if (!currentTemplate) return
    setIsExporting(true)
    setStatusMessage('Exporting LabelForge Studio file...')
    try {
      const currentVersion = versions.find((version) => version.id === currentTemplate.current_version_id) || versions[0]
      const canvas = currentVersion?.template_json ? JSON.parse(currentVersion.template_json) : {
        width: canvasWidth,
        height: canvasHeight,
        unit: currentTemplate.unit,
        dpi: currentTemplate.dpi,
        objects,
        dataSources: [],
        printSettings: { copies: 1, printerLanguage: 'pdf' },
      }
      const exportData = {
        format: 'labelforge-template',
        formatVersion: 1,
        savedAt: new Date().toISOString(),
        template: currentTemplate,
        canvas,
      }
      const result = await window.electronAPI?.app.saveFile({
        title: 'Save LabelForge Studio File',
        defaultPath: `${currentTemplate.name || 'label'}.lfx`,
        filters: [
          { name: 'LabelForge Studio', extensions: ['lfx'] },
          { name: 'JSON Document', extensions: ['json'] },
        ],
        extension: '.lfx',
        showDialog: true,
        content: JSON.stringify(exportData, null, 2),
      })
      if (result?.success === false && !result.canceled) {
        throw new Error(result.error || 'Could not save the file.')
      }
      setStatusMessage(result?.canceled ? 'LabelForge Studio export cancelled.' : `LabelForge Studio file saved to ${result?.filePath}.`)
    } catch (error: any) {
      setStatusMessage(`LabelForge Studio export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
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
        const dataUrl = await renderToPNG(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
        result = await window.electronAPI?.app.printImage({
          dataUrl,
          printerName: selectedPrinterDetails?.driver_name || selectedPrinterDetails?.name,
          copies: safeCopies,
          width: currentTemplate.label_width,
          height: currentTemplate.label_height,
          unit: currentTemplate.unit,
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

  const renderObject = (obj: LabelObject) => {
    switch (obj.type) {
      case 'text':
        return <RichTextRenderer key={obj.id} object={obj as TextObject} />
      case 'barcode': {
        const barcode = obj as BarcodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            value={barcode.value}
            barcodeType={barcode.barcodeType}
            width={obj.width}
            height={obj.height}
            options={{
              showHumanReadable: barcode.showHumanReadable,
              moduleWidth: barcode.moduleWidth,
              barcodeHeight: barcode.barcodeHeight,
              quietZone: barcode.quietZone,
              foregroundColor: barcode.foregroundColor,
              backgroundColor: barcode.backgroundColor,
            }}
          />
        )
      }
      case 'qrcode': {
        const qr = obj as QRCodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            value={qr.value}
            barcodeType={qr.barcodeType || 'QRCode'}
            width={obj.width}
            height={obj.height}
            options={{
              errorCorrectionLevel: qr.errorCorrectionLevel,
              quietZone: qr.quietZone,
              foregroundColor: qr.foregroundColor,
              backgroundColor: qr.backgroundColor,
            }}
          />
        )
      }
      case 'shape': {
        const shape = obj as ShapeObject
        return <ShapeRenderer key={obj.id} object={shape} stroke={shape.borderColor} strokeWidth={shape.borderWidth} />
      }
      case 'line': {
        const line = obj as LineObjType
        const lineHeight = getLineVisualHeight(line)
        return (
          <Group key={obj.id} x={obj.x + obj.width / 2} y={obj.y + lineHeight / 2} rotation={obj.rotation}>
            <Line points={[-obj.width / 2, 0, obj.width / 2, 0]} stroke={line.lineColor} strokeWidth={line.lineThickness} />
          </Group>
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
        return <Rect key={obj.id} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill="#E0E0E0" stroke="#999" strokeWidth={1} />
    }
  }

  if (!currentTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-[var(--text-secondary)]">Loading template...</div>
      </div>
    )
  }

  const labelSizeText = `${currentTemplate.label_width}${currentTemplate.unit} x ${currentTemplate.label_height}${currentTemplate.unit}`

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-slate-200">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div ref={previewWrapRef} className="h-full min-h-0 overflow-auto px-12 py-4">
          <div className="flex min-h-full justify-center">
            <div className="bg-white p-10 shadow-[0_2px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/20">
              <Stage width={canvasWidth * zoom + 40} height={canvasHeight * zoom + 40} scale={{ x: zoom, y: zoom }}>
                <Layer offsetX={-20} offsetY={-20}>
                  <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="white" />
                  {visibleObjects.map(renderObject)}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>

      <aside className="flex w-[420px] min-w-[420px] flex-col border-l border-slate-200 bg-white text-slate-950 shadow-[-8px_0_18px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between px-7 py-6">
          <h1 className="text-base font-semibold">Print</h1>
          <div className="text-sm font-semibold text-slate-600">1 sheet of paper</div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6">
          <section className="space-y-5">
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <label className="text-sm font-semibold text-slate-600">Destination</label>
              <div>
                {printers.length === 0 ? (
                  <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">No registered printers</div>
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
              <label className="text-sm font-semibold text-slate-600">Pages</label>
              <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option>All</option>
              </select>
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
              <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option>Portrait</option>
                <option>Landscape</option>
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
            <div className="mt-4 space-y-5">
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

              <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-4 text-sm">
                <div className="font-semibold text-slate-600">Details</div>
                <div className="space-y-1 text-slate-600">
                  <div>{labelSizeText}</div>
                  <div>{currentTemplate.dpi} DPI</div>
                  <div>{visibleObjects.length} visible item{visibleObjects.length === 1 ? '' : 's'}</div>
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

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExportLabelForge} disabled={isExporting} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">LabelForge</button>
                <button onClick={handleExportPDF} disabled={isExporting} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">PDF</button>
                <button onClick={handleExportJPEG} disabled={isExporting} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">JPEG</button>
                <button onClick={handleExportPNG} disabled={isExporting} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">PNG</button>
              </div>
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
            disabled={isPrinting || !selectedPrinter}
            className="rounded-full border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPrinting ? 'Sending...' : 'Print'}
          </button>
        </div>
      </aside>
    </div>
  )
}
