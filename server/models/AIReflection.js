const mongoose = require('mongoose');

const AIReflectionSchema = new mongoose.Schema({
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeEntry',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  summary: {
    type: String,
    required: [true, 'Reflection summary is required']
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  suggestions: {
    type: [String],
    default: []
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  score: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
AIReflectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AIReflection', AIReflectionSchema);
