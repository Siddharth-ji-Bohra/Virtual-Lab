const mongoose = require('mongoose')

const experimentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Experiment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  worldSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'World snapshot is required'],
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  category: {
    type: String,
    enum: ['mechanics', 'thermodynamics', 'waves', 'electricity', 'optics', 'custom'],
    default: 'custom',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Text index for search
experimentSchema.index({ title: 'text', description: 'text', tags: 'text' })

module.exports = mongoose.model('Experiment', experimentSchema)
