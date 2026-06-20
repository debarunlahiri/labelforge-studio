import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onSave: () => void
  onSaveAs?: () => void
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
      const key = e.key.toLowerCase()
      const isZoomInKey =
        e.code === 'Equal' ||
        e.code === 'NumpadAdd' ||
        key === '=' ||
        key === '+'
      const isZoomOutKey =
        e.code === 'Minus' ||
        e.code === 'NumpadSubtract' ||
        key === '-' ||
        key === '_'
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)

      if (isInputFocused && !(mod && key === 's')) return

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handlers.onUndo()
        return
      }

      if ((mod && key === 'z' && e.shiftKey) || (mod && key === 'y')) {
        e.preventDefault()
        handlers.onRedo()
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused) {
        e.preventDefault()
        handlers.onDelete()
        return
      }

      if (mod && key === 's') {
        e.preventDefault()
        if (e.shiftKey) handlers.onSaveAs?.()
        else handlers.onSave()
        return
      }

      if (mod && key === 'a') {
        e.preventDefault()
        handlers.onSelectAll()
        return
      }

      if (mod && key === 'x') {
        e.preventDefault()
        handlers.onCut?.()
        return
      }

      if (mod && key === 'c') {
        e.preventDefault()
        handlers.onCopy()
        return
      }

      if (mod && key === 'v') {
        e.preventDefault()
        handlers.onPaste()
        return
      }

      if (mod && key === 'd') {
        e.preventDefault()
        handlers.onDuplicate?.()
        return
      }

      if (mod && isZoomInKey) {
        e.preventDefault()
        e.stopPropagation()
        handlers.onZoomIn()
        return
      }

      if (mod && isZoomOutKey) {
        e.preventDefault()
        e.stopPropagation()
        handlers.onZoomOut()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
