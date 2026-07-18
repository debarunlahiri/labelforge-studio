import { create } from 'zustand'
import type { Template, TemplateVersion } from '../types'

interface TemplateState {
  templates: Template[]
  currentTemplate: Template | null
  currentVersion: TemplateVersion | null
  versions: TemplateVersion[]
  isLoading: boolean
  loadingTemplateId: string | null
  error: string | null
  filters: {
    status?: string
    search?: string
  }
  setFilters: (filters: Partial<{ status: string; search: string }>) => void
  activateTemplate: (template: Template) => void
  clearCurrentTemplate: () => void
  loadTemplates: () => Promise<void>
  loadTemplate: (id: string) => Promise<void>
  createTemplate: (data: any) => Promise<Template | null>
  updateTemplate: (id: string, data: any) => Promise<Template | null>
  deleteTemplate: (id: string) => Promise<boolean>
  duplicateTemplate: (id: string) => Promise<Template | null>
  archiveTemplate: (id: string) => Promise<Template | null>
  saveVersion: (templateId: string, data: any) => Promise<TemplateVersion | null>
  loadVersions: (templateId: string) => Promise<void>
  submitForApproval: (versionId: string) => Promise<void>
  approveVersion: (versionId: string) => Promise<void>
  rejectVersion: (versionId: string, reason: string) => Promise<void>
}

function getApi() {
  return window.electronAPI
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  currentTemplate: null,
  currentVersion: null,
  versions: [],
  isLoading: false,
  loadingTemplateId: null,
  error: null,
  filters: {},

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  activateTemplate: (template) => set({ currentTemplate: template, currentVersion: null, versions: [], loadingTemplateId: null, error: null }),
  clearCurrentTemplate: () => set({ currentTemplate: null, currentVersion: null, versions: [], loadingTemplateId: null }),

  loadTemplates: async () => {
    set({ isLoading: true, error: null })
    try {
      const filters = get().filters
      const templates = await getApi().templates.list(filters)
      set({ templates, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  loadTemplate: async (id) => {
    set((state) => ({
      isLoading: true,
      error: null,
      currentTemplate: state.currentTemplate?.id === id ? state.currentTemplate : null,
      currentVersion: null,
      loadingTemplateId: id,
    }))
    try {
      const template = await getApi().templates.getById(id)
      if (get().loadingTemplateId !== id) return
      set({ currentTemplate: template, isLoading: false, loadingTemplateId: null })
    } catch (error: any) {
      if (get().loadingTemplateId !== id) return
      set({ error: error.message, isLoading: false, loadingTemplateId: null })
    }
  },

  createTemplate: async (data) => {
    try {
      const result = await getApi().templates.create(data)
      if (result.success) {
        set({ currentTemplate: result.template, currentVersion: null, versions: [], loadingTemplateId: null })
        await get().loadTemplates()
        return result.template
      }
      set({ error: result.error })
      return null
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const result = await getApi().templates.update(id, data)
      if (result.success) {
        set({ currentTemplate: result.template })
        await get().loadTemplates()
        return result.template
      }
      set({ error: result.error })
      return null
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  deleteTemplate: async (id) => {
    try {
      const result = await getApi().templates.delete(id)
      await get().loadTemplates()
      return result.success
    } catch (error: any) {
      set({ error: error.message })
      return false
    }
  },

  duplicateTemplate: async (id) => {
    try {
      const result = await getApi().templates.duplicate(id)
      if (result.success) {
        await get().loadTemplates()
        return result.template
      }
      return null
    } catch {
      return null
    }
  },

  archiveTemplate: async (id) => {
    try {
      const result = await getApi().templates.archive(id)
      if (result.success) {
        await get().loadTemplates()
        return result.template
      }
      return null
    } catch {
      return null
    }
  },

  saveVersion: async (templateId, data) => {
    try {
      const result = await getApi().templateVersions.save(templateId, data)
      if (result.success) {
        set({ currentVersion: result.version })
        await get().loadVersions(templateId)
        return result.version
      }
      return null
    } catch {
      return null
    }
  },

  loadVersions: async (templateId) => {
    try {
      const versions = await getApi().templateVersions.list(templateId)
      set({ versions })
    } catch {
    }
  },

  submitForApproval: async (versionId) => {
    try {
      await getApi().templateVersions.submitForApproval(versionId)
    } catch {
    }
  },

  approveVersion: async (versionId) => {
    try {
      await getApi().templateVersions.approve(versionId)
    } catch {
    }
  },

  rejectVersion: async (versionId, reason) => {
    try {
      await getApi().templateVersions.reject(versionId, reason)
    } catch {
    }
  },
}))
