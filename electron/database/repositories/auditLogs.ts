import { query, run } from '../dbHelpers'
import { v4 as uuidv4 } from 'uuid'

export interface AuditLog {
  id: string
  timestamp: string
  user_id: string | null
  username: string | null
  action: string
  module: string | null
  entity_type: string | null
  entity_id: string | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  machine_name: string | null
  status: string | null
  error_message: string | null
}

export function listAuditLogs(filters?: {
  module?: string
  action?: string
  user_id?: string
  start_date?: string
  end_date?: string
}): AuditLog[] {
  let sql = 'SELECT * FROM audit_logs WHERE 1=1'
  const params: any[] = []

  if (filters?.module) {
    sql += ' AND module = ?'
    params.push(filters.module)
  }
  if (filters?.action) {
    sql += ' AND action = ?'
    params.push(filters.action)
  }
  if (filters?.user_id) {
    sql += ' AND user_id = ?'
    params.push(filters.user_id)
  }
  if (filters?.start_date) {
    sql += ' AND timestamp >= ?'
    params.push(filters.start_date)
  }
  if (filters?.end_date) {
    sql += ' AND timestamp <= ?'
    params.push(filters.end_date)
  }

  sql += ' ORDER BY timestamp DESC LIMIT 1000'

  return query(sql, params) as AuditLog[]
}

export function createAuditLog(data: {
  user_id?: string
  username?: string
  action: string
  module?: string
  entity_type?: string
  entity_id?: string
  old_value?: string
  new_value?: string
  status?: string
  error_message?: string
}): void {
  run(
    'INSERT INTO audit_logs (id, user_id, username, action, module, entity_type, entity_id, old_value, new_value, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      uuidv4(),
      data.user_id || null,
      data.username || null,
      data.action,
      data.module || null,
      data.entity_type || null,
      data.entity_id || null,
      data.old_value || null,
      data.new_value || null,
      data.status || null,
      data.error_message || null,
    ]
  )
}