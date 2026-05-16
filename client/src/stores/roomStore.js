import { create } from 'zustand'

/**
 * Room Store — manages multi-user room state
 */
export const useRoomStore = create((set) => ({
  // ── Room Info ──
  roomId: null,
  roomName: null,
  roomCode: null,
  isConnected: false,

  // ── Users ──
  users: [],
  currentUserId: null,
  hostId: null,

  // ── Actions ──
  setRoom: (room) => set({
    roomId: room.id,
    roomName: room.name,
    roomCode: room.code,
    hostId: room.hostId,
  }),
  clearRoom: () => set({
    roomId: null,
    roomName: null,
    roomCode: null,
    isConnected: false,
    users: [],
    hostId: null,
  }),
  setConnected: (val) => set({ isConnected: val }),
  setUsers: (users) => set({ users }),
  addUser: (user) => set((s) => ({
    users: [...s.users.filter(u => u.id !== user.id), user]
  })),
  removeUser: (userId) => set((s) => ({
    users: s.users.filter(u => u.id !== userId)
  })),
  setCurrentUserId: (id) => set({ currentUserId: id }),
}))
