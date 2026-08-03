import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stage, Layer, Rect, Line, Transformer, useStrictMode as setKonvaStrictMode } from 'react-konva'
import { useTemplateStore } from '../store/templateStore'
import { useDesignerStore } from '../store/designerStore'
import type { LabelObject, TextObject, BarcodeObject, QRCodeObject, ShapeObject, LineObject as LineObjType, ImageObject, DataSourceConfig, Template, TemplateCanvas } from '../types'
import { v4 as uuidv4 } from 'uuid'
import PropertiesPanel from '../designer/PropertiesPanel'
import LayersPanel from '../designer/LayersPanel'
import Toolbar from '../designer/Toolbar'
import DataSourcePanel from '../designer/DataSourcePanel'
import ArtboardPanel from '../designer/ArtboardPanel'
import Ruler from '../designer/Ruler'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { renderToJPEG, renderToPDF, renderToPNG } from '../utils/labelRenderer'
import NewTemplateWizard from './template-designer/NewTemplateWizard'
import DesignerObject from './template-designer/DesignerObject'
import { getLineVisualHeight } from './template-designer/canvasGeometry'
import ObjectContextMenu, { type ImageContextAction } from './template-designer/ObjectContextMenu'
import DesignerStatusBar from './template-designer/DesignerStatusBar'
import type {
  AutoSaveStatus,
  DesignerContextMenuState,
  NewTemplateData,
} from './template-designer/types'
import { useConfirm } from '../hooks/useConfirm'
import { APP_NAME, APP_TEMPLATE_NAME } from '../../shared/branding'

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

type RotationGuide = {
  points: number[]
}

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

type InlineTextEditorState = {
  objectId: string
  value: string
}

type SelectionBox = Bounds & {
  startX: number
  startY: number
  additive: boolean
}

const SNAP_TOLERANCE = 6
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-2.64-6.36'/%3E%3Cpath d='M21 3v6h-6'/%3E%3C/svg%3E") 12 12, alias`
const TRANSFORMER_ANCHOR_SIZE = 10
const TRANSFORMER_ANCHOR_RADIUS = 2
const TRANSFORMER_STROKE_WIDTH = 1.5
const TRANSFORMER_ROTATE_OFFSET = 28

type ExportFormat = 'labelforge' | 'pdf' | 'jpeg' | 'png'
const ROTATION_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315]
const ROTATION_SNAP_TOLERANCE = 6

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
}

// Konva strict mode reapplies React props on every render. Drag move updates
// smart guides, so strict mode would keep resetting the node to its saved
// position until drag end and make objects appear to jump back.
setKonvaStrictMode(false)

function mmToPx(mm: number, unit: string = 'mm', dpi: number = 300): number {
  const factor = UNIT_TO_PX[unit] || 3.78
  return mm * factor * (dpi / 300)
}

export default function TemplateDesigner() {
  const { confirm, dialog: confirmDialog } = useConfirm()
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    currentTemplate, loadTemplate, createTemplate, updateTemplate, saveVersion, loadVersions,
    versions, clearCurrentTemplate,
  } = useTemplateStore()
  const {
    objects, selectedObjectId, selectedObjectIds, zoom, showGrid, snapToGrid, gridSize,
    addObject, updateObject, moveObjects, deleteObject, selectObject, selectObjects, toggleObjectSelection, deleteSelectedObjects, setZoom, toggleGrid, toggleSnap,
    setGridVisible, setSnapToGrid, setGridSize,
    clearObjects, loadObjects, canvasWidth, canvasHeight, setCanvasSize,
    undo, redo, canUndo, canRedo,
    copyObject, pasteObject, duplicateObject, reorderObjects, groupSelectedObjects, ungroupObjects,
  } = useDesignerStore()

  const [showNewWizard, setShowNewWizard] = useState(!id)
  const [wizardData, setWizardData] = useState<NewTemplateData>({
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
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([])
  const [rotationGuides, setRotationGuides] = useState<RotationGuide[]>([])
  const [contextMenu, setContextMenu] = useState<DesignerContextMenuState>(null)
  const [layerFlashObjectId, setLayerFlashObjectId] = useState<string | null>(null)
  const [workspaceScroll, setWorkspaceScroll] = useState({ left: 0, top: 0 })
  const [rulerOffset, setRulerOffset] = useState({ x: 0, y: 0 })
  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 })
  const [inlineTextEditor, setInlineTextEditor] = useState<InlineTextEditorState | null>(null)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 })
  const [documentFilePath, setDocumentFilePath] = useState<string | null>(null)
  const stageRef = useRef<any>(null)
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const artboardRef = useRef<HTMLDivElement | null>(null)
  const inlineTextAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const transformerRef = useRef<any>(null)
  const autoSaveTimerRef = useRef<any>(null)
  const lastSavedHashRef = useRef<string>('')
  const hasLoadedVersionRef = useRef(false)
  const autoSaveInFlightRef = useRef(false)
  const layerFlashTimerRef = useRef<any>(null)
  const documentFilePathRef = useRef<string | null>(null)
  const leaveSaveRef = useRef<{
    templateId: string | null
    template: Template | null
    canvasData: TemplateCanvas | null
    canvasHash: string
    filePath: string | null
  }>({
    templateId: null,
    template: null,
    canvasData: null,
    canvasHash: '',
    filePath: null,
  })
  const multiDragRef = useRef<{
    anchorId: string
    startX: number
    startY: number
    objectIds: string[]
  } | null>(null)
  const selectionJustCompletedRef = useRef(false)
  const getNodeId = (id: string) => `object-${id}`
  const getTemplateFilePathSettingKey = (templateId: string) => `template_file_path_${templateId}`

  useEffect(() => {
    if (!inlineTextEditor) return
    requestAnimationFrame(() => {
      inlineTextAreaRef.current?.focus()
      inlineTextAreaRef.current?.select()
      const length = inlineTextAreaRef.current?.value.length || 0
      setTextSelection({ start: 0, end: length })
    })
  }, [inlineTextEditor?.objectId])

  const finishInlineTextEdit = useCallback((save: boolean) => {
    if (!inlineTextEditor) return
    if (save) {
      updateObject(inlineTextEditor.objectId, { value: inlineTextEditor.value } as Partial<LabelObject>)
    }
    setInlineTextEditor(null)
  }, [inlineTextEditor, updateObject])

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const handleModifierWheel = (event: WheelEvent) => {
      if (!event.metaKey && !event.ctrlKey) return
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      const currentZoom = useDesignerStore.getState().zoom
      setZoom(clampZoom(currentZoom + direction * ZOOM_STEP))
    }

    const updateWorkspaceSize = () => {
      setWorkspaceSize({
        width: workspace.clientWidth,
        height: workspace.clientHeight,
      })
    }

    updateWorkspaceSize()
    const observer = new ResizeObserver(updateWorkspaceSize)
    observer.observe(workspace)
    workspace.addEventListener('wheel', handleModifierWheel, { passive: false })
    return () => {
      observer.disconnect()
      workspace.removeEventListener('wheel', handleModifierWheel)
    }
  }, [setZoom])

  const updateRulerOffset = useCallback(() => {
    const workspace = workspaceRef.current
    const artboard = artboardRef.current
    if (!workspace || !artboard) return
    const workspaceRect = workspace.getBoundingClientRect()
    const artboardRect = artboard.getBoundingClientRect()
    setRulerOffset({
      x: 24 - (artboardRect.left - workspaceRect.left),
      y: 24 - (artboardRect.top - workspaceRect.top),
    })
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(updateRulerOffset)
    return () => cancelAnimationFrame(frame)
  }, [canvasHeight, canvasWidth, updateRulerOffset, workspaceScroll, workspaceSize, zoom])

  const setClampedZoom = useCallback((value: number) => {
    setZoom(clampZoom(value))
  }, [setZoom])

  const zoomIn = useCallback(() => {
    setClampedZoom(zoom + ZOOM_STEP)
  }, [setClampedZoom, zoom])

  const zoomOut = useCallback(() => {
    setClampedZoom(zoom - ZOOM_STEP)
  }, [setClampedZoom, zoom])

  const zoomToFit = useCallback(() => {
    const workspace = workspaceRef.current
    if (!workspace || canvasWidth <= 0 || canvasHeight <= 0) return
    const horizontalPadding = 120
    const verticalPadding = 120
    const availableWidth = Math.max(120, workspace.clientWidth - horizontalPadding)
    const availableHeight = Math.max(120, workspace.clientHeight - verticalPadding)
    setClampedZoom(Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight, 1))
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
      printerLanguage: 'pdf' as const,
    },
  }), [canvasWidth, canvasHeight, currentTemplate, dataSources, objects, wizardData.dpi, wizardData.unit])

  const getCanvasHash = useCallback((canvasData = buildCanvasData()) => {
    return JSON.stringify(canvasData)
  }, [buildCanvasData])

  useEffect(() => {
    const canvasData = buildCanvasData()
    leaveSaveRef.current = {
      templateId: currentTemplate?.id || null,
      template: currentTemplate || null,
      canvasData,
      canvasHash: getCanvasHash(canvasData),
      filePath: documentFilePathRef.current,
    }
  }, [buildCanvasData, currentTemplate?.id, getCanvasHash])

  useEffect(() => {
    return () => {
      const pending = leaveSaveRef.current
      if (
        !pending.templateId ||
        !pending.canvasData ||
        pending.canvasHash === lastSavedHashRef.current
      ) {
        return
      }

      const databaseSave = saveVersion(pending.templateId, {
        template_json: JSON.stringify(pending.canvasData),
        change_comment: 'Saved when leaving designer',
      })

      const fileSave = pending.filePath && pending.template
        ? window.electronAPI?.app.saveFile({
            title: `Save ${APP_TEMPLATE_NAME}`,
            filePath: pending.filePath,
            showDialog: false,
            extension: '.lfx',
            content: JSON.stringify({
              format: 'labelforge-template',
              formatVersion: 1,
              savedAt: new Date().toISOString(),
              template: pending.template,
              canvas: pending.canvasData,
            }, null, 2),
          })
        : Promise.resolve(null)

      void Promise.allSettled([databaseSave, fileSave])
    }
  }, [saveVersion])

  const loadAutoSaveSettings = useCallback(async () => {
    try {
      const settings = await window.electronAPI?.settings.getAll()
      const enabled = settings?.auto_save_enabled !== 'false'
      const intervalSeconds = Math.max(5, Math.min(600, Number(settings?.auto_save_interval_seconds || 30)))
      setAutoSaveEnabled(enabled)
      setAutoSaveIntervalMs(intervalSeconds * 1000)
      setGridVisible(settings?.designer_show_grid !== 'false')
      setSnapToGrid(settings?.designer_snap_to_grid !== 'false')
      setGridSize(Number(settings?.designer_grid_size || 10))
      const defaultZoom = settings?.designer_default_zoom || '100'
      if (defaultZoom === 'fit') {
        requestAnimationFrame(() => zoomToFit())
      } else {
        setZoom(clampZoom((Number(defaultZoom) || 100) / 100))
      }
    } catch {
      setAutoSaveEnabled(true)
      setAutoSaveIntervalMs(30000)
    }
  }, [setGridSize, setGridVisible, setSnapToGrid, setZoom, zoomToFit])

  useEffect(() => {
    if (id) {
      setShowNewWizard(false)
      documentFilePathRef.current = null
      setDocumentFilePath(null)
      hasLoadedVersionRef.current = false
      lastSavedHashRef.current = ''
      setAutoSaveStatus('idle')
      loadTemplate(id)
      loadVersions(id)
      window.electronAPI?.settings.set('last_edited_template_id', id).catch(() => undefined)
      loadAutoSaveSettings()
      window.electronAPI?.settings.getAll()
        .then((settings: Record<string, string>) => {
          const savedPath = settings?.[getTemplateFilePathSettingKey(id)] || null
          documentFilePathRef.current = savedPath
          setDocumentFilePath(savedPath)
        })
        .catch(() => {
          documentFilePathRef.current = null
          setDocumentFilePath(null)
        })
    } else {
      clearCurrentTemplate()
      clearObjects()
      setDataSources([])
      setShowNewWizard(true)
      setShowArtboard(false)
      setShowDataSource(false)
      hasLoadedVersionRef.current = false
      lastSavedHashRef.current = ''
      documentFilePathRef.current = null
      setDocumentFilePath(null)
      window.electronAPI?.settings.getAll()
        .then((settings: Record<string, string>) => {
          if (!settings?.default_label_preset) return
          setWizardData((current) => ({
            ...current,
            label_width: Math.max(0.01, Number(settings.default_label_width) || current.label_width),
            label_height: Math.max(0.01, Number(settings.default_label_height) || current.label_height),
            unit: settings.default_unit || current.unit,
            dpi: Number(settings.default_dpi) || current.dpi,
            printer_type: settings.default_printer_name || current.printer_type,
          }))
        })
        .catch(() => undefined)
    }
  }, [id, clearCurrentTemplate, clearObjects, loadAutoSaveSettings, loadTemplate, loadVersions])

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
    const nextWidth = mmToPx(nextTemplate.label_width, nextTemplate.unit, nextTemplate.dpi)
    const nextHeight = mmToPx(nextTemplate.label_height, nextTemplate.unit, nextTemplate.dpi)
    setCanvasSize(nextWidth, nextHeight)
    const updated = await updateTemplate(currentTemplate.id, updates)
    if (updated) {
      const updatedWidth = mmToPx(updated.label_width, updated.unit, updated.dpi)
      const updatedHeight = mmToPx(updated.label_height, updated.unit, updated.dpi)
      setCanvasSize(updatedWidth, updatedHeight)
      requestAnimationFrame(() => {
        const workspace = workspaceRef.current
        if (!workspace) return
        const availableWidth = Math.max(120, workspace.clientWidth - 120)
        const availableHeight = Math.max(120, workspace.clientHeight - 120)
        setClampedZoom(Math.min(availableWidth / updatedWidth, availableHeight / updatedHeight, 1))
      })
    }
  }

  const handleSave = async (silent = false, saveAs = false) => {
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

      if (!silent) {
        const exportData = {
          format: 'labelforge-template',
          formatVersion: 1,
          savedAt: new Date().toISOString(),
          template: currentTemplate,
          canvas: canvasData,
        }
        const safeName = currentTemplate.name
          .trim()
          .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
          .replace(/\s+/g, ' ')
          || 'Untitled Label'
        const saveResult = await window.electronAPI?.app.saveFile({
          title: saveAs ? `Save ${APP_TEMPLATE_NAME} As` : `Save ${APP_TEMPLATE_NAME}`,
          defaultPath: `${safeName}.lfx`,
          filePath: saveAs ? undefined : documentFilePathRef.current || undefined,
          showDialog: saveAs || !documentFilePathRef.current,
          extension: '.lfx',
          filters: [
            { name: APP_TEMPLATE_NAME, extensions: ['lfx'] },
            { name: 'JSON Document', extensions: ['json'] },
          ],
          content: JSON.stringify(exportData, null, 2),
        })
        if (saveResult?.canceled) return
        if (!saveResult?.success) {
          throw new Error(saveResult?.error || 'Could not save the template file')
        }
        documentFilePathRef.current = saveResult.filePath
        setDocumentFilePath(saveResult.filePath)
        await window.electronAPI?.settings.set(
          getTemplateFilePathSettingKey(currentTemplate.id),
          saveResult.filePath,
        )
      }

      lastSavedHashRef.current = canvasHash
      if (id) await loadVersions(id)
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

  const getSafeTemplateName = () => {
    return currentTemplate?.name
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/\s+/g, ' ')
      || 'Untitled Label'
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = () => reject(reader.error || new Error('Could not read exported file data.'))
      reader.readAsDataURL(blob)
    })
  }

  const saveBase64Export = async (base64Content: string, extension: string, mimeType: string) => {
    const formatName = extension.replace('.', '').toUpperCase()
    const result = await window.electronAPI?.app.saveFile({
      title: `Export ${formatName}`,
      defaultPath: `${getSafeTemplateName()}${extension}`,
      filters: [{ name: `${formatName} files`, extensions: [extension.replace('.', '')] }],
      extension,
      showDialog: true,
      base64Content,
      mimeType,
    })
    if (result?.success === false && !result.canceled) {
      throw new Error(result.error || 'Could not export the file')
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (!currentTemplate) return
    const canvasData = buildCanvasData()
    setIsSaving(true)
    try {
      if (format === 'labelforge') {
        const exportData = {
          format: 'labelforge-template',
          formatVersion: 1,
          savedAt: new Date().toISOString(),
          template: currentTemplate,
          canvas: canvasData,
        }
        const result = await window.electronAPI?.app.saveFile({
          title: `Export ${APP_NAME} File`,
          defaultPath: `${getSafeTemplateName()}.lfx`,
          filters: [
            { name: APP_NAME, extensions: ['lfx'] },
            { name: 'JSON Document', extensions: ['json'] },
          ],
          extension: '.lfx',
          showDialog: true,
          content: JSON.stringify(exportData, null, 2),
        })
        if (result?.success === false && !result.canceled) {
          throw new Error(result.error || 'Could not export the file')
        }
        return
      }

      if (format === 'pdf') {
        const blob = await renderToPDF(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit, currentTemplate.name || 'label')
        await saveBase64Export(await blobToBase64(blob), '.pdf', 'application/pdf')
        return
      }

      const dataUrl = format === 'jpeg'
        ? await renderToJPEG(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
        : await renderToPNG(objects, currentTemplate.label_width, currentTemplate.label_height, currentTemplate.dpi, currentTemplate.unit)
      await saveBase64Export(dataUrl.split(',')[1] || '', format === 'jpeg' ? '.jpg' : '.png', format === 'jpeg' ? 'image/jpeg' : 'image/png')
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
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
        ;(obj as QRCodeObject).showHumanReadable = false
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
          x: 20, y: 50, width: 200, height: 12, rotation: 0,
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
          fitMode: 'contain', cropX: 50, cropY: 50, flipHorizontal: false, flipVertical: false,
        } as any
        break
      case 'datetime': {
        const now = new Date()
        obj = {
          id, type: 'datetime', name: `Date/Time ${objects.length + 1}`,
          x: 20, y: 20, width: 120, height: 30, rotation: 0,
          visible: true, locked: false, opacity: 1,
          format: 'dd/MM/yyyy', offset: 0, offsetUnit: 'days',
          baseDate: now.toISOString().split('T')[0],
          baseTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        } as any
        ;(obj as any).data_source_binding = 'static'
        ;(obj as any).print_condition = ''
        break
      }
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
    if (selectionJustCompletedRef.current) {
      selectionJustCompletedRef.current = false
      return
    }
    setContextMenu(null)
    if (e.target === e.target.getStage() || e.target.name() === 'canvas-bg') {
      if (!e.evt.metaKey && !e.evt.ctrlKey) {
        selectObject(null)
        setShowArtboard(true)
        setShowDataSource(false)
        setSmartGuides([])
        setRotationGuides([])
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
    const source = objects.find((object) => object.id === objectId)
    const targetIds = selectedObjectIds.length > 1 && selectedObjectIds.includes(objectId)
      ? selectedObjectIds.filter((id) => objects.find((object) => object.id === id)?.type === source?.type)
      : [objectId]
    targetIds.forEach((id) => {
      updateObject(id, updates)
      syncCanvasNode(id, updates)
    })
  }, [objects, selectedObjectIds, syncCanvasNode, updateObject])

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

    const clickedObject = objects.find((object) => object.id === objectId)
    if (!selectedObjectIds.includes(objectId)) {
      if (clickedObject?.groupId) {
        selectObjects(
          objects
            .filter((object) => object.groupId === clickedObject.groupId)
            .map((object) => object.id)
        )
      } else {
        selectObject(objectId)
      }
    }
    setSmartGuides([])
    setRotationGuides([])
    setContextMenu({
      x: clientX,
      y: clientY,
      objectId,
    })
    return true
  }, [getObjectIdFromNode, objects, selectObject, selectObjects, selectedObjectIds])

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
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    return evt.button === 2 || evt.buttons === 2 || (isMac && evt.ctrlKey && evt.button === 0)
  }, [])

  const getStagePointer = useCallback(() => {
    const stage = stageRef.current
    const pointer = stage?.getRelativePointerPosition?.()
    if (!pointer) return null
    return {
      x: Math.max(0, Math.min(canvasWidth, pointer.x)),
      y: Math.max(0, Math.min(canvasHeight, pointer.y)),
    }
  }, [canvasHeight, canvasWidth])

  const handleStageMouseDown = useCallback((e: any) => {
    if (e.evt.button !== 0) return
    setContextMenu(null)
    setRotationGuides([])
    if (e.target !== e.target.getStage() && e.target.name() !== 'canvas-bg') return
    const pointer = getStagePointer()
    if (!pointer) return
    setSelectionBox({
      startX: pointer.x,
      startY: pointer.y,
      x: pointer.x,
      y: pointer.y,
      width: 0,
      height: 0,
      additive: e.evt.metaKey || e.evt.ctrlKey,
    })
  }, [getStagePointer])

  const handleStageMouseMove = useCallback(() => {
    if (!selectionBox) return
    const pointer = getStagePointer()
    if (!pointer) return
    setSelectionBox((current) => current ? {
      ...current,
      x: Math.min(current.startX, pointer.x),
      y: Math.min(current.startY, pointer.y),
      width: Math.abs(pointer.x - current.startX),
      height: Math.abs(pointer.y - current.startY),
    } : null)
  }, [getStagePointer, selectionBox])

  const handleStageMouseUp = useCallback(() => {
    if (!selectionBox) return
    const dragged = selectionBox.width > 2 || selectionBox.height > 2
    if (dragged) {
      const right = selectionBox.x + selectionBox.width
      const bottom = selectionBox.y + selectionBox.height
      const enclosedIds = objects
        .filter((object) => object.visible && !object.locked)
        .filter((object) => {
          const bounds = {
            x: object.x,
            y: object.y,
            width: Math.max(1, object.width),
            height: object.type === 'line'
              ? getLineVisualHeight(object as LineObjType)
              : Math.max(1, object.height),
          }
          return bounds.x < right
            && bounds.x + bounds.width > selectionBox.x
            && bounds.y < bottom
            && bounds.y + bounds.height > selectionBox.y
        })
        .map((object) => object.id)
      selectObjects(selectionBox.additive
        ? Array.from(new Set([...selectedObjectIds, ...enclosedIds]))
        : enclosedIds)
      setShowArtboard(false)
      setShowDataSource(false)
      selectionJustCompletedRef.current = true
    }
    setSelectionBox(null)
  }, [objects, selectObjects, selectedObjectIds, selectionBox])

  const handleStageContextMenu = useCallback((e: any) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    setRotationGuides([])
    openContextMenuForNode(e.target, e.evt)
  }, [openContextMenuForNode])

  const handleObjectClick = (objId: string, multiSelect: boolean) => {
    setContextMenu(null)
    setRotationGuides([])
    if (multiSelect) {
      toggleObjectSelection(objId)
    } else {
      const object = objects.find((item) => item.id === objId)
      if (object?.groupId) {
        selectObjects(
          objects
            .filter((item) => item.groupId === object.groupId)
            .map((item) => item.id)
        )
      } else {
        selectObject(objId)
      }
    }
    setShowArtboard(false)
    setShowDataSource(false)
  }

  const handleObjectMouseDown = useCallback((objId: string, e: any) => {
    if (isContextClick(e.evt)) {
      e.cancelBubble = true
      return
    }

    const object = objects.find((item) => item.id === objId)
    if (object?.groupId && !e.evt.metaKey && !e.evt.ctrlKey) {
      selectObjects(objects.filter((item) => item.groupId === object.groupId).map((item) => item.id))
    }
  }, [isContextClick, objects, selectObjects])

  const handleObjectContextMenu = useCallback((objId: string, e: any) => {
    e.evt.preventDefault()
    e.cancelBubble = true
    openContextMenuForNode(e.target, e.evt)
  }, [openContextMenuForNode])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedObjectIds.length > 0) {
      const count = selectedObjectIds.length
      if (!await confirm({
        title: count === 1 ? 'Delete item?' : `Delete ${count} items?`,
        message: count === 1 ? 'This item will be permanently removed from the design.' : `These ${count} items will be permanently removed from the design.`,
      })) return
      deleteSelectedObjects()
    }
  }, [confirm, selectedObjectIds, deleteSelectedObjects])

  const handleOpenPrintPreview = useCallback(async () => {
    if (!currentTemplate?.id) {
      alert('Save this template before opening print preview.')
      return
    }
    const settings = await window.electronAPI?.settings.getAll().catch(() => ({})) || {}
    navigate(settings.show_print_preview === 'false'
      ? `/app/print?template=${encodeURIComponent(currentTemplate.id)}`
      : `/app/templates/${currentTemplate.id}/preview`)
  }, [currentTemplate?.id, navigate])

  const handleAlign = useCallback((action: string) => {
    selectedObjectIds.forEach((objectId) => {
      const object = objects.find((item) => item.id === objectId)
      if (!object) return
      switch (action) {
        case 'alignLeft': updateObject(objectId, { x: 0 }); break
        case 'alignRight': updateObject(objectId, { x: canvasWidth - object.width }); break
        case 'alignTop': updateObject(objectId, { y: 0 }); break
        case 'alignBottom': updateObject(objectId, { y: canvasHeight - object.height }); break
        case 'alignCenterHorizontal': updateObject(objectId, { x: (canvasWidth - object.width) / 2 }); break
        case 'alignCenterVertical': updateObject(objectId, { y: (canvasHeight - object.height) / 2 }); break
      }
    })
  }, [selectedObjectIds, objects, canvasWidth, canvasHeight, updateObject])

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDelete: handleDeleteSelected,
    onSave: () => { void handleSave(false) },
    onSaveAs: () => { void handleSave(false, true) },
    onPrint: () => { void handleOpenPrintPreview() },
    onCopy: () => copyObject(),
    onPaste: () => pasteObject(),
    onCut: () => { copyObject(); handleDeleteSelected() },
    onDuplicate: () => duplicateObject(),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onSelectAll: () => { selectObjects(objects.map(o => o.id)) },
    onNudge: (deltaX, deltaY) => moveObjects(selectedObjectIds, deltaX, deltaY),
  })

  const selectedObject = objects.find(o => o.id === selectedObjectId)

  const getObjectBounds = useCallback((obj: LabelObject): Bounds => ({
    x: obj.x,
    y: obj.y,
    width: Math.max(1, obj.width),
    height: obj.type === 'line'
      ? getLineVisualHeight(obj as LineObjType)
      : Math.max(1, obj.height),
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

  const getSelectionBounds = useCallback((): Bounds | null => {
    const bounds = selectedObjectIds
      .map((objectId) => objects.find((object) => object.id === objectId))
      .filter((object): object is LabelObject => Boolean(object))
      .map(getObjectBounds)

    if (bounds.length === 0) return null

    const left = Math.min(...bounds.map((bound) => bound.x))
    const top = Math.min(...bounds.map((bound) => bound.y))
    const right = Math.max(...bounds.map((bound) => bound.x + bound.width))
    const bottom = Math.max(...bounds.map((bound) => bound.y + bound.height))

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    }
  }, [getObjectBounds, objects, selectedObjectIds])

  const getNearestRotationSnap = useCallback((rotation: number): number | null => {
    const normalized = ((rotation % 360) + 360) % 360
    let nearestAngle = ROTATION_SNAPS[0]
    let nearestDistance = Number.POSITIVE_INFINITY

    ROTATION_SNAPS.forEach((angle) => {
      const rawDistance = Math.abs(normalized - angle)
      const distance = Math.min(rawDistance, 360 - rawDistance)
      if (distance < nearestDistance) {
        nearestAngle = angle
        nearestDistance = distance
      }
    })

    return nearestDistance <= ROTATION_SNAP_TOLERANCE ? nearestAngle : null
  }, [])

  const handleTransform = useCallback(() => {
    const transformer = transformerRef.current
    if (!transformer || transformer.getActiveAnchor?.() !== 'rotater') {
      setRotationGuides([])
      return
    }

    const snapAngle = getNearestRotationSnap(transformer.rotation())
    const bounds = getSelectionBounds()
    if (snapAngle === null || !bounds) {
      setRotationGuides([])
      return
    }

    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const radians = snapAngle * Math.PI / 180
    const length = Math.hypot(canvasWidth, canvasHeight) * 1.5
    const dx = Math.cos(radians) * length
    const dy = Math.sin(radians) * length

    setRotationGuides([{
      points: [
        centerX - dx,
        centerY - dy,
        centerX + dx,
        centerY + dy,
      ],
    }])
  }, [canvasHeight, canvasWidth, getNearestRotationSnap, getSelectionBounds])

  const snapNodePosition = useCallback((obj: LabelObject, node: any, disableSnap = false) => {
    if (!snapToGrid || disableSnap) {
      setSmartGuides([])
      return
    }

    const gridX = Math.round(node.x() / gridSize) * gridSize
    const gridY = Math.round(node.y() / gridSize) * gridSize
    const bounds = getObjectBounds({ ...obj, x: gridX, y: gridY })
    const result = getSnapResult(bounds, obj.id)
    node.position({ x: result.x, y: result.y })
    setSmartGuides(result.guides)
  }, [getObjectBounds, getSnapResult, gridSize, snapToGrid])

  const handleObjectDragMove = useCallback((obj: LabelObject, e: any) => {
    const node = e.currentTarget
    const disableSnap = e.evt?.altKey === true
    if (!multiDragRef.current) {
      const selectedIds = selectedObjectIds.includes(obj.id) && selectedObjectIds.length > 1
        ? selectedObjectIds
        : obj.groupId
          ? objects.filter((item) => item.groupId === obj.groupId).map((item) => item.id)
          : [obj.id]

      multiDragRef.current = {
        anchorId: obj.id,
        startX: obj.x,
        startY: obj.y,
        objectIds: selectedIds,
      }
    }

    snapNodePosition(obj, node, disableSnap)
    const drag = multiDragRef.current
    const deltaX = node.x() - drag.startX
    const deltaY = node.y() - drag.startY
    const stage = stageRef.current

    drag.objectIds.forEach((objectId) => {
      if (objectId === drag.anchorId) return
      const original = objects.find((item) => item.id === objectId)
      const siblingNode = stage?.findOne(`#${getNodeId(objectId)}`)
      if (original && siblingNode) {
        siblingNode.position({
          x: original.x + deltaX,
          y: original.y + deltaY,
        })
      }
    })
    node.getLayer()?.batchDraw()
  }, [objects, selectedObjectIds, snapNodePosition])

  const handleObjectDragEnd = useCallback((obj: LabelObject, e: any) => {
    const node = e.currentTarget
    const disableSnap = e.evt?.altKey === true
    snapNodePosition(obj, node, disableSnap)
    const drag = multiDragRef.current
    const objectIds = drag?.objectIds || [obj.id]
    const deltaX = node.x() - (drag?.startX ?? obj.x)
    const deltaY = node.y() - (drag?.startY ?? obj.y)
    moveObjects(objectIds, deltaX, deltaY)
    multiDragRef.current = null
    setSmartGuides([])
  }, [moveObjects, snapNodePosition])

  const finishRendererDrag = useCallback((obj: LabelObject, x: number, y: number) => {
    const drag = multiDragRef.current
    const objectIds = drag?.objectIds || [obj.id]
    moveObjects(
      objectIds,
      x - (drag?.startX ?? obj.x),
      y - (drag?.startY ?? obj.y),
    )
    multiDragRef.current = null
    setSmartGuides([])
  }, [moveObjects])

  useEffect(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    if (!transformer || !stage) return

    const nodes = selectedObjectIds.length === 1 ? selectedObjectIds
      .map((id) => {
        const object = objects.find((item) => item.id === id)
        const node = stage.findOne(`#${getNodeId(id)}`)
        if (!object || !node) return null

        const position = object.type === 'line'
          ? {
              x: object.x + object.width / 2,
              y: object.y + getLineVisualHeight(object as LineObjType) / 2,
            }
          : { x: object.x, y: object.y }

        node.position(position)
        node.rotation(object.rotation)
        node.scale({ x: 1, y: 1 })
        return node
      })
      .filter(Boolean) : []

    transformer.rotation(0)
    transformer.scale({ x: 1, y: 1 })
    transformer.nodes(nodes)
    transformer.forceUpdate()
    transformer.getLayer()?.batchDraw()
  }, [selectedObjectIds, objects])

  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    setRotationGuides([])

    transformer.nodes().forEach((node: any) => {
      const objectId = String(node.id()).replace(/^object-/, '')
      const obj = objects.find((item) => item.id === objectId)
      if (!obj) return

      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      const nextWidth = Math.max(4, Math.abs(obj.width * scaleX))
      const nextHeight = obj.type === 'line'
        ? getLineVisualHeight(obj as LineObjType)
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
        const lineHeight = getLineVisualHeight(obj as LineObjType)
        updates.x = node.x() - nextWidth / 2
        updates.y = node.y() - lineHeight / 2
        ;(updates as any).endX = nextWidth
        ;(updates as any).endY = 0
        updates.height = lineHeight
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

  const handleContextAction = useCallback(async (action: 'copy' | 'paste' | 'duplicate' | 'delete') => {
    if (!contextMenu) return

    if (action === 'copy') copyObject()
    if (action === 'paste') pasteObject()
    if (action === 'duplicate') duplicateObject()
    if (action === 'delete') {
      const count = selectedObjectIds.includes(contextMenu.objectId) ? selectedObjectIds.length : 1
      if (!await confirm({
        title: count === 1 ? 'Delete item?' : `Delete ${count} items?`,
        message: count === 1 ? 'This item will be permanently removed from the design.' : `These ${count} items will be permanently removed from the design.`,
      })) {
        closeContextMenu()
        return
      }
      if (selectedObjectIds.includes(contextMenu.objectId) && selectedObjectIds.length > 1) {
        deleteSelectedObjects()
      } else {
        deleteObject(contextMenu.objectId)
      }
    }

    closeContextMenu()
  }, [closeContextMenu, confirm, contextMenu, copyObject, deleteObject, deleteSelectedObjects, duplicateObject, pasteObject, selectedObjectIds])

  const handleImageContextAction = useCallback((action: ImageContextAction) => {
    if (!contextMenu) return
    const image = objects.find((object) => object.id === contextMenu.objectId) as ImageObject | undefined
    if (!image || image.type !== 'image') return
    const updates: Partial<ImageObject> =
      action === 'fit' ? { fitMode: 'contain', maintainAspectRatio: true } :
      action === 'fill' ? { fitMode: 'cover', maintainAspectRatio: true } :
      action === 'stretch' ? { fitMode: 'stretch', maintainAspectRatio: false } :
      action === 'portrait' ? { width: Math.min(image.width, image.height), height: Math.max(image.width, image.height) } :
      action === 'landscape' ? { width: Math.max(image.width, image.height), height: Math.min(image.width, image.height) } :
      action === 'flip-horizontal' ? { flipHorizontal: !image.flipHorizontal } :
      action === 'flip-vertical' ? { flipVertical: !image.flipVertical } :
      { fitMode: 'contain', maintainAspectRatio: true, cropX: 50, cropY: 50, flipHorizontal: false, flipVertical: false, rotation: 0 }
    updateObject(image.id, updates)
    closeContextMenu()
  }, [closeContextMenu, contextMenu, objects, updateObject])

  const renderObject = (object: LabelObject) => (
    <DesignerObject
      key={object.id}
      object={object}
      selected={selectedObjectIds.includes(object.id)}
      flashing={layerFlashObjectId === object.id}
      inlineEditing={inlineTextEditor?.objectId === object.id}
      onSelect={handleObjectClick}
      onMouseDown={handleObjectMouseDown}
      onContextMenu={handleObjectContextMenu}
      onEditText={(textObject) => {
        selectObject(textObject.id)
        setInlineTextEditor({ objectId: textObject.id, value: textObject.value })
      }}
      onDragMove={handleObjectDragMove}
      onDragEnd={handleObjectDragEnd}
      onRendererDragEnd={finishRendererDrag}
    />
  )

  const multiSelectionBounds = selectedObjectIds.length > 1 ? getSelectionBounds() : null

  if (showNewWizard) {
    return (
      <NewTemplateWizard
        data={wizardData}
        setData={setWizardData}
        onCancel={() => navigate('/app/templates')}
        onCreate={handleCreateTemplate}
      />
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
        onSave={() => { void handleSave(false) }}
        onSaveAs={() => { void handleSave(false, true) }}
        onExport={(format) => { void handleExport(format) }}
        onPrint={handleOpenPrintPreview}
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
          selectedObjectIds={selectedObjectIds}
          onSelect={selectObject}
          onToggleSelect={toggleObjectSelection}
          onSelectGroup={selectObjects}
          onRename={(objectId, name) => updateObject(objectId, { name })}
          onRenameGroup={(groupId, groupName) => {
            objects
              .filter((object) => object.groupId === groupId)
              .forEach((object) => updateObject(object.id, { groupName }))
          }}
          onGroupSelected={groupSelectedObjects}
          onUngroup={ungroupObjects}
          onMoveUp={(id) => moveLayerInPanel(id, 'up')}
          onMoveDown={(id) => moveLayerInPanel(id, 'down')}
          onReorder={applyLayerOrder}
          onLayerPreview={flashLayerObject}
        />

        <div
          ref={workspaceRef}
          className="relative flex-1 overflow-auto bg-[#e8edf4]"
          onScroll={(event) => {
            setWorkspaceScroll({
              left: event.currentTarget.scrollLeft,
              top: event.currentTarget.scrollTop,
            })
          }}
        >
          <div className="sticky left-0 top-0 z-30 h-6 w-6 border-b border-r border-slate-300 bg-slate-100" />
          <div className="pointer-events-none sticky top-0 z-20 -mt-6 ml-6 h-6 overflow-hidden border-b border-slate-300 bg-slate-100 shadow-sm">
            <Stage width={Math.max(workspaceSize.width - 24, canvasWidth * zoom + 4)} height={24}>
              <Layer>
                <Ruler
                  size={Math.max(workspaceSize.width - 24, canvasWidth * zoom)}
                  zoom={zoom}
                  unit={currentTemplate?.unit || 'mm'}
                  dpi={currentTemplate?.dpi || 300}
                  offset={rulerOffset.x}
                  direction="horizontal"
                />
              </Layer>
            </Stage>
          </div>
          <div className="pointer-events-none sticky left-0 z-20 h-0 w-6 overflow-visible">
            <div className="h-[calc(100vh-24px)] w-6 overflow-hidden border-r border-slate-300 bg-slate-100 shadow-sm">
              <Stage width={24} height={Math.max(workspaceSize.height - 24, canvasHeight * zoom + 4)}>
                <Layer>
                  <Ruler
                    size={Math.max(workspaceSize.height - 24, canvasHeight * zoom)}
                    zoom={zoom}
                    unit={currentTemplate?.unit || 'mm'}
                    dpi={currentTemplate?.dpi || 300}
                    offset={rulerOffset.y}
                    direction="vertical"
                  />
                </Layer>
              </Stage>
            </div>
          </div>
          <div className="flex min-h-full min-w-max items-center justify-center p-12">
            <div ref={artboardRef} className="relative">
              <div>
                <div className="overflow-hidden bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.08)] ring-1 ring-slate-400/70">
                  <Stage
                    ref={stageRef}
                    width={canvasWidth * zoom + 4}
                    height={canvasHeight * zoom + 4}
                    onClick={handleStageClick}
                    onMouseDown={handleStageMouseDown}
                    onMouseMove={handleStageMouseMove}
                    onMouseUp={handleStageMouseUp}
                    onMouseLeave={handleStageMouseUp}
                    onContextMenu={handleStageContextMenu}
                    scale={{ x: zoom, y: zoom }}
                  >
                    <Layer offsetX={-2} offsetY={-2}>
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
                      {gridLines}
                      {objects.filter(o => o.visible).map(renderObject)}
                      {multiSelectionBounds && (
                        <Rect
                          x={multiSelectionBounds.x}
                          y={multiSelectionBounds.y}
                          width={multiSelectionBounds.width}
                          height={multiSelectionBounds.height}
                          fill="transparent"
                          stroke="#2563eb"
                          strokeWidth={1.5 / zoom}
                          dash={[6 / zoom, 4 / zoom]}
                          listening={false}
                        />
                      )}
                      {selectionBox && (
                        <Rect
                          x={selectionBox.x}
                          y={selectionBox.y}
                          width={selectionBox.width}
                          height={selectionBox.height}
                          fill="rgba(37, 99, 235, 0.12)"
                          stroke="#2563eb"
                          strokeWidth={1 / zoom}
                          dash={[4 / zoom, 3 / zoom]}
                          listening={false}
                        />
                      )}
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
                      {rotationGuides.map((guide, index) => (
                        <Line
                          key={`rotation-${index}`}
                          points={guide.points}
                          stroke="#0ea5e9"
                          strokeWidth={1 / zoom}
                          dash={[6 / zoom, 4 / zoom]}
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
                        anchorSize={TRANSFORMER_ANCHOR_SIZE}
                        anchorCornerRadius={TRANSFORMER_ANCHOR_RADIUS}
                        borderStroke="#2563eb"
                        borderStrokeWidth={TRANSFORMER_STROKE_WIDTH}
                        anchorStroke="#2563eb"
                        anchorFill="#ffffff"
                        anchorStrokeWidth={TRANSFORMER_STROKE_WIDTH}
                        rotateAnchorOffset={TRANSFORMER_ROTATE_OFFSET}
                        rotateAnchorCursor={ROTATE_CURSOR}
                        rotationSnaps={ROTATION_SNAPS}
                        rotationSnapTolerance={ROTATION_SNAP_TOLERANCE}
                        anchorStyleFunc={(anchor: any) => {
                          if (!anchor.hasName('rotater')) return
                          anchor.cornerRadius(anchor.width() / 2)
                          anchor.fill('#2563eb')
                          anchor.stroke('#ffffff')
                        }}
                        onTransform={handleTransform}
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

          {inlineTextEditor && (() => {
            const textObject = objects.find((object) => object.id === inlineTextEditor.objectId) as TextObject | undefined
            const stageContainer = stageRef.current?.container?.() as HTMLDivElement | undefined
            if (!textObject || !stageContainer) return null
            const stageBounds = stageContainer.getBoundingClientRect()

            return (
              <textarea
                ref={inlineTextAreaRef}
                value={inlineTextEditor.value}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onSelect={(event) => setTextSelection({
                  start: event.currentTarget.selectionStart,
                  end: event.currentTarget.selectionEnd,
                })}
                onChange={(event) => {
                  setInlineTextEditor((current) => current
                    ? { ...current, value: event.target.value }
                    : current)
                }}
                onBlur={() => finishInlineTextEdit(true)}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    finishInlineTextEdit(false)
                  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault()
                    finishInlineTextEdit(true)
                  }
                }}
                className="fixed z-50 resize-none overflow-hidden border-2 border-blue-500 bg-white/95 p-0 outline-none shadow-sm"
                style={{
                  left: stageBounds.left + textObject.x * zoom,
                  top: stageBounds.top + textObject.y * zoom,
                  width: Math.max(40, textObject.width * zoom),
                  height: Math.max(textObject.fontSize * zoom * 1.5, textObject.height * zoom),
                  color: textObject.textColor,
                  backgroundColor: textObject.backgroundColor === 'transparent'
                    ? 'rgba(255,255,255,0.95)'
                    : textObject.backgroundColor,
                  fontFamily: textObject.fontFamily,
                  fontSize: `${textObject.fontSize * zoom}px`,
                  fontWeight: textObject.bold ? 700 : 400,
                  fontStyle: textObject.italic ? 'italic' : 'normal',
                  textDecoration: textObject.underline ? 'underline' : 'none',
                  lineHeight: String(textObject.lineHeight),
                  letterSpacing: `${textObject.letterSpacing * zoom}px`,
                  textAlign: textObject.horizontalAlign as React.CSSProperties['textAlign'],
                  transform: `rotate(${textObject.rotation}deg)`,
                  transformOrigin: 'top left',
                }}
                aria-label="Edit text item"
              />
            )
          })()}
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
            onDelete={handleDeleteSelected}
            textSelection={selectedObject.type === 'text' ? textSelection : undefined}
            onTextSelectionChange={selectedObject.type === 'text' ? setTextSelection : undefined}
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
        <ObjectContextMenu
          menu={contextMenu}
          onAction={handleContextAction}
          onStackAction={moveObjectInStack}
          selectionCount={selectedObjectIds.length}
          canGroup={selectedObjectIds.length > 1 && !selectedObjectIds.every((id) => Boolean(objects.find((object) => object.id === id)?.groupId))}
          canUngroup={selectedObjectIds.some((id) => Boolean(objects.find((object) => object.id === id)?.groupId))}
          isImage={objects.find((object) => object.id === contextMenu.objectId)?.type === 'image'}
          onImageAction={handleImageContextAction}
          onGroup={() => {
            groupSelectedObjects()
            closeContextMenu()
          }}
          onUngroup={() => {
            const groupIds = new Set(
              selectedObjectIds
                .map((id) => objects.find((object) => object.id === id)?.groupId)
                .filter((groupId): groupId is string => Boolean(groupId))
            )
            groupIds.forEach((groupId) => ungroupObjects(groupId))
            closeContextMenu()
          }}
        />
      )}
      {confirmDialog}

      <DesignerStatusBar
        template={currentTemplate}
        objectCount={objects.length}
        zoom={zoom}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        autoSaveStatus={autoSaveStatus}
        lastSavedAt={lastSavedAt}
        filePath={documentFilePath}
      />
    </div>
  )
}
