const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const TradeEntry = require('../models/TradeEntry');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
router.post(
  '/',
  [
    protect,
    [
      check('instrumentType', 'Instrument type is required').not().isEmpty(),
      check('instrumentName', 'Instrument name is required').not().isEmpty(),
      check('direction', 'Direction is required').not().isEmpty(),
      check('entryPrice', 'Entry price is required').isNumeric(),
      check('exitPrice', 'Exit price is required').isNumeric(),
      check('quantity', 'Quantity is required').isNumeric()
    ]
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Create new trade with user ID
      const newTrade = new TradeEntry({
        ...req.body,
        userId: req.user.id
      });

      // Save trade to database
      const trade = await newTrade.save();

      res.status(201).json({
        success: true,
        data: trade
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

/**
 * @route   PUT /api/trades/:id
 * @desc    Update a trade
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let trade = await TradeEntry.findById(req.params.id);

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
        error: 'Not authorized to update this trade'
      });
    }

    // Update trade
    trade = await TradeEntry.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

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
