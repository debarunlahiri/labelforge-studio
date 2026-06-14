import { query, queryOne, run, runDelete } from '../dbHelpers'
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
  return query('SELECT * FROM template_data_sources WHERE template_id = ? ORDER BY created_at', [templateId]) as DataSource[]
}

export function getDataSourceById(id: string): DataSource | null {
  return queryOne('SELECT * FROM template_data_sources WHERE id = ?', [id]) as DataSource | null
}

export function createDataSource(data: {
  template_id: string
  name: string
  type: string
  config_json: string
  is_default?: number
}): DataSource {
  const id = uuidv4()

  run(
    'INSERT INTO template_data_sources (id, template_id, name, type, config_json, is_default) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.template_id, data.name, data.type, data.config_json, data.is_default ?? 0]
  )

  return getDataSourceById(id)!
}

export function updateDataSource(id: string, data: {
  name?: string
  type?: string
  config_json?: string
  is_default?: number
}): DataSource | null {
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

  run(`UPDATE template_data_sources SET ${updates.join(', ')} WHERE id = ?`, values)
  return getDataSourceById(id)
}

export function deleteDataSource(id: string): boolean {
  return runDelete('DELETE FROM template_data_sources WHERE id = ?', [id])
}