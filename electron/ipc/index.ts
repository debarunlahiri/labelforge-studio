import { ipcMain, app, dialog } from 'electron'
import { listTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate as deleteTemplateRepo, duplicateTemplate, archiveTemplate, exportTemplate, importTemplate } from '../database/repositories/templates'
import { listTemplateVersions, getTemplateVersionById, saveTemplateVersion, submitForApproval, approveVersion, rejectVersion } from '../database/repositories/templateVersions'
import { listPrinters, getPrinterById, registerPrinter, updatePrinter, deletePrinter as deletePrinterRepo, updatePrinterJobStatus, updatePrinterStatus } from '../database/repositories/printers'
import { listPrintJobs, getPrintJobById, createPrintJob, cancelPrintJob, retryPrintJob, addPrintJobLog } from '../database/repositories/printJobs'
import { listAuditLogs } from '../database/repositories/auditLogs'
import { createAuditLog } from '../database/repositories/auditLogs'
import { listGlobalVariables, createGlobalVariable, updateGlobalVariable, deleteGlobalVariable } from '../database/repositories/globalVariables'
import { getSystemSettings, setSystemSetting, setSystemSettings } from '../database/repositories/systemSettings'
import { listDataSources, getDataSourceById, createDataSource, updateDataSource, deleteDataSource } from '../database/repositories/dataSources'
import { fetchRecords, getFields, parseCsv } from '../preprocessing/dataSourceEngine'
import { SUPPORTED_PRINTERS, discoverSystemPrinters, inferPrinterLanguage, sendRawToPrinter } from '../printerSupport'
import { renderRawLabel } from '../printRenderer'

const systemActorId = 'system'

export function registerIpcHandlers(): void {
  ipcMain.handle('templates:list', async (_event, filters?: any) => listTemplates(filters))
  ipcMain.handle('templates:getById', async (_event, id: string) => getTemplateById(id))

  ipcMain.handle('templates:create', async (_event, data: any) => {
    try {
      const template = createTemplate({ ...data, created_by: systemActorId })
      createAuditLog({ action: 'template_created', module: 'templates', entity_id: template.id, status: 'success' })
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:update', async (_event, id: string, data: any) => {
    try {
      const template = updateTemplate(id, data)
      createAuditLog({ action: 'template_updated', module: 'templates', entity_id: id, status: 'success' })
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:delete', async (_event, id: string) => {
    try {
      const result = deleteTemplateRepo(id)
      createAuditLog({ action: 'template_deleted', module: 'templates', entity_id: id, status: result ? 'success' : 'failed' })
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:duplicate', async (_event, id: string) => {
    try {
      const template = duplicateTemplate(id, systemActorId)
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:archive', async (_event, id: string) => {
    try {
      const template = archiveTemplate(id)
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:export', async (_event, id: string) => {
    return exportTemplate(id)
  })

  ipcMain.handle('templates:import', async (_event, data: any) => {
    try {
      const template = importTemplate(data, systemActorId)
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templateVersions:list', async (_event, templateId: string) => listTemplateVersions(templateId))
  ipcMain.handle('templateVersions:getById', async (_event, id: string) => getTemplateVersionById(id))
  ipcMain.handle('templateVersions:save', async (_event, templateId: string, data: any) => {
    try {
      const version = saveTemplateVersion(templateId, { ...data, created_by: systemActorId })
      return { success: true, version }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('templateVersions:submitForApproval', async (_event, id: string) => {
    const version = submitForApproval(id)
    return { success: true, version }
  })
  ipcMain.handle('templateVersions:approve', async (_event, id: string) => {
    const version = approveVersion(id, systemActorId)
    createAuditLog({ action: 'template_approved', module: 'templates', entity_id: id, status: 'success' })
    return { success: true, version }
  })
  ipcMain.handle('templateVersions:reject', async (_event, id: string, reason: string) => {
    const version = rejectVersion(id, reason)
    createAuditLog({ action: 'template_rejected', module: 'templates', entity_id: id, status: 'success' })
    return { success: true, version }
  })

  ipcMain.handle('printers:supportedModels', async () => SUPPORTED_PRINTERS)
  ipcMain.handle('printers:list', async () => listPrinters())
  ipcMain.handle('printers:getById', async (_event, id: string) => getPrinterById(id))
  ipcMain.handle('printers:register', async (_event, data: any) => {
    try {
      const printer = registerPrinter(data)
      createAuditLog({ action: 'printer_registered', module: 'printers', entity_id: printer.id, status: 'success' })
      return { success: true, printer }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printers:update', async (_event, id: string, data: any) => {
    try {
      const printer = updatePrinter(id, data)
      return { success: true, printer }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printers:delete', async (_event, id: string) => {
    try {
      const result = deletePrinterRepo(id)
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printers:discover', async (event) => {
    const electronPrinters = await event.sender.getPrintersAsync()
    return discoverSystemPrinters(electronPrinters)
  })
  ipcMain.handle('printers:registerDiscovered', async (_event, data: any) => {
    try {
      const printer = registerPrinter({
        name: data.name,
        printer_type: data.printer_type,
        connection_type: data.connection_type,
        ip_address: data.ip_address,
        port: data.port,
        machine_name: data.machine_name,
        driver_name: data.driver_name,
        dpi: data.dpi,
      })
      updatePrinterStatus(printer.id, data.status || 'available')
      createAuditLog({ action: 'printer_discovered_registered', module: 'printers', entity_id: printer.id, status: 'success' })
      return { success: true, printer: getPrinterById(printer.id) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printers:getStatus', async (_event, id: string) => {
    const printer = getPrinterById(id)
    return printer?.status || 'unknown'
  })

  ipcMain.handle('printJobs:list', async (_event, filters?: any) => listPrintJobs(filters))
  ipcMain.handle('printJobs:getById', async (_event, id: string) => getPrintJobById(id))
  ipcMain.handle('printJobs:create', async (_event, data: any) => {
    try {
      const job = createPrintJob(data)
      createAuditLog({ action: 'print_job_created', module: 'print', entity_id: job.id, status: 'success' })
      try {
        updatePrinterJobStatus(job.id, 'Rendering')
        addPrintJobLog(job.id, 'Rendering label payload', 'Rendering')

        const template = getTemplateById(data.template_id)
        const version = getTemplateVersionById(data.template_version_id || template?.current_version_id)
        const printer = getPrinterById(data.printer_id)
        if (!template) throw new Error('Template not found')
        if (!version) throw new Error('Template version not found')
        if (!printer) throw new Error('Printer not found')

        const canvas = JSON.parse(version.template_json || '{}')
        const objects = Array.isArray(canvas.objects) ? canvas.objects : []
        const language = data.printer_language || inferPrinterLanguage(printer)
        const payload = renderRawLabel(template, objects, language)

        updatePrinterJobStatus(job.id, 'Sending')
        addPrintJobLog(job.id, `Sending ${language.toUpperCase()} payload to ${printer.name}`, 'Sending')
        await sendRawToPrinter({ ...printer, copies: data.copies }, payload)

        updatePrinterJobStatus(job.id, 'Completed')
        updatePrinterStatus(printer.id, 'available')
        addPrintJobLog(job.id, 'Print job sent successfully', 'Completed')
        createAuditLog({ action: 'print_job_completed', module: 'print', entity_id: job.id, status: 'success' })
        return { success: true, job: getPrintJobById(job.id) }
      } catch (printError: any) {
        updatePrinterJobStatus(job.id, 'Failed', printError.message)
        addPrintJobLog(job.id, printError.message, 'Failed')
        createAuditLog({ action: 'print_job_failed', module: 'print', entity_id: job.id, status: 'failed', error_message: printError.message })
        return { success: false, job: getPrintJobById(job.id), error: printError.message }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printJobs:cancel', async (_event, id: string) => {
    try {
      const job = cancelPrintJob(id)
      createAuditLog({ action: 'print_job_cancelled', module: 'print', entity_id: id, status: 'success' })
      return { success: true, job }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printJobs:retry', async (_event, id: string) => {
    try {
      const job = retryPrintJob(id)
      return { success: true, job }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('globalVariables:list', async () => listGlobalVariables())
  ipcMain.handle('globalVariables:create', async (_event, data: any) => {
    try {
      const variable = createGlobalVariable(data)
      return { success: true, variable }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('globalVariables:update', async (_event, id: string, data: any) => {
    try {
      const variable = updateGlobalVariable(id, data)
      return { success: true, variable }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('globalVariables:delete', async (_event, id: string) => {
    try {
      const result = deleteGlobalVariable(id)
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:getAll', async () => getSystemSettings())
  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    try {
      return { success: true, setting: setSystemSetting(key, value) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('settings:setMany', async (_event, settings: Record<string, string>) => {
    try {
      return { success: true, settings: setSystemSettings(settings) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auditLogs:list', async (_event, filters?: any) => listAuditLogs(filters))

  ipcMain.handle('dataSources:list', async (_event, templateId: string) => listDataSources(templateId))
  ipcMain.handle('dataSources:getById', async (_event, id: string) => getDataSourceById(id))
  ipcMain.handle('dataSources:create', async (_event, data: any) => {
    try {
      const ds = createDataSource(data)
      createAuditLog({ action: 'datasource_created', module: 'datasources', entity_id: ds.id, status: 'success' })
      return { success: true, dataSource: ds }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:update', async (_event, id: string, data: any) => {
    try {
      const ds = updateDataSource(id, data)
      return { success: true, dataSource: ds }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:delete', async (_event, id: string) => {
    try {
      const result = deleteDataSource(id)
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:testConnection', async (_event, config: any) => {
    return { success: true, message: 'Connection test not yet implemented' }
  })
  ipcMain.handle('dataSources:fetchRecords', async (_event, dataSourceId: string, limit?: number, offset?: number) => {
    try {
      const ds = getDataSourceById(dataSourceId)
      if (!ds) return { success: false, error: 'Data source not found' }
      const records = fetchRecords(ds, limit, offset)
      return { success: true, records }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:getFields', async (_event, dataSourceId: string) => {
    try {
      const ds = getDataSourceById(dataSourceId)
      if (!ds) return { success: false, error: 'Data source not found' }
      const fields = getFields(ds)
      return { success: true, fields }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:importCsv', async (_event, filePath: string) => {
    try {
      const fs = require('fs')
      const content = fs.readFileSync(filePath, 'utf-8')
      const records = parseCsv(content)
      return { success: true, records, count: records.length }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('dataSources:importExcel', async (_event, _filePath: string) => {
    return { success: false, error: 'Excel import not yet implemented' }
  })

  ipcMain.handle('app:getVersion', async () => app.getVersion())
  ipcMain.handle('app:getPath', async (_event, name: string) => app.getPath(name as any))
  ipcMain.handle('app:selectFile', async (_event, options: any) => {
    const result = await dialog.showOpenDialog({
      title: options?.title || 'Select File',
      filters: options?.filters || [],
      properties: ['openFile'],
    })
    if (result.canceled) return null
    return result.filePaths[0] || null
  })
  ipcMain.handle('app:readFile', async (_event, filePath: string) => {
    try {
      const fs = await import('fs')
      return fs.readFileSync(filePath, 'utf-8')
    } catch (error: any) {
      return null
    }
  })

  }
