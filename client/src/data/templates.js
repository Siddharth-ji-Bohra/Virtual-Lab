/**
 * Pre-built physics experiment templates
 *
 * Canvas coordinate system:
 *  - Origin (0,0) is top-left
 *  - Canvas is approximately 950×420 px
 *  - Ground surface is at approximately y ≈ 400 (30px-high rect centered at y = height-15)
 *  - Safe area: x: 30-920, y: 30-380
 *
 * For world-anchored constraints:
 *  - bodyAId: null → pointA is the world coordinate of the fixed anchor
 *  - bodyBId: string → pointB is the local offset on that body (usually {x:0,y:0} for center)
 */
export const TEMPLATES = [
  // ═══════════════════════════════════════════
  // 1. SIMPLE PENDULUM
  // ═══════════════════════════════════════════
  {
    id: 'pendulum',
    title: 'Simple Pendulum',
    description: 'A weight suspended from a fixed point. Pull it sideways and release to observe periodic motion.',
    category: 'mechanics',
    difficulty: 'beginner',
    tags: ['oscillation', 'gravity', 'energy'],
    icon: '🔔',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        {
          id: 'bob', type: 'circle', label: 'Pendulum Bob',
          circleRadius: 20,
          // Start displaced to the right of the pivot so it swings when simulation starts
          position: { x: 600, y: 100 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.008, friction: 0.01, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#e8a84c', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
      ],
      constraints: [
        {
          id: 'rope', label: 'Rope',
          bodyAId: null, bodyBId: 'bob',
          // Pivot point anchored to the world at top-center
          pointA: { x: 450, y: 60 },
          // Attach to the center of the bob
          pointB: { x: 0, y: 0 },
          // Rope length = distance from pivot to bob equilibrium
          // Bob will swing in an arc. Max low point at pivot.y + length
          // 60 + 200 = 260, well above ground at ~400
          length: 200,
          stiffness: 1, damping: 0,
          render: { strokeStyle: '#fbbf24', lineWidth: 2 },
        },
      ],
    },
  },

  // ═══════════════════════════════════════════
  // 2. NEWTON'S CRADLE
  // ═══════════════════════════════════════════
  {
    id: 'newtons-cradle',
    title: "Newton's Cradle",
    description: 'Five balls on strings. Pull one back and release — momentum transfers through the chain.',
    category: 'mechanics',
    difficulty: 'intermediate',
    tags: ['momentum', 'collision', 'energy-transfer'],
    icon: '⚖️',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        // Ball 0 starts pulled to the left (displaced) so it swings into the others
        {
          id: 'ball-0', type: 'circle', label: 'Ball 1',
          circleRadius: 18,
          position: { x: 310, y: 130 }, // pulled left and up
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.008, friction: 0.002, frictionAir: 0.0002, restitution: 1.0,
          isStatic: false,
          render: { fillStyle: '#f87171', strokeStyle: 'rgba(255,255,255,0.12)', lineWidth: 1 },
        },
        // Balls 1-4 hang at rest directly below their pivots
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `ball-${i + 1}`, type: 'circle', label: `Ball ${i + 2}`,
          circleRadius: 18,
          position: { x: 400 + i * 37, y: 260 }, // hanging at rest
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.008, friction: 0.002, frictionAir: 0.0002, restitution: 1.0,
          isStatic: false,
          render: { fillStyle: '#94a3b8', strokeStyle: 'rgba(255,255,255,0.12)', lineWidth: 1 },
        })),
      ],
      constraints: [
        // Ball 0 rope — same pivot x as balls at rest position
        {
          id: 'rope-0', label: 'Rope',
          bodyAId: null, bodyBId: 'ball-0',
          pointA: { x: 363, y: 60 }, // pivot above rest position of ball 0
          pointB: { x: 0, y: 0 },
          length: 200, stiffness: 1, damping: 0,
          render: { strokeStyle: '#fbbf24', lineWidth: 1.5 },
        },
        // Balls 1-4 ropes
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `rope-${i + 1}`, label: 'Rope',
          bodyAId: null, bodyBId: `ball-${i + 1}`,
          pointA: { x: 400 + i * 37, y: 60 },
          pointB: { x: 0, y: 0 },
          length: 200, stiffness: 1, damping: 0,
          render: { strokeStyle: '#fbbf24', lineWidth: 1.5 },
        })),
      ],
    },
  },

  // ═══════════════════════════════════════════
  // 3. INCLINED PLANE
  // ═══════════════════════════════════════════
  {
    id: 'inclined-plane',
    title: 'Inclined Plane',
    description: 'A block on an angled ramp. Adjust friction to see it slide or stay in place.',
    category: 'mechanics',
    difficulty: 'beginner',
    tags: ['friction', 'gravity', 'forces'],
    icon: '📐',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        // Static ramp — wide, thin, angled
        {
          id: 'ramp', type: 'rectangle', label: 'Ramp',
          width: 500, height: 15,
          position: { x: 420, y: 280 },
          angle: 0.35, // ~20 degrees tilted
          velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.4, frictionAir: 0, restitution: 0.05,
          isStatic: true,
          render: { fillStyle: '#78716c', strokeStyle: '#555', lineWidth: 1 },
        },
        // Sliding block on top of the ramp
        {
          id: 'block', type: 'rectangle', label: 'Block',
          width: 35, height: 35,
          position: { x: 280, y: 180 },
          angle: 0.35, // same angle as ramp so it sits flat
          velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.004, friction: 0.2, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#60a5fa', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
      ],
      constraints: [],
    },
  },

  // ═══════════════════════════════════════════
  // 4. SPRING-MASS SYSTEM  *** FIXED ***
  // ═══════════════════════════════════════════
  {
    id: 'spring-mass',
    title: 'Spring-Mass System',
    description: 'A mass on a spring. Watch it bounce up and down in simple harmonic motion.',
    category: 'mechanics',
    difficulty: 'beginner',
    tags: ['oscillation', 'spring', 'harmonic'],
    icon: '🌀',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        {
          id: 'mass', type: 'circle', label: 'Mass',
          circleRadius: 22,
          // Start pulled down from equilibrium so it bounces when released
          position: { x: 450, y: 320 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.004, friction: 0.1, frictionAir: 0.005, restitution: 0.2,
          isStatic: false,
          render: { fillStyle: '#f87171', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
        // Static anchor point visible at the top
        {
          id: 'anchor', type: 'rectangle', label: 'Anchor',
          width: 60, height: 10,
          position: { x: 450, y: 55 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.5, frictionAir: 0, restitution: 0,
          isStatic: true,
          render: { fillStyle: '#475569', strokeStyle: '#64748b', lineWidth: 1 },
        },
      ],
      constraints: [
        {
          id: 'spring', label: 'Spring',
          bodyAId: null, bodyBId: 'mass',
          pointA: { x: 450, y: 60 },
          pointB: { x: 0, y: 0 },
          // Natural length = 120px. Mass starts at y=320, anchor at y=60.
          // Distance = 260, so spring is stretched 140px beyond natural length.
          // With stiffness=0.02, this creates visible oscillation.
          // Equilibrium ≈ y=180. Mass bounces between ~y=120 and ~y=320.
          // All well above ground at y=400.
          length: 120,
          stiffness: 0.02, damping: 0.002,
          render: { strokeStyle: '#f472b6', lineWidth: 2.5 },
        },
      ],
    },
  },

  // ═══════════════════════════════════════════
  // 5. PROJECTILE MOTION  *** FIXED ***
  // ═══════════════════════════════════════════
  {
    id: 'projectile',
    title: 'Projectile Motion',
    description: 'A ball launched at 45°. Watch the classic parabolic arc under gravity.',
    category: 'mechanics',
    difficulty: 'beginner',
    tags: ['trajectory', 'velocity', 'gravity'],
    icon: '🎯',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        {
          id: 'ball', type: 'circle', label: 'Projectile',
          circleRadius: 12,
          position: { x: 80, y: 350 },
          angle: 0,
          // Launch velocity: angled upward at ~45 degrees
          velocity: { x: 7, y: -9 },
          angularVelocity: 0,
          density: 0.005, friction: 0.1, frictionAir: 0.0003, restitution: 0.7,
          isStatic: false,
          render: { fillStyle: '#34d399', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
        // A launch platform
        {
          id: 'platform', type: 'rectangle', label: 'Launch Pad',
          width: 80, height: 12,
          position: { x: 80, y: 375 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.5, frictionAir: 0, restitution: 0.05,
          isStatic: true,
          render: { fillStyle: '#475569', strokeStyle: '#64748b', lineWidth: 1 },
        },
        // A target wall to hit
        {
          id: 'target', type: 'rectangle', label: 'Target',
          width: 15, height: 80,
          position: { x: 750, y: 350 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.5, frictionAir: 0, restitution: 0.05,
          isStatic: true,
          render: { fillStyle: '#fbbf24', strokeStyle: '#b8860b', lineWidth: 1 },
        },
        // Some stacked blocks as targets that get knocked over
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `target-block-${i}`, type: 'rectangle', label: `Target Block ${i + 1}`,
          width: 20, height: 20,
          position: { x: 650, y: 375 - i * 22 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.002, friction: 0.4, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#c084fc', strokeStyle: 'rgba(255,255,255,0.12)', lineWidth: 1 },
        })),
      ],
      constraints: [],
    },
  },

  // ═══════════════════════════════════════════
  // 6. DOMINO CHAIN
  // ═══════════════════════════════════════════
  {
    id: 'dominoes',
    title: 'Domino Chain',
    description: 'A ball triggers a chain of falling dominoes. Watch the cascade!',
    category: 'mechanics',
    difficulty: 'intermediate',
    tags: ['chain-reaction', 'momentum', 'rotation'],
    icon: '🀄',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        // Trigger ball — rolls toward the first domino
        {
          id: 'trigger', type: 'circle', label: 'Trigger Ball',
          circleRadius: 14,
          position: { x: 80, y: 340 },
          angle: 0, velocity: { x: 5, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.3, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#e8a84c', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
        // 10 dominoes — tall and thin, standing upright
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `dom-${i}`, type: 'rectangle', label: `Domino ${i + 1}`,
          width: 8, height: 50,
          // Standing on the ground (~y=400), so center is at 400 - 25 = 375
          position: { x: 180 + i * 42, y: 370 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.003, friction: 0.5, frictionAir: 0.001, restitution: 0.02,
          isStatic: false,
          render: { fillStyle: '#c084fc', strokeStyle: 'rgba(255,255,255,0.12)', lineWidth: 1 },
        })),
      ],
      constraints: [],
    },
  },

  // ═══════════════════════════════════════════
  // 7. ROPE BRIDGE  *** FIXED ***
  // ═══════════════════════════════════════════
  {
    id: 'bridge',
    title: 'Rope Bridge',
    description: 'A flexible chain bridge anchored at both ends. Drop a weight on it!',
    category: 'mechanics',
    difficulty: 'advanced',
    tags: ['structure', 'forces', 'engineering'],
    icon: '🌉',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        // Left pillar (static, visible)
        {
          id: 'pillar-L', type: 'rectangle', label: 'Left Pillar',
          width: 20, height: 72,
          position: { x: 160, y: 244 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.8, frictionAir: 0, restitution: 0,
          isStatic: true,
          render: { fillStyle: '#475569', strokeStyle: '#64748b', lineWidth: 1 },
        },
        // Right pillar (static, visible)
        {
          id: 'pillar-R', type: 'rectangle', label: 'Right Pillar',
          width: 20, height: 72,
          position: { x: 740, y: 244 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0.8, frictionAir: 0, restitution: 0,
          isStatic: true,
          render: { fillStyle: '#475569', strokeStyle: '#64748b', lineWidth: 1 },
        },
        // 11 bridge segments — small planks chained together
        ...Array.from({ length: 11 }, (_, i) => ({
          id: `seg-${i}`, type: 'rectangle', label: `Plank ${i + 1}`,
          width: 48, height: 8,
          position: { x: 200 + i * 50, y: 200 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.003, friction: 0.8, frictionAir: 0.005, restitution: 0.02,
          isStatic: false,
          render: { fillStyle: '#d4a574', strokeStyle: 'rgba(255,255,255,0.12)', lineWidth: 1 },
        })),
        // Heavy ball above the middle of the bridge
        {
          id: 'weight', type: 'circle', label: 'Weight',
          circleRadius: 14,
          position: { x: 450, y: 140 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.008, friction: 0.6, frictionAir: 0.001, restitution: 0.05,
          isStatic: false,
          render: { fillStyle: '#f87171', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
      ],
      constraints: [
        // Chain links between adjacent segments
        // pointA/B at edges of planks (half-width = 21)
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `link-${i}`, label: 'Weld',
          bodyAId: `seg-${i}`, bodyBId: `seg-${i + 1}`,
          pointA: { x: 24, y: 0 },
          pointB: { x: -24, y: 0 },
          length: 2, stiffness: 0.9, damping: 0.15,
          render: { strokeStyle: '#94a3b8', lineWidth: 1.5 },
        })),
        // Left anchor — world point to first segment
        {
          id: 'anchor-L', label: 'Pivot',
          bodyAId: null, bodyBId: 'seg-0',
          pointA: { x: 170, y: 200 },
          pointB: { x: -24, y: 0 },
          length: 0, stiffness: 1, damping: 0.05,
          render: { strokeStyle: '#60a5fa', lineWidth: 2 },
        },
        // Right anchor — world point to last segment
        {
          id: 'anchor-R', label: 'Pivot',
          bodyAId: null, bodyBId: 'seg-10',
          pointA: { x: 730, y: 200 },
          pointB: { x: 24, y: 0 },
          length: 0, stiffness: 1, damping: 0.05,
          render: { strokeStyle: '#60a5fa', lineWidth: 2 },
        },
      ],
    },
  },

  // ═══════════════════════════════════════════
  // 8. ATWOOD MACHINE (PULLEY)  *** FIXED ***
  // Uses a horizontal lever bar pivoted at center
  // to mechanically couple two weights like a pulley.
  // ═══════════════════════════════════════════
  {
    id: 'pulley',
    title: 'Atwood Machine',
    description: 'Two unequal weights connected by a lever-pulley. The heavier one descends, pulling the lighter one up.',
    category: 'mechanics',
    difficulty: 'intermediate',
    tags: ['pulley', 'tension', 'forces'],
    icon: '⚙️',
    snapshot: {
      version: 1, timestamp: 0,
      gravity: { x: 0, y: 1 },
      bodies: [
        // Pulley wheel (static, decorative) at top center
        {
          id: 'pulley-wheel', type: 'circle', label: 'Pulley Wheel',
          circleRadius: 15,
          position: { x: 450, y: 60 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.01, friction: 0, frictionAir: 0, restitution: 0,
          isStatic: true, isSensor: true, // sensor prevents the lever from colliding with it
          render: { fillStyle: '#475569', strokeStyle: '#64748b', lineWidth: 2 },
        },
        // Horizontal lever bar — very thin, light bar that pivots at center
        {
          id: 'lever', type: 'rectangle', label: 'Lever Bar',
          width: 300, height: 4,
          position: { x: 450, y: 60 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.0005, friction: 0, frictionAir: 0.001, restitution: 0,
          isStatic: false,
          render: { fillStyle: '#94a3b8', strokeStyle: 'rgba(255,255,255,0.2)', lineWidth: 1 },
        },
        // Heavy weight on the left
        {
          id: 'heavy', type: 'circle', label: 'Heavy (8 kg)',
          circleRadius: 25,
          position: { x: 300, y: 220 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.012, friction: 0.1, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#60a5fa', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
        // Light weight on the right
        {
          id: 'light', type: 'circle', label: 'Light (3 kg)',
          circleRadius: 16,
          position: { x: 600, y: 220 },
          angle: 0, velocity: { x: 0, y: 0 }, angularVelocity: 0,
          density: 0.005, friction: 0.1, frictionAir: 0.001, restitution: 0.1,
          isStatic: false,
          render: { fillStyle: '#34d399', strokeStyle: 'rgba(255,255,255,0.15)', lineWidth: 1 },
        },
      ],
      constraints: [
        // Pivot: lever bar fixed to world at its center (acts as the axle)
        {
          id: 'axle', label: 'Pivot',
          bodyAId: null, bodyBId: 'lever',
          pointA: { x: 450, y: 60 },
          pointB: { x: 0, y: 0 },
          length: 0, stiffness: 1, damping: 0,
          render: { strokeStyle: '#94a3b8', lineWidth: 2 },
        },
        // Left rope: lever left end → heavy weight
        {
          id: 'rope-L', label: 'Rope',
          bodyAId: 'lever', bodyBId: 'heavy',
          pointA: { x: -150, y: 0 },  // left end of 300px-wide bar
          pointB: { x: 0, y: 0 },
          length: 160, stiffness: 1, damping: 0,
          render: { strokeStyle: '#fbbf24', lineWidth: 2 },
        },
        // Right rope: lever right end → light weight
        {
          id: 'rope-R', label: 'Rope',
          bodyAId: 'lever', bodyBId: 'light',
          pointA: { x: 150, y: 0 },   // right end of 300px-wide bar
          pointB: { x: 0, y: 0 },
          length: 160, stiffness: 1, damping: 0,
          render: { strokeStyle: '#fbbf24', lineWidth: 2 },
        },
      ],
    },
  },
]

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id)
}

export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'beginner': return { bg: 'rgba(74, 222, 128, 0.12)', color: '#4ade80' }
    case 'intermediate': return { bg: 'rgba(250, 204, 21, 0.12)', color: '#facc15' }
    case 'advanced': return { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171' }
    default: return { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' }
  }
}
