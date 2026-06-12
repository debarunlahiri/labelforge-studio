import { getDatabase } from '../db'
import { v4 as uuidv4 } from 'uuid'

export interface Printer {
  id: string
  name: string
  printer_type: string | null
  connection_type: string | null
  ip_address: string | null
  port: number | null
  machine_name: string | null
  driver_name: string | null
  dpi: number | null
  status: string
  is_active: number
  last_seen: string | null
  created_at: string
  updated_at: string | null
}

export function listPrinters(): Printer[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM printers WHERE is_active = 1 ORDER BY name').all() as Printer[]
}

export function getPrinterById(id: string): Printer | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM printers WHERE id = ?').get(id) as Printer) || null
}

export function registerPrinter(data: {
  name: string
  printer_type?: string
  connection_type?: string
  ip_address?: string
  port?: number
  machine_name?: string
  driver_name?: string
  dpi?: number
}): Printer {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO printers (id, name, printer_type, connection_type, ip_address, port, machine_name, driver_name, dpi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.name,
    data.printer_type || null,
    data.connection_type || null,
    data.ip_address || null,
    data.port || null,
    data.machine_name || null,
    data.driver_name || null,
    data.dpi || null
  )

  return getPrinterById(id)!
}

export function updatePrinter(
  id: string,
  data: Partial<Pick<Printer, 'name' | 'printer_type' | 'connection_type' | 'ip_address' | 'port' | 'driver_name' | 'dpi' | 'status'>>
): Printer | null {
  const db = getDatabase()
  const fields = Object.keys(data) as (keyof typeof data)[]
  if (fields.length === 0) return getPrinterById(id)

  const setClauses = fields.map(f => `${f} = ?`)
  const values = fields.map(f => data[f])
  setClauses.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE printers SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)
  return getPrinterById(id)
}

export function deletePrinter(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM printers WHERE id = ?').run(id)
  return result.changes > 0
}

export function updatePrinterStatus(id: string, status: string): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE printers SET status = ?, last_seen = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(status, id)
}

export function discoverPrinters(): any[] {
  return []
}