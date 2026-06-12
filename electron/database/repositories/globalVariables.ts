import { getDatabase } from '../db'
import { v4 as uuidv4 } from 'uuid'

export interface GlobalVariable {
  id: string
  variable_key: string
  variable_value: string | null
  data_type: string
  description: string | null
  is_active: number
  created_at: string
  updated_at: string | null
}

export function listGlobalVariables(): GlobalVariable[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM global_variables ORDER BY variable_key').all() as GlobalVariable[]
}

export function createGlobalVariable(data: {
  variable_key: string
  variable_value?: string
  data_type?: string
  description?: string
}): GlobalVariable {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO global_variables (id, variable_key, variable_value, data_type, description)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, data.variable_key, data.variable_value || null, data.data_type || 'string', data.description || null)

  return db.prepare('SELECT * FROM global_variables WHERE id = ?').get(id) as GlobalVariable
}

export function updateGlobalVariable(id: string, data: {
  variable_value?: string
  data_type?: string
  description?: string
  is_active?: number
}): GlobalVariable {
  const db = getDatabase()
  const updates: string[] = []
  const values: any[] = []

  if (data.variable_value !== undefined) {
    updates.push('variable_value = ?')
    values.push(data.variable_value)
  }
  if (data.data_type !== undefined) {
    updates.push('data_type = ?')
    values.push(data.data_type)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.is_active !== undefined) {
    updates.push('is_active = ?')
    values.push(data.is_active)
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE global_variables SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare('SELECT * FROM global_variables WHERE id = ?').get(id) as GlobalVariable
}

export function deleteGlobalVariable(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM global_variables WHERE id = ?').run(id)
  return result.changes > 0
}