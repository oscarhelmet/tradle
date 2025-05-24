const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const geminiService = require('../services/gemini');
const TradeEntry = require('../models/TradeEntry');
const path = require('path');
const fs = require('fs');

/**
 * @route   POST /api/analysis/image
 * @desc    Analyze a trade chart image
 * @access  Private
 */
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Get image path
    const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // Analyze image with Gemini API
    const analysisResult = await geminiService.analyzeTradeImage(imagePath);

    // Create image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl,
      analysis: analysisResult.analysis
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
 * @route   POST /api/analysis/trade/:tradeId
 * @desc    Generate insights for a specific trade
 * @access  Private
 */
router.post('/trade/:tradeId', protect, async (req, res) => {
  try {
    // Find the trade
    const trade = await TradeEntry.findById(req.params.tradeId);

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
        error: 'Not authorized to analyze this trade'
      });
    }

    // Prepare trade data for analysis
    const tradeData = {
      instrumentType: trade.instrumentType,
      instrumentName: trade.instrumentName,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      profitLoss: trade.profitLoss,
      profitLossPercentage: trade.profitLossPercentage,
      riskRewardRatio: trade.riskRewardRatio,
      notes: trade.notes
    };

    // Generate insights with Gemini API
    const insightsResult = await geminiService.generateTradeInsights(tradeData);

    // Update trade with AI insights
    trade.aiInsights = insightsResult.insights;
    await trade.save();

    res.json({
      success: true,
      insights: insightsResult.insights,
      trade: trade
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
 * @route   POST /api/analysis/extract
 * @desc    Extract trade data from image
 * @access  Private
 */
/**
 * @route   POST /api/analysis/performance
 * @desc    Analyze trading performance based on trade history
 * @access  Private
 */
router.post('/performance', protect, async (req, res) => {
  try {
    // Get all trades for the user
    const trades = await TradeEntry.find({ userId: req.user.id });

    if (trades.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No trades found to analyze'
      });
    }

    // Generate performance analysis with Gemini API
    const analysisResult = await geminiService.analyzePerformance(trades, req.user.id);

    res.json({
      success: true,
      analysis: analysisResult.analysis,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.post('/extract', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Get image path
    const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // Extract trade data using Gemini API
    const extractedData = await geminiService.extractTradeData(imagePath);

    // Create image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Calculate additional metrics if not provided by the extraction
    if (extractedData.entryPrice && extractedData.exitPrice && extractedData.direction) {
      // Calculate risk/reward ratio if stop loss is available
      if (!extractedData.riskRewardRatio && extractedData.stopLoss) {
        const entryPrice = parseFloat(extractedData.entryPrice);
        const exitPrice = parseFloat(extractedData.exitPrice);
        const stopLoss = parseFloat(extractedData.stopLoss);
        
        if (extractedData.direction === 'LONG') {
          const risk = entryPrice - stopLoss;
          const reward = exitPrice - entryPrice;
          if (risk > 0) {
            extractedData.riskRewardRatio = (reward / risk).toFixed(2);
          }
        } else {
          const risk = stopLoss - entryPrice;
          const reward = entryPrice - exitPrice;
          if (risk > 0) {
            extractedData.riskRewardRatio = (reward / risk).toFixed(2);
          }
        }
      }
      
      // Calculate profit/loss percentage if not provided
      if (!extractedData.profitLossPercentage) {
        const entryPrice = parseFloat(extractedData.entryPrice);
        const profitLoss = parseFloat(extractedData.profitLoss);
        const positionSize = parseFloat(extractedData.positionSize || 1);
        
        if (entryPrice > 0 && positionSize > 0) {
          extractedData.profitLossPercentage = ((profitLoss / (entryPrice * positionSize)) * 100).toFixed(2);
        }
      }
    }

    res.json({
      success: true,
      imageUrl,
      extractedData
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
