import { create } from 'zustand'

interface AuthState {
  user: any | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

declare global {
  interface Window {
    electronAPI?: any
  }
}

function getApi() {
  return window.electronAPI
}

const AUTO_LOGIN_ENABLED = true

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getApi().auth.login(username, password)
      if (result.success) {
        set({ user: result.user, isAuthenticated: true, isLoading: false, error: null })
        return true
      } else {
        set({ isLoading: false, error: result.error })
        return false
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      return false
    }
  },

  logout: async () => {
    try {
      await getApi().auth.logout()
    } catch {}
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    if (AUTO_LOGIN_ENABLED) {
      try {
        const result = await getApi().auth.login('admin', 'admin')
        if (result.success) {
          set({ user: result.user, isAuthenticated: true })
          return
        }
      } catch {}
    }
    try {
      const user = await getApi().auth.getCurrentUser()
      if (user) {
        set({ user, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },

  clearError: () => set({ error: null }),
}))