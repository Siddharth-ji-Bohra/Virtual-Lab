const express = require('express')
const Experiment = require('../models/Experiment')
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware')

const router = express.Router()

/**
 * POST /api/experiments — Save an experiment snapshot
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, worldSnapshot, tags, category, difficulty, isPublic, isTemplate } = req.body

    if (!worldSnapshot) {
      return res.status(400).json({ error: 'World snapshot is required' })
    }

    const experiment = await Experiment.create({
      title: title || 'Untitled Experiment',
      description,
      author: req.userId,
      worldSnapshot,
      tags: tags || [],
      category: category || 'custom',
      difficulty: difficulty || 'beginner',
      isPublic: isPublic !== false,
      isTemplate: isTemplate || false,
    })

    await experiment.populate('author', 'username avatarColor')
    res.status(201).json({ experiment })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/experiments — List experiments with search, tags, pagination
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, tag, category, difficulty, sort = 'newest' } = req.query

    const filter = { isPublic: true }

    if (search) {
      filter.$text = { $search: search }
    }
    if (tag) {
      filter.tags = tag.toLowerCase()
    }
    if (category && category !== 'all') {
      filter.category = category
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      popular: { likes: -1 },
      views: { views: -1 },
      oldest: { createdAt: 1 },
    }

    const experiments = await Experiment.find(filter)
      .populate('author', 'username avatarColor')
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-worldSnapshot')  // Don't send full snapshot in listing
      .lean()

    const total = await Experiment.countDocuments(filter)

    res.json({
      experiments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/experiments/templates — List pre-built lab templates
 */
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await Experiment.find({ isTemplate: true })
      .populate('author', 'username avatarColor')
      .sort({ title: 1 })
      .lean()

    res.json({ templates })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/experiments/:id — Get single experiment with full snapshot
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate('author', 'username avatarColor')

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' })
    }

    // Increment views
    experiment.views += 1
    await experiment.save()

    res.json({ experiment })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/experiments/:id — Update experiment
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const experiment = await Experiment.findById(req.params.id)

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' })
    }

    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the author can update this experiment' })
    }

    const { title, description, worldSnapshot, tags, category, difficulty, isPublic } = req.body

    if (title) experiment.title = title
    if (description !== undefined) experiment.description = description
    if (worldSnapshot) experiment.worldSnapshot = worldSnapshot
    if (tags) experiment.tags = tags
    if (category) experiment.category = category
    if (difficulty) experiment.difficulty = difficulty
    if (isPublic !== undefined) experiment.isPublic = isPublic

    await experiment.save()
    await experiment.populate('author', 'username avatarColor')

    res.json({ experiment })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/experiments/:id — Delete experiment
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const experiment = await Experiment.findById(req.params.id)

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' })
    }

    if (experiment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the author can delete this experiment' })
    }

    await experiment.deleteOne()
    res.json({ message: 'Experiment deleted' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
