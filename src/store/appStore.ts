import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  sidebarWidth: number
  propertiesPanelOpen: boolean
  activeModule: string
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  togglePropertiesPanel: () => void
  setActiveModule: (module: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 240,
  propertiesPanelOpen: true,
  activeModule: 'dashboard',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  togglePropertiesPanel: () =>
    set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
}))