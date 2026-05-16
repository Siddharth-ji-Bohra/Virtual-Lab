const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware')

const router = express.Router()

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { username, email, password } = req.body

    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(409).json({
        error: existing.email === email ? 'Email already registered' : 'Username already taken'
      })
    }

    const user = await User.create({ username, email, password })

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/auth/login
 * Authenticate and receive JWT
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: user.toSafeObject() })
  } catch (error) {
    next(error)
  }
})

module.exports = router
