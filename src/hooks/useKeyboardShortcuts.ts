import { useEffect } from 'react'

interface KeyboardShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onSave: () => void
  onSaveAs?: () => void
  onPrint?: () => void
  onCopy: () => void
  onPaste: () => void
  onCut?: () => void
  onDuplicate?: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSelectAll: () => void
  onNudge?: (deltaX: number, deltaY: number) => void
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

      if (isInputFocused && !(mod && (key === 's' || key === 'p'))) return

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

      if (!isInputFocused && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        const distance = e.shiftKey ? 10 : 1
        const offsets: Record<string, [number, number]> = {
          ArrowLeft: [-distance, 0],
          ArrowRight: [distance, 0],
          ArrowUp: [0, -distance],
          ArrowDown: [0, distance],
        }
        handlers.onNudge?.(...offsets[e.key])
        return
      }

      if (mod && key === 's') {
        e.preventDefault()
        if (e.shiftKey) handlers.onSaveAs?.()
        else handlers.onSave()
        return
      }

      if (mod && key === 'p') {
        e.preventDefault()
        e.stopPropagation()
        handlers.onPrint?.()
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
