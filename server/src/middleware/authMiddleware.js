const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'virtuallab-dev-secret-change-in-production'

/**
 * Auth middleware — validates JWT from Authorization header
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Optional auth — sets req.userId if token present, but doesn't block
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      req.userId = decoded.userId
      req.user = decoded
    } catch (e) {
      // Token invalid, continue without auth
    }
  }
  next()
}

module.exports = { authMiddleware, optionalAuth, JWT_SECRET }
