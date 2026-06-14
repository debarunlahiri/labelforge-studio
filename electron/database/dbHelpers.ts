import type { Database as SqlJsDatabase } from 'sql.js'
import { getDatabase, scheduleSave } from './db'

export type SqlJsRow = Record<string, any>

export function query(sql: string, params?: any[]): SqlJsRow[] {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  if (params) stmt.bind(params)

  const rows: SqlJsRow[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as SqlJsRow
    rows.push(row)
  }
  stmt.free()
  return rows
}

export function queryOne(sql: string, params?: any[]): SqlJsRow | null {
  const rows = query(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export function run(sql: string, params?: any[]): void {
  const db = getDatabase()
  db.run(sql, params)
  scheduleSave()
}

export function runDelete(sql: string, params?: any[]): boolean {
  const db = getDatabase()
  db.run(sql, params)
  const modified = db.getRowsModified()
  scheduleSave()
  return modified > 0
}