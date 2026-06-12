import { getDatabase } from '../db'
import { v4 as uuidv4 } from 'uuid'

export interface DataSource {
  id: string
  template_id: string
  name: string
  type: string
  config_json: string
  is_default: number
  created_at: string
  updated_at: string | null
}

export function listDataSources(templateId: string): DataSource[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM template_data_sources WHERE template_id = ? ORDER BY created_at').all(templateId) as DataSource[]
}

export function getDataSourceById(id: string): DataSource | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM template_data_sources WHERE id = ?').get(id) as DataSource | undefined
  return row || null
}

export function createDataSource(data: {
  template_id: string
  name: string
  type: string
  config_json: string
  is_default?: number
}): DataSource {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO template_data_sources (id, template_id, name, type, config_json, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.template_id, data.name, data.type, data.config_json, data.is_default ?? 0)

  return getDataSourceById(id)!
}

export function updateDataSource(id: string, data: {
  name?: string
  type?: string
  config_json?: string
  is_default?: number
}): DataSource | null {
  const db = getDatabase()
  const updates: string[] = []
  const values: any[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.type !== undefined) {
    updates.push('type = ?')
    values.push(data.type)
  }
  if (data.config_json !== undefined) {
    updates.push('config_json = ?')
    values.push(data.config_json)
  }
  if (data.is_default !== undefined) {
    updates.push('is_default = ?')
    values.push(data.is_default)
  }

  if (updates.length === 0) return getDataSourceById(id)

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE template_data_sources SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getDataSourceById(id)
}

export function deleteDataSource(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM template_data_sources WHERE id = ?').run(id)
  return result.changes > 0
}