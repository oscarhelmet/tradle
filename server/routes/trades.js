const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const TradeEntry = require('../models/TradeEntry');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { calculateProfitLossPercentage } = require('../utils/tradeCalculations');

/**
 * @route   GET /api/trades
 * @desc    Get all trades for the authenticated user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-entryDate',
      instrumentName,
      direction,
      outcome,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (instrumentName) {
      filter.instrumentName = { $regex: instrumentName, $options: 'i' };
    }
    
    if (direction && direction !== 'ALL') {
      filter.direction = direction;
    }
    
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = startDate;
      if (endDate) filter.entryDate.$lte = endDate;
    }
    
    // Handle outcome filter
    if (outcome && outcome !== 'ALL') {
      if (outcome === 'WIN') {
        filter.profitLoss = { $gt: 0 };
      } else if (outcome === 'LOSS') {
        filter.profitLoss = { $lt: 0 };
      } else if (outcome === 'BREAKEVEN') {
        filter.profitLoss = 0;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await TradeEntry.countDocuments(filter);
    
    // Get trades with pagination
    const trades = await TradeEntry.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      trades,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/trades/:id
 * @desc    Get a single trade by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const trade = await TradeEntry.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Check if the trade belongs to the authenticated user
    if (trade.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this trade'
      });
    }

    res.json({
      success: true,
      data: trade
    });
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/trades
 * @desc    Create a new trade
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      instrumentType,
      instrumentName,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      quantity,
      profitLoss,
      entryDate,
      exitDate,
      notes,
      tags,
      imageUrl
    } = req.body;

    // Calculate profit/loss percentage based on current account balance
    const profitLossPercentage = await calculateProfitLossPercentage(profitLoss, req.user.id);

    // Create trade entry
    const trade = new TradeEntry({
      userId: req.user.id,
      instrumentType,
      instrumentName,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      quantity,
      positionSize: quantity, // Set positionSize same as quantity
      profitLoss,
      profitLossPercentage, // Use calculated percentage
      entryDate: entryDate || Date.now(),
      exitDate: exitDate || Date.now(),
      tradeDate: entryDate || Date.now(),
      notes: notes || '',
      tags: tags || [],
      imageUrl: imageUrl || ''
    });

    const savedTrade = await trade.save();

    res.status(201).json({
      success: true,
      data: savedTrade
    });
  } catch (err) {
    console.error('Create trade error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   PUT /api/trades/:id
 * @desc    Update a trade
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const trade = await TradeEntry.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Check authorization
    if (trade.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this trade'
      });
    }

    // If profitLoss is being updated, recalculate percentage
    if (req.body.profitLoss !== undefined) {
      req.body.profitLossPercentage = await calculateProfitLossPercentage(req.body.profitLoss, req.user.id);
    }

    const updatedTrade = await TradeEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedTrade
    });
  } catch (err) {
    console.error('Update trade error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @route   DELETE /api/trades/:id
 * @desc    Delete a trade
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const trade = await TradeEntry.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Check if the trade belongs to the authenticated user
    if (trade.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this trade'
      });
    }

    await trade.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/trades/upload
 * @desc    Upload a chart image
 * @access  Private
 */
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Create image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
