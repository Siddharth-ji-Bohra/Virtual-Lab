import { useEffect, useRef, useCallback } from 'react'
import Matter from 'matter-js'
import TopBar from './components/Layout/TopBar'
import ToolPalette from './components/Toolbar/ToolPalette'
import PhysicsCanvas from './components/Canvas/PhysicsCanvas'
import PropertyPanel from './components/Inspector/PropertyPanel'
import BottomPanel from './components/Dashboard/BottomPanel'
import RoomLobby from './components/Room/RoomLobby'
import ExperimentGallery from './components/Experiments/ExperimentGallery'
import ErrorBoundary from './components/ErrorBoundary'
import { EngineProvider, useEngine } from './contexts/EngineContext'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import useUndoRedo from './hooks/useUndoRedo'
import useSocket from './hooks/useSocket'
import useAnalytics from './hooks/useAnalytics'
import { useRoomStore } from './stores/roomStore'
import { useCanvasStore } from './stores/canvasStore'
import { serializeWorld, deserializeWorld, resetWorld } from './utils/physicsSerializer'

function AppContent() {
  const {
    joinRoom, leaveRoom,
    sendExperiment, onExperimentLoaded,
    sendWorldSync, onWorldSync,
    sendSimState, onSimState,
  } = useSocket()
  const { isConnected, roomCode } = useRoomStore()
  const { data, collisions, exportCSV, clearCollisions } = useAnalytics(100)
  const { engineRef } = useEngine()
  const { undo, redo, clear: clearHistory } = useUndoRedo()

  // Prevent infinite sync loops: true while applying incoming remote changes
  const isSyncingRef = useRef(false)
  // Track body count to detect local changes (body creation/deletion)
  const lastBodyCountRef = useRef(0)

  useKeyboardShortcuts({ onUndo: undo, onRedo: redo })

  // ──────────────────────────────────────────
  // RECEIVE: Experiment loaded by another user
  // ──────────────────────────────────────────
  useEffect(() => {
    return onExperimentLoaded((snapshot) => {
      const engine = engineRef.current
      if (!engine || !snapshot) return
      isSyncingRef.current = true
      deserializeWorld(engine, snapshot, useCanvasStore)
      useCanvasStore.getState().setRunning(false)
      clearHistory()
      clearCollisions()
      isSyncingRef.current = false
    })
  }, [onExperimentLoaded])

  // ──────────────────────────────────────────
  // RECEIVE: Full world state from another user
  // ──────────────────────────────────────────
  useEffect(() => {
    return onWorldSync((snapshot) => {
      const engine = engineRef.current
      if (!engine || !snapshot) return
      isSyncingRef.current = true
      deserializeWorld(engine, snapshot, useCanvasStore)
      isSyncingRef.current = false
    })
  }, [onWorldSync])

  // ──────────────────────────────────────────
  // RECEIVE: Play/Pause state from another user
  // ──────────────────────────────────────────
  useEffect(() => {
    return onSimState((isRunning) => {
      isSyncingRef.current = true
      useCanvasStore.getState().setRunning(isRunning)
      isSyncingRef.current = false
    })
  }, [onSimState])

  // ──────────────────────────────────────────
  // SEND: Periodic world sync while in a room
  // Broadcasts full world state every 500ms
  // This syncs body creation, constraint creation,
  // physics positions, and everything else
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return

    const interval = setInterval(() => {
      const engine = engineRef.current
      if (!engine || isSyncingRef.current) return

      const snapshot = serializeWorld(engine)
      sendWorldSync(snapshot)
    }, 500)

    return () => clearInterval(interval)
  }, [roomCode, sendWorldSync])

  // ──────────────────────────────────────────
  // SEND: Play/Pause state changes
  // Subscribe to isRunning changes in the store
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return

    const unsub = useCanvasStore.subscribe(
      (state) => state.isRunning,
      (isRunning) => {
        if (isSyncingRef.current) return
        sendSimState(isRunning)
      }
    )

    return unsub
  }, [roomCode, sendSimState])

  // ──────────────────────────────────────────
  // Room join/leave handlers
  // ──────────────────────────────────────────
  const handleJoinRoom = (code, roomName) => {
    joinRoom(code, {
      username: `User-${Math.random().toString(36).slice(2, 6)}`,
      roomName: roomName || code,
    })
  }

  // ──────────────────────────────────────────
  // Experiment loading
  // ──────────────────────────────────────────
  const handleLoadExperiment = (experiment) => {
    const engine = engineRef.current
    if (!engine || !experiment.snapshot) return
    deserializeWorld(engine, experiment.snapshot, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    clearHistory()
    clearCollisions()

    // Broadcast to room peers
    if (roomCode) {
      sendExperiment(experiment.snapshot)
    }
  }

  // ──────────────────────────────────────────
  // World reset
  // ──────────────────────────────────────────
  const handleReset = () => {
    const engine = engineRef.current
    if (!engine) return
    resetWorld(engine, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    useCanvasStore.getState().clearSelection()
    clearHistory()
    clearCollisions()

    // Sync empty world to room
    if (roomCode) {
      const snapshot = serializeWorld(engine)
      sendWorldSync(snapshot)
    }
  }

  // ──────────────────────────────────────────
  // Step forward one frame
  // ──────────────────────────────────────────
  const handleStep = () => {
    const engine = engineRef.current
    if (!engine) return
    useCanvasStore.getState().setRunning(false)
    Matter.Engine.update(engine, 1000 / 60)

    // Sync after step
    if (roomCode) {
      const snapshot = serializeWorld(engine)
      sendWorldSync(snapshot)
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--color-bg-deep)' }}>
      <TopBar onReset={handleReset} onStep={handleStep} />
      <div className="flex flex-1 min-h-0">
        <ToolPalette />
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex flex-1 min-h-0">
            <ErrorBoundary label="Canvas crashed">
              <PhysicsCanvas />
            </ErrorBoundary>
            <PropertyPanel />
          </div>
          <ErrorBoundary label="Analytics error">
            <BottomPanel data={data} collisions={collisions} onExport={exportCSV} />
          </ErrorBoundary>
        </div>
      </div>
      <RoomLobby onJoinRoom={handleJoinRoom} onLeaveRoom={leaveRoom} isConnected={isConnected} />
      <ExperimentGallery onLoadExperiment={handleLoadExperiment} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary label="Application error">
      <EngineProvider>
        <AppContent />
      </EngineProvider>
    </ErrorBoundary>
  )
}
