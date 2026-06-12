import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-color)] bg-white px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">LabelForge Studio</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/templates/new')}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          + New Label
        </button>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{user?.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--color-danger)] transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}