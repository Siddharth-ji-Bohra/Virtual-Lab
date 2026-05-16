import { create } from 'zustand'

/**
 * Canvas Store — manages physics canvas state
 * Selected tool, selected bodies, simulation controls
 */
export const useCanvasStore = create((set, get) => ({
  // ── Tool Selection ──
  activeTool: 'select',   // select | rectangle | circle | polygon | rope | spring | pivot | motor | eraser
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Selection ──
  selectedBodyId: null,
  selectedConstraintId: null,
  setSelectedBodyId: (id) => set({ selectedBodyId: id, selectedConstraintId: null }),
  setSelectedConstraintId: (id) => set({ selectedConstraintId: id, selectedBodyId: null }),
  clearSelection: () => set({ selectedBodyId: null, selectedConstraintId: null }),

  // ── Simulation Controls ──
  isRunning: false,
  toggleRunning: () => set((s) => ({ isRunning: !s.isRunning })),
  setRunning: (val) => set({ isRunning: val }),

  // ── Gravity ──
  gravity: { x: 0, y: 1 },
  setGravity: (g) => set({ gravity: g }),

  // ── Canvas Viewport ──
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(4, z)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  // ── Grid ──
  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  // ── Overlays ──
  showForceVectors: false,
  showVelocityVectors: false,
  toggleForceVectors: () => set((s) => ({ showForceVectors: !s.showForceVectors })),
  toggleVelocityVectors: () => set((s) => ({ showVelocityVectors: !s.showVelocityVectors })),

  // ── Body Registry (lightweight metadata, actual bodies live in Matter.js) ──
  bodies: {},  // { [matterBodyId]: { label, material, color, ... } }
  registerBody: (id, meta) => set((s) => ({
    bodies: { ...s.bodies, [id]: meta }
  })),
  unregisterBody: (id) => set((s) => {
    const { [id]: _, ...rest } = s.bodies
    return { bodies: rest }
  }),
  updateBodyMeta: (id, updates) => set((s) => ({
    bodies: {
      ...s.bodies,
      [id]: { ...s.bodies[id], ...updates }
    }
  })),

  // ── Constraints Registry ──
  constraints: {},
  registerConstraint: (id, meta) => set((s) => ({
    constraints: { ...s.constraints, [id]: meta }
  })),
  unregisterConstraint: (id) => set((s) => {
    const { [id]: _, ...rest } = s.constraints
    return { constraints: rest }
  }),
}))
