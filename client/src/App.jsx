import { useEffect, useRef } from 'react'
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
  const { isConnected, roomCode, hostId, currentUserId } = useRoomStore()
  const { data, collisions, exportCSV, clearCollisions } = useAnalytics(100)
  const { engineRef } = useEngine()
  const { undo, redo, clear: clearHistory } = useUndoRedo()

  // Prevent sync loops: true while applying incoming data
  const isSyncingRef = useRef(false)

  // Am I the room host?
  const isHost = !!(hostId && hostId === currentUserId)

  useKeyboardShortcuts({ onUndo: undo, onRedo: redo })

  // ──────────────────────────────────────────
  // RECEIVE: Experiment loaded by a peer
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
      setTimeout(() => { isSyncingRef.current = false }, 200)
    })
  }, [onExperimentLoaded])

  // ──────────────────────────────────────────
  // RECEIVE: Full world state from a peer
  // ──────────────────────────────────────────
  useEffect(() => {
    return onWorldSync((snapshot) => {
      const engine = engineRef.current
      if (!engine || !snapshot) return
      isSyncingRef.current = true
      deserializeWorld(engine, snapshot, useCanvasStore)
      setTimeout(() => { isSyncingRef.current = false }, 200)
    })
  }, [onWorldSync])

  // ──────────────────────────────────────────
  // RECEIVE: Play/Pause from a peer
  // ──────────────────────────────────────────
  useEffect(() => {
    return onSimState((isRunning) => {
      isSyncingRef.current = true
      useCanvasStore.getState().setRunning(isRunning)
      setTimeout(() => { isSyncingRef.current = false }, 200)
    })
  }, [onSimState])

  // ──────────────────────────────────────────
  // SEND: Host-only periodic world sync (every 1s)
  // Only the HOST broadcasts the authoritative world state.
  // Non-host clients NEVER periodically sync — they only
  // send on explicit actions (body creation etc).
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!roomCode || !isHost) return

    const interval = setInterval(() => {
      const engine = engineRef.current
      if (!engine || isSyncingRef.current) return
      const snapshot = serializeWorld(engine)
      sendWorldSync(snapshot)
    }, 1000)

    return () => clearInterval(interval)
  }, [roomCode, isHost, sendWorldSync])

  // ──────────────────────────────────────────
  // SEND: Play/Pause sync
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return
    const unsub = useCanvasStore.subscribe(
      (state) => state.isRunning,
      (isRunning) => {
        if (!isSyncingRef.current) sendSimState(isRunning)
      }
    )
    return unsub
  }, [roomCode, sendSimState])

  // ──────────────────────────────────────────
  // Room join/leave
  // ──────────────────────────────────────────
  const handleJoinRoom = (code, roomName) => {
    joinRoom(code, {
      username: `User-${Math.random().toString(36).slice(2, 6)}`,
      roomName: roomName || code,
    })
  }

  // ──────────────────────────────────────────
  // Load experiment — sync to peers
  // ──────────────────────────────────────────
  const handleLoadExperiment = (experiment) => {
    const engine = engineRef.current
    if (!engine || !experiment.snapshot) return
    deserializeWorld(engine, experiment.snapshot, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    clearHistory()
    clearCollisions()

    if (roomCode) sendExperiment(experiment.snapshot)
  }

  // ──────────────────────────────────────────
  // Reset world — sync to peers
  // ──────────────────────────────────────────
  const handleReset = () => {
    const engine = engineRef.current
    if (!engine) return
    resetWorld(engine, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    useCanvasStore.getState().clearSelection()
    clearHistory()
    clearCollisions()

    if (roomCode) {
      const snapshot = serializeWorld(engine)
      sendWorldSync(snapshot)
    }
  }

  // ──────────────────────────────────────────
  // Step forward
  // ──────────────────────────────────────────
  const handleStep = () => {
    const engine = engineRef.current
    if (!engine) return
    useCanvasStore.getState().setRunning(false)
    Matter.Engine.update(engine, 1000 / 60)

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
