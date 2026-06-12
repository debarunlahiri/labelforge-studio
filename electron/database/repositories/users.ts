import { getDatabase } from '../db'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  username: string
  password_hash: string
  full_name: string | null
  email: string | null
  is_active: number
  last_login_at: string | null
  created_at: string
  updated_at: string | null
}

export interface UserWithRoles extends User {
  roles: string[]
  permissions: string[]
}

export function listUsers(): any[] {
  const db = getDatabase()
  const users = db.prepare(`
    SELECT u.*, GROUP_CONCAT(DISTINCT r.name) as role_names
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[]
  return users.map(({ password_hash, ...user }) => user)
}

export function getUserById(id: string): any | null {
  const db = getDatabase()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
  if (!user) return null

  const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(id) as { name: string }[]

  const permissions = db.prepare(`
    SELECT DISTINCT p.code FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = ?
  `).all(id) as { code: string }[]

  const { password_hash, ...safeUser } = user
  return {
    ...safeUser,
    roles: roles.map(r => r.name),
    permissions: permissions.map(p => p.code),
  }
}

export function getUserByUsername(username: string): User | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User) || null
}

export function createUser(data: {
  username: string
  password: string
  full_name?: string
  email?: string
  role_ids?: string[]
}): any {
  const db = getDatabase()
  const id = uuidv4()
  const passwordHash = bcrypt.hashSync(data.password, 10)

  db.prepare(
    `INSERT INTO users (id, username, password_hash, full_name, email, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).run(id, data.username, passwordHash, data.full_name || null, data.email || null)

  if (data.role_ids) {
    const insertUserRole = db.prepare(
      'INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)'
    )
    for (const roleId of data.role_ids) {
      insertUserRole.run(uuidv4(), id, roleId)
    }
  }

  return getUserById(id)
}

export function updateUser(
  id: string,
  data: { full_name?: string; email?: string; is_active?: number }
): any {
  const db = getDatabase()
  const updates: string[] = []
  const values: any[] = []

  if (data.full_name !== undefined) {
    updates.push('full_name = ?')
    values.push(data.full_name)
  }
  if (data.email !== undefined) {
    updates.push('email = ?')
    values.push(data.email)
  }
  if (data.is_active !== undefined) {
    updates.push('is_active = ?')
    values.push(data.is_active)
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getUserById(id)
}

export function deleteUser(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash)
}

export function updateLastLogin(id: string): void {
  const db = getDatabase()
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id)
}

export function changePassword(id: string, newPassword: string): void {
  const db = getDatabase()
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, id)
}