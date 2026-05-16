const express = require('express')
const Room = require('../models/Room')
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware')

const router = express.Router()

/**
 * POST /api/rooms — Create a new room
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, isPublic, maxMembers } = req.body

    const room = await Room.create({
      name: name || 'Untitled Lab',
      host: req.userId,
      members: [req.userId],
      isPublic: isPublic !== false,
      maxMembers: maxMembers || 8,
    })

    await room.populate('host', 'username avatarColor')
    res.status(201).json({ room })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/rooms — List public rooms
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const rooms = await Room.find({ isPublic: true, status: 'active' })
      .populate('host', 'username avatarColor')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()

    const total = await Room.countDocuments({ isPublic: true, status: 'active' })

    res.json({
      rooms: rooms.map(r => ({
        ...r,
        memberCount: r.members.length,
        members: undefined,  // Don't expose member IDs in listing
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/rooms/:code — Get room by join code
 */
router.get('/:code', optionalAuth, async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code })
      .populate('host', 'username avatarColor')
      .populate('members', 'username avatarColor')

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    res.json({ room })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/rooms/:code/join — Join a room
 */
router.post('/:code/join', authMiddleware, async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code })

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    if (room.status === 'closed') {
      return res.status(403).json({ error: 'Room is closed' })
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(403).json({ error: 'Room is full' })
    }

    if (!room.members.includes(req.userId)) {
      room.members.push(req.userId)
      await room.save()
    }

    await room.populate('host', 'username avatarColor')
    await room.populate('members', 'username avatarColor')

    res.json({ room })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/rooms/:id — Delete room (host only)
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    if (room.host.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the host can delete this room' })
    }

    await room.deleteOne()
    res.json({ message: 'Room deleted' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
