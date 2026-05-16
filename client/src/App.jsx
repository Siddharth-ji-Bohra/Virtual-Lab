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
import { deserializeWorld, resetWorld } from './utils/physicsSerializer'

function AppContent() {
  const { joinRoom, leaveRoom } = useSocket()
  const { isConnected } = useRoomStore()
  const { data, collisions, exportCSV, clearCollisions } = useAnalytics(100)
  const { engineRef } = useEngine()
  const { undo, redo, clear: clearHistory } = useUndoRedo()

  useKeyboardShortcuts({ onUndo: undo, onRedo: redo })

  const handleJoinRoom = (code, roomName) => {
    joinRoom(code, {
      username: `User-${Math.random().toString(36).slice(2, 6)}`,
      roomName: roomName || code,
    })
  }

  const handleLoadExperiment = (experiment) => {
    const engine = engineRef.current
    if (!engine || !experiment.snapshot) return
    deserializeWorld(engine, experiment.snapshot, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    clearHistory()      // clear undo stack — can't undo an experiment load
    clearCollisions()   // clear old collision data
  }

  const handleReset = () => {
    const engine = engineRef.current
    if (!engine) return
    resetWorld(engine, useCanvasStore)
    useCanvasStore.getState().setRunning(false)
    useCanvasStore.getState().clearSelection()
    clearHistory()
    clearCollisions()
  }

  const handleStep = () => {
    const engine = engineRef.current
    if (!engine) return
    // Ensure simulation is paused, then advance one frame
    useCanvasStore.getState().setRunning(false)
    Matter.Engine.update(engine, 1000 / 60)  // single 16.67ms step
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
