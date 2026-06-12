import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onSave: () => void
  onCopy: () => void
  onPaste: () => void
  onCut?: () => void
  onDuplicate?: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSelectAll: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handlers.onUndo()
        return
      }

      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handlers.onRedo()
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused) {
        e.preventDefault()
        handlers.onDelete()
        return
      }

      if (mod && e.key === 's') {
        e.preventDefault()
        handlers.onSave()
        return
      }

      if (mod && e.key === 'a') {
        e.preventDefault()
        handlers.onSelectAll()
        return
      }

      if (mod && e.key === 'x') {
        e.preventDefault()
        handlers.onCut?.()
        return
      }

      if (mod && e.key === 'd') {
        e.preventDefault()
        handlers.onDuplicate?.()
        return
      }

      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        handlers.onZoomIn()
        return
      }

      if (mod && e.key === '-') {
        e.preventDefault()
        handlers.onZoomOut()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}