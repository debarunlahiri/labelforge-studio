import { useEffect, useState } from 'react'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await window.electronAPI?.users.list() || []
      setUsers(data)
    } catch {}
  }

  const handleCreate = async () => {
    if (!formData.username.trim() || !formData.password.trim()) return
    try {
      await window.electronAPI?.users.create(formData)
      setShowCreateForm(false)
      setFormData({ username: '', password: '', full_name: '', email: '' })
      loadUsers()
    } catch (error: any) {
      alert(`Failed to create user: ${error.message}`)
    }
  }

  const handleToggleActive = async (id: string, isActive: number) => {
    await window.electronAPI?.users.update(id, { is_active: isActive ? 0 : 1 })
    loadUsers()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await window.electronAPI?.users.delete(id)
      loadUsers()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          + Add User
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Create User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.username.trim() || !formData.password.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              Create User
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Username</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Full Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Email</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-[var(--border-color)] hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{user.username}</td>
                  <td className="px-4 py-3">{user.full_name || '-'}</td>
                  <td className="px-4 py-3">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{user.role_names || 'No role'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}