const mongoose = require('mongoose')
const crypto = require('crypto')

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters'],
  },
  code: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex'),
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPublic: {
    type: Boolean,
    default: true,
  },
  maxMembers: {
    type: Number,
    default: 8,
  },
  worldState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
  },
}, {
  timestamps: true,
})

module.exports = mongoose.model('Room', roomSchema)
