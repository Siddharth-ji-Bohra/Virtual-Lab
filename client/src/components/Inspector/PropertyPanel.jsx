import { useState } from 'react'
import Matter from 'matter-js'
import { useCanvasStore } from '../../stores/canvasStore'
import { useUIStore } from '../../stores/uiStore'
import { MATERIALS, getMaterialProps } from '../../utils/materials'
import { useEngine } from '../../contexts/EngineContext'
import { X, ChevronRight, RotateCw } from 'lucide-react'

export default function PropertyPanel() {
  const { selectedBodyId, bodies, updateBodyMeta } = useCanvasStore()
  const { inspectorOpen, toggleInspector } = useUIStore()
  const { engineRef } = useEngine()
  const selectedBody = selectedBodyId ? bodies[selectedBodyId] : null

  // Helper: update both Zustand store AND the real Matter.js body
  const updateBody = (prop, value) => {
    updateBodyMeta(selectedBodyId, { [prop]: value })
    const engine = engineRef.current
    if (!engine) return
    const body = Matter.Composite.allBodies(engine.world).find(b => b.id === selectedBodyId)
    if (!body) return
    if (prop === 'mass') Matter.Body.setMass(body, value)
    else if (prop === 'density') Matter.Body.setDensity(body, value)
    else if (prop === 'color') {
      body.render.fillStyle = value  // Matter.js uses render.fillStyle, not 'color'
    }
    else if (prop === 'label') {
      body.label = value  // Update the actual Matter.js body label
    }
    else Matter.Body.set(body, prop, value)
  }

  // Apply full material preset to body
  const applyMaterial = (materialKey) => {
    const matProps = getMaterialProps(materialKey)
    const mat = MATERIALS[materialKey]
    updateBodyMeta(selectedBodyId, {
      material: materialKey,
      friction: matProps.friction,
      restitution: matProps.restitution,
      density: matProps.density,
      frictionAir: matProps.frictionAir,
    })
    const engine = engineRef.current
    if (!engine) return
    const body = Matter.Composite.allBodies(engine.world).find(b => b.id === selectedBodyId)
    if (body) {
      Matter.Body.set(body, 'friction', matProps.friction)
      Matter.Body.set(body, 'restitution', matProps.restitution)
      Matter.Body.setDensity(body, matProps.density)
      Matter.Body.set(body, 'frictionAir', matProps.frictionAir)
    }
  }

  if (!inspectorOpen) return null

  return (
    <aside
      className="flex flex-col border-l overflow-y-auto animate-slide-right"
      style={{
        width: 'var(--inspector-width)',
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Inspector
        </span>
        <button
          onClick={toggleInspector}
          className="p-1 rounded transition-colors"
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          <X size={14} />
        </button>
      </div>

      {selectedBody ? (
        <div className="flex flex-col gap-0.5">
          {/* Body Info */}
          <Section title="Object">
            <InfoRow label="Type" value={selectedBody.type || 'Body'} />
            <InfoRow label="ID" value={`#${selectedBodyId}`} mono />
            <InputRow
              label="Label"
              value={selectedBody.label || ''}
              onChange={(v) => updateBody('label', v)}
            />
          </Section>

          {/* Material */}
          <Section title="Material">
            <div className="grid grid-cols-4 gap-1.5 px-4 pb-3">
              {Object.entries(MATERIALS).map(([key, mat]) => (
                <button
                  key={key}
                  onClick={() => applyMaterial(key)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] transition-all duration-150"
                  style={{
                    background: selectedBody.material === key ? 'var(--color-accent-muted)' : 'var(--color-bg-raised)',
                    border: selectedBody.material === key ? '1px solid rgba(232,168,76,0.3)' : '1px solid transparent',
                    color: selectedBody.material === key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-sm">{mat.icon}</span>
                  <span className="font-medium">{mat.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Physics Properties */}
          <Section title="Physics">
            <SliderRow
              label="Mass"
              value={selectedBody.mass || 1}
              min={0.1}
              max={50}
              step={0.1}
              unit="kg"
              onChange={(v) => updateBody('mass', v)}
            />
            <SliderRow
              label="Friction"
              value={selectedBody.friction ?? 0.4}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateBody('friction', v)}
            />
            <SliderRow
              label="Bounce"
              value={selectedBody.restitution ?? 0.3}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateBody('restitution', v)}
            />
            <SliderRow
              label="Density"
              value={selectedBody.density ?? 0.004}
              min={0.001}
              max={0.05}
              step={0.001}
              onChange={(v) => updateBody('density', v)}
            />
            <SliderRow
              label="Air Drag"
              value={selectedBody.frictionAir ?? 0.001}
              min={0}
              max={0.1}
              step={0.001}
              onChange={(v) => updateBody('frictionAir', v)}
            />
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Color</span>
              <div className="flex gap-1.5">
                {['#60a5fa', '#c084fc', '#34d399', '#f87171', '#fbbf24', '#94a3b8', '#e8a84c', '#f472b6'].map(c => (
                  <button
                    key={c}
                    onClick={() => updateBody('color', c)}
                    className="w-5 h-5 rounded-full transition-transform duration-150"
                    style={{
                      background: c,
                      border: selectedBody.color === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                      transform: selectedBody.color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* Transform (read-only for now) */}
          <Section title="Transform">
            <InfoRow label="X" value={`${(selectedBody.x || 0).toFixed(1)} px`} mono />
            <InfoRow label="Y" value={`${(selectedBody.y || 0).toFixed(1)} px`} mono />
            <InfoRow label="Angle" value={`${((selectedBody.angle || 0) * 180 / Math.PI).toFixed(1)}°`} mono />
          </Section>
        </div>
      ) : (
        <EmptyState />
      )}
    </aside>
  )
}

/* ── Sub-components ── */

function Section({ title, children }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-4 py-2.5 text-left transition-colors"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
        }}
      >
        <ChevronRight
          size={12}
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      </button>
      {open && children}
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span
        className="text-xs"
        style={{
          color: 'var(--color-text-secondary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function InputRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 px-2 py-1 text-xs rounded-md outline-none transition-colors"
        style={{
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--color-border-default)'}
      />
    </div>
  )
}

function SliderRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="px-4 py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {typeof value === 'number' ? (value < 0.1 ? value.toFixed(3) : value.toFixed(2)) : value}
          {unit && <span style={{ color: 'var(--color-text-muted)' }}> {unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((value - min) / (max - min)) * 100}%, var(--color-bg-raised) ${((value - min) / (max - min)) * 100}%, var(--color-bg-raised) 100%)`,
          outline: 'none',
        }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center" style={{ opacity: 0.6 }}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: 'var(--color-bg-raised)' }}
      >
        <RotateCw size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        No object selected
      </p>
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        Click on a body in the canvas to inspect and edit its properties
      </p>
    </div>
  )
}
