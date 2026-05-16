import Matter from 'matter-js'

const { Composite, Bodies, Body, Constraint } = Matter

// Labels for ground/wall bodies (never serialized or removed)
const BOUNDARY_LABELS = new Set(['Ground', 'Wall-L', 'Wall-R'])

/**
 * Serialize a Matter.js world into a JSON-safe snapshot.
 * Includes BOTH static and dynamic bodies (excluding ground/walls).
 */
export function serializeWorld(engine) {
  const world = engine.world
  const bodies = Composite.allBodies(world)
    .filter(b => !BOUNDARY_LABELS.has(b.label))
    .map(b => ({
      id: b.id,
      type: detectBodyType(b),
      label: b.label,
      position: { x: b.position.x, y: b.position.y },
      angle: b.angle,
      velocity: { x: b.velocity.x, y: b.velocity.y },
      angularVelocity: b.angularVelocity,
      circleRadius: b.circleRadius || null,
      width: b.bounds ? Math.round(b.bounds.max.x - b.bounds.min.x) : null,
      height: b.bounds ? Math.round(b.bounds.max.y - b.bounds.min.y) : null,
      mass: b.mass,
      density: b.density,
      friction: b.friction,
      frictionAir: b.frictionAir,
      restitution: b.restitution,
      isStatic: b.isStatic,
      isSensor: b.isSensor || false,
      render: {
        fillStyle: b.render.fillStyle,
        strokeStyle: b.render.strokeStyle,
        lineWidth: b.render.lineWidth,
      },
    }))

  const constraints = Composite.allConstraints(world)
    .filter(c => c.label !== 'Mouse Constraint')
    .map(c => ({
      id: c.id,
      label: c.label || 'Constraint',
      bodyAId: c.bodyA ? c.bodyA.id : null,
      bodyBId: c.bodyB ? c.bodyB.id : null,
      pointA: c.pointA,
      pointB: c.pointB,
      length: c.length,
      stiffness: c.stiffness,
      damping: c.damping,
      render: {
        strokeStyle: c.render?.strokeStyle || '#fbbf24',
        lineWidth: c.render?.lineWidth || 2,
      },
    }))

  return {
    version: 1,
    timestamp: Date.now(),
    gravity: { x: engine.gravity.x, y: engine.gravity.y },
    bodies,
    constraints,
  }
}

/**
 * Deserialize a snapshot back into a Matter.js world.
 *
 * Key design:
 *  - Clears all non-ground/wall bodies first
 *  - Supports isStatic bodies (e.g. ramps) via Body.setStatic()
 *  - Supports world-anchored constraints (bodyA or bodyB = null)
 *  - All body positions use absolute canvas coordinates
 */
export function deserializeWorld(engine, snapshot, store) {
  if (!snapshot || snapshot.version !== 1) {
    console.warn('Invalid snapshot version:', snapshot)
    return
  }

  const world = engine.world

  // Remove ALL non-ground/wall bodies (both static custom and dynamic)
  const existingBodies = Composite.allBodies(world)
    .filter(b => !BOUNDARY_LABELS.has(b.label))
  existingBodies.forEach(b => Composite.remove(world, b))

  // Remove all non-mouse constraints
  const existingConstraints = Composite.allConstraints(world)
    .filter(c => c.label !== 'Mouse Constraint')
  existingConstraints.forEach(c => Composite.remove(world, c))

  // Clear store
  if (store) {
    const state = store.getState()
    Object.keys(state.bodies).forEach(id => state.unregisterBody(id))
    Object.keys(state.constraints || {}).forEach(id => state.unregisterConstraint(id))
  }

  // Set gravity
  engine.gravity.x = snapshot.gravity.x
  engine.gravity.y = snapshot.gravity.y

  // Calculate Y offset so templates load relative to the actual ground
  // The templates were authored assuming the ground is at y=405
  const groundBody = Composite.allBodies(world).find(b => b.label === 'Ground')
  const offsetY = groundBody ? (groundBody.position.y - 405) : 0

  // Create bodies
  const idMap = {}

  snapshot.bodies.forEach(data => {
    let body = null

    try {
      const bodyOpts = {
        density: data.density,
        friction: data.friction,
        frictionAir: data.frictionAir,
        restitution: data.restitution,
        label: data.label,
        isSensor: data.isSensor || false,
        render: { ...data.render },
      }

      if (data.circleRadius) {
        body = Bodies.circle(data.position.x, data.position.y + offsetY, data.circleRadius, bodyOpts)
      } else {
        const w = data.width || 60
        const h = data.height || 40
        body = Bodies.rectangle(data.position.x, data.position.y + offsetY, w, h, bodyOpts)
      }
    } catch (err) {
      console.warn('Failed to create body:', data.label, err)
      return
    }

    if (!body) return

    // Set angle BEFORE setting static (static bodies can't be rotated after)
    Body.setAngle(body, data.angle || 0)

    // Set static AFTER creation and angle — Matter.js needs this explicit call
    if (data.isStatic) {
      Body.setStatic(body, true)
    }

    // Set velocity (only meaningful for dynamic bodies)
    if (!data.isStatic && data.velocity) {
      Body.setVelocity(body, data.velocity)
    }
    if (!data.isStatic && data.angularVelocity) {
      Body.setAngularVelocity(body, data.angularVelocity)
    }

    Composite.add(world, body)
    idMap[data.id] = body

    // Register ALL bodies in the store (so body count and selection work)
    if (store) {
      store.getState().registerBody(body.id, {
        type: data.type || detectBodyType(body),
        label: data.label,
        material: 'custom',
        color: data.render.fillStyle,
        mass: body.mass,
        friction: body.friction,
        restitution: body.restitution,
        density: body.density,
        frictionAir: body.frictionAir,
        x: body.position.x,
        y: body.position.y, // This now includes offsetY naturally because we applied it at creation
        angle: body.angle,
        isStatic: data.isStatic || false,
      })
    }
  })

  // Create constraints
  snapshot.constraints.forEach(data => {
    const bodyA = data.bodyAId ? idMap[data.bodyAId] : null
    const bodyB = data.bodyBId ? idMap[data.bodyBId] : null

    // Skip only if BOTH are null (invalid constraint)
    if (!bodyA && !bodyB) return

    // If a body reference is specified but not found in idMap, skip
    if (data.bodyAId && !bodyA) {
      console.warn('Constraint references missing bodyA:', data.bodyAId, data.label)
      return
    }
    if (data.bodyBId && !bodyB) {
      console.warn('Constraint references missing bodyB:', data.bodyBId, data.label)
      return
    }

    try {
      const opts = {
        label: data.label || 'Constraint',
        stiffness: data.stiffness ?? 0.5,
        damping: data.damping ?? 0,
        render: {
          visible: true,
          strokeStyle: data.render?.strokeStyle || '#fbbf24',
          lineWidth: data.render?.lineWidth || 2,
          type: 'line',
        },
      }

      // Set length if provided (undefined = auto-calculate from positions)
      if (data.length != null) opts.length = data.length

      // When body is null, pointA/B is the world coordinate anchor
      // When body exists, pointA/B is the local offset on that body
      if (bodyA) {
        opts.bodyA = bodyA
        opts.pointA = data.pointA || { x: 0, y: 0 }
      } else {
        opts.pointA = data.pointA ? { x: data.pointA.x, y: data.pointA.y + offsetY } : undefined  // world coordinate
      }

      if (bodyB) {
        opts.bodyB = bodyB
        opts.pointB = data.pointB || { x: 0, y: 0 }
      } else {
        opts.pointB = data.pointB ? { x: data.pointB.x, y: data.pointB.y + offsetY } : undefined  // world coordinate
      }

      const constraint = Constraint.create(opts)
      Composite.add(world, constraint)

      if (store) {
        store.getState().registerConstraint(constraint.id, {
          type: (data.label || 'rope').toLowerCase(),
          label: data.label,
          bodyAId: bodyA ? bodyA.id : null,
          bodyBId: bodyB ? bodyB.id : null,
          stiffness: data.stiffness,
          damping: data.damping,
          color: data.render?.strokeStyle || '#fbbf24',
        })
      }
    } catch (err) {
      console.warn('Failed to create constraint:', data.label, err)
    }
  })

  console.log(`✅ Loaded: ${snapshot.bodies.length} bodies, ${snapshot.constraints.length} constraints`)
}

/**
 * Reset the world — remove all user-created bodies and constraints,
 * keep only ground and walls.
 */
export function resetWorld(engine, store, motorsRef) {
  const world = engine.world

  // Remove all non-boundary bodies
  const userBodies = Composite.allBodies(world)
    .filter(b => !BOUNDARY_LABELS.has(b.label))
  userBodies.forEach(b => Composite.remove(world, b))

  // Remove all non-mouse constraints
  const userConstraints = Composite.allConstraints(world)
    .filter(c => c.label !== 'Mouse Constraint')
  userConstraints.forEach(c => Composite.remove(world, c))

  // Clear store
  if (store) {
    const state = store.getState()
    Object.keys(state.bodies).forEach(id => state.unregisterBody(id))
    Object.keys(state.constraints || {}).forEach(id => state.unregisterConstraint(id))
  }

  // Clear motors
  if (motorsRef) {
    motorsRef.current = []
  }

  console.log('🗑 World reset — all bodies and constraints cleared')
}

function detectBodyType(body) {
  if (body.circleRadius) return 'circle'
  if (body.vertices?.length === 4) return 'rectangle'
  return 'polygon'
}
