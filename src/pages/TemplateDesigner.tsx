import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stage, Layer, Rect, Text, Line, Group, Transformer, useStrictMode as setKonvaStrictMode } from 'react-konva'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject, LineObject as LineObjType, DataSourceConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'
import PropertiesPanel from '../designer/PropertiesPanel'
import LayersPanel from '../designer/LayersPanel'
import Toolbar from '../designer/Toolbar'
import DataSourcePanel from '../designer/DataSourcePanel'
import ArtboardPanel from '../designer/ArtboardPanel'
import Ruler from '../designer/Ruler'
import BarcodeRenderer from '../designer/BarcodeRenderer'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown,
  faArrowUp,
  faClone,
  faCopy,
  faLayerGroup,
  faPaste,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const UNIT_TO_PX: Record<string, number> = {
  mm: 3.78,
  cm: 37.8,
  in: 96,
  px: 1,
  pt: 1.33,
}

type SmartGuide = {
  orientation: 'vertical' | 'horizontal'
  position: number
  start: number
  end: number
}

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

type ContextMenuState = {
  x: number
  y: number
  objectId: string
} | null

type ContextMenuItemProps = {
  icon: IconDefinition
  label: string
  onClick: () => void
  danger?: boolean
}

const SNAP_TOLERANCE = 6
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
}

// Konva strict mode reapplies React props on every render. Drag move updates
// smart guides, so strict mode would keep resetting the node to its saved
// position until drag end and make objects appear to jump back.
setKonvaStrictMode(false)

function ContextMenuItem({ icon, label, onClick, danger = false }: ContextMenuItemProps) {
  return (
    <button
      type="button"
      className={`flex h-8 w-full items-center gap-3 px-3 text-left text-xs font-medium transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
      onClick={onClick}
    >
      <span className={`flex w-4 justify-center ${danger ? 'text-red-500' : 'text-slate-400'}`}>
        <FontAwesomeIcon icon={icon} fixedWidth />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  )
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
    objects, selectedObjectId, selectedObjectIds, zoom, showGrid, snapToGrid, gridSize,
    addObject, updateObject, deleteObject, selectObject, selectObjects, toggleObjectSelection, deleteSelectedObjects, setZoom, toggleGrid, toggleSnap,
    clearObjects, loadObjects, canvasWidth, canvasHeight, setCanvasSize,
    undo, redo, canUndo, canRedo,
    copyObject, pasteObject, duplicateObject, reorderObjects,
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
  const [showArtboard, setShowArtboard] = useState(false)
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([])
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [autoSaveIntervalMs, setAutoSaveIntervalMs] = useState(30000)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle')
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [layerFlashObjectId, setLayerFlashObjectId] = useState<string | null>(null)
  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const autoSaveTimerRef = useRef<any>(null)
  const lastSavedHashRef = useRef<string>('')
  const hasLoadedVersionRef = useRef(false)
  const autoSaveInFlightRef = useRef(false)
  const layerFlashTimerRef = useRef<any>(null)
  const getNodeId = (id: string) => `object-${id}`

  const setClampedZoom = useCallback((value: number) => {
    setZoom(clampZoom(value))
  }, [setZoom])

  const zoomIn = useCallback(() => {
    setClampedZoom(zoom + ZOOM_STEP)
  }, [setClampedZoom, zoom])

  const zoomOut = useCallback(() => {
    setClampedZoom(zoom - ZOOM_STEP)
  }, [setClampedZoom, zoom])

  const zoomToActual = useCallback(() => {
    setClampedZoom(1)
  }, [setClampedZoom])

  const zoomToFit = useCallback(() => {
    const maxW = 900
    const maxH = 650
    setClampedZoom(Math.min(maxW / canvasWidth, maxH / canvasHeight, 1))
  }, [canvasHeight, canvasWidth, setClampedZoom])

  const buildCanvasData = useCallback(() => ({
    width: canvasWidth,
    height: canvasHeight,
    unit: currentTemplate?.unit || wizardData.unit,
    dpi: currentTemplate?.dpi || wizardData.dpi,
    objects,
    dataSources,
    printSettings: {
      copies: 1,
      printerLanguage: 'pdf',
    },
  }), [canvasWidth, canvasHeight, currentTemplate, dataSources, objects, wizardData.dpi, wizardData.unit])

  const getCanvasHash = useCallback((canvasData = buildCanvasData()) => {
    return JSON.stringify(canvasData)
  }, [buildCanvasData])

  const loadAutoSaveSettings = useCallback(async () => {
    try {
      const settings = await window.electronAPI?.settings.getAll()
      const enabled = settings?.auto_save_enabled !== 'false'
      const intervalSeconds = Math.max(5, Math.min(600, Number(settings?.auto_save_interval_seconds || 30)))
      setAutoSaveEnabled(enabled)
      setAutoSaveIntervalMs(intervalSeconds * 1000)
    } catch {
      setAutoSaveEnabled(true)
      setAutoSaveIntervalMs(30000)
    }
  }, [])

  useEffect(() => {
    if (id) {
      hasLoadedVersionRef.current = false
      lastSavedHashRef.current = ''
      setAutoSaveStatus('idle')
      loadTemplate(id)
      loadVersions(id)
      loadAutoSaveSettings()
    }
  }, [id, loadAutoSaveSettings])

  useEffect(() => {
    if (currentTemplate && id && !hasLoadedVersionRef.current) {
      if (currentTemplate.current_version_id && versions.length === 0) return
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
          setDataSources(Array.isArray(canvas.dataSources) ? canvas.dataSources : [])
          lastSavedHashRef.current = JSON.stringify({
            width: canvas.width ?? mmToPx(currentTemplate.label_width, currentTemplate.unit, currentTemplate.dpi),
            height: canvas.height ?? mmToPx(currentTemplate.label_height, currentTemplate.unit, currentTemplate.dpi),
            unit: canvas.unit ?? currentTemplate.unit,
            dpi: canvas.dpi ?? currentTemplate.dpi,
            objects: canvas.objects || [],
            dataSources: Array.isArray(canvas.dataSources) ? canvas.dataSources : [],
            printSettings: canvas.printSettings || { copies: 1, printerLanguage: 'pdf' },
          })
          hasLoadedVersionRef.current = true
          setAutoSaveStatus('idle')
        } catch {}
      } else {
        hasLoadedVersionRef.current = true
        lastSavedHashRef.current = getCanvasHash()
      }
    }
  }, [currentTemplate, getCanvasHash, versions])

  useEffect(() => {
    if (!id && currentTemplate) {
      navigate(`/app/templates/${currentTemplate.id}/edit`, { replace: true })
      setShowNewWizard(false)
    }
  }, [currentTemplate])

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      if (layerFlashTimerRef.current) clearTimeout(layerFlashTimerRef.current)
    }
  }, [])

  const flashLayerObject = useCallback((objectId: string) => {
    if (layerFlashTimerRef.current) clearTimeout(layerFlashTimerRef.current)
    setLayerFlashObjectId(objectId)
    layerFlashTimerRef.current = setTimeout(() => {
      setLayerFlashObjectId(null)
    }, 700)
  }, [])

  const applyLayerOrder = useCallback((orderedTopToBottom: LabelObject[], movedId: string) => {
    reorderObjects([...orderedTopToBottom].reverse())
    selectObject(movedId)
    flashLayerObject(movedId)
  }, [flashLayerObject, reorderObjects, selectObject])

  const moveLayerInPanel = useCallback((objectId: string, direction: 'up' | 'down') => {
    const displayObjects = [...objects].reverse()
    const index = displayObjects.findIndex((obj) => obj.id === objectId)
    if (index < 0) return

    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= displayObjects.length) return

    const nextObjects = [...displayObjects]
    const temp = nextObjects[index]
    nextObjects[index] = nextObjects[nextIndex]
    nextObjects[nextIndex] = temp
    applyLayerOrder(nextObjects, objectId)
  }, [applyLayerOrder, objects])

  const handleCreateTemplate = async () => {
    if (!wizardData.name.trim()) return
    setIsSaving(true)
    try {
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
        navigate(`/app/templates/${result.id}/edit`, { replace: true })
        setShowNewWizard(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleArtboardUpdate = async (updates: any) => {
    if (!currentTemplate) return
    const nextTemplate = { ...currentTemplate, ...updates }
    setCanvasSize(
      mmToPx(nextTemplate.label_width, nextTemplate.unit, nextTemplate.dpi),
      mmToPx(nextTemplate.label_height, nextTemplate.unit, nextTemplate.dpi)
    )
    const updated = await updateTemplate(currentTemplate.id, updates)
    if (updated) {
      setCanvasSize(
        mmToPx(updated.label_width, updated.unit, updated.dpi),
        mmToPx(updated.label_height, updated.unit, updated.dpi)
      )
    }
  }

  const handleSave = async (silent = false) => {
    if (!currentTemplate) return
    if (silent && autoSaveInFlightRef.current) return
    const canvasData = buildCanvasData()
    const canvasHash = getCanvasHash(canvasData)
    if (silent && canvasHash === lastSavedHashRef.current) {
      setAutoSaveStatus('saved')
      return
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveInFlightRef.current = silent
    setAutoSaveStatus(silent ? 'saving' : 'idle')
    setIsSaving(true)
    try {
      const savedVersion = await saveVersion(currentTemplate.id, {
        template_json: JSON.stringify(canvasData),
        change_comment: silent ? 'Auto save' : 'Manual save',
      })
      if (!savedVersion) throw new Error('Save failed')
      lastSavedHashRef.current = canvasHash
      setLastSavedAt(new Date().toLocaleTimeString())
      setAutoSaveStatus(silent ? 'saved' : 'idle')
    } catch (error) {
      if (silent) setAutoSaveStatus('error')
      throw error
    } finally {
      autoSaveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!currentTemplate || !id || !hasLoadedVersionRef.current) return
    const currentHash = getCanvasHash()
    if (currentHash === lastSavedHashRef.current) {
      if (autoSaveStatus === 'pending') setAutoSaveStatus('saved')
      return
    }
    if (!autoSaveEnabled) {
      setAutoSaveStatus('pending')
      return
    }
    setAutoSaveStatus('pending')
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true).catch(() => undefined)
    }, autoSaveIntervalMs)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [objects, dataSources, canvasWidth, canvasHeight, currentTemplate, id, autoSaveEnabled, autoSaveIntervalMs, getCanvasHash])

  const handleAddObject = (type: string) => {
    const id = uuidv4()
    let obj: LabelObject

    switch (type) {
      case 'text':
        obj = {
          id, type: 'text', name: `Text ${objects.length + 1}`,
          x: 20, y: 20, width: 80, height: 22, rotation: 0,
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
        ;(obj as QRCodeObject).barcodeType = 'QRCode'
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
    if (e.evt.button === 2) return
    setContextMenu(null)
    if (e.target === e.target.getStage() || e.target.name() === 'canvas-bg') {
      if (!e.evt.shiftKey) {
        selectObject(null)
        setShowArtboard(true)
        setShowDataSource(false)
        setSmartGuides([])
      }
    }
  }

  const syncCanvasNode = useCallback((objectId: string, updates: Partial<LabelObject>) => {
    requestAnimationFrame(() => {
      const stage = stageRef.current
      if (!stage) return
      const node = stage.findOne(`#${getNodeId(objectId)}`)
      if (!node) return

      const attrs: Record<string, any> = {}
      if (updates.x !== undefined) attrs.x = updates.x
      if (updates.y !== undefined) attrs.y = updates.y
      if (updates.rotation !== undefined) attrs.rotation = updates.rotation
      if (updates.width !== undefined) attrs.width = updates.width
      if (updates.height !== undefined) attrs.height = updates.height

      node.setAttrs(attrs)
      node.getLayer()?.batchDraw()
      transformerRef.current?.forceUpdate?.()
    })
  }, [])

  const updateObjectFromProperties = useCallback((objectId: string, updates: Partial<LabelObject>) => {
    updateObject(objectId, updates)
    syncCanvasNode(objectId, updates)
  }, [syncCanvasNode, updateObject])

  const getObjectIdFromNode = useCallback((node: unknown): string | null => {
    let current = node
    while (current) {
      const candidate = current as { id?: () => unknown; getParent?: () => unknown }
      const id = typeof candidate.id === 'function' ? candidate.id() : ''
      if (typeof id === 'string' && id.startsWith('object-')) {
        return id.replace(/^object-/, '')
      }
      current = typeof candidate.getParent === 'function' ? candidate.getParent() : null
    }
    return null
  }, [])

  const showContextMenuForNode = useCallback((node: unknown, clientX: number, clientY: number) => {
    const objectId = getObjectIdFromNode(node)
    if (!objectId) return false

    selectObject(objectId)
    setSmartGuides([])
    setContextMenu({
      x: clientX,
      y: clientY,
      objectId,
    })
    return true
  }, [getObjectIdFromNode, selectObject])

  const openContextMenuForNode = useCallback((node: unknown, evt: MouseEvent) => {
    evt.preventDefault()

    const clientX = evt.clientX
    const clientY = evt.clientY

    if (evt.buttons & 2) {
      window.addEventListener(
        'mouseup',
        () => showContextMenuForNode(node, clientX, clientY),
        { once: true }
      )
      return true
    }

    return showContextMenuForNode(node, clientX, clientY)
  }, [showContextMenuForNode])

  const isContextClick = useCallback((evt: MouseEvent) => {
    return evt.button === 2 || evt.buttons === 2 || (evt.ctrlKey && evt.button === 0)
  }, [])

  const handleStageMouseDown = useCallback((e: any) => {
    if (e.evt.button === 0) {
      setContextMenu(null)
    }
  }, [])

  const handleStageContextMenu = useCallback((e: any) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    openContextMenuForNode(e.target, e.evt)
  }, [openContextMenuForNode])

  const handleObjectClick = (objId: string, shiftKey: boolean) => {
    setContextMenu(null)
    if (shiftKey) {
      toggleObjectSelection(objId)
    } else {
      selectObject(objId)
    }
    setShowArtboard(false)
    setShowDataSource(false)
  }

  const handleObjectMouseDown = useCallback((objId: string, e: any) => {
    if (isContextClick(e.evt)) {
      e.cancelBubble = true
    }
  }, [isContextClick])

  const handleObjectContextMenu = useCallback((objId: string, e: any) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    openContextMenuForNode(e.target, e.evt)
  }, [openContextMenuForNode])

  const handleDeleteSelected = useCallback(() => {
    if (selectedObjectIds.length > 0) {
      deleteSelectedObjects()
    }
  }, [selectedObjectIds, deleteSelectedObjects])

  const handleAlign = useCallback((action: string) => {
    if (!selectedObjectId) return
    const obj = objects.find(o => o.id === selectedObjectId)
    if (!obj) return
    switch (action) {
      case 'alignLeft': updateObject(selectedObjectId, { x: 0 }); break
      case 'alignRight': updateObject(selectedObjectId, { x: canvasWidth - obj.width }); break
      case 'alignTop': updateObject(selectedObjectId, { y: 0 }); break
      case 'alignBottom': updateObject(selectedObjectId, { y: canvasHeight - obj.height }); break
      case 'alignCenterHorizontal': updateObject(selectedObjectId, { x: (canvasWidth - obj.width) / 2 }); break
      case 'alignCenterVertical': updateObject(selectedObjectId, { y: (canvasHeight - obj.height) / 2 }); break
      case 'distributeHorizontally': break
      case 'distributeVertically': break
    }
  }, [selectedObjectId, objects, canvasWidth, canvasHeight, updateObject])

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDeleteSelected,
    onSave: handleSave,
    onCopy: () => copyObject(),
    onPaste: () => pasteObject(),
    onCut: () => { copyObject(); handleDeleteSelected() },
    onDuplicate: () => duplicateObject(),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onSelectAll: () => { selectObjects(objects.map(o => o.id)) },
  })

  const selectedObject = objects.find(o => o.id === selectedObjectId)

  const getObjectBounds = useCallback((obj: LabelObject): Bounds => ({
    x: obj.x,
    y: obj.y,
    width: Math.max(1, obj.width),
    height: Math.max(1, obj.height || (obj.type === 'line' ? 1 : obj.height)),
  }), [])

  const getSnapResult = useCallback((moving: Bounds, movingId: string) => {
    const verticalGuides = [
      { value: 0, start: 0, end: canvasHeight },
      { value: canvasWidth / 2, start: 0, end: canvasHeight },
      { value: canvasWidth, start: 0, end: canvasHeight },
    ]
    const horizontalGuides = [
      { value: 0, start: 0, end: canvasWidth },
      { value: canvasHeight / 2, start: 0, end: canvasWidth },
      { value: canvasHeight, start: 0, end: canvasWidth },
    ]

    objects.forEach((obj) => {
      if (obj.id === movingId || !obj.visible) return
      const bounds = getObjectBounds(obj)
      verticalGuides.push(
        { value: bounds.x, start: bounds.y, end: bounds.y + bounds.height },
        { value: bounds.x + bounds.width / 2, start: bounds.y, end: bounds.y + bounds.height },
        { value: bounds.x + bounds.width, start: bounds.y, end: bounds.y + bounds.height }
      )
      horizontalGuides.push(
        { value: bounds.y, start: bounds.x, end: bounds.x + bounds.width },
        { value: bounds.y + bounds.height / 2, start: bounds.x, end: bounds.x + bounds.width },
        { value: bounds.y + bounds.height, start: bounds.x, end: bounds.x + bounds.width }
      )
    })

    const movingVerticalPoints = [
      { value: moving.x, offset: 0 },
      { value: moving.x + moving.width / 2, offset: moving.width / 2 },
      { value: moving.x + moving.width, offset: moving.width },
    ]
    const movingHorizontalPoints = [
      { value: moving.y, offset: 0 },
      { value: moving.y + moving.height / 2, offset: moving.height / 2 },
      { value: moving.y + moving.height, offset: moving.height },
    ]

    let nextX = moving.x
    let nextY = moving.y
    const guides: SmartGuide[] = []
    let bestVertical: { distance: number; guide: number; offset: number; start: number; end: number } | null = null
    let bestHorizontal: { distance: number; guide: number; offset: number; start: number; end: number } | null = null

    verticalGuides.forEach((guide) => {
      movingVerticalPoints.forEach((point) => {
        const distance = Math.abs(guide.value - point.value)
        if (distance <= SNAP_TOLERANCE / zoom && (!bestVertical || distance < bestVertical.distance)) {
          bestVertical = { distance, guide: guide.value, offset: point.offset, start: guide.start, end: guide.end }
        }
      })
    })

    horizontalGuides.forEach((guide) => {
      movingHorizontalPoints.forEach((point) => {
        const distance = Math.abs(guide.value - point.value)
        if (distance <= SNAP_TOLERANCE / zoom && (!bestHorizontal || distance < bestHorizontal.distance)) {
          bestHorizontal = { distance, guide: guide.value, offset: point.offset, start: guide.start, end: guide.end }
        }
      })
    })

    if (bestVertical) {
      const verticalMatch = bestVertical as { distance: number; guide: number; offset: number; start: number; end: number }
      nextX = verticalMatch.guide - verticalMatch.offset
      guides.push({
        orientation: 'vertical',
        position: verticalMatch.guide,
        start: Math.min(verticalMatch.start, moving.y) - 12,
        end: Math.max(verticalMatch.end, moving.y + moving.height) + 12,
      })
    }

    if (bestHorizontal) {
      const horizontalMatch = bestHorizontal as { distance: number; guide: number; offset: number; start: number; end: number }
      nextY = horizontalMatch.guide - horizontalMatch.offset
      guides.push({
        orientation: 'horizontal',
        position: horizontalMatch.guide,
        start: Math.min(horizontalMatch.start, moving.x) - 12,
        end: Math.max(horizontalMatch.end, moving.x + moving.width) + 12,
      })
    }

    return { x: nextX, y: nextY, guides }
  }, [canvasHeight, canvasWidth, getObjectBounds, objects, zoom])

  const snapNodePosition = useCallback((obj: LabelObject, node: any) => {
    if (!snapToGrid) {
      setSmartGuides([])
      return
    }

    const bounds = getObjectBounds({ ...obj, x: node.x(), y: node.y() })
    const result = getSnapResult(bounds, obj.id)
    node.position({ x: result.x, y: result.y })
    setSmartGuides(result.guides)
  }, [getObjectBounds, getSnapResult, snapToGrid])

  const handleObjectDragMove = useCallback((obj: LabelObject, e: any) => {
    snapNodePosition(obj, e.currentTarget)
  }, [snapNodePosition])

  const handleObjectDragEnd = useCallback((obj: LabelObject, e: any) => {
    const node = e.currentTarget
    snapNodePosition(obj, node)
    updateObject(obj.id, { x: node.x(), y: node.y() })
    setSmartGuides([])
  }, [snapNodePosition, updateObject])

  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    if (!transformer || !stage) return

    const nodes = selectedObjectIds
      .map((id) => stage.findOne(`#${getNodeId(id)}`))
      .filter(Boolean)

    transformer.nodes(nodes)
    transformer.getLayer()?.batchDraw()
  }, [selectedObjectIds, objects])

  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    transformer.nodes().forEach((node: any) => {
      const objectId = String(node.id()).replace(/^object-/, '')
      const obj = objects.find((item) => item.id === objectId)
      if (!obj) return

      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const nextWidth = Math.max(4, obj.width * scaleX)
      const nextHeight = obj.type === 'line'
        ? Math.max(1, Math.abs((obj.height || 1) * scaleY))
        : Math.max(4, obj.height * scaleY)

      node.scaleX(1)
      node.scaleY(1)

      const updates: Partial<LabelObject> = {
        x: node.x(),
        y: node.y(),
        width: nextWidth,
        height: nextHeight,
        rotation: node.rotation(),
      }

      if (obj.type === 'line') {
        ;(updates as any).endX = nextWidth
        ;(updates as any).endY = 0
        updates.height = 0
      }

      updateObject(objectId, updates)
    })
  }, [objects, updateObject])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const moveObjectInStack = useCallback((objectId: string, action: 'front' | 'back' | 'forward' | 'backward') => {
    const index = objects.findIndex((obj) => obj.id === objectId)
    if (index < 0) return

    const nextObjects = [...objects]
    const [item] = nextObjects.splice(index, 1)

    if (action === 'front') {
      nextObjects.push(item)
    } else if (action === 'back') {
      nextObjects.unshift(item)
    } else if (action === 'forward') {
      nextObjects.splice(Math.min(index + 1, nextObjects.length), 0, item)
    } else {
      nextObjects.splice(Math.max(index - 1, 0), 0, item)
    }

    reorderObjects(nextObjects)
    selectObject(objectId)
    flashLayerObject(objectId)
    closeContextMenu()
  }, [closeContextMenu, flashLayerObject, objects, reorderObjects, selectObject])

  const handleContextAction = useCallback((action: 'copy' | 'paste' | 'duplicate' | 'delete') => {
    if (!contextMenu) return

    if (action === 'copy') copyObject()
    if (action === 'paste') pasteObject()
    if (action === 'duplicate') duplicateObject()
    if (action === 'delete') deleteObject(contextMenu.objectId)

    closeContextMenu()
  }, [closeContextMenu, contextMenu, copyObject, deleteObject, duplicateObject, pasteObject])

  const renderObject = (obj: LabelObject) => {
    const isSelected = selectedObjectIds.includes(obj.id)
    const isLayerFlashing = layerFlashObjectId === obj.id
    const selectionStroke = isLayerFlashing ? '#f59e0b' : '#2563eb'
    const selectionWidth = isLayerFlashing ? 3 : 2

    switch (obj.type) {
      case 'text': {
        const textObj = obj as TextObject
        const hasBackground = Boolean(textObj.backgroundColor && textObj.backgroundColor !== 'transparent')
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            {hasBackground && (
              <Rect
                width={obj.width}
                height={obj.height}
                fill={textObj.backgroundColor}
                listening={false}
              />
            )}
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
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 8 : 0}
              shadowOpacity={isLayerFlashing ? 0.4 : 0}
            />
          </Group>
        )
      }
      case 'barcode': {
        const bcObj = obj as BarcodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            id={getNodeId(obj.id)}
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
            selected={isSelected || isLayerFlashing}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(x, y) => {
              updateObject(obj.id, { x, y })
              setSmartGuides([])
            }}
          />
        )
      }
      case 'qrcode': {
        const qrObj = obj as QRCodeObject
        return (
          <BarcodeRenderer
            key={obj.id}
            id={getNodeId(obj.id)}
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
            selected={isSelected || isLayerFlashing}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(x, y) => {
              updateObject(obj.id, { x, y })
              setSmartGuides([])
            }}
          />
        )
      }
      case 'shape': {
        const shapeObj = obj as ShapeObject
        return (
          <Rect
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            rotation={obj.rotation}
            fill={shapeObj.fillColor}
            stroke={(isSelected || isLayerFlashing) ? selectionStroke : shapeObj.borderColor}
            strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : shapeObj.borderWidth}
            shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
            shadowBlur={isLayerFlashing ? 10 : 0}
            shadowOpacity={isLayerFlashing ? 0.35 : 0}
            cornerRadius={shapeObj.cornerRadius}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          />
        )
      }
      case 'line': {
        const lineObj = obj as LineObjType
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            <Line
              points={[0, 0, lineObj.endX || obj.width, lineObj.endY || obj.height]}
              stroke={(isSelected || isLayerFlashing) ? selectionStroke : lineObj.lineColor}
              strokeWidth={isLayerFlashing ? Math.max(lineObj.lineThickness + 2, 3) : lineObj.lineThickness}
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 10 : 0}
              shadowOpacity={isLayerFlashing ? 0.35 : 0}
              hitStrokeWidth={12}
            />
          </Group>
        )
      }
      case 'counter': {
        const cntObj = obj as any
        const display = `${cntObj.prefix || ''}${String(cntObj.startValue ?? 1).padStart(cntObj.padding ?? 4, '0')}${cntObj.suffix || ''}`
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill="white"
              stroke={(isSelected || isLayerFlashing) ? selectionStroke : '#999'}
              strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : 1}
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 10 : 0}
              shadowOpacity={isLayerFlashing ? 0.35 : 0}
            />
            <Text
              text={display}
              fontSize={14}
              fontFamily="monospace"
              fill="#333"
              width={obj.width}
              height={obj.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      }
      case 'datetime': {
        const dtObj = obj as any
        const dateStr = new Date().toLocaleDateString()
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill="white"
              stroke={(isSelected || isLayerFlashing) ? selectionStroke : '#999'}
              strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : 1}
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 10 : 0}
              shadowOpacity={isLayerFlashing ? 0.35 : 0}
            />
            <Text
              text={dtObj.format ? `{{${dtObj.format}}}` : dateStr}
              fontSize={12}
              fill="#333"
              width={obj.width}
              height={obj.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      }
      case 'image': {
        const imgObj = obj as any
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill="#f0f0f0"
              stroke={(isSelected || isLayerFlashing) ? selectionStroke : '#999'}
              strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : 1}
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 10 : 0}
              shadowOpacity={isLayerFlashing ? 0.35 : 0}
            />
            <Text
              text="IMG"
              fontSize={14}
              fill="#666"
              width={obj.width}
              height={obj.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      }
      case 'rfid': {
        return (
          <Group
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            rotation={obj.rotation}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
          >
            <Rect
              width={obj.width}
              height={obj.height}
              fill="#e8f4f8"
              stroke={(isSelected || isLayerFlashing) ? selectionStroke : '#0066cc'}
              strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : 1}
              shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
              shadowBlur={isLayerFlashing ? 10 : 0}
              shadowOpacity={isLayerFlashing ? 0.35 : 0}
            />
            <Text
              text="RFID"
              fontSize={12}
              fill="#0066cc"
              width={obj.width}
              height={obj.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      }
      default:
        return (
          <Rect
            id={getNodeId(obj.id)}
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill="#E0E0E0"
            stroke={(isSelected || isLayerFlashing) ? selectionStroke : '#999'}
            strokeWidth={(isSelected || isLayerFlashing) ? selectionWidth : 1}
            shadowColor={isLayerFlashing ? '#f59e0b' : undefined}
            shadowBlur={isLayerFlashing ? 10 : 0}
            shadowOpacity={isLayerFlashing ? 0.35 : 0}
            onClick={(e) => handleObjectClick(obj.id, e.evt.shiftKey)}
            onMouseDown={(e) => handleObjectMouseDown(obj.id, e)}
            onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
            onTap={() => handleObjectClick(obj.id, false)}
            draggable
            onDragMove={(e) => handleObjectDragMove(obj, e)}
            onDragEnd={(e) => handleObjectDragEnd(obj, e)}
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
                onClick={() => navigate('/app/templates')}
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
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridLines.push(
        <Line key={`gv-${x}`} points={[x, 0, x, canvasHeight]} stroke="#e2e8f0" strokeWidth={0.5 / zoom} />
      )
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridLines.push(
        <Line key={`gh-${y}`} points={[0, y, canvasWidth, y]} stroke="#e2e8f0" strokeWidth={0.5 / zoom} />
      )
    }
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-slate-100"
      onMouseDown={(e) => {
        if (e.button === 0) setContextMenu(null)
      }}
    >
      <Toolbar
        onSave={handleSave}
        isSaving={isSaving}
        onAddObject={handleAddObject}
        onToggleGrid={toggleGrid}
        onToggleSnap={toggleSnap}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        zoom={zoom}
        onZoom={(delta: number) => setClampedZoom(zoom + delta)}
        onZoomFit={zoomToFit}
        onDelete={handleDeleteSelected}
        hasSelection={!!selectedObjectId}
        templateName={currentTemplate?.name || 'Untitled'}
        onToggleArtboard={() => {
          setShowArtboard((current) => !current)
          setShowDataSource(false)
        }}
        showArtboard={showArtboard}
        onToggleDataSource={() => {
          setShowDataSource((current) => !current)
          setShowArtboard(false)
        }}
        showDataSource={showDataSource}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAlign={handleAlign}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LayersPanel
          objects={objects}
          selectedObjectId={selectedObjectId}
          onSelect={selectObject}
          onMoveUp={(id) => moveLayerInPanel(id, 'up')}
          onMoveDown={(id) => moveLayerInPanel(id, 'down')}
          onReorder={applyLayerOrder}
          onLayerPreview={flashLayerObject}
        />

        <div className="relative flex-1 overflow-auto bg-[#e8edf4]">
          <div className="absolute right-5 top-5 z-20 flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-9 w-9 items-center justify-center border-r border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              title="Zoom out (Cmd/Ctrl+-)"
            >
              -
            </button>
            <button
              type="button"
              onClick={zoomToActual}
              className="h-9 min-w-16 border-r border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              title="Actual size"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-9 w-9 items-center justify-center border-r border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              title="Zoom in (Cmd/Ctrl++)"
            >
              +
            </button>
            <button
              type="button"
              onClick={zoomToFit}
              className="h-9 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              title="Fit artboard"
            >
              Fit
            </button>
          </div>
          <div className="flex min-h-full items-center justify-center p-10">
            <div className="rounded-xl border border-slate-300 bg-slate-200/70 p-4 shadow-sm">
              <div style={{ display: 'inline-grid', gridTemplateColumns: '24px auto', gridTemplateRows: '24px auto' }}>
                <div className="rounded-tl-md border-b border-r border-slate-300 bg-slate-100" />
                <div className="overflow-hidden border-b border-slate-300 bg-slate-100" style={{ height: '24px' }}>
                  <Stage width={canvasWidth * zoom + 4} height={24}>
                    <Layer>
                      <Ruler size={canvasWidth * zoom} zoom={zoom} unit={currentTemplate?.unit || 'mm'} dpi={currentTemplate?.dpi || 300} offset={0} direction="horizontal" />
                    </Layer>
                  </Stage>
                </div>
                <div className="overflow-hidden border-r border-slate-300 bg-slate-100" style={{ width: '24px' }}>
                  <Stage width={24} height={canvasHeight * zoom + 4}>
                    <Layer>
                      <Ruler size={canvasHeight * zoom} zoom={zoom} unit={currentTemplate?.unit || 'mm'} dpi={currentTemplate?.dpi || 300} offset={0} direction="vertical" />
                    </Layer>
                  </Stage>
                </div>
                <div className="bg-white shadow-lg shadow-slate-900/15 ring-1 ring-slate-300">
                  <Stage
                    ref={stageRef}
                    width={canvasWidth * zoom + 4}
                    height={canvasHeight * zoom + 4}
                    onClick={handleStageClick}
                    onMouseDown={handleStageMouseDown}
                    onContextMenu={handleStageContextMenu}
                    scale={{ x: zoom, y: zoom }}
                  >
                    <Layer offsetX={-2} offsetY={-2}>
                      {gridLines}
                      <Rect
                        name="canvas-bg"
                        x={0}
                        y={0}
                        width={canvasWidth}
                        height={canvasHeight}
                        fill="white"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                      {objects.filter(o => o.visible).map(renderObject)}
                      {smartGuides.map((guide, index) => (
                        <Line
                          key={`${guide.orientation}-${guide.position}-${index}`}
                          points={
                            guide.orientation === 'vertical'
                              ? [guide.position, guide.start, guide.position, guide.end]
                              : [guide.start, guide.position, guide.end, guide.position]
                          }
                          stroke="#0ea5e9"
                          strokeWidth={1 / zoom}
                          dash={[4 / zoom, 4 / zoom]}
                          listening={false}
                        />
                      ))}
                      <Transformer
                        ref={transformerRef}
                        rotateEnabled
                        enabledAnchors={[
                          'top-left',
                          'top-center',
                          'top-right',
                          'middle-right',
                          'bottom-right',
                          'bottom-center',
                          'bottom-left',
                          'middle-left',
                        ]}
                        anchorSize={8 / zoom}
                        anchorCornerRadius={2}
                        borderStroke="#2563eb"
                        borderStrokeWidth={1 / zoom}
                        anchorStroke="#2563eb"
                        anchorFill="#ffffff"
                        anchorStrokeWidth={1 / zoom}
                        rotateAnchorOffset={24 / zoom}
                        onTransformEnd={handleTransformEnd}
                        boundBoxFunc={(oldBox, newBox) => {
                          if (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 4) {
                            return oldBox
                          }
                          return newBox
                        }}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showArtboard && currentTemplate && (
          <ArtboardPanel
            template={currentTemplate}
            onUpdate={handleArtboardUpdate}
          />
        )}
        {!showArtboard && selectedObject && (
          <PropertiesPanel
            object={selectedObject}
            onUpdate={(updates) => updateObjectFromProperties(selectedObject.id, updates)}
            onDelete={() => deleteObject(selectedObject.id)}
          />
        )}
        {!showArtboard && !selectedObject && !showDataSource && currentTemplate && (
          <ArtboardPanel
            template={currentTemplate}
            onUpdate={handleArtboardUpdate}
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

      {contextMenu && (
        <div
          className="fixed z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-xs shadow-2xl shadow-slate-900/20 ring-1 ring-black/5"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Object actions
          </div>
          <ContextMenuItem icon={faCopy} label="Copy" onClick={() => handleContextAction('copy')} />
          <ContextMenuItem icon={faPaste} label="Paste" onClick={() => handleContextAction('paste')} />
          <ContextMenuItem icon={faClone} label="Duplicate" onClick={() => handleContextAction('duplicate')} />
          <div className="my-1 border-t border-slate-100" />
          <ContextMenuItem icon={faLayerGroup} label="Bring to Front" onClick={() => moveObjectInStack(contextMenu.objectId, 'front')} />
          <ContextMenuItem icon={faArrowUp} label="Bring Forward" onClick={() => moveObjectInStack(contextMenu.objectId, 'forward')} />
          <ContextMenuItem icon={faArrowDown} label="Send Backward" onClick={() => moveObjectInStack(contextMenu.objectId, 'backward')} />
          <ContextMenuItem icon={faLayerGroup} label="Send to Back" onClick={() => moveObjectInStack(contextMenu.objectId, 'back')} />
          <div className="my-1 border-t border-slate-100" />
          <ContextMenuItem icon={faTrash} label="Delete" danger onClick={() => handleContextAction('delete')} />
        </div>
      )}

      <div className="flex h-8 shrink-0 items-center justify-between border-t border-[var(--border-color)] bg-white px-4 text-[11px] text-[var(--text-secondary)]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Width: {currentTemplate?.label_width || 0}{currentTemplate?.unit || 'mm'}</span>
          <span>Height: {currentTemplate?.label_height || 0}{currentTemplate?.unit || 'mm'}</span>
          <span>DPI: {currentTemplate?.dpi || 300}</span>
          <span>Status: {currentTemplate?.status || 'Draft'}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Objects: {objects.length}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>{showGrid ? 'Grid: On' : 'Grid: Off'}</span>
          <span>{snapToGrid ? 'Snap: On' : 'Snap: Off'}</span>
          {autoSaveStatus === 'pending' && <span className="text-amber-600">Unsaved changes</span>}
          {autoSaveStatus === 'saving' && <span className="text-blue-600">Auto-saving...</span>}
          {autoSaveStatus === 'error' && <span className="text-red-600">Auto-save failed</span>}
          {lastSavedAt && autoSaveStatus !== 'pending' && autoSaveStatus !== 'saving' && autoSaveStatus !== 'error' && (
            <span>Saved: {lastSavedAt}</span>
          )}
        </div>
      </div>
    </div>
  )
}
