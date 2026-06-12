import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export function seedDatabase(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertRole = db.prepare(
    'INSERT INTO roles (id, name, description) VALUES (?, ?, ?)'
  )
  const insertPermission = db.prepare(
    'INSERT INTO permissions (id, code, description) VALUES (?, ?, ?)'
  )
  const insertUser = db.prepare(
    `INSERT INTO users (id, username, password_hash, full_name, email, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  const insertUserRole = db.prepare(
    'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)'
  )
  const insertRolePermission = db.prepare(
    'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)'
  )

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
    insertRole.run(role.id, role.name, role.description)
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
    insertPermission.run(perm.id, perm.code, perm.description)
    permMap[perm.code] = perm.id
  }

  const adminPasswordHash = bcrypt.hashSync('admin', 10)
  const adminId = uuidv4()
  insertUser.run(adminId, 'admin', adminPasswordHash, 'Administrator', 'admin@labelforge.local', 1)

  insertUserRole.run(uuidv4(), adminId, roleMap['Super Admin'])

  for (const perm of permissions) {
    insertRolePermission.run(uuidv4(), roleMap['Super Admin'], perm.id)
  }

  for (const perm of permissions) {
    insertRolePermission.run(uuidv4(), roleMap['Admin'], perm.id)
  }

  const designerPerms = [
    'template:create', 'template:edit', 'template:print',
  ]
  for (const code of designerPerms) {
    insertRolePermission.run(uuidv4(), roleMap['Designer'], permMap[code])
  }

  const approverPerms = ['template:approve', 'template:edit']
  for (const code of approverPerms) {
    insertRolePermission.run(uuidv4(), roleMap['Approver'], permMap[code])
  }

  const operatorPerms = ['template:print', 'template:reprint']
  for (const code of operatorPerms) {
    insertRolePermission.run(uuidv4(), roleMap['Print Operator'], permMap[code])
  }

  insertRolePermission.run(uuidv4(), roleMap['Auditor'], permMap['audit:view'])

  const globalVariables = [
    { id: uuidv4(), key: 'company_name', value: 'LabelForge Studio', data_type: 'string', description: 'Company name' },
    { id: uuidv4(), key: 'plant_code', value: 'PL01', data_type: 'string', description: 'Plant code' },
    { id: uuidv4(), key: 'factory_address', value: '', data_type: 'string', description: 'Factory address' },
    { id: uuidv4(), key: 'gst_number', value: '', data_type: 'string', description: 'GST number' },
    { id: uuidv4(), key: 'default_label_prefix', value: 'LBL', data_type: 'string', description: 'Default label prefix' },
    { id: uuidv4(), key: 'current_financial_year', value: '2025-2026', data_type: 'string', description: 'Current financial year' },
  ]

  const insertVar = db.prepare(
    `INSERT INTO global_variables (id, variable_key, variable_value, data_type, description)
     VALUES (?, ?, ?, ?, ?)`
  )
  for (const v of globalVariables) {
    insertVar.run(v.id, v.key, v.value, v.data_type, v.description)
  }
}