const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeEntrySchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instrumentType: {
    type: String,
    enum: ['FOREX', 'CRYPTO', 'STOCKS', 'FUTURES', 'OPTIONS', 'COMMODITIES', 'INDICES', 'OTHER'],
    required: [true, 'Please specify the instrument type']
  },
  instrumentName: {
    type: String,
    required: [true, 'Please specify the instrument name'],
    trim: true
  },
  direction: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: [true, 'Please specify the trade direction']
  },
  entryPrice: {
    type: Number,
    required: [true, 'Please specify the entry price']
  },
  exitPrice: {
    type: Number,
    required: [true, 'Please specify the exit price']
  },
  stopLoss: {
    type: Number
  },
  takeProfit: {
    type: Number
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify the quantity/position size']
  },
  positionSize: {
    type: Number
  },
  profitLoss: {
    type: Number,
    required: [true, 'Please specify the profit/loss']
  },
  profitLossPercentage: {
    type: Number,
    required: [true, 'Please specify the profit/loss percentage']
  },
  entryDate: {
    type: Date,
    required: [true, 'Please specify the entry date']
  },
  exitDate: {
    type: Date,
    required: false,
    default: null
  },
  tradeDate: {
    type: Date
  },
  duration: {
    type: String
  },
  setupType: {
    type: String
  },
  timeframe: {
    type: String
  },
  riskRewardRatio: {
    type: Number
  },
  notes: {
    type: String,
    default: '',
    maxlength: 10000 // Increased to handle structured JSON notes
  },
  aiInsights: {
    type: String
  },
  tags: {
    type: [String]
  },
  imageUrl: {
    type: String
  },
  imageUrls: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate duration between entry and exit dates before saving
TradeEntrySchema.pre('save', function(next) {
  // Set positionSize to quantity if not provided (for backward compatibility)
  if (!this.positionSize && this.quantity) {
    this.positionSize = this.quantity;
  }
  
  // Calculate duration if entry and exit dates are provided
  if (this.entryDate && this.exitDate) {
    const diff = this.exitDate - this.entryDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      this.duration = `${days}d ${hours % 24}h`;
    } else {
      this.duration = `${hours}h ${minutes}m`;
    }
  }
  
  // Update the updatedAt field
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('TradeEntry', TradeEntrySchema);
