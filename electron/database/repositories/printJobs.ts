import { query, queryOne, run } from '../dbHelpers'
import { v4 as uuidv4 } from 'uuid'

export interface PrintJob {
  id: string
  template_id: string
  template_version_id: string
  printer_id: string
  requested_by: string | null
  copies: number
  payload_json: string | null
  status: string
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export function listPrintJobs(filters?: {
  status?: string
  requested_by?: string
  template_id?: string
}): PrintJob[] {
  let sql = 'SELECT * FROM print_jobs WHERE 1=1'
  const params: any[] = []

  if (filters?.status) {
    sql += ' AND status = ?'
    params.push(filters.status)
  }
  if (filters?.requested_by) {
    sql += ' AND requested_by = ?'
    params.push(filters.requested_by)
  }
  if (filters?.template_id) {
    sql += ' AND template_id = ?'
    params.push(filters.template_id)
  }

  sql += ' ORDER BY created_at DESC'

  return query(sql, params) as PrintJob[]
}

export function getPrintJobById(id: string): PrintJob | null {
  return queryOne('SELECT * FROM print_jobs WHERE id = ?', [id]) as PrintJob | null
}

export function createPrintJob(data: {
  template_id: string
  template_version_id: string
  printer_id: string
  requested_by: string
  copies: number
  payload_json?: string
}): PrintJob {
  const id = uuidv4()

  run(
    "INSERT INTO print_jobs (id, template_id, template_version_id, printer_id, requested_by, copies, payload_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
    [id, data.template_id, data.template_version_id, data.printer_id, data.requested_by, data.copies, data.payload_json || null]
  )

  addPrintJobLog(id, 'Print job created', 'Pending')

  return getPrintJobById(id)!
}

export function cancelPrintJob(id: string): PrintJob | null {
  run("UPDATE print_jobs SET status = 'Cancelled', completed_at = datetime('now') WHERE id = ?", [id])
  addPrintJobLog(id, 'Print job cancelled', 'Cancelled')
  return getPrintJobById(id)
}

export function retryPrintJob(id: string): PrintJob | null {
  run("UPDATE print_jobs SET status = 'Pending', error_message = NULL, started_at = NULL, completed_at = NULL WHERE id = ?", [id])
  addPrintJobLog(id, 'Print job retried', 'Pending')
  return getPrintJobById(id)
}

export function addPrintJobLog(jobId: string, message: string, status: string): void {
  run(
    'INSERT INTO print_job_logs (id, print_job_id, message, status) VALUES (?, ?, ?, ?)',
    [uuidv4(), jobId, message, status]
  )
}