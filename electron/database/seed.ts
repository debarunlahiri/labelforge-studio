import type { Database as SqlJsDatabase } from 'sql.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export function seedDatabase(db: SqlJsDatabase): void {
  const result = db.exec('SELECT COUNT(*) as count FROM users')
  const count = result.length > 0 && result[0].values.length > 0 ? (result[0].values[0][0] as number) : 0
  if (count > 0) return

  const roles = [
    { id: uuidv4(), name: 'Super Admin', description: 'Full system access' },
    { id: uuidv4(), name: 'Admin', description: 'System administrator' },
    { id: uuidv4(), name: 'Designer', description: 'Can create and edit templates' },
    { id: uuidv4(), name: 'Approver', description: 'Can approve template revisions' },
    { id: uuidv4(), name: 'Print Operator', description: 'Can print labels' },
    { id: uuidv4(), name: 'Auditor', description: 'Can view audit logs' },
  ]

  const roleMap: Record<string, string> = {}
  for (const role of roles) {
    db.run('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [role.id, role.name, role.description])
    roleMap[role.name] = role.id
  }

  const permissions = [
    { id: uuidv4(), code: 'template:create', description: 'Create templates' },
    { id: uuidv4(), code: 'template:edit', description: 'Edit templates' },
    { id: uuidv4(), code: 'template:delete', description: 'Delete templates' },
    { id: uuidv4(), code: 'template:approve', description: 'Approve templates' },
    { id: uuidv4(), code: 'template:print', description: 'Print templates' },
    { id: uuidv4(), code: 'template:reprint', description: 'Reprint jobs' },
    { id: uuidv4(), code: 'printer:manage', description: 'Manage printers' },
    { id: uuidv4(), code: 'user:manage', description: 'Manage users' },
    { id: uuidv4(), code: 'audit:view', description: 'View audit logs' },
    { id: uuidv4(), code: 'variable:manage', description: 'Manage global variables' },
    { id: uuidv4(), code: 'settings:manage', description: 'Manage system settings' },
  ]

  const permMap: Record<string, string> = {}
  for (const perm of permissions) {
    db.run('INSERT INTO permissions (id, code, description) VALUES (?, ?, ?)', [perm.id, perm.code, perm.description])
    permMap[perm.code] = perm.id
  }

  const adminPasswordHash = bcrypt.hashSync('admin', 10)
  const adminId = uuidv4()
  db.run('INSERT INTO users (id, username, password_hash, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, 1)', [adminId, 'admin', adminPasswordHash, 'Administrator', 'admin@labelforge.local'])

  db.run('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)', [uuidv4(), adminId, roleMap['Super Admin']])

  for (const perm of permissions) {
    db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Super Admin'], perm.id])
  }

  for (const perm of permissions) {
    db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Admin'], perm.id])
  }

  const designerPerms = ['template:create', 'template:edit', 'template:print']
  for (const code of designerPerms) {
    db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Designer'], permMap[code]])
  }

  const approverPerms = ['template:approve', 'template:edit']
  for (const code of approverPerms) {
    db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Approver'], permMap[code]])
  }

  const operatorPerms = ['template:print', 'template:reprint']
  for (const code of operatorPerms) {
    db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Print Operator'], permMap[code]])
  }

  db.run('INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)', [uuidv4(), roleMap['Auditor'], permMap['audit:view']])

  const globalVariables = [
    { id: uuidv4(), key: 'company_name', value: 'LabelForge Studio', data_type: 'string', description: 'Company name' },
    { id: uuidv4(), key: 'plant_code', value: 'PL01', data_type: 'string', description: 'Plant code' },
    { id: uuidv4(), key: 'factory_address', value: '', data_type: 'string', description: 'Factory address' },
    { id: uuidv4(), key: 'gst_number', value: '', data_type: 'string', description: 'GST number' },
    { id: uuidv4(), key: 'default_label_prefix', value: 'LBL', data_type: 'string', description: 'Default label prefix' },
    { id: uuidv4(), key: 'current_financial_year', value: '2025-2026', data_type: 'string', description: 'Current financial year' },
  ]

  for (const v of globalVariables) {
    db.run('INSERT INTO global_variables (id, variable_key, variable_value, data_type, description) VALUES (?, ?, ?, ?, ?)', [v.id, v.key, v.value, v.data_type, v.description])
  }

  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['auto_save_enabled', 'true'])
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['auto_save_interval_seconds', '30'])
}
