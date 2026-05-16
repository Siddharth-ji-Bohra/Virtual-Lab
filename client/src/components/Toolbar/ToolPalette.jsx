import { useCanvasStore } from '../../stores/canvasStore'
import {
  MousePointer2, Square, Circle, Hexagon,
  Link, Grip, Anchor, Cog, Eraser,
  ArrowUpRight, Zap
} from 'lucide-react'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select', group: 'general' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', group: 'bodies' },
  { id: 'circle', icon: Circle, label: 'Circle', group: 'bodies' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon', group: 'bodies' },
  { id: 'rope', icon: Link, label: 'Rope', group: 'constraints' },
  { id: 'spring', icon: Grip, label: 'Spring', group: 'constraints' },
  { id: 'pivot', icon: Anchor, label: 'Pivot', group: 'constraints' },
  { id: 'motor', icon: Cog, label: 'Motor', group: 'constraints' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', group: 'general' },
]

export default function ToolPalette() {
  const { activeTool, setActiveTool } = useCanvasStore()

  // Group tools with dividers
  const bodyTools = TOOLS.filter(t => t.group === 'bodies')
  const constraintTools = TOOLS.filter(t => t.group === 'constraints')
  const selectTool = TOOLS.find(t => t.id === 'select')
  const eraserTool = TOOLS.find(t => t.id === 'eraser')

  return (
    <aside
      className="flex flex-col items-center py-3 gap-1 border-r"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
        height: '100%',
      }}
    >
      {/* Select */}
      <ToolButton tool={selectTool} active={activeTool === selectTool.id} onClick={() => setActiveTool(selectTool.id)} />

      <Divider />

      {/* Body creation tools */}
      {bodyTools.map(tool => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
        />
      ))}

      <Divider />

      {/* Constraint tools */}
      {constraintTools.map(tool => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
        />
      ))}

      <Divider />

      {/* Eraser */}
      <ToolButton tool={eraserTool} active={activeTool === eraserTool.id} onClick={() => setActiveTool(eraserTool.id)} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom quick toggles */}
      <VectorToggle />
    </aside>
  )
}

function ToolButton({ tool, active, onClick }) {
  const Icon = tool.icon

  return (
    <button
      onClick={onClick}
      data-tooltip={tool.label}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150"
      style={{
        background: active ? 'var(--color-accent-muted)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--color-bg-hover)'
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-muted)'
        }
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: 'var(--color-accent)' }}
        />
      )}
      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
    </button>
  )
}

function Divider() {
  return (
    <div
      className="w-6 my-1"
      style={{ height: '1px', background: 'var(--color-border-default)' }}
    />
  )
}

function VectorToggle() {
  const { showForceVectors, showVelocityVectors, toggleForceVectors, toggleVelocityVectors } = useCanvasStore()

  return (
    <div className="flex flex-col items-center gap-1 mb-1">
      <button
        onClick={toggleVelocityVectors}
        title="Velocity Vectors"
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150"
        style={{
          background: showVelocityVectors ? 'var(--color-info-muted)' : 'transparent',
          color: showVelocityVectors ? 'var(--color-info)' : 'var(--color-text-muted)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ArrowUpRight size={14} />
      </button>
      <button
        onClick={toggleForceVectors}
        title="Force Vectors"
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150"
        style={{
          background: showForceVectors ? 'var(--color-warning-muted)' : 'transparent',
          color: showForceVectors ? 'var(--color-warning)' : 'var(--color-text-muted)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Zap size={14} />
      </button>
    </div>
  )
}
