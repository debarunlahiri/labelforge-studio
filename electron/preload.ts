import { contextBridge, ipcRenderer } from 'electron'

const api = {
  templates: {
    list: (filters?: any) => ipcRenderer.invoke('templates:list', filters),
    getById: (id: string) => ipcRenderer.invoke('templates:getById', id),
    create: (data: any) => ipcRenderer.invoke('templates:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('templates:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('templates:delete', id),
    duplicate: (id: string) => ipcRenderer.invoke('templates:duplicate', id),
    archive: (id: string) => ipcRenderer.invoke('templates:archive', id),
    exportTemplate: (id: string) => ipcRenderer.invoke('templates:export', id),
    importTemplate: (data: any) => ipcRenderer.invoke('templates:import', data),
  },
  templateVersions: {
    list: (templateId: string) => ipcRenderer.invoke('templateVersions:list', templateId),
    getById: (id: string) => ipcRenderer.invoke('templateVersions:getById', id),
    save: (templateId: string, data: any) =>
      ipcRenderer.invoke('templateVersions:save', templateId, data),
    submitForApproval: (id: string) =>
      ipcRenderer.invoke('templateVersions:submitForApproval', id),
    approve: (id: string) => ipcRenderer.invoke('templateVersions:approve', id),
    reject: (id: string, reason: string) =>
      ipcRenderer.invoke('templateVersions:reject', id, reason),
  },
  printers: {
    supportedModels: () => ipcRenderer.invoke('printers:supportedModels'),
    list: () => ipcRenderer.invoke('printers:list'),
    getById: (id: string) => ipcRenderer.invoke('printers:getById', id),
    register: (data: any) => ipcRenderer.invoke('printers:register', data),
    registerDiscovered: (data: any) => ipcRenderer.invoke('printers:registerDiscovered', data),
    update: (id: string, data: any) => ipcRenderer.invoke('printers:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('printers:delete', id),
    discover: () => ipcRenderer.invoke('printers:discover'),
    getStatus: (id: string) => ipcRenderer.invoke('printers:getStatus', id),
  },
  printJobs: {
    list: (filters?: any) => ipcRenderer.invoke('printJobs:list', filters),
    getById: (id: string) => ipcRenderer.invoke('printJobs:getById', id),
    create: (data: any) => ipcRenderer.invoke('printJobs:create', data),
    cancel: (id: string) => ipcRenderer.invoke('printJobs:cancel', id),
    retry: (id: string) => ipcRenderer.invoke('printJobs:retry', id),
  },
  globalVariables: {
    list: () => ipcRenderer.invoke('globalVariables:list'),
    create: (data: any) => ipcRenderer.invoke('globalVariables:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('globalVariables:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('globalVariables:delete', id),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setMany: (settings: Record<string, string>) => ipcRenderer.invoke('settings:setMany', settings),
  },
  auditLogs: {
    list: (filters?: any) => ipcRenderer.invoke('auditLogs:list', filters),
  },
  dataSources: {
    list: (templateId: string) => ipcRenderer.invoke('dataSources:list', templateId),
    getById: (id: string) => ipcRenderer.invoke('dataSources:getById', id),
    create: (data: any) => ipcRenderer.invoke('dataSources:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('dataSources:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('dataSources:delete', id),
    testConnection: (config: any) => ipcRenderer.invoke('dataSources:testConnection', config),
    fetchRecords: (dataSourceId: string, limit?: number, offset?: number) =>
      ipcRenderer.invoke('dataSources:fetchRecords', dataSourceId, limit, offset),
    getFields: (dataSourceId: string) => ipcRenderer.invoke('dataSources:getFields', dataSourceId),
    importCsv: (filePath: string) => ipcRenderer.invoke('dataSources:importCsv', filePath),
    importExcel: (filePath: string) => ipcRenderer.invoke('dataSources:importExcel', filePath),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
    selectFile: (options: any) => ipcRenderer.invoke('app:selectFile', options),
    readFile: (filePath: string) => ipcRenderer.invoke('app:readFile', filePath),
  },
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('electronAPI', api)
