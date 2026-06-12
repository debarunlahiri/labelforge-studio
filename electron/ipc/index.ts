import { ipcMain, app, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, closeDatabase, getDatabase } from '../database/db'
import { getUserByUsername, verifyPassword, updateLastLogin, getUserById, listUsers, createUser, updateUser, deleteUser, changePassword } from '../database/repositories/users'
import { listTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate as deleteTemplateRepo, duplicateTemplate, archiveTemplate, exportTemplate, importTemplate } from '../database/repositories/templates'
import { listTemplateVersions, saveTemplateVersion, submitForApproval, approveVersion, rejectVersion } from '../database/repositories/templateVersions'
import { listPrinters, getPrinterById, registerPrinter, updatePrinter, deletePrinter as deletePrinterRepo, discoverPrinters } from '../database/repositories/printers'
import { listPrintJobs, getPrintJobById, createPrintJob, cancelPrintJob, retryPrintJob } from '../database/repositories/printJobs'
import { createAuditLog } from '../database/repositories/auditLogs'
import { listGlobalVariables, createGlobalVariable, updateGlobalVariable, deleteGlobalVariable } from '../database/repositories/globalVariables'
import { listDataSources, getDataSourceById, createDataSource, updateDataSource, deleteDataSource } from '../database/repositories/dataSources'
import { fetchRecords, getFields, parseCsv, parseJson } from '../preprocessing/dataSourceEngine'

let currentUserId: string | null = null

export function registerIpcHandlers(): void {
  initDatabase()

  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
      const user = getUserByUsername(username)
      if (!user) {
        createAuditLog({ action: 'login_failed', module: 'auth', status: 'failed', error_message: 'User not found' })
        return { success: false, error: 'Invalid username or password' }
      }
      if (!user.is_active) {
        createAuditLog({ action: 'login_failed', module: 'auth', user_id: user.id, username: user.username, status: 'failed', error_message: 'Account disabled' })
        return { success: false, error: 'Account is disabled' }
      }
      if (!verifyPassword(user, password)) {
        createAuditLog({ action: 'login_failed', module: 'auth', user_id: user.id, username: user.username, status: 'failed', error_message: 'Wrong password' })
        return { success: false, error: 'Invalid username or password' }
      }

      updateLastLogin(user.id)
      currentUserId = user.id
      const userWithRoles = getUserById(user.id)
      createAuditLog({ action: 'login_success', module: 'auth', user_id: user.id, username: user.username, status: 'success' })
      return { success: true, user: userWithRoles }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    if (currentUserId) {
      const user = getUserById(currentUserId)
      createAuditLog({ action: 'logout', module: 'auth', user_id: currentUserId, username: user?.username, status: 'success' })
    }
    currentUserId = null
    return { success: true }
  })

  ipcMain.handle('auth:getCurrentUser', async () => {
    if (!currentUserId) return null
    return getUserById(currentUserId)
  })

  ipcMain.handle('auth:changePassword', async (_event, userId: string, oldPassword: string, newPassword: string) => {
    try {
      const user = getUserByUsername(getUserById(userId)?.username || '')
      if (!user || !verifyPassword(user, oldPassword)) {
        return { success: false, error: 'Current password is incorrect' }
      }
      changePassword(userId, newPassword)
      createAuditLog({ action: 'password_changed', module: 'auth', user_id: userId, status: 'success' })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('users:list', async () => listUsers())
  ipcMain.handle('users:getById', async (_event, id: string) => getUserById(id))

  ipcMain.handle('users:create', async (_event, data: any) => {
    try {
      const user = createUser(data)
      createAuditLog({ action: 'user_created', module: 'users', user_id: currentUserId || undefined, entity_id: user.id, status: 'success' })
      return { success: true, user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('users:update', async (_event, id: string, data: any) => {
    try {
      const user = updateUser(id, data)
      createAuditLog({ action: 'user_updated', module: 'users', user_id: currentUserId || undefined, entity_id: id, status: 'success' })
      return { success: true, user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('users:delete', async (_event, id: string) => {
    try {
      const result = deleteUser(id)
      createAuditLog({ action: 'user_deleted', module: 'users', user_id: currentUserId || undefined, entity_id: id, status: result ? 'success' : 'failed' })
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('roles:list', async () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM roles ORDER BY name').all()
  })

  ipcMain.handle('roles:create', async (_event, data: any) => {
    const db = getDatabase()
    const id = uuidv4()
    db.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)').run(id, data.name, data.description)
    return { success: true, id }
  })

  ipcMain.handle('roles:update', async (_event, id: string, data: any) => {
    const db = getDatabase()
    db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(data.name, data.description, id)
    return { success: true }
  })

  ipcMain.handle('roles:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM roles WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('templates:list', async (_event, filters?: any) => listTemplates(filters))
  ipcMain.handle('templates:getById', async (_event, id: string) => getTemplateById(id))

  ipcMain.handle('templates:create', async (_event, data: any) => {
    try {
      const template = createTemplate({ ...data, created_by: currentUserId || 'unknown' })
      createAuditLog({ action: 'template_created', module: 'templates', user_id: currentUserId || undefined, entity_id: template.id, status: 'success' })
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:update', async (_event, id: string, data: any) => {
    try {
      const template = updateTemplate(id, data)
      createAuditLog({ action: 'template_updated', module: 'templates', user_id: currentUserId || undefined, entity_id: id, status: 'success' })
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:delete', async (_event, id: string) => {
    try {
      const result = deleteTemplateRepo(id)
      createAuditLog({ action: 'template_deleted', module: 'templates', user_id: currentUserId || undefined, entity_id: id, status: result ? 'success' : 'failed' })
      return { success: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templates:duplicate', async (_event, id: string) => {
    try {
      const template = duplicateTemplate(id, currentUserId || 'unknown')
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
      const template = importTemplate(data, currentUserId || 'unknown')
      return { success: true, template }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('templateVersions:list', async (_event, templateId: string) => listTemplateVersions(templateId))
  ipcMain.handle('templateVersions:getById', async (_event, id: string) => getTemplateVersionById(id))
  ipcMain.handle('templateVersions:save', async (_event, templateId: string, data: any) => {
    try {
      const version = saveTemplateVersion(templateId, { ...data, created_by: currentUserId || 'unknown' })
      return { success: true, version }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('templateVersions:submitForApproval', async (_event, id: string) => {
    const version = submitForApproval(id)
    return { success: true, version }
  })
  ipcMain.handle('templateVersions:approve', async (_event, id: string, approverId: string) => {
    const version = approveVersion(id, approverId)
    createAuditLog({ action: 'template_approved', module: 'templates', user_id: currentUserId || undefined, entity_id: id, status: 'success' })
    return { success: true, version }
  })
  ipcMain.handle('templateVersions:reject', async (_event, id: string, reason: string) => {
    const version = rejectVersion(id, reason)
    createAuditLog({ action: 'template_rejected', module: 'templates', user_id: currentUserId || undefined, entity_id: id, status: 'success' })
    return { success: true, version }
  })

  ipcMain.handle('printers:list', async () => listPrinters())
  ipcMain.handle('printers:getById', async (_event, id: string) => getPrinterById(id))
  ipcMain.handle('printers:register', async (_event, data: any) => {
    try {
      const printer = registerPrinter(data)
      createAuditLog({ action: 'printer_registered', module: 'printers', user_id: currentUserId || undefined, entity_id: printer.id, status: 'success' })
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
  ipcMain.handle('printers:discover', async () => discoverPrinters())
  ipcMain.handle('printers:getStatus', async (_event, id: string) => {
    const printer = getPrinterById(id)
    return printer?.status || 'unknown'
  })

  ipcMain.handle('printJobs:list', async (_event, filters?: any) => listPrintJobs(filters))
  ipcMain.handle('printJobs:getById', async (_event, id: string) => getPrintJobById(id))
  ipcMain.handle('printJobs:create', async (_event, data: any) => {
    try {
      const job = createPrintJob(data)
      createAuditLog({ action: 'print_job_created', module: 'print', user_id: currentUserId || undefined, entity_id: job.id, status: 'success' })
      return { success: true, job }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('printJobs:cancel', async (_event, id: string) => {
    try {
      const job = cancelPrintJob(id)
      createAuditLog({ action: 'print_job_cancelled', module: 'print', user_id: currentUserId || undefined, entity_id: id, status: 'success' })
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

  ipcMain.handle('auditLogs:list', async (_event, filters?: any) => listAuditLogs(filters))

  ipcMain.handle('dataSources:list', async (_event, templateId: string) => listDataSources(templateId))
  ipcMain.handle('dataSources:getById', async (_event, id: string) => getDataSourceById(id))
  ipcMain.handle('dataSources:create', async (_event, data: any) => {
    try {
      const ds = createDataSource(data)
      createAuditLog({ action: 'datasource_created', module: 'datasources', user_id: currentUserId || undefined, entity_id: ds.id, status: 'success' })
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

  app.on('before-quit', () => {
    closeDatabase()
  })
}