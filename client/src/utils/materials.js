/**
 * Material presets for physics bodies
 * Each material defines physical properties for Matter.js
 */
export const MATERIALS = {
  metal: {
    label: 'Metal',
    density: 0.008,
    friction: 0.3,
    restitution: 0.1,
    frictionAir: 0.001,
    color: '#94a3b8',
    icon: '🔩',
  },
  wood: {
    label: 'Wood',
    density: 0.004,
    friction: 0.6,
    restitution: 0.2,
    frictionAir: 0.001,
    color: '#d4a574',
    icon: '🪵',
  },
  rubber: {
    label: 'Rubber',
    density: 0.005,
    friction: 0.9,
    restitution: 0.8,
    frictionAir: 0.002,
    color: '#f87171',
    icon: '🔴',
  },
  ice: {
    label: 'Ice',
    density: 0.003,
    friction: 0.02,
    restitution: 0.05,
    frictionAir: 0.0005,
    color: '#93c5fd',
    icon: '🧊',
  },
  stone: {
    label: 'Stone',
    density: 0.01,
    friction: 0.7,
    restitution: 0.05,
    frictionAir: 0.001,
    color: '#78716c',
    icon: '🪨',
  },
  glass: {
    label: 'Glass',
    density: 0.006,
    friction: 0.1,
    restitution: 0.3,
    frictionAir: 0.001,
    color: '#a5f3fc',
    icon: '💎',
  },
  foam: {
    label: 'Foam',
    density: 0.001,
    friction: 0.5,
    restitution: 0.6,
    frictionAir: 0.05,
    color: '#fef08a',
    icon: '🧽',
  },
  custom: {
    label: 'Custom',
    density: 0.004,
    friction: 0.4,
    restitution: 0.3,
    frictionAir: 0.001,
    color: '#e8a84c',
    icon: '⚙️',
  },
}

/**
 * Body type visual defaults
 */
export const BODY_DEFAULTS = {
  rectangle: {
    width: 60,
    height: 40,
    color: '#60a5fa',
    label: 'Rectangle',
  },
  circle: {
    radius: 25,
    color: '#c084fc',
    label: 'Circle',
  },
  polygon: {
    radius: 30,
    sides: 6,
    color: '#34d399',
    label: 'Polygon',
  },
}

/**
 * Constraint visual defaults
 */
export const CONSTRAINT_DEFAULTS = {
  rope: {
    stiffness: 0.05,
    damping: 0.01,
    color: '#fbbf24',
    label: 'Rope',
  },
  spring: {
    stiffness: 0.01,
    damping: 0.005,
    color: '#f472b6',
    label: 'Spring',
  },
  pivot: {
    stiffness: 1,
    damping: 0,
    length: 0,
    color: '#60a5fa',
    label: 'Pivot',
  },
  motor: {
    stiffness: 1,
    damping: 0,
    length: 0,
    angularSpeed: 0.05,
    color: '#4ade80',
    label: 'Motor',
  },
  weld: {
    stiffness: 1,
    damping: 0.1,
    color: '#94a3b8',
    label: 'Weld',
  },
}

/**
 * Get material properties by name
 */
export function getMaterialProps(materialName) {
  const mat = MATERIALS[materialName] || MATERIALS.custom
  return {
    density: mat.density,
    friction: mat.friction,
    restitution: mat.restitution,
    frictionAir: mat.frictionAir,
  }
}
