import { create } from 'zustand'
import type { LabelObject } from '../types'

interface DesignerState {
  objects: LabelObject[]
  selectedObjectId: string | null
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  addObject: (obj: LabelObject) => void
  updateObject: (id: string, updates: Partial<LabelObject>) => void
  deleteObject: (id: string) => void
  selectObject: (id: string | null) => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  toggleSnap: () => void
  setCanvasSize: (width: number, height: number) => void
  reorderObjects: (objects: LabelObject[]) => void
  clearObjects: () => void
  loadObjects: (objects: LabelObject[]) => void
}

export const useDesignerStore = create<DesignerState>((set) => ({
  objects: [],
  selectedObjectId: null,
  zoom: 1,
  showGrid: true,
  snapToGrid: true,
  gridSize: 10,
  canvasWidth: 400,
  canvasHeight: 200,

  addObject: (obj) =>
    set((state) => ({ objects: [...state.objects, obj] })),

  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),

  deleteObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    })),

  selectObject: (id) => set({ selectedObjectId: id }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  reorderObjects: (objects) => set({ objects }),

  clearObjects: () => set({ objects: [], selectedObjectId: null }),

  loadObjects: (objects) => set({ objects, selectedObjectId: null }),
}))