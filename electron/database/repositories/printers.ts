import { query, queryOne, run, runDelete } from '../dbHelpers'
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
  return query('SELECT * FROM printers WHERE is_active = 1 ORDER BY name') as Printer[]
}

export function getPrinterById(id: string): Printer | null {
  return queryOne('SELECT * FROM printers WHERE id = ?', [id]) as Printer | null
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
  const existing = queryOne(
    'SELECT * FROM printers WHERE is_active = 1 AND (name = ? OR driver_name = ?)',
    [data.name, data.driver_name || data.name]
  ) as Printer | null
  if (existing) {
    return updatePrinter(existing.id, {
      name: data.name,
      printer_type: data.printer_type,
      connection_type: data.connection_type,
      ip_address: data.ip_address,
      port: data.port,
      driver_name: data.driver_name,
      dpi: data.dpi,
      status: 'available',
    })!
  }

  const id = uuidv4()

  run(
    'INSERT INTO printers (id, name, printer_type, connection_type, ip_address, port, machine_name, driver_name, dpi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, data.name, data.printer_type || null, data.connection_type || null, data.ip_address || null, data.port || null, data.machine_name || null, data.driver_name || null, data.dpi || null]
  )

  return getPrinterById(id)!
}

export function updatePrinter(
  id: string,
  data: Partial<Pick<Printer, 'name' | 'printer_type' | 'connection_type' | 'ip_address' | 'port' | 'driver_name' | 'dpi' | 'status'>>
): Printer | null {
  const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as typeof data
  const fields = Object.keys(cleanData) as (keyof typeof cleanData)[]
  if (fields.length === 0) return getPrinterById(id)

  const setClauses = fields.map(f => `${f} = ?`)
  const values = fields.map(f => cleanData[f])
  setClauses.push("updated_at = datetime('now')")
  values.push(id)

  run(`UPDATE printers SET ${setClauses.join(', ')} WHERE id = ?`, values)
  return getPrinterById(id)
}

export function deletePrinter(id: string): boolean {
  return runDelete('DELETE FROM printers WHERE id = ?', [id])
}

export function updatePrinterStatus(id: string, status: string): void {
  run("UPDATE printers SET status = ?, last_seen = datetime('now'), updated_at = datetime('now') WHERE id = ?", [status, id])
}

export function updatePrinterJobStatus(id: string, status: string, errorMessage?: string | null): void {
  const completedAt = status === 'Completed' || status === 'Failed' || status === 'Cancelled' ? ", completed_at = datetime('now')" : ''
  const startedAt = status === 'Sending' || status === 'Printing' ? ", started_at = COALESCE(started_at, datetime('now'))" : ''
  run(`UPDATE print_jobs SET status = ?, error_message = ?${startedAt}${completedAt} WHERE id = ?`, [status, errorMessage || null, id])
}
