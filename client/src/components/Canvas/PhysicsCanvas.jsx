import { useEffect, useRef, useCallback } from 'react'
import Matter from 'matter-js'
import { useCanvasStore } from '../../stores/canvasStore'
import { getMaterialProps, BODY_DEFAULTS, CONSTRAINT_DEFAULTS } from '../../utils/materials'
import { useEngine } from '../../contexts/EngineContext'

const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body, Constraint, Vector } = Matter

// Labels for ground/wall bodies (never removed during reset or experiment load)
const BOUNDARY_LABELS = new Set(['Ground', 'Wall-L', 'Wall-R'])

/**
 * PhysicsCanvas — Core 2D physics simulation.
 *
 * IMPORTANT DESIGN NOTE:
 * All click interactions (select, eraser, body creation, constraint creation)
 * are handled via the React canvas `onClick` handler — NOT via Matter.js
 * MouseConstraint events. This is because MC events only fire when the engine
 * is actively updating (Runner running). Since users typically build scenes
 * while paused, we MUST use React events for click handling.
 *
 * The MouseConstraint is ONLY used for body dragging in select mode.
 */
export default function PhysicsCanvas() {
  const canvasRef = useRef(null)
  const { engineRef, renderRef } = useEngine()
  const runnerRef = useRef(null)
  const rafRef = useRef(null)
  const mcRef = useRef(null)

  // Constraint creation: tracks first body clicked
  const constraintFirstBodyRef = useRef(null)

  // Motor tracking: continuously applies angular velocity
  // Each entry: { constraintId, bodyId, speed }
  const motorsRef = useRef([])

  const {
    activeTool, isRunning, gravity, showGrid,
    showForceVectors, showVelocityVectors,
    selectedBodyId, setSelectedBodyId, clearSelection,
    registerBody, unregisterBody, updateBodyMeta,
    registerConstraint, unregisterConstraint,
    bodies, zoom, setZoom, panOffset, setPanOffset,
  } = useCanvasStore()

  const activeToolRef = useRef(activeTool)
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])

  // ── Enable/Disable MouseConstraint based on active tool ──
  useEffect(() => {
    const mc = mcRef.current
    if (!mc) return
    if (activeTool === 'select') {
      mc.constraint.stiffness = 0.2
    } else {
      mc.constraint.stiffness = 0
      mc.constraint.bodyB = null
    }
    // Clear constraint first-body when switching away from constraint tools
    if (!['rope', 'spring', 'pivot', 'motor', 'weld'].includes(activeTool)) {
      constraintFirstBodyRef.current = null
    }
  }, [activeTool])

  // ── Initialize Matter.js ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    const width = container.clientWidth
    const height = container.clientHeight

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } })
    engineRef.current = engine

    const render = Render.create({
      canvas, engine,
      options: {
        width, height, wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    })
    renderRef.current = render

    const runner = Runner.create()
    runnerRef.current = runner

    const mouse = Mouse.create(canvas)
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    })
    mcRef.current = mc
    Composite.add(engine.world, mc)
    render.mouse = mouse

    // Ground + walls
    const ground = Bodies.rectangle(width / 2, height - 15, width + 100, 30, {
      isStatic: true, label: 'Ground',
      render: { fillStyle: '#1e2838', strokeStyle: '#2a3548', lineWidth: 1 },
    })
    const wallL = Bodies.rectangle(-15, height / 2, 30, height + 100, {
      isStatic: true, label: 'Wall-L',
      render: { fillStyle: '#1e2838', strokeStyle: '#2a3548', lineWidth: 1 },
    })
    const wallR = Bodies.rectangle(width + 15, height / 2, 30, height + 100, {
      isStatic: true, label: 'Wall-R',
      render: { fillStyle: '#1e2838', strokeStyle: '#2a3548', lineWidth: 1 },
    })
    Composite.add(engine.world, [ground, wallL, wallR])

    // ── Motor engine: apply angular velocity on every physics tick ──
    Events.on(engine, 'beforeUpdate', () => {
      motorsRef.current.forEach(motor => {
        const body = Composite.allBodies(engine.world).find(b => b.id === motor.bodyId)
        if (body) {
          Body.setAngularVelocity(body, motor.speed)
        }
      })
    })

    Render.run(render)

    // Resize
    const handleResize = () => {
      const w = container.clientWidth, h = container.clientHeight
      render.canvas.width = w * (window.devicePixelRatio || 1)
      render.canvas.height = h * (window.devicePixelRatio || 1)
      render.canvas.style.width = w + 'px'
      render.canvas.style.height = h + 'px'
      render.options.width = w
      render.options.height = h
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      Render.stop(render)
      Runner.stop(runner)
      Engine.clear(engine)
      render.canvas = null
      render.context = null
    }
  }, [])

  // Toggle running
  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return
    if (isRunning) Runner.run(runnerRef.current, engineRef.current)
    else Runner.stop(runnerRef.current)
  }, [isRunning])

  // Update gravity
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.x = gravity.x
      engineRef.current.gravity.y = gravity.y
    }
  }, [gravity])

  // ══════════════════════════════════════════════════════════════
  // UNIFIED CLICK HANDLER — handles ALL tools via React onClick
  // This works whether the simulation is running or paused.
  // ══════════════════════════════════════════════════════════════
  const handleCanvasClick = useCallback((e) => {
    const tool = activeToolRef.current
    const engine = engineRef.current
    if (!engine) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pos = { x, y }

    // Helper: find body at click position
    const allBodies = Composite.allBodies(engine.world)
    const findBodyAtPos = () => allBodies.find(b => {
      if (BOUNDARY_LABELS.has(b.label)) return false
      return Matter.Bounds.contains(b.bounds, pos) &&
        Matter.Vertices.contains(b.vertices, pos)
    })

    // ── SELECT TOOL ──
    if (tool === 'select') {
      const body = findBodyAtPos()
      if (body) {
        setSelectedBodyId(body.id)
        updateBodyMeta(body.id, {
          x: body.position.x, y: body.position.y, angle: body.angle,
        })
      } else {
        clearSelection()
      }
      return
    }

    // ── ERASER TOOL ──
    if (tool === 'eraser') {
      const body = findBodyAtPos()
      if (body) {
        // Remove connected constraints first
        const allConstraints = Composite.allConstraints(engine.world)
        allConstraints.forEach(c => {
          if (c.bodyA === body || c.bodyB === body) {
            Composite.remove(engine.world, c)
            unregisterConstraint(c.id)
            // Clean up motor entries for this constraint
            motorsRef.current = motorsRef.current.filter(m => m.constraintId !== c.id)
          }
        })
        // Also clean up any motor entries referencing this body
        motorsRef.current = motorsRef.current.filter(m => m.bodyId !== body.id)
        Composite.remove(engine.world, body)
        unregisterBody(body.id)
        clearSelection()
      }
      return
    }

    // ── BODY CREATION TOOLS ──
    if (['circle', 'rectangle', 'polygon'].includes(tool)) {
      let newBody = null
      const defMap = { circle: 'metal', rectangle: 'wood', polygon: 'stone' }
      const defaults = BODY_DEFAULTS[tool]
      const matProps = getMaterialProps(defMap[tool])
      const renderStyle = {
        fillStyle: defaults.color,
        strokeStyle: 'rgba(255,255,255,0.12)',
        lineWidth: 1,
      }

      if (tool === 'circle') {
        newBody = Bodies.circle(x, y, defaults.radius, { ...matProps, render: renderStyle, label: 'Circle' })
      } else if (tool === 'rectangle') {
        newBody = Bodies.rectangle(x, y, defaults.width, defaults.height, { ...matProps, render: renderStyle, label: 'Rectangle' })
      } else if (tool === 'polygon') {
        newBody = Bodies.polygon(x, y, defaults.sides, defaults.radius, { ...matProps, render: renderStyle, label: 'Polygon' })
      }

      if (newBody) {
        Composite.add(engine.world, newBody)
        registerBody(newBody.id, {
          type: tool, label: newBody.label,
          material: defMap[tool], color: defaults.color,
          mass: newBody.mass, friction: newBody.friction,
          restitution: newBody.restitution, density: newBody.density,
          frictionAir: newBody.frictionAir,
          x: newBody.position.x, y: newBody.position.y, angle: newBody.angle,
        })
        setSelectedBodyId(newBody.id)
      }
      return
    }

    // ── CONSTRAINT CREATION TOOLS (rope, spring, pivot, motor, weld) ──
    if (['rope', 'spring', 'pivot', 'motor', 'weld'].includes(tool)) {
      const body = findBodyAtPos()
      if (body) {
        if (!constraintFirstBodyRef.current) {
          // First click: store body A
          constraintFirstBodyRef.current = body
        } else if (constraintFirstBodyRef.current.id !== body.id) {
          // Second click on different body: create the constraint
          const bodyA = constraintFirstBodyRef.current
          const bodyB = body
          const defaults = CONSTRAINT_DEFAULTS[tool] || CONSTRAINT_DEFAULTS.rope
          const dist = Vector.magnitude(Vector.sub(bodyA.position, bodyB.position))

          // All constraints maintain the actual distance between bodies.
          // The behavioral difference comes from stiffness, damping, and rotation:
          //   Rope:   low stiffness (flexible, stretchy)
          //   Spring: very low stiffness (bouncy)
          //   Pivot:  high stiffness, no damping (rigid bar, free rotation)
          //   Motor:  high stiffness + continuous angular velocity on bodyB
          //   Weld:   max stiffness + high damping (rigid, resists rotation)

          // Override stiffness/damping per tool for correct behavior
          let stiffness = defaults.stiffness
          let damping = defaults.damping
          let constraintLength = dist

          if (tool === 'pivot') {
            stiffness = 0.7
            damping = 0
          } else if (tool === 'motor') {
            stiffness = 0.7
            damping = 0
          } else if (tool === 'weld') {
            stiffness = 1.0
            damping = 0.3
          }

          const constraintOpts = {
            bodyA, bodyB,
            stiffness,
            damping,
            length: constraintLength,
            render: {
              visible: true,
              strokeStyle: defaults.color,
              lineWidth: tool === 'weld' ? 3 : 2,
              type: 'line',
            },
            label: defaults.label,
          }

          const constraint = Constraint.create(constraintOpts)
          Composite.add(engine.world, constraint)

          // If motor: register it for continuous angular velocity
          if (tool === 'motor') {
            motorsRef.current.push({
              constraintId: constraint.id,
              bodyId: bodyB.id,
              speed: 0.15,  // visible rotation speed
            })
          }

          registerConstraint(constraint.id, {
            type: tool,
            label: defaults.label,
            bodyAId: bodyA.id,
            bodyBId: bodyB.id,
            stiffness: defaults.stiffness,
            damping: defaults.damping,
            color: defaults.color,
          })

          constraintFirstBodyRef.current = null
        }
        // Clicking the same body again does nothing (wait for a different body)
      } else {
        // Clicked empty space: cancel constraint creation
        constraintFirstBodyRef.current = null
      }
      return
    }
  }, [registerBody, setSelectedBodyId, clearSelection, unregisterBody,
      unregisterConstraint, updateBodyMeta, registerConstraint])

  // ── Scroll wheel zoom ──
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const currentZoom = useCanvasStore.getState().zoom
    useCanvasStore.getState().setZoom(currentZoom + delta)
    if (renderRef.current) {
      const render = renderRef.current
      const scaleFactor = 1 / (currentZoom + delta)
      const w = render.options.width
      const h = render.options.height
      render.bounds.min.x = w / 2 - (w / 2) * scaleFactor
      render.bounds.min.y = h / 2 - (h / 2) * scaleFactor
      render.bounds.max.x = w / 2 + (w / 2) * scaleFactor
      render.bounds.max.y = h / 2 + (h / 2) * scaleFactor
    }
  }, [])

  // ── Overlay rendering (vectors, selection, constraint preview) ──
  useEffect(() => {
    const drawOverlays = () => {
      const ctx = renderRef.current?.context
      const engine = engineRef.current
      if (!ctx || !engine) { rafRef.current = requestAnimationFrame(drawOverlays); return }

      const allBodies = Composite.allBodies(engine.world).filter(b => !BOUNDARY_LABELS.has(b.label))
      const dynamicBodies = allBodies.filter(b => !b.isStatic)

      // Velocity vectors
      if (showVelocityVectors) {
        dynamicBodies.forEach(body => {
          const vel = body.velocity
          const mag = Vector.magnitude(vel)
          if (mag > 0.2) {
            const endX = body.position.x + vel.x * 8
            const endY = body.position.y + vel.y * 8
            ctx.beginPath()
            ctx.moveTo(body.position.x, body.position.y)
            ctx.lineTo(endX, endY)
            ctx.strokeStyle = '#60a5fa'
            ctx.lineWidth = 1.5
            ctx.stroke()
            // Arrowhead
            const angle = Math.atan2(vel.y, vel.x)
            ctx.beginPath()
            ctx.moveTo(endX, endY)
            ctx.lineTo(endX - 6 * Math.cos(angle - 0.5), endY - 6 * Math.sin(angle - 0.5))
            ctx.lineTo(endX - 6 * Math.cos(angle + 0.5), endY - 6 * Math.sin(angle + 0.5))
            ctx.fillStyle = '#60a5fa'
            ctx.fill()
          }
        })
      }

      // Force vectors
      if (showForceVectors) {
        dynamicBodies.forEach(body => {
          const fx = body.force.x / body.mass * 5000
          const fy = body.force.y / body.mass * 5000
          if (Math.sqrt(fx * fx + fy * fy) > 0.5) {
            ctx.beginPath()
            ctx.moveTo(body.position.x, body.position.y)
            ctx.lineTo(body.position.x + fx, body.position.y + fy)
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
        })
      }

      // Selection highlight
      const selId = useCanvasStore.getState().selectedBodyId
      if (selId) {
        const body = allBodies.find(b => b.id === selId)
        if (body) {
          ctx.beginPath()
          const verts = body.vertices
          ctx.moveTo(verts[0].x, verts[0].y)
          for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y)
          ctx.closePath()
          ctx.strokeStyle = '#e8a84c'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 3])
          ctx.stroke()
          ctx.setLineDash([])
          useCanvasStore.getState().updateBodyMeta(selId, {
            x: body.position.x, y: body.position.y, angle: body.angle,
          })
        }
      }

      // Constraint first-body indicator (green pulsing dot)
      const firstBody = constraintFirstBodyRef.current
      if (firstBody) {
        ctx.beginPath()
        ctx.arc(firstBody.position.x, firstBody.position.y, 12, 0, Math.PI * 2)
        ctx.strokeStyle = '#4ade80'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(firstBody.position.x, firstBody.position.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#4ade80'
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(drawOverlays)
    }

    rafRef.current = requestAnimationFrame(drawOverlays)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [showForceVectors, showVelocityVectors])

  // ── Delete key handler ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        const selId = useCanvasStore.getState().selectedBodyId
        const engine = engineRef.current
        if (!selId || !engine) return
        const body = Composite.allBodies(engine.world).find(b => b.id === selId)
        if (body && !BOUNDARY_LABELS.has(body.label)) {
          Composite.allConstraints(engine.world).forEach(c => {
            if (c.bodyA === body || c.bodyB === body) {
              Composite.remove(engine.world, c)
              unregisterConstraint(c.id)
              motorsRef.current = motorsRef.current.filter(m => m.constraintId !== c.id)
            }
          })
          motorsRef.current = motorsRef.current.filter(m => m.bodyId !== body.id)
          Composite.remove(engine.world, body)
          unregisterBody(selId)
          clearSelection()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [unregisterBody, unregisterConstraint, clearSelection])

  // ── Determine hint text ──
  const isConstraintTool = ['rope', 'spring', 'pivot', 'motor', 'weld'].includes(activeTool)
  const hasFirstBody = constraintFirstBodyRef.current !== null

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ background: 'var(--color-bg-deep)' }}
    >
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none canvas-grid" style={{ opacity: 0.5 }} />
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        style={{ cursor: getCursorForTool(activeTool) }}
      />

      {/* Status bar */}
      <div
        className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] select-none"
        style={{
          background: 'rgba(17, 23, 32, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-muted)',
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: isRunning ? 'var(--color-success)' : 'var(--color-text-muted)',
            boxShadow: isRunning ? '0 0 6px rgba(74, 222, 128, 0.4)' : 'none',
          }}
        />
        {isRunning ? 'Simulating' : 'Paused'}
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{Object.keys(bodies).length} bodies</span>
        {zoom !== 1 && (
          <>
            <span style={{ color: 'var(--color-border-strong)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(zoom * 100)}%</span>
          </>
        )}
      </div>

      {/* Tool hint */}
      {activeTool !== 'select' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium select-none animate-fade-in"
          style={{
            background: 'rgba(17, 23, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border-subtle)',
            color: isConstraintTool ? (hasFirstBody ? '#4ade80' : 'var(--color-accent)') : 'var(--color-accent)',
          }}
        >
          {activeTool === 'eraser' && '🗑 Click body to delete'}
          {['circle', 'rectangle', 'polygon'].includes(activeTool) && `Click to place ${activeTool}`}
          {isConstraintTool && !hasFirstBody && `Click first body for ${activeTool}`}
          {isConstraintTool && hasFirstBody && `Now click second body to connect`}
        </div>
      )}
    </div>
  )
}

function getCursorForTool(tool) {
  switch (tool) {
    case 'select': return 'default'
    case 'eraser': return 'not-allowed'
    default: return 'crosshair'
  }
}
