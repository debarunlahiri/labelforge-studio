import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject, LineObject as LineObjType, DataSourceConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'
import PropertiesPanel from '../designer/PropertiesPanel'
import LayersPanel from '../designer/LayersPanel'
import Toolbar from '../designer/Toolbar'
import DataSourcePanel from '../designer/DataSourcePanel'

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

export default function TemplateDesigner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentTemplate, loadTemplate, createTemplate, updateTemplate, saveVersion, loadVersions, versions } = useTemplateStore()
  const {
    objects, selectedObjectId, zoom, showGrid, snapToGrid, gridSize,
    addObject, updateObject, deleteObject, selectObject, setZoom, toggleGrid, toggleSnap,
    clearObjects, loadObjects, canvasWidth, canvasHeight, setCanvasSize,
  } = useDesignerStore()

  const [showNewWizard, setShowNewWizard] = useState(!id)
  const [wizardData, setWizardData] = useState({
    name: '',
    description: '',
    label_width: 100,
    label_height: 50,
    unit: 'mm',
    dpi: 300,
    printer_type: '',
    page_orientation: 'portrait',
    rows: 1,
    columns: 1,
    margin_top: 0,
    margin_bottom: 0,
    margin_left: 0,
    margin_right: 0,
    gap_horizontal: 0,
    gap_vertical: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showDataSource, setShowDataSource] = useState(false)
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([])
  const stageRef = useRef<any>(null)

  useEffect(() => {
    if (id) {
      loadTemplate(id)
      loadVersions(id)
    }
  }, [id])

  useEffect(() => {
    if (currentTemplate && id) {
      setCanvasSize(
        mmToPx(currentTemplate.label_width, currentTemplate.unit, currentTemplate.dpi),
        mmToPx(currentTemplate.label_height, currentTemplate.unit, currentTemplate.dpi)
      )
      const currentVersion = versions.find(v => v.id === currentTemplate.current_version_id)
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

  useEffect(() => {
    if (!id && currentTemplate) {
      navigate(`/templates/${currentTemplate.id}/edit`, { replace: true })
      setShowNewWizard(false)
    }
  }, [currentTemplate])

  const handleCreateTemplate = async () => {
    if (!wizardData.name.trim()) return
    const result = await createTemplate({
      name: wizardData.name,
      description: wizardData.description,
      label_width: wizardData.label_width,
      label_height: wizardData.label_height,
      unit: wizardData.unit,
      dpi: wizardData.dpi,
      printer_type: wizardData.printer_type || undefined,
    })
    if (result) {
      setCanvasSize(
        mmToPx(wizardData.label_width, wizardData.unit, wizardData.dpi),
        mmToPx(wizardData.label_height, wizardData.unit, wizardData.dpi)
      )
      setShowNewWizard(false)
    }
  }

  const handleSave = async () => {
    if (!currentTemplate) return
    setIsSaving(true)
    try {
      const canvasData = {
        width: canvasWidth,
        height: canvasHeight,
        unit: currentTemplate.unit,
        dpi: currentTemplate.dpi,
        objects: objects,
        printSettings: {
          copies: 1,
          printerLanguage: 'pdf',
        },
      }
      await saveVersion(currentTemplate.id, {
        template_json: JSON.stringify(canvasData),
        change_comment: 'Auto save',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddObject = (type: string) => {
    const id = uuidv4()
    let obj: LabelObject

    switch (type) {
      case 'text':
        obj = {
          id, type: 'text', name: `Text ${objects.length + 1}`,
          x: 20, y: 20, width: 150, height: 30, rotation: 0,
          visible: true, locked: false, opacity: 1,
        } as TextObject
        ;(obj as TextObject).value = 'Text'
        ;(obj as TextObject).fontFamily = 'Arial'
        ;(obj as TextObject).fontSize = 14
        ;(obj as TextObject).bold = false
        ;(obj as TextObject).italic = false
        ;(obj as TextObject).underline = false
        ;(obj as TextObject).textColor = '#000000'
        ;(obj as TextObject).backgroundColor = 'transparent'
        ;(obj as TextObject).horizontalAlign = 'left'
        ;(obj as TextObject).verticalAlign = 'top'
        ;(obj as TextObject).lineHeight = 1.2
        ;(obj as TextObject).letterSpacing = 0
        ;(obj as TextObject).wordWrap = true
        ;(obj as TextObject).autoShrink = false
        break
      case 'barcode':
        obj = {
          id, type: 'barcode', name: `Barcode ${objects.length + 1}`,
          x: 20, y: 20, width: 200, height: 80, rotation: 0,
          visible: true, locked: false, opacity: 1,
        } as BarcodeObject
        ;(obj as BarcodeObject).barcodeType = 'Code128'
        ;(obj as BarcodeObject).value = '1234567890'
        ;(obj as BarcodeObject).showHumanReadable = true
        ;(obj as BarcodeObject).humanReadablePosition = 'bottom'
        ;(obj as BarcodeObject).moduleWidth = 2
        ;(obj as BarcodeObject).barcodeHeight = 60
        ;(obj as BarcodeObject).quietZone = 10
        ;(obj as BarcodeObject).foregroundColor = '#000000'
        ;(obj as BarcodeObject).backgroundColor = '#FFFFFF'
        break
      case 'qrcode':
        obj = {
          id, type: 'qrcode', name: `QR Code ${objects.length + 1}`,
          x: 20, y: 20, width: 100, height: 100, rotation: 0,
          visible: true, locked: false, opacity: 1,
        } as QRCodeObject
        ;(obj as QRCodeObject).value = 'https://example.com'
        ;(obj as QRCodeObject).errorCorrectionLevel = 'M'
        ;(obj as QRCodeObject).quietZone = 4
        ;(obj as QRCodeObject).foregroundColor = '#000000'
        ;(obj as QRCodeObject).backgroundColor = '#FFFFFF'
        break
      case 'shape':
        obj = {
          id, type: 'shape', name: `Shape ${objects.length + 1}`,
          x: 20, y: 20, width: 100, height: 60, rotation: 0,
          visible: true, locked: false, opacity: 1,
        } as ShapeObject
        ;(obj as ShapeObject).shapeType = 'rectangle'
        ;(obj as ShapeObject).fillColor = '#FFFFFF'
        ;(obj as ShapeObject).borderColor = '#000000'
        ;(obj as ShapeObject).borderWidth = 1
        ;(obj as ShapeObject).cornerRadius = 0
        break
      case 'line':
        obj = {
          id, type: 'line', name: `Line ${objects.length + 1}`,
          x: 20, y: 50, width: 200, height: 0, rotation: 0,
          visible: true, locked: false, opacity: 1,
        } as LineObjType
        ;(obj as LineObjType).startX = 0
        ;(obj as LineObjType).startY = 0
        ;(obj as LineObjType).endX = 200
        ;(obj as LineObjType).endY = 0
        ;(obj as LineObjType).lineColor = '#000000'
        ;(obj as LineObjType).lineThickness = 1
        ;(obj as LineObjType).lineStyle = 'solid'
        ;(obj as LineObjType).arrowStart = false
        ;(obj as LineObjType).arrowEnd = false
        break
      case 'image':
        obj = {
          id, type: 'image', name: `Image ${objects.length + 1}`,
          x: 20, y: 20, width: 100, height: 100, rotation: 0,
          visible: true, locked: false, opacity: 1,
          source: '', sourceType: 'embedded', maintainAspectRatio: true,
        } as any
        break
      case 'datetime':
        obj = {
          id, type: 'datetime', name: `Date/Time ${objects.length + 1}`,
          x: 20, y: 20, width: 120, height: 30, rotation: 0,
          visible: true, locked: false, opacity: 1,
          format: 'dd/MM/yyyy', offset: 0, offsetUnit: 'days',
        } as any
        ;(obj as any).data_source_binding = 'static'
        ;(obj as any).print_condition = ''
        break
      case 'counter':
        obj = {
          id, type: 'counter', name: `Counter ${objects.length + 1}`,
          x: 20, y: 20, width: 80, height: 30, rotation: 0,
          visible: true, locked: false, opacity: 1,
          startValue: 1, endValue: 9999, increment: 1,
          prefix: '', suffix: '', padding: 4,
          resetType: 'never',
        } as any
        ;(obj as any).data_source_binding = 'counter'
        ;(obj as any).print_condition = ''
        break
      default:
        return
    }
    addObject(obj)
    selectObject(obj.id)
  }

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage() || e.target.name() === 'canvas-bg') {
      selectObject(null)
    }
  }

  const handleObjectClick = (objId: string) => {
    selectObject(objId)
  }

  const handleDeleteSelected = useCallback(() => {
    if (selectedObjectId) {
      deleteObject(selectedObjectId)
    }
  }, [selectedObjectId, deleteObject])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
        handleDeleteSelected()
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDeleteSelected])

  const selectedObject = objects.find(o => o.id === selectedObjectId)

  const renderObject = (obj: LabelObject) => {
    switch (obj.type) {
      case 'text': {
        const textObj = obj as TextObject
        return (
          <Group
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill={textObj.backgroundColor === 'transparent' ? '#FFFFFF' : textObj.backgroundColor}
              stroke={selectedObjectId === obj.id ? '#2563eb' : 'transparent'}
              strokeWidth={selectedObjectId === obj.id ? 1 : 0}
              strokeEnabled={selectedObjectId === obj.id}
            />
            <Text
              text={textObj.value}
              fontSize={textObj.fontSize}
              fontFamily={textObj.fontFamily}
              fontStyle={`${textObj.bold ? 'bold' : ''} ${textObj.italic ? 'italic' : ''}`.trim() || 'normal'}
              fill={textObj.textColor}
              width={obj.width}
              height={obj.height}
              align={textObj.horizontalAlign}
              verticalAlign={textObj.verticalAlign as any}
              lineHeight={textObj.lineHeight}
              letterSpacing={textObj.letterSpacing}
              wrap={textObj.wordWrap ? 'word' : 'none'}
              textDecoration={textObj.underline ? 'underline' : ''}
            />
          </Group>
        )
      }
      case 'barcode': {
        const bcObj = obj as BarcodeObject
        return (
          <Group
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill={bcObj.backgroundColor}
              stroke={selectedObjectId === obj.id ? '#2563eb' : '#333'}
              strokeWidth={selectedObjectId === obj.id ? 2 : 1}
            />
            <Text
              text={`[${bcObj.barcodeType}]`}
              fontSize={12}
              fill={bcObj.foregroundColor}
              width={obj.width}
              height={obj.height - (bcObj.showHumanReadable ? 16 : 0)}
              align="center"
              verticalAlign="middle"
            />
            {bcObj.showHumanReadable && (
              <Text
                text={bcObj.value}
                fontSize={10}
                fill={bcObj.foregroundColor}
                width={obj.width}
                y={obj.height - 16}
                align="center"
              />
            )}
          </Group>
        )
      }
      case 'qrcode': {
        const qrObj = obj as QRCodeObject
        return (
          <Group
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill={qrObj.backgroundColor}
              stroke={selectedObjectId === obj.id ? '#2563eb' : '#333'}
              strokeWidth={selectedObjectId === obj.id ? 2 : 1}
            />
            <Rect
              x={8} y={8}
              width={obj.width - 16}
              height={obj.height - 16}
              fill={qrObj.foregroundColor}
            />
            <Text
              text="QR"
              fontSize={12}
              fill="white"
              width={obj.width}
              height={obj.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      }
      case 'shape': {
        const shapeObj = obj as ShapeObject
        return (
          <Rect
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            rotation={obj.rotation}
            fill={shapeObj.fillColor}
            stroke={selectedObjectId === obj.id ? '#2563eb' : shapeObj.borderColor}
            strokeWidth={selectedObjectId === obj.id ? 2 : shapeObj.borderWidth}
            cornerRadius={shapeObj.cornerRadius}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
          />
        )
      }
      case 'line': {
        const lineObj = obj as LineObjType
        return (
          <Line
            key={obj.id}
            points={[obj.x, obj.y, obj.x + lineObj.endX, obj.y + lineObj.endY]}
            stroke={selectedObjectId === obj.id ? '#2563eb' : lineObj.lineColor}
            strokeWidth={lineObj.lineThickness}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
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
            stroke={selectedObjectId === obj.id ? '#2563eb' : '#999'}
            strokeWidth={1}
            onClick={() => handleObjectClick(obj.id)}
            onTap={() => handleObjectClick(obj.id)}
            draggable
            onDragEnd={(e) => {
              updateObject(obj.id, { x: e.target.x(), y: e.target.y() })
            }}
          />
        )
    }
  }

  if (showNewWizard) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg border border-[var(--border-color)]">
          <h2 className="mb-6 text-xl font-bold">New Template</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Template Name *</label>
              <input
                type="text"
                value={wizardData.name}
                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Product Label"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={wizardData.description}
                onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Width *</label>
                <input
                  type="number"
                  value={wizardData.label_width}
                  onChange={(e) => setWizardData({ ...wizardData, label_width: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Height *</label>
                <input
                  type="number"
                  value={wizardData.label_height}
                  onChange={(e) => setWizardData({ ...wizardData, label_height: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Unit</label>
                <select
                  value={wizardData.unit}
                  onChange={(e) => setWizardData({ ...wizardData, unit: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                  <option value="px">px</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">DPI</label>
                <select
                  value={wizardData.dpi}
                  onChange={(e) => setWizardData({ ...wizardData, dpi: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value={203}>203 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Printer Type</label>
                <input
                  type="text"
                  value={wizardData.printer_type}
                  onChange={(e) => setWizardData({ ...wizardData, printer_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g., Zebra"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => navigate('/templates')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!wizardData.name.trim()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gridLines = []
  if (showGrid) {
    for (let x = 0; x <= canvasWidth * zoom; x += gridSize * zoom) {
      gridLines.push(
        <Line key={`gv-${x}`} points={[x, 0, x, canvasHeight * zoom]} stroke="#e2e8f0" strokeWidth={0.5} />
      )
    }
    for (let y = 0; y <= canvasHeight * zoom; y += gridSize * zoom) {
      gridLines.push(
        <Line key={`gh-${y}`} points={[0, y, canvasWidth * zoom, y]} stroke="#e2e8f0" strokeWidth={0.5} />
      )
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <Toolbar
        onSave={handleSave}
        isSaving={isSaving}
        onAddObject={handleAddObject}
        onToggleGrid={toggleGrid}
        onToggleSnap={toggleSnap}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        zoom={zoom}
        onZoom={(delta: number) => setZoom(zoom + delta)}
        onZoomFit={() => {
          const maxW = 800
          const maxH = 600
          const scale = Math.min(maxW / canvasWidth, maxH / canvasHeight, 1)
          setZoom(scale)
        }}
        onDelete={handleDeleteSelected}
        hasSelection={!!selectedObjectId}
        templateName={currentTemplate?.name || 'Untitled'}
        onToggleDataSource={() => setShowDataSource(!showDataSource)}
        showDataSource={showDataSource}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayersPanel objects={objects} selectedObjectId={selectedObjectId} onSelect={selectObject} />

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div className="flex items-center justify-center min-h-full">
            <Stage
              ref={stageRef}
              width={canvasWidth * zoom + 40}
              height={canvasHeight * zoom + 40}
              onClick={handleStageClick}
              scale={{ x: zoom, y: zoom }}
            >
              <Layer offsetX={-20} offsetY={-20}>
                {gridLines}
                <Rect
                  name="canvas-bg"
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="white"
                  shadowColor="rgba(0,0,0,0.15)"
                  shadowBlur={10}
                  shadowOffsetX={2}
                  shadowOffsetY={2}
                />
                {objects.filter(o => o.visible).map(renderObject)}
              </Layer>
            </Stage>
          </div>
        </div>

        {selectedObject && (
          <PropertiesPanel
            object={selectedObject}
            onUpdate={(updates) => updateObject(selectedObject.id, updates)}
            onDelete={() => deleteObject(selectedObject.id)}
          />
        )}
        {showDataSource && (
          <DataSourcePanel
            dataSources={dataSources}
            onChange={setDataSources}
            onMapField={(dsId, fieldName, objectId) => {
              updateObject(objectId, { data_source_binding: `${dsId}.${fieldName}` })
            }}
          />
        )}
      </div>

      <div className="flex h-7 items-center justify-between border-t border-[var(--border-color)] bg-white px-4 text-[11px] text-[var(--text-secondary)]">
        <div className="flex gap-4">
          <span>Width: {currentTemplate?.label_width || 0}{currentTemplate?.unit || 'mm'}</span>
          <span>Height: {currentTemplate?.label_height || 0}{currentTemplate?.unit || 'mm'}</span>
          <span>DPI: {currentTemplate?.dpi || 300}</span>
          <span>Status: {currentTemplate?.status || 'Draft'}</span>
        </div>
        <div className="flex gap-4">
          <span>Objects: {objects.length}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>{showGrid ? 'Grid: On' : 'Grid: Off'}</span>
          <span>{snapToGrid ? 'Snap: On' : 'Snap: Off'}</span>
        </div>
      </div>
    </div>
  )
}