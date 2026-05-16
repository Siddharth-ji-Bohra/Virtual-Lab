import { useEffect } from 'react'
import { useCanvasStore } from '../stores/canvasStore'

/**
 * useKeyboardShortcuts — Global keyboard shortcuts for the workspace
 */
export default function useKeyboardShortcuts({ onUndo, onRedo }) {
  const { setActiveTool, toggleRunning, clearSelection, toggleGrid } = useCanvasStore()

  useEffect(() => {
    const handler = (e) => {
      // Don't fire if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const ctrl = e.ctrlKey || e.metaKey

      // Undo / Redo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo?.()
      }
      if (ctrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey)) ) {
        e.preventDefault()
        onRedo?.()
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault()
        onRedo?.()
      }

      // Tool shortcuts
      if (!ctrl) {
        switch (e.key) {
          case 'v': case 'V': setActiveTool('select'); break
          case 'r': case 'R': setActiveTool('rectangle'); break
          case 'c': case 'C': setActiveTool('circle'); break
          case 'p': case 'P': setActiveTool('polygon'); break
          case 'e': case 'E': setActiveTool('eraser'); break
          case 'g': case 'G': toggleGrid(); break
          case ' ':
            e.preventDefault()
            toggleRunning()
            break
          case 'Escape':
            setActiveTool('select')
            clearSelection()
            break
          case 'Delete':
          case 'Backspace':
            // Delete selected body — handled by canvas
            break
        }
      }

      // Reset zoom
      if (ctrl && e.key === '0') {
        e.preventDefault()
        useCanvasStore.getState().setZoom(1)
        useCanvasStore.getState().setPanOffset({ x: 0, y: 0 })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onUndo, onRedo, setActiveTool, toggleRunning, clearSelection, toggleGrid])
}
