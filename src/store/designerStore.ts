import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { LabelObject } from '../types'

interface DesignerState {
  objects: LabelObject[]
  selectedObjectId: string | null
  selectedObjectIds: string[]
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  history: LabelObject[][]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  addObject: (obj: LabelObject) => void
  updateObject: (id: string, updates: Partial<LabelObject>) => void
  deleteObject: (id: string) => void
  selectObject: (id: string | null) => void
  selectObjects: (ids: string[]) => void
  toggleObjectSelection: (id: string) => void
  deleteSelectedObjects: () => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  toggleSnap: () => void
  setCanvasSize: (width: number, height: number) => void
  clipboard: LabelObject | null
  copyObject: () => void
  pasteObject: () => void
  duplicateObject: () => void
  reorderObjects: (objects: LabelObject[]) => void
  clearObjects: () => void
  loadObjects: (objects: LabelObject[]) => void
  undo: () => void
  redo: () => void
}

function pushToHistory(state: DesignerState, newObjects: LabelObject[]): Partial<DesignerState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(newObjects)
  return {
    objects: newObjects,
    history: newHistory,
    historyIndex: newHistory.length - 1,
    canUndo: true,
    canRedo: false,
  }
}

export const useDesignerStore = create<DesignerState>((set) => ({
  objects: [],
  selectedObjectId: null,
  selectedObjectIds: [],
  zoom: 1,
  showGrid: true,
  snapToGrid: true,
  gridSize: 10,
  canvasWidth: 400,
  canvasHeight: 200,
  history: [[]],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  addObject: (obj) =>
    set((state) => pushToHistory(state, [...state.objects, obj])),

  updateObject: (id, updates) =>
    set((state) =>
      pushToHistory(
        state,
        state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        )
      )
    ),

  deleteObject: (id) =>
    set((state) =>
      pushToHistory(
        state,
        state.objects.filter((obj) => obj.id !== id)
      )
    ),

  clipboard: null,

  copyObject: () =>
    set((state) => {
      const selected = state.objects.find((obj) => obj.id === state.selectedObjectId)
      if (!selected) return state
      return { clipboard: selected }
    }),

  pasteObject: () =>
    set((state) => {
      if (!state.clipboard) return state
      const newObj: LabelObject = {
        ...state.clipboard,
        id: uuidv4(),
        name: state.clipboard.name + ' (Copy)',
        x: state.clipboard.x + 10,
        y: state.clipboard.y + 10,
      }
      return pushToHistory(state, [...state.objects, newObj])
    }),

  duplicateObject: () =>
    set((state) => {
      const selected = state.objects.find((obj) => obj.id === state.selectedObjectId)
      if (!selected) return state
      const newObj: LabelObject = {
        ...selected,
        id: uuidv4(),
        name: selected.name + ' (Copy)',
        x: selected.x + 10,
        y: selected.y + 10,
      }
      return pushToHistory(state, [...state.objects, newObj])
    }),

  selectObject: (id) => set({ selectedObjectId: id, selectedObjectIds: id ? [id] : [] }),

  selectObjects: (ids) => set({ selectedObjectIds: ids, selectedObjectId: ids.length > 0 ? ids[0] : null }),

  toggleObjectSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedObjectIds.includes(id)
      const newIds = isSelected
        ? state.selectedObjectIds.filter((oid) => oid !== id)
        : [...state.selectedObjectIds, id]
      return {
        selectedObjectIds: newIds,
        selectedObjectId: newIds.length > 0 ? newIds[0] : null,
      }
    }),

  deleteSelectedObjects: () =>
    set((state) =>
      pushToHistory(
        state,
        state.objects.filter((obj) => !state.selectedObjectIds.includes(obj.id))
      )
    ),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  reorderObjects: (objects) =>
    set((state) => pushToHistory(state, objects)),

  clearObjects: () =>
    set((state) => pushToHistory(state, [])),

  loadObjects: (objects) =>
    set((state) => pushToHistory(state, objects)),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        objects: state.history[newIndex],
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
        selectedObjectId: null,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        objects: state.history[newIndex],
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
        selectedObjectId: null,
      }
    }),
}))