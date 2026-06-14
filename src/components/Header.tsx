import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-white px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">LabelForge Studio</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/templates/new')}
          className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          + New Label
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-md px-2 py-1 text-sm text-[var(--text-secondary)] transition-colors hover:bg-slate-100 hover:text-[var(--color-primary)]"
        >
          Home
        </button>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{user?.username}</span>
        </div>
      </div>
    </header>
  )
}
