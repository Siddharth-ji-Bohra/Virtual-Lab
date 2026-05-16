/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message)

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ error: 'Validation failed', details: messages })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({ error: `${field} already exists` })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
}

module.exports = errorHandler
