const mongoose = require('mongoose')

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtuallab'
    await mongoose.connect(uri)
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
