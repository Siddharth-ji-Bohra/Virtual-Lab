import { useState, useEffect, useRef, useCallback } from 'react'
import Matter from 'matter-js'
import { useEngine } from '../contexts/EngineContext'
import { useCanvasStore } from '../stores/canvasStore'

/**
 * useAnalytics — Samples physics data from the Matter.js engine
 *
 * Charts:
 *   Velocity  — √(vx² + vy²)  in px/tick  (proportional to m/s)
 *   Energy    — Total KE = Σ 0.5·m·v²      (Joules, simulation units)
 *   Force     — F = m·a, where a = Δv/Δt   (derived from velocity change)
 *
 * IMPORTANT: body.force in Matter.js resets to {0,0} after each tick,
 * so we compute force from acceleration instead.
 */
export default function useAnalytics(sampleRate = 100) {
  const { engineRef } = useEngine()
  const [data, setData] = useState([])
  const [collisions, setCollisions] = useState([])
  const tickRef = useRef(0)
  const prevVelocities = useRef({}) // { bodyId: { vx, vy } }
  const maxPoints = 60

  const clearCollisions = useCallback(() => {
    setCollisions([])
    setData([])
    tickRef.current = 0
    prevVelocities.current = {}
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    // Listen for collision events
    const collisionHandler = (event) => {
      if (!useCanvasStore.getState().isRunning) return

      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair
        if (bodyA.isStatic && bodyB.isStatic) return

        setCollisions(prev => {
          const relativeSpeed = Math.sqrt(
            (bodyA.velocity.x - bodyB.velocity.x) ** 2 +
            (bodyA.velocity.y - bodyB.velocity.y) ** 2
          )
          const newCollision = {
            id: Date.now() + Math.random(),
            time: (tickRef.current * sampleRate / 1000).toFixed(1) + 's',
            bodyA: bodyA.label || `Body #${bodyA.id}`,
            bodyB: bodyB.label || `Body #${bodyB.id}`,
            speed: relativeSpeed.toFixed(2) + ' px/t',
          }
          return [newCollision, ...prev].slice(0, 50)
        })
      })
    }

    Matter.Events.on(engine, 'collisionStart', collisionHandler)

    // Sample physics data at interval
    const interval = setInterval(() => {
      if (!engineRef.current) return
      if (!useCanvasStore.getState().isRunning) return

      const allBodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic)
      if (allBodies.length === 0) return

      tickRef.current++

      // Time step in seconds (sampleRate is in ms)
      const dt = sampleRate / 1000

      const selId = useCanvasStore.getState().selectedBodyId
      const targetBody = selId ? allBodies.find(b => b.id === selId) : null

      let velocity, energy, force

      if (targetBody) {
        // ── Single body tracking ──
        const vx = targetBody.velocity.x
        const vy = targetBody.velocity.y
        velocity = Math.sqrt(vx ** 2 + vy ** 2)
        energy = 0.5 * targetBody.mass * velocity ** 2

        // Force = mass × acceleration, where a = Δv / Δt
        const prev = prevVelocities.current[targetBody.id]
        if (prev) {
          const ax = (vx - prev.vx) / dt
          const ay = (vy - prev.vy) / dt
          force = targetBody.mass * Math.sqrt(ax ** 2 + ay ** 2)
        } else {
          // First sample — use gravity as baseline force
          force = targetBody.mass * engine.gravity.y * engine.gravity.scale * 1000
        }
        prevVelocities.current[targetBody.id] = { vx, vy }

      } else {
        // ── Aggregate tracking ──
        let totalVel = 0, totalEnergy = 0, totalForce = 0

        allBodies.forEach(b => {
          const vx = b.velocity.x
          const vy = b.velocity.y
          const vel = Math.sqrt(vx ** 2 + vy ** 2)
          totalVel += vel
          totalEnergy += 0.5 * b.mass * vel ** 2

          const prev = prevVelocities.current[b.id]
          if (prev) {
            const ax = (vx - prev.vx) / dt
            const ay = (vy - prev.vy) / dt
            totalForce += b.mass * Math.sqrt(ax ** 2 + ay ** 2)
          }
          prevVelocities.current[b.id] = { vx, vy }
        })

        velocity = totalVel / allBodies.length
        energy = totalEnergy
        force = totalForce / allBodies.length  // average force per body
      }

      setData(prev => {
        const newPoint = {
          t: tickRef.current,
          velocity: parseFloat(velocity.toFixed(2)),
          energy: parseFloat(energy.toFixed(1)),
          force: parseFloat(force.toFixed(2)),
        }
        const updated = [...prev, newPoint]
        return updated.length > maxPoints ? updated.slice(-maxPoints) : updated
      })
    }, sampleRate)

    return () => {
      clearInterval(interval)
      Matter.Events.off(engine, 'collisionStart', collisionHandler)
    }
  }, [engineRef, sampleRate])

  const exportCSV = useCallback(() => {
    if (data.length === 0) return
    const headers = 'tick,velocity_px_per_tick,energy_J,force_N\n'
    const rows = data.map(d => `${d.t},${d.velocity},${d.energy},${d.force}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `virtuallab_analytics_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  return { data, collisions, exportCSV, clearCollisions }
}
