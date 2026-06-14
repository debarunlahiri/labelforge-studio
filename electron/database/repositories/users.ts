import { query, queryOne, run, runDelete } from '../dbHelpers'
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
  const users = query(`
    SELECT u.*, GROUP_CONCAT(DISTINCT r.name) as role_names
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `)
  return users.map(({ password_hash, ...user }: any) => user)
}

export function getUserById(id: string): any | null {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [id])
  if (!user) return null

  const roles = query('SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?', [id])
  const permissions = query('SELECT DISTINCT p.code FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id JOIN user_roles ur ON rp.role_id = ur.role_id WHERE ur.user_id = ?', [id])

  const { password_hash, ...safeUser } = user
  return {
    ...safeUser,
    roles: roles.map((r: any) => r.name),
    permissions: permissions.map((p: any) => p.code),
  }
}

export function getUserByUsername(username: string): User | null {
  return queryOne('SELECT * FROM users WHERE username = ?', [username]) as User | null
}

export function createUser(data: {
  username: string
  password: string
  full_name?: string
  email?: string
  role_ids?: string[]
}): any {
  const id = uuidv4()
  const passwordHash = bcrypt.hashSync(data.password, 10)

  run(
    'INSERT INTO users (id, username, password_hash, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [id, data.username, passwordHash, data.full_name || null, data.email || null]
  )

  if (data.role_ids) {
    for (const roleId of data.role_ids) {
      run('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)', [uuidv4(), id, roleId])
    }
  }

  return getUserById(id)
}

export function updateUser(
  id: string,
  data: { full_name?: string; email?: string; is_active?: number }
): any {
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

  run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
  return getUserById(id)
}

export function deleteUser(id: string): boolean {
  return runDelete('DELETE FROM users WHERE id = ?', [id])
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash)
}

export function updateLastLogin(id: string): void {
  run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [id])
}

export function changePassword(id: string, newPassword: string): void {
  const hash = bcrypt.hashSync(newPassword, 10)
  run('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?', [hash, id])
}