const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const geminiService = require('../services/gemini');
const TradeEntry = require('../models/TradeEntry');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const uploadMulter = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/analysis/image
 * @desc    Analyze a trade chart image
 * @access  Private
 */
router.post('/image', protect, uploadMulter.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    console.log('Analyzing image for user:', req.user.email);

    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI analysis service is currently unavailable'
      });
    }

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);
    const imagePath = req.file.path;

    try {
      // Extract trade data using Gemini
      const result = await geminiService.extractTradeDataFromImage(
        imageBuffer, 
        req.file.mimetype
      );

      // Create image URL
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      res.json({
        success: true,
        imageUrl,
        extractedTrades: result.data || [],
        message: `Successfully extracted ${(result.data || []).length} trade(s) from the image`,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          timestamp: new Date().toISOString(),
          user: req.user.email
        }
      });

    } catch (analysisError) {
      console.error('Image analysis error:', analysisError);
      
      // Clean up uploaded file
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to analyze image',
        details: analysisError.message
      });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image upload'
    });
  }
});

/**
 * @route   POST /api/analysis/trade/:tradeId
 * @desc    Generate AI insights for a specific trade using new Gemini SDK
 * @access  Private
 */
router.post('/trade/:tradeId', protect, async (req, res) => {
  try {
    const trade = await TradeEntry.findById(req.params.tradeId);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    if (trade.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to analyze this trade'
      });
    }

    let insights;

    if (geminiService.isAvailable()) {
      try {
        console.log('Generating trade insights using new Gemini SDK...');
        
        const tradeData = {
          instrumentName: trade.instrumentName,
          instrumentType: trade.instrumentType,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          profitLoss: trade.profitLoss,
          profitLossPercentage: trade.profitLossPercentage,
          entryDate: trade.entryDate,
          exitDate: trade.exitDate,
          notes: trade.notes
        };

        const result = await geminiService.analyzeTradeData(tradeData, 'general');
        
        if (result.success && result.data) {
          insights = result.data.summary || 'Analysis completed successfully';
        } else {
          throw new Error('Invalid Gemini response');
        }
      } catch (error) {
        console.error('Gemini trade analysis error:', error);
        insights = generateMockTradeInsights(trade);
      }
    } else {
      console.log('Gemini service not available, using mock insights');
      insights = generateMockTradeInsights(trade);
    }

    // Update trade with insights
    trade.aiInsights = insights;
    await trade.save();

    res.json({
      success: true,
      insights,
      trade: {
        _id: trade._id,
        instrumentName: trade.instrumentName,
        direction: trade.direction,
        profitLoss: trade.profitLoss,
        aiInsights: trade.aiInsights
      },
      metadata: {
        model: 'gemini-2.0-flash-exp',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trade analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trade insights'
    });
  }
});

/**
 * @route   POST /api/analysis/performance
 * @desc    Generate AI analysis of trading performance using new Gemini SDK
 * @access  Private
 */
router.post('/performance', protect, async (req, res) => {
  try {
    // Get user's trades
    const trades = await TradeEntry.find({ userId: req.user.id })
      .sort({ entryDate: -1 })
      .limit(100); // Analyze last 100 trades

    if (trades.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No trades found for analysis'
      });
    }

    // Calculate basic metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.profitLoss > 0).length;
    const losingTrades = trades.filter(trade => trade.profitLoss < 0).length;
    const winRate = (winningTrades / totalTrades) * 100;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const avgWin = winningTrades > 0 ? 
      trades.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? 
      trades.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + Math.abs(trade.profitLoss), 0) / losingTrades : 0;

    const performanceData = {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      recentTrades: trades.slice(0, 10).map(trade => ({
        instrument: trade.instrumentName,
        direction: trade.direction,
        pnl: trade.profitLoss,
        date: trade.entryDate
      }))
    };

    let analysisResult;

    if (geminiService.isAvailable()) {
      try {
        console.log('Generating performance analysis using new Gemini SDK...');
        
        const prompt = `
          As a professional trading analyst, analyze this trading performance data and provide comprehensive insights:

          Performance Metrics:
          - Total Trades: ${totalTrades}
          - Winning Trades: ${winningTrades}
          - Losing Trades: ${losingTrades}
          - Win Rate: ${winRate.toFixed(2)}%
          - Total P&L: $${totalPnL.toFixed(2)}
          - Average Win: $${avgWin.toFixed(2)}
          - Average Loss: $${avgLoss.toFixed(2)}

          Recent Trades Sample:
          ${JSON.stringify(performanceData.recentTrades, null, 2)}

          Please provide a detailed analysis including:
          1. Overall performance assessment
          2. Key strengths in the trading approach
          3. Areas that need improvement
          4. Specific actionable recommendations
          5. Risk management evaluation
          6. Strategic suggestions for better performance

          Format your response as JSON with this structure:
          {
            "analysis": "Comprehensive performance analysis",
            "strengths": ["strength1", "strength2", "strength3"],
            "weaknesses": ["weakness1", "weakness2", "weakness3"],
            "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
          }
        `;

        const schema = {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['analysis', 'strengths', 'weaknesses', 'recommendations']
        };

        const result = await geminiService.generateStructuredContent(prompt, schema);
        
        if (result.success && result.data) {
          analysisResult = result.data;
        } else {
          throw new Error('Invalid Gemini response');
        }
      } catch (error) {
        console.error('Gemini analysis error:', error);
        analysisResult = generateMockAnalysis(performanceData);
      }
    } else {
      console.log('Gemini service not available, using mock analysis');
      analysisResult = generateMockAnalysis(performanceData);
    }

    res.json({
      success: true,
      ...analysisResult,
      metadata: {
        totalTrades,
        winRate,
        totalPnL,
        model: 'gemini-2.0-flash-exp',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance analysis'
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

router.post('/extract', protect, uploadMulter.single('image'), async (req, res) => {
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

/**
 * @route   GET /api/analysis/test
 * @desc    Test analysis endpoints and Gemini service
 * @access  Private
 */
router.get('/test', protect, async (req, res) => {
  try {
    console.log('Analysis test requested by user:', req.user.email);
    
    const serviceStatus = {
      geminiAvailable: geminiService.isAvailable(),
      timestamp: new Date().toISOString(),
      user: req.user.email
    };

    if (geminiService.isAvailable()) {
      try {
        const testResult = await geminiService.generateContent(
          'Generate a brief test message about trading analysis.',
          { maxOutputTokens: 100 }
        );
        serviceStatus.testMessage = testResult.text;
        serviceStatus.testSuccess = true;
      } catch (error) {
        serviceStatus.testError = error.message;
        serviceStatus.testSuccess = false;
      }
    }

    res.json({
      success: true,
      message: 'Analysis service is running',
      ...serviceStatus
    });
  } catch (error) {
    console.error('Analysis test error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis service test failed'
    });
  }
});

/**
 * Generate mock analysis for fallback
 */
function generateMockAnalysis(performanceData) {
  const { winRate, totalPnL, totalTrades } = performanceData;
  
  let analysis, strengths, weaknesses, recommendations;

  if (winRate > 60) {
    analysis = `Excellent trading performance with a ${winRate.toFixed(1)}% win rate over ${totalTrades} trades. The total P&L of $${totalPnL.toFixed(2)} demonstrates strong profitability and consistent execution.`;
    strengths = [
      'High win rate indicates good trade selection',
      'Positive total P&L shows profitable strategy',
      'Consistent trading activity demonstrates discipline'
    ];
    weaknesses = [
      'Monitor risk management to maintain performance',
      'Consider position sizing optimization',
      'Track emotional factors during winning streaks'
    ];
    recommendations = [
      'Continue current strategy with minor refinements',
      'Document successful trade patterns',
      'Consider scaling position sizes carefully'
    ];
  } else if (winRate > 40) {
    analysis = `Moderate trading performance with a ${winRate.toFixed(1)}% win rate. While there\'s room for improvement, the foundation is solid with ${totalTrades} trades executed.`;
    strengths = [
      'Maintaining trading discipline',
      'Active trading approach',
      'Learning from market experience'
    ];
    weaknesses = [
      'Win rate could be improved with better entry timing',
      'Risk-reward ratios may need adjustment',
      'Trade selection criteria needs refinement'
    ];
    recommendations = [
      'Focus on improving entry criteria',
      'Analyze losing trades for patterns',
      'Consider adjusting risk-reward ratios'
    ];
  } else {
    analysis = `Trading performance needs improvement with a ${winRate.toFixed(1)}% win rate. Focus on strategy refinement and risk management to improve results.`;
    strengths = [
      'Maintaining trading activity',
      'Opportunity for significant improvement',
      'Experience gained from market exposure'
    ];
    weaknesses = [
      'Low win rate indicates strategy issues',
      'Risk management needs attention',
      'Entry and exit timing needs improvement'
    ];
    recommendations = [
      'Review and refine trading strategy',
      'Implement stricter entry criteria',
      'Focus on risk management fundamentals'
    ];
  }

  return { analysis, strengths, weaknesses, recommendations };
}

/**
 * Generate mock trade insights for fallback
 */
function generateMockTradeInsights(trade) {
  const isProfit = trade.profitLoss > 0;
  const percentage = trade.profitLossPercentage || 0;
  
  if (isProfit) {
    return `Profitable ${trade.direction} trade on ${trade.instrumentName} with a ${percentage.toFixed(2)}% return. Good execution of entry and exit strategy. Consider similar setups in the future.`;
  } else {
    return `Loss-making ${trade.direction} trade on ${trade.instrumentName} with a ${percentage.toFixed(2)}% loss. Review entry criteria and risk management for this setup. Consider adjusting stop-loss levels.`;
  }
}

module.exports = router;
