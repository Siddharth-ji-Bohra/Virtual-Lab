import { useRef, useCallback } from 'react'
import Matter from 'matter-js'

const { Composite } = Matter

/**
 * useUndoRedo — Command pattern undo/redo system
 * Stores actions as { execute, undo } pairs
 */
export default function useUndoRedo(maxHistory = 50) {
  const undoStack = useRef([])
  const redoStack = useRef([])

  const execute = useCallback((command) => {
    command.execute()
    undoStack.current.push(command)
    if (undoStack.current.length > maxHistory) {
      undoStack.current.shift()
    }
    redoStack.current = [] // clear redo on new action
  }, [maxHistory])

  const undo = useCallback(() => {
    const command = undoStack.current.pop()
    if (command) {
      command.undo()
      redoStack.current.push(command)
    }
  }, [])

  const redo = useCallback(() => {
    const command = redoStack.current.pop()
    if (command) {
      command.execute()
      undoStack.current.push(command)
    }
  }, [])

  const canUndo = useCallback(() => undoStack.current.length > 0, [])
  const canRedo = useCallback(() => redoStack.current.length > 0, [])

  const clear = useCallback(() => {
    undoStack.current = []
    redoStack.current = []
  }, [])

  return { execute, undo, redo, canUndo, canRedo, clear }
}

/**
 * Command factories for physics actions
 */
export function createAddBodyCommand(engine, body, store) {
  return {
    execute: () => {
      Composite.add(engine.world, body)
      store.registerBody(body.id, {
        type: body.label.toLowerCase(),
        label: body.label,
        material: 'custom',
        color: body.render?.fillStyle || '#60a5fa',
        mass: body.mass,
        friction: body.friction,
        restitution: body.restitution,
        density: body.density,
        frictionAir: body.frictionAir,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
      })
    },
    undo: () => {
      Composite.remove(engine.world, body)
      store.unregisterBody(body.id)
      store.clearSelection()
    },
  }
}

export function createRemoveBodyCommand(engine, body, meta, store) {
  return {
    execute: () => {
      Composite.remove(engine.world, body)
      store.unregisterBody(body.id)
      store.clearSelection()
    },
    undo: () => {
      Composite.add(engine.world, body)
      store.registerBody(body.id, meta)
    },
  }
}
