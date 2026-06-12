import { getDatabase } from '../db'
import { v4 as uuidv4 } from 'uuid'

export interface Template {
  id: string
  name: string
  description: string | null
  label_width: number
  label_height: number
  unit: string
  dpi: number
  printer_type: string | null
  page_orientation: string
  rows: number
  columns: number
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  gap_horizontal: number
  gap_vertical: number
  current_version_id: string | null
  status: string
  tags: string | null
  created_by: string
  created_at: string
  updated_at: string | null
}

export function listTemplates(filters?: {
  status?: string
  created_by?: string
  search?: string
}): any[] {
  const db = getDatabase()
  let sql = 'SELECT * FROM templates WHERE 1=1'
  const params: any[] = []

  if (filters?.status) {
    sql += ' AND status = ?'
    params.push(filters.status)
  }
  if (filters?.created_by) {
    sql += ' AND created_by = ?'
    params.push(filters.created_by)
  }
  if (filters?.search) {
    sql += ' AND name LIKE ?'
    params.push(`%${filters.search}%`)
  }

  sql += ' ORDER BY updated_at DESC NULLS LAST, created_at DESC'

  return db.prepare(sql).all(...params)
}

export function getTemplateById(id: string): Template | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Template) || null
}

export function createTemplate(data: {
  name: string
  description?: string
  label_width: number
  label_height: number
  unit?: string
  dpi?: number
  printer_type?: string
  created_by: string
}): Template {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO templates (id, name, description, label_width, label_height, unit, dpi, printer_type, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.name,
    data.description || null,
    data.label_width,
    data.label_height,
    data.unit || 'mm',
    data.dpi || 300,
    data.printer_type || null,
    data.created_by
  )

  return getTemplateById(id)!
}

export function updateTemplate(
  id: string,
  data: Partial<
    Pick<
      Template,
      | 'name'
      | 'description'
      | 'label_width'
      | 'label_height'
      | 'unit'
      | 'dpi'
      | 'printer_type'
      | 'page_orientation'
      | 'rows'
      | 'columns'
      | 'margin_top'
      | 'margin_bottom'
      | 'margin_left'
      | 'margin_right'
      | 'gap_horizontal'
      | 'gap_vertical'
      | 'tags'
    >
  >
): Template | null {
  const db = getDatabase()
  const fields = Object.keys(data) as (keyof typeof data)[]
  if (fields.length === 0) return getTemplateById(id)

  const setClauses = fields.map(f => `${f} = ?`)
  const values = fields.map(f => data[f])
  setClauses.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE templates SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)
  return getTemplateById(id)
}

export function deleteTemplate(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id)
  return result.changes > 0
}

export function duplicateTemplate(id: string, userId: string): Template | null {
  const db = getDatabase()
  const original = getTemplateById(id)
  if (!original) return null

  const newId = uuidv4()
  db.prepare(
    `INSERT INTO templates (id, name, description, label_width, label_height, unit, dpi, printer_type,
     page_orientation, rows, columns, margin_top, margin_bottom, margin_left, margin_right,
     gap_horizontal, gap_vertical, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`
  ).run(
    newId,
    `${original.name} (Copy)`,
    original.description,
    original.label_width,
    original.label_height,
    original.unit,
    original.dpi,
    original.printer_type,
    original.page_orientation,
    original.rows,
    original.columns,
    original.margin_top,
    original.margin_bottom,
    original.margin_left,
    original.margin_right,
    original.gap_horizontal,
    original.gap_vertical,
    userId
  )

  return getTemplateById(newId)
}

export function archiveTemplate(id: string): Template | null {
  const db = getDatabase()
  db.prepare("UPDATE templates SET status = 'Archived', updated_at = datetime('now') WHERE id = ?").run(id)
  return getTemplateById(id)
}

export function updateTemplateStatus(id: string, status: string): Template | null {
  const db = getDatabase()
  db.prepare("UPDATE templates SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
  return getTemplateById(id)
}

export function setTemplateCurrentVersion(id: string, versionId: string): void {
  const db = getDatabase()
  db.prepare("UPDATE templates SET current_version_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    versionId,
    id
  )
}

export function exportTemplate(id: string): any {
  const template = getTemplateById(id)
  if (!template) return null

  const db = getDatabase()
  const versions = db.prepare('SELECT * FROM template_versions WHERE template_id = ?').all(id)
  const dataSources = db.prepare('SELECT * FROM template_data_sources WHERE template_id = ?').all(id)

  return {
    template,
    versions,
    dataSources,
    exportedAt: new Date().toISOString(),
    format: 'labelforge-template-v1',
  }
}

export function importTemplate(data: any, userId: string): Template | null {
  const db = getDatabase()
  const newId = uuidv4()

  db.prepare(
    `INSERT INTO templates (id, name, description, label_width, label_height, unit, dpi, printer_type,
     page_orientation, rows, columns, margin_top, margin_bottom, margin_left, margin_right,
     gap_horizontal, gap_vertical, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`
  ).run(
    newId,
    data.template.name,
    data.template.description,
    data.template.label_width,
    data.template.label_height,
    data.template.unit || 'mm',
    data.template.dpi || 300,
    data.template.printer_type,
    data.template.page_orientation || 'portrait',
    data.template.rows || 1,
    data.template.columns || 1,
    data.template.margin_top || 0,
    data.template.margin_bottom || 0,
    data.template.margin_left || 0,
    data.template.margin_right || 0,
    data.template.gap_horizontal || 0,
    data.template.gap_vertical || 0,
    userId
  )

  return getTemplateById(newId)
}