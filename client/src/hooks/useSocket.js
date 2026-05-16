import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useRoomStore } from '../stores/roomStore'

// Connect via Vite proxy (same origin) to avoid CORS
const SOCKET_URL = window.location.origin

/**
 * useSocket — Socket.io client hook for real-time collaboration
 *
 * Sync strategy:
 *  1. Any user action (body create, experiment load) → full world snapshot broadcast
 *  2. Play/pause state → broadcast to all
 *  3. Host periodically sends position updates while simulation runs
 */
export default function useSocket() {
  const socketRef = useRef(null)

  // Callback refs — set by App.jsx to handle incoming events
  const experimentCallbackRef = useRef(null)
  const worldSyncCallbackRef = useRef(null)
  const simStateCallbackRef = useRef(null)

  const {
    setRoom, clearRoom, setConnected, setUsers,
    addUser, removeUser, setCurrentUserId,
  } = useRoomStore()

  // Initialize socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Connected:', socket.id)
      setConnected(true)
      setCurrentUserId(socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason)
      setConnected(false)
    })

    socket.on('reconnect', () => {
      console.log('🔌 Reconnected!')
      setConnected(true)
      const { roomCode } = useRoomStore.getState()
      if (roomCode) {
        socket.emit('room:join', {
          roomCode,
          user: { username: `User-${socket.id.slice(0, 4)}` },
        })
      }
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Connection error:', err.message)
      setConnected(false)
    })

    // ── Room events ──
    socket.on('room:joined', ({ roomCode, users, worldState, isHost }) => {
      setConnected(true)
      setRoom({ id: roomCode, name: roomCode, code: roomCode, hostId: isHost ? socket.id : null })
      setUsers(users)
      // If joining an existing room and host sends world state, apply it
      if (worldState && worldSyncCallbackRef.current) {
        setTimeout(() => worldSyncCallbackRef.current(worldState), 300)
      }
      console.log(`🏠 Joined room: ${roomCode} (${users.length} users, host: ${isHost})`)
    })

    socket.on('room:user-joined', (user) => {
      addUser(user)
      console.log(`👤 ${user.username} joined`)
    })

    socket.on('room:user-left', ({ userId, username }) => {
      removeUser(userId)
      console.log(`👤 ${username || userId} left`)
    })

    socket.on('room:host-changed', ({ isHost }) => {
      if (isHost) console.log('👑 You are now the host')
    })

    // ── Experiment sync ──
    socket.on('experiment:loaded', (snapshot) => {
      console.log('📡 Received experiment from peer')
      if (experimentCallbackRef.current) experimentCallbackRef.current(snapshot)
    })

    // ── Full world sync (body positions, new bodies, constraints, etc.) ──
    socket.on('world:synced', (snapshot) => {
      if (worldSyncCallbackRef.current) worldSyncCallbackRef.current(snapshot)
    })

    // ── Simulation state sync (play/pause) ──
    socket.on('sim:toggled', ({ isRunning }) => {
      console.log('📡 Simulation state from peer:', isRunning ? 'PLAY' : 'PAUSE')
      if (simStateCallbackRef.current) simStateCallbackRef.current(isRunning)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // ── Connect ──
  const connect = useCallback(() => {
    socketRef.current?.connect()
  }, [])

  // ── Join Room ──
  const joinRoom = useCallback((roomCode, user) => {
    const socket = socketRef.current
    if (!socket) return
    if (!socket.connected) socket.connect()

    const doJoin = () => socket.emit('room:join', { roomCode, user })
    if (socket.connected) doJoin()
    else socket.once('connect', doJoin)
  }, [])

  // ── Leave Room ──
  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave')
    clearRoom()
  }, [clearRoom])

  // ── Experiment sync ──
  const sendExperiment = useCallback((snapshot) => {
    socketRef.current?.emit('experiment:load', snapshot)
  }, [])

  const onExperimentLoaded = useCallback((callback) => {
    experimentCallbackRef.current = callback
    return () => { experimentCallbackRef.current = null }
  }, [])

  // ── World sync — broadcast full serialized world ──
  const sendWorldSync = useCallback((snapshot) => {
    socketRef.current?.emit('world:sync', snapshot)
  }, [])

  const onWorldSync = useCallback((callback) => {
    worldSyncCallbackRef.current = callback
    return () => { worldSyncCallbackRef.current = null }
  }, [])

  // ── Simulation state (play/pause) sync ──
  const sendSimState = useCallback((isRunning) => {
    socketRef.current?.emit('sim:toggle', { isRunning })
  }, [])

  const onSimState = useCallback((callback) => {
    simStateCallbackRef.current = callback
    return () => { simStateCallbackRef.current = null }
  }, [])

  // ── Physics delta (lightweight per-tick updates) ──
  const sendDelta = useCallback((delta) => {
    socketRef.current?.emit('physics:delta', delta)
  }, [])

  const sendCursor = useCallback((x, y) => {
    socketRef.current?.emit('cursor:move', { x, y })
  }, [])

  const sendFullState = useCallback((worldState) => {
    socketRef.current?.emit('physics:full-state', worldState)
  }, [])

  const onPhysicsDelta = useCallback((callback) => {
    socketRef.current?.on('physics:delta', callback)
    return () => socketRef.current?.off('physics:delta', callback)
  }, [])

  const onCursorUpdate = useCallback((callback) => {
    socketRef.current?.on('cursor:update', callback)
    return () => socketRef.current?.off('cursor:update', callback)
  }, [])

  const onChatMessage = useCallback((callback) => {
    socketRef.current?.on('chat:message', callback)
    return () => socketRef.current?.off('chat:message', callback)
  }, [])

  const sendChatMessage = useCallback((text) => {
    socketRef.current?.emit('chat:message', { text })
  }, [])

  return {
    connect, joinRoom, leaveRoom,
    sendExperiment, onExperimentLoaded,
    sendWorldSync, onWorldSync,
    sendSimState, onSimState,
    sendDelta, sendCursor, sendFullState,
    onPhysicsDelta, onCursorUpdate, onChatMessage,
    sendChatMessage,
    socket: socketRef,
  }
}
