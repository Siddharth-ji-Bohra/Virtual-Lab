import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useRoomStore } from '../stores/roomStore'

// Connect via Vite proxy (same origin) to avoid CORS
const SOCKET_URL = window.location.origin

/**
 * useSocket — Socket.io client hook for real-time collaboration
 * Manages connection, room events, physics deltas, cursor sync, and experiment sync
 */
export default function useSocket() {
  const socketRef = useRef(null)
  const cursorIntervalRef = useRef(null)
  // Store callbacks for experiment sync (set by App.jsx)
  const experimentCallbackRef = useRef(null)
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
      console.log('🔌 Connected to server:', socket.id)
      setConnected(true)
      setCurrentUserId(socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason)
      // Only clear connected state, don't clear room (allows reconnection)
      setConnected(false)
    })

    socket.on('reconnect', () => {
      console.log('🔌 Reconnected!')
      setConnected(true)
      // Re-join room if we were in one
      const { roomCode } = useRoomStore.getState()
      if (roomCode) {
        socket.emit('room:join', {
          roomCode,
          user: { username: `User-${socket.id.slice(0, 4)}` },
        })
      }
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message)
      setConnected(false)
    })

    // ── Room events ──
    socket.on('room:joined', ({ roomCode, users, worldState, isHost }) => {
      // Explicitly set connected when room is confirmed joined
      setConnected(true)
      setRoom({ id: roomCode, name: roomCode, code: roomCode, hostId: isHost ? socket.id : null })
      setUsers(users)
      console.log(`🏠 Joined room: ${roomCode} (${users.length} users, host: ${isHost})`)
    })

    socket.on('room:user-joined', (user) => {
      addUser(user)
      console.log(`👤 ${user.username} joined the room`)
    })

    socket.on('room:user-left', ({ userId, username }) => {
      removeUser(userId)
      console.log(`👤 ${username || userId} left the room`)
    })

    socket.on('room:host-changed', ({ isHost }) => {
      if (isHost) {
        console.log('👑 You are now the host')
      }
    })

    // ── Experiment sync ──
    socket.on('experiment:loaded', (snapshot) => {
      console.log('📡 Received experiment from another user')
      if (experimentCallbackRef.current) {
        experimentCallbackRef.current(snapshot)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current)
    }
  }, [])

  // Connect to server
  const connect = useCallback(() => {
    socketRef.current?.connect()
  }, [])

  // Join a room
  const joinRoom = useCallback((roomCode, user) => {
    const socket = socketRef.current
    if (!socket) return

    if (!socket.connected) {
      socket.connect()
    }

    const doJoin = () => socket.emit('room:join', { roomCode, user })

    if (socket.connected) {
      doJoin()
    } else {
      socket.once('connect', doJoin)
    }
  }, [])

  // Leave current room
  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave')
    clearRoom()
  }, [clearRoom])

  // ── Experiment sync ──
  // Broadcast experiment load to all room members
  const sendExperiment = useCallback((snapshot) => {
    socketRef.current?.emit('experiment:load', snapshot)
  }, [])

  // Register callback for when another user loads an experiment
  const onExperimentLoaded = useCallback((callback) => {
    experimentCallbackRef.current = callback
    return () => { experimentCallbackRef.current = null }
  }, [])

  // Send physics delta
  const sendDelta = useCallback((delta) => {
    socketRef.current?.emit('physics:delta', delta)
  }, [])

  // Send cursor position
  const sendCursor = useCallback((x, y) => {
    socketRef.current?.emit('cursor:move', { x, y })
  }, [])

  // Send full world state (host only)
  const sendFullState = useCallback((worldState) => {
    socketRef.current?.emit('physics:full-state', worldState)
  }, [])

  // Subscribe to physics deltas
  const onPhysicsDelta = useCallback((callback) => {
    socketRef.current?.on('physics:delta', callback)
    return () => socketRef.current?.off('physics:delta', callback)
  }, [])

  // Subscribe to cursor updates
  const onCursorUpdate = useCallback((callback) => {
    socketRef.current?.on('cursor:update', callback)
    return () => socketRef.current?.off('cursor:update', callback)
  }, [])

  // Subscribe to chat messages
  const onChatMessage = useCallback((callback) => {
    socketRef.current?.on('chat:message', callback)
    return () => socketRef.current?.off('chat:message', callback)
  }, [])

  // Send chat message
  const sendChatMessage = useCallback((text) => {
    socketRef.current?.emit('chat:message', { text })
  }, [])

  return {
    connect, joinRoom, leaveRoom,
    sendDelta, sendCursor, sendFullState,
    sendExperiment, onExperimentLoaded,
    onPhysicsDelta, onCursorUpdate, onChatMessage,
    sendChatMessage,
    socket: socketRef,
  }
}
