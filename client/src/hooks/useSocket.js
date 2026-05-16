import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useRoomStore } from '../stores/roomStore'

// Use empty string so socket.io connects to the same origin
// which goes through Vite's proxy → no CORS issues
const SOCKET_URL = window.location.origin

/**
 * useSocket — Socket.io client hook for real-time collaboration
 * Manages connection, room events, physics deltas, and cursor sync
 */
export default function useSocket() {
  const socketRef = useRef(null)
  const cursorIntervalRef = useRef(null)
  const {
    setRoom, clearRoom, setConnected, setUsers,
    addUser, removeUser, setCurrentUserId,
  } = useRoomStore()

  // Initialize socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Connected to server:', socket.id)
      setConnected(true)
      setCurrentUserId(socket.id)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message)
      setConnected(false)
    })

    // Room events
    socket.on('room:joined', ({ roomCode, users, worldState, isHost }) => {
      setRoom({ id: roomCode, name: roomCode, code: roomCode, hostId: isHost ? socket.id : null })
      setUsers(users)
    })

    socket.on('room:user-joined', (user) => {
      addUser(user)
    })

    socket.on('room:user-left', ({ userId }) => {
      removeUser(userId)
    })

    socket.on('room:host-changed', ({ isHost }) => {
      if (isHost) {
        console.log('👑 You are now the host')
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
    if (!socketRef.current?.connected) {
      socketRef.current?.connect()
    }
    // Wait for connection, then join
    const socket = socketRef.current
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
    onPhysicsDelta, onCursorUpdate, onChatMessage,
    sendChatMessage,
    socket: socketRef,
  }
}
