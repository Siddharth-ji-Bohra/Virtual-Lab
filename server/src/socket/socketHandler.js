/**
 * Socket.io event handler — manages real-time room communication
 * 
 * Events:
 *   Client → Server:
 *     - room:join { roomCode, user }
 *     - room:leave
 *     - physics:delta { type, data }
 *     - cursor:move { x, y }
 *     - chat:message { text }
 * 
 *   Server → Client:
 *     - room:joined { room, users }
 *     - room:user-joined { user }
 *     - room:user-left { userId }
 *     - physics:delta { type, data, userId }
 *     - physics:full-state { worldState }
 *     - cursor:update { userId, x, y }
 *     - chat:message { userId, username, text, timestamp }
 *     - error { message }
 */

// In-memory room state (production would use Redis)
const rooms = new Map()  // roomCode → { users: Map<socketId, userData>, worldState, hostSocketId }

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    let currentRoom = null

    // ── Join Room ──
    socket.on('room:join', ({ roomCode, user }) => {
      // Leave previous room if any
      if (currentRoom) {
        leaveRoom(socket, io, currentRoom)
      }

      currentRoom = roomCode

      // Initialize room if first user
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          users: new Map(),
          worldState: null,
          hostSocketId: socket.id,
        })
      }

      const room = rooms.get(roomCode)

      // Add user to room
      const userData = {
        id: socket.id,
        userId: user?.userId || socket.id,
        username: user?.username || `User-${socket.id.slice(0, 4)}`,
        avatarColor: user?.avatarColor || `hsl(${Math.floor(Math.random() * 360)}, 50%, 45%)`,
        cursor: { x: 0, y: 0 },
      }
      room.users.set(socket.id, userData)

      // Join Socket.io room
      socket.join(roomCode)

      // Send current state to joining user
      const usersList = Array.from(room.users.values()).map(u => ({
        id: u.id,
        userId: u.userId,
        username: u.username,
        avatarColor: u.avatarColor,
      }))

      socket.emit('room:joined', {
        roomCode,
        users: usersList,
        worldState: room.worldState,
        isHost: room.hostSocketId === socket.id,
      })

      // Notify others
      socket.to(roomCode).emit('room:user-joined', {
        id: userData.id,
        userId: userData.userId,
        username: userData.username,
        avatarColor: userData.avatarColor,
      })

      console.log(`👤 ${userData.username} joined room ${roomCode} (${room.users.size} users)`)
    })

    // ── Physics Delta ──
    socket.on('physics:delta', (delta) => {
      if (!currentRoom) return

      const room = rooms.get(currentRoom)
      if (!room) return

      // Broadcast delta to other users in room
      socket.to(currentRoom).emit('physics:delta', {
        ...delta,
        userId: socket.id,
        timestamp: Date.now(),
      })
    })

    // ── Experiment Sync ──
    // When a user loads an experiment, broadcast it to everyone else in the room
    socket.on('experiment:load', (snapshot) => {
      if (!currentRoom) return

      const room = rooms.get(currentRoom)
      if (!room) return

      console.log(`🔬 ${socket.id} loaded experiment in room ${currentRoom}`)

      // Broadcast to all OTHER users in the room
      socket.to(currentRoom).emit('experiment:loaded', snapshot)
    })

    // ── Full State Sync (host broadcasts periodically) ──
    socket.on('physics:full-state', (worldState) => {
      if (!currentRoom) return

      const room = rooms.get(currentRoom)
      if (!room) return

      // Only accept full state from host
      if (room.hostSocketId === socket.id) {
        room.worldState = worldState
      }
    })

    // ── Cursor Movement ──
    socket.on('cursor:move', ({ x, y }) => {
      if (!currentRoom) return

      const room = rooms.get(currentRoom)
      if (!room) return

      const user = room.users.get(socket.id)
      if (user) {
        user.cursor = { x, y }
      }

      socket.to(currentRoom).emit('cursor:update', {
        userId: socket.id,
        x,
        y,
      })
    })

    // ── Chat Message ──
    socket.on('chat:message', ({ text }) => {
      if (!currentRoom) return

      const room = rooms.get(currentRoom)
      if (!room) return

      const user = room.users.get(socket.id)
      if (!user) return

      io.to(currentRoom).emit('chat:message', {
        userId: socket.id,
        username: user.username,
        text,
        timestamp: Date.now(),
      })
    })

    // ── Leave Room ──
    socket.on('room:leave', () => {
      if (currentRoom) {
        leaveRoom(socket, io, currentRoom)
        currentRoom = null
      }
    })

    // ── Disconnect ──
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
      if (currentRoom) {
        leaveRoom(socket, io, currentRoom)
        currentRoom = null
      }
    })
  })
}

function leaveRoom(socket, io, roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return

  const user = room.users.get(socket.id)
  room.users.delete(socket.id)
  socket.leave(roomCode)

  // Notify others
  socket.to(roomCode).emit('room:user-left', {
    userId: socket.id,
    username: user?.username,
  })

  // If host left, assign new host
  if (room.hostSocketId === socket.id && room.users.size > 0) {
    const newHostId = room.users.keys().next().value
    room.hostSocketId = newHostId
    io.to(newHostId).emit('room:host-changed', { isHost: true })
    console.log(`👑 New host in ${roomCode}: ${newHostId}`)
  }

  // Clean up empty rooms
  if (room.users.size === 0) {
    rooms.delete(roomCode)
    console.log(`🗑️  Room ${roomCode} deleted (empty)`)
  }

  if (user) {
    console.log(`👤 ${user.username} left room ${roomCode} (${room.users.size} remaining)`)
  }
}

module.exports = socketHandler
