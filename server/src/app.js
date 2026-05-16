const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

// Load environment variables
dotenv.config()

const app = express()
const server = http.createServer(app)

// Socket.io setup
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',')
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

// ── Middleware ──
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: allowedOrigins }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))  // large payload for experiment snapshots
app.use(express.urlencoded({ extended: true }))

// ── Routes ──
app.use('/api/auth', require('./routes/auth'))
app.use('/api/rooms', require('./routes/rooms'))
app.use('/api/experiments', require('./routes/experiments'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// ── Socket.io Event Handling ──
const socketHandler = require('./socket/socketHandler')
socketHandler(io)

// ── Error Handler ──
app.use(require('./middleware/errorHandler'))

// ── Start Server ──
const PORT = process.env.PORT || 5000

async function start() {
  // Connect to MongoDB (skip in development if no URI)
  if (process.env.MONGODB_URI) {
    await connectDB()
  } else {
    console.log('⚠️  No MONGODB_URI set — running without database')
  }

  server.listen(PORT, () => {
    console.log(`\n🔬 VIRTUAL-LAB Server running on port ${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/api/health`)
    console.log(`   Socket.io: ws://localhost:${PORT}`)
    console.log('')
  })
}

start().catch(console.error)
