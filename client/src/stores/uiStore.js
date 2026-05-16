import { create } from 'zustand'

/**
 * UI Store — manages layout state
 * Panel visibility, bottom panel tabs, modals
 */
export const useUIStore = create((set) => ({
  // ── Panel Visibility ──
  inspectorOpen: true,
  bottomPanelOpen: true,
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),

  // ── Bottom Panel Tab ──
  bottomTab: 'analytics',  // analytics | console | collisions
  setBottomTab: (tab) => set({ bottomTab: tab }),

  // ── Modals ──
  activeModal: null,  // null | 'save' | 'load' | 'share' | 'settings' | 'auth'
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  // ── Notifications ──
  notifications: [],
  addNotification: (notif) => set((s) => ({
    notifications: [...s.notifications, { id: Date.now(), ...notif }]
  })),
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id)
  })),

  // ── Current Page ──
  currentPage: 'workspace',  // workspace | library | auth
  setCurrentPage: (page) => set({ currentPage: page }),
}))
