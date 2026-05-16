import { useUIStore } from '../../stores/uiStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useRoomStore } from '../../stores/roomStore'
import {
  Play, Pause, RotateCcw, SkipForward,
  Share2, Settings, Users, ChevronDown,
  Maximize2, Grid3X3, FlaskConical
} from 'lucide-react'

export default function TopBar({ onReset, onStep }) {
  const { isRunning, toggleRunning, setRunning, showGrid, toggleGrid } = useCanvasStore()
  const { openModal } = useUIStore()
  const { roomName, users, isConnected } = useRoomStore()

  return (
    <header
      className="flex items-center justify-between px-4 border-b select-none"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {/* ── Left: Logo + Room ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), #d4772e)',
              color: 'var(--color-text-inverse)',
            }}
          >
            VL
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            VIRTUAL-LAB
          </span>
        </div>

        <div
          className="w-px h-5"
          style={{ background: 'var(--color-border-default)' }}
        />

        <button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150"
          style={{
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {roomName || 'Untitled Experiment'}
          <ChevronDown size={12} />
        </button>
      </div>

      {/* ── Center: Simulation Controls ── */}
      <div className="flex items-center gap-1">
        <SimButton
          icon={isRunning ? <Pause size={14} /> : <Play size={14} />}
          label={isRunning ? 'Pause' : 'Play'}
          onClick={toggleRunning}
          primary={!isRunning}
        />
        <SimButton
          icon={<SkipForward size={14} />}
          label="Step"
          onClick={onStep || (() => {})}
        />
        <SimButton
          icon={<RotateCcw size={14} />}
          label="Reset"
          onClick={onReset || (() => setRunning(false))}
        />

        <div
          className="w-px h-5 mx-1"
          style={{ background: 'var(--color-border-default)' }}
        />

        <SimButton
          icon={<Grid3X3 size={14} />}
          label="Grid"
          onClick={toggleGrid}
          active={showGrid}
        />
      </div>

      {/* ── Right: Users + Actions ── */}
      <div className="flex items-center gap-2">
        {/* User Avatars */}
        <div className="flex items-center -space-x-2 mr-1">
          {(users.length > 0 ? users.slice(0, 4) : [{ id: 'you', username: 'You' }]).map((user, i) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2"
              style={{
                background: `hsl(${(i * 72 + 200) % 360}, 50%, 45%)`,
                color: '#fff',
                ringColor: 'var(--color-bg-surface)',
                zIndex: 10 - i,
              }}
              title={user.username}
            >
              {(user.username || 'U')[0].toUpperCase()}
            </div>
          ))}
        </div>

        <button
          onClick={() => openModal('experiments')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
          style={{
            background: 'rgba(192, 132, 252, 0.1)',
            color: '#c084fc',
            border: '1px solid rgba(192, 132, 252, 0.2)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(192, 132, 252, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(192, 132, 252, 0.1)'}
        >
          <FlaskConical size={12} />
          Lab
        </button>

        <button
          onClick={() => openModal('share')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
          style={{
            background: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
            border: '1px solid rgba(232, 168, 76, 0.25)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(232, 168, 76, 0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-muted)'
          }}
        >
          <Share2 size={12} />
          Share
        </button>

        <button
          onClick={() => openModal('settings')}
          className="p-1.5 rounded-md transition-colors duration-150"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-hover)'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-muted)'
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}

/**
 * Small simulation control button
 */
function SimButton({ icon, label, onClick, primary, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
      style={{
        background: primary
          ? 'var(--color-accent)'
          : active
          ? 'var(--color-bg-active)'
          : 'transparent',
        color: primary
          ? 'var(--color-text-inverse)'
          : active
          ? 'var(--color-text-primary)'
          : 'var(--color-text-secondary)',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!primary) e.currentTarget.style.background = 'var(--color-bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!primary && !active) e.currentTarget.style.background = 'transparent'
        else if (active) e.currentTarget.style.background = 'var(--color-bg-active)'
      }}
    >
      {icon}
    </button>
  )
}
