const express = require('express');
const router = express.Router();
const AIReflection = require('../models/AIReflection');
const TradeEntry = require('../models/TradeEntry');
const { protect } = require('../middleware/auth');
const geminiService = require('../services/gemini');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { calculateTradePercentages } = require('../utils/tradeCalculations');

// Configure multer for file uploads
const upload = multer({
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
 * @route   GET /api/reflection/:tradeId
 * @desc    Get AI reflection for a specific trade
 * @access  Private
 */
router.get('/:tradeId', protect, async (req, res) => {
  try {
    // Find reflection by trade ID
    const reflection = await AIReflection.findOne({ 
      tradeId: req.params.tradeId,
      userId: req.user.id
    });

    if (!reflection) {
      return res.status(404).json({
        success: false,
        error: 'Reflection not found for this trade'
      });
    }

    res.json({
      success: true,
      reflection
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
 * @route   POST /api/reflection/generate/:tradeId
 * @desc    Generate AI reflection for a specific trade using new Gemini SDK
 * @access  Private
 */
router.post('/generate/:tradeId', protect, async (req, res) => {
  try {
    // Find the trade
    const trade = await TradeEntry.findById(req.params.tradeId);

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
        error: 'Not authorized to generate reflection for this trade'
      });
    }

    // Check if reflection already exists
    let reflection = await AIReflection.findOne({ 
      tradeId: req.params.tradeId,
      userId: req.user.id
    });

    // If reflection exists and force regenerate is not specified, return existing
    if (reflection && !req.query.force) {
      return res.json({
        success: true,
        reflection
      });
    }

    // Prepare trade data for analysis
    const tradeData = {
      id: trade._id,
      instrumentType: trade.instrumentType,
      instrumentName: trade.instrumentName,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      profitLoss: trade.profitLoss,
      profitLossPercentage: trade.profitLossPercentage,
      date: trade.tradeDate || trade.entryDate,
      notes: trade.notes,
      aiInsights: trade.aiInsights,
      tags: trade.tags
    };

    let reflectionData;
    
    // Use new Gemini service for analysis
    if (geminiService.isAvailable()) {
      try {
        console.log('Generating trade reflection using new Gemini SDK...');
        
        const analysisResult = await geminiService.analyzeTradeData(tradeData, 'reflection');
        
        if (analysisResult.success && analysisResult.data) {
          const data = analysisResult.data;
              reflectionData = {
            summary: data.reflection || "AI reflection completed",
            strengths: data.lessons || [],
            weaknesses: data.improvementAreas || [],
            suggestions: data.nextSteps || [],
            sentiment: data.emotionalFactors?.length > 0 ? 'positive' : 'neutral',
            score: 7 // Default score for reflection type
          };
        } else {
          throw new Error('Invalid Gemini response');
        }
      } catch (error) {
        console.error('Gemini reflection error:', error);
        reflectionData = await generateMockReflection(tradeData);
      }
    } else {
      console.log('Gemini service not available, using mock reflection');
      reflectionData = await generateMockReflection(tradeData);
    }

    // Create or update reflection
    if (reflection) {
      reflection = await AIReflection.findByIdAndUpdate(
        reflection._id,
        {
          ...reflectionData,
          updatedAt: Date.now()
        },
        { new: true }
      );
    } else {
      reflection = new AIReflection({
        ...reflectionData,
        tradeId: trade._id,
        userId: req.user.id
      });
      await reflection.save();
    }

    res.json({
      success: true,
      reflection
    });
  } catch (err) {
    console.error('Reflection generation error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/reflection/analyze-image
 * @desc    Analyze trading image and extract trade data using new Gemini SDK
 * @access  Private
 */
router.post('/analyze-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Analyzing image for user:', req.user.email, 'File:', req.file.originalname);

    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please try again later.'
      });
    }

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);
    
    try {
      console.log('Starting Gemini image analysis...');
      
      // Use new Gemini service to extract trade data (pass userId for percentage calculation)
      const analysisResult = await geminiService.extractTradeDataFromImage(
        imageBuffer, 
        req.file.mimetype,
        req.user.id // Pass user ID for percentage calculation
      );

      console.log('Gemini analysis result:', analysisResult);

      // Create image URL for frontend
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error('Failed to extract trade data from image');
      }

      const trades = analysisResult.data;

      // Validate the extracted trades
      if (!Array.isArray(trades)) {
        throw new Error('Invalid trade data format received from AI');
      }

      console.log(`Successfully extracted ${trades.length} trade(s)`);

      // Helper function to determine instrument type (fallback)
      const determineInstrumentType = (instrumentName) => {
        if (!instrumentName) return 'OTHER';
        
        const name = instrumentName.toUpperCase();
        
        // Forex pairs
        if (name.includes('/') && (
          name.includes('USD') || name.includes('EUR') || name.includes('GBP') || 
          name.includes('JPY') || name.includes('CHF') || name.includes('AUD') || 
          name.includes('CAD') || name.includes('NZD')
        )) {
          return 'FOREX';
        }
        
        // Crypto
        if (name.includes('BTC') || name.includes('ETH') || name.includes('CRYPTO') || 
            name.includes('USDT') || name.includes('USDC')) {
          return 'CRYPTO';
        }
        
        // Futures
        if (name.includes('ES') || name.includes('NQ') || name.includes('YM') || 
            name.includes('CL') || name.includes('GC') || name.includes('NAS') || name.includes('US500')|| name.includes('US30')|| name.includes('HK50')|| name.includes('JPN225')) {
          return 'FUTURES';
        }
        
        // Options
        if (name.includes('CALL') || name.includes('PUT')) {
          return 'OPTIONS';
        }
        
        // Stock (1-5 character symbols)
        if (/^[A-Z]{1,5}$/.test(name)) {
          return 'STOCK';
        }
        
        return 'OTHER';
      };

      // Helper function to calculate profit/loss percentage based on current balance
      const calculateProfitLossPercentage = (profitLoss) => {
        // This will be overridden by the proper calculation, just a placeholder
        return 0;
      };

      // Validate and enhance the trades with proper percentage calculation
      const validInstrumentTypes = ['FOREX', 'STOCK', 'CRYPTO', 'FUTURES', 'OPTIONS', 'OTHER'];
      const today = new Date().toISOString();

      const processedTrades = trades.map((trade, index) => {
        console.log(`Processing trade ${index + 1}:`, trade);
        
        const detectedType = trade.instrumentType || determineInstrumentType(trade.instrumentName || '');
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const exitPrice = parseFloat(trade.exitPrice) || 0;
        const quantity = parseFloat(trade.quantity) || parseFloat(trade.positionSize) || 0;
        const direction = ['LONG', 'SHORT'].includes(trade.direction) ? trade.direction : 'LONG';
        const profitLoss = parseFloat(trade.profitLoss) || 0;
        
        // Convert BUY/SELL to LONG/SHORT
        let finalDirection = direction;
        if (trade.direction === 'BUY') finalDirection = 'LONG';
        if (trade.direction === 'SELL') finalDirection = 'SHORT';

        // Handle dates properly - ensure they are valid Date objects
        const now = new Date();
        let entryDate, exitDate, tradeDate;
        
        try {
          entryDate = trade.entryDate ? new Date(trade.entryDate) : now;
          if (isNaN(entryDate.getTime())) entryDate = now;
        } catch (e) {
          entryDate = now;
        }
        
        try {
          exitDate = trade.exitDate ? new Date(trade.exitDate) : now;
          if (isNaN(exitDate.getTime())) exitDate = now;
        } catch (e) {
          exitDate = now;
        }
        
        try {
          tradeDate = trade.tradeDate ? new Date(trade.tradeDate) : entryDate;
          if (isNaN(tradeDate.getTime())) tradeDate = entryDate;
        } catch (e) {
          tradeDate = entryDate;
        }

        return {
          instrumentType: validInstrumentTypes.includes(detectedType) ? detectedType : 'OTHER',
          instrumentName: trade.instrumentName || 'UNKNOWN',
          direction: finalDirection,
          entryPrice: entryPrice,
          exitPrice: exitPrice,
          stopLoss: parseFloat(trade.stopLoss) || undefined,
          takeProfit: parseFloat(trade.takeProfit) || undefined,
          quantity: quantity,
          positionSize: quantity, // Same as quantity
          profitLoss: profitLoss,
          profitLossPercentage: trade.profitLossPercentage || 0, // Will be recalculated
          entryDate: entryDate,
          exitDate: exitDate,
          tradeDate: tradeDate,
          duration: trade.duration || '1h',
          notes: null,
          tags: Array.isArray(trade.tags) ? trade.tags : []
        };
      });

      // Calculate proper profit/loss percentages based on current account balance
      const tradesWithPercentages = await calculateTradePercentages(processedTrades, req.user.id);

      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file');
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError.message);
      }

      // Return response in the format expected by frontend
      res.json({
        success: true,
        imageUrl,
        trades: tradesWithPercentages,
        message: `Successfully extracted ${tradesWithPercentages.length} trade(s) from the image`,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          timestamp: new Date().toISOString(),
          user: req.user.email,
          originalFilename: req.file.originalname,
          calculationMethod: 'account-balance-based'
        }
      });

    } catch (analysisError) {
      console.error('Gemini analysis error:', analysisError);
      
      // Clean up uploaded file on error
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file on error:', cleanupError.message);
      }

      // Return fallback response
      res.json({
        success: false,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        trades: [],
        error: 'Could not extract trade data from image. Please try again or enter manually.',
        details: analysisError.message
      });
    }

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process image upload',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/reflection/prompts
 * @desc    Get available reflection prompts
 * @access  Private
 */
router.get('/prompts', protect, async (req, res) => {
  try {
    const prompts = [
      {
        id: 'trade-analysis',
        name: 'Trade Analysis',
        description: 'Analyze your recent trades and identify patterns',
        template: 'What patterns do you notice in my recent trades? What could I improve?'
      },
      {
        id: 'risk-management',
        name: 'Risk Management Review', 
        description: 'Review your risk management practices',
        template: 'How well am I managing risk in my trades? What adjustments should I make?'
      },
      {
        id: 'strategy-review',
        name: 'Strategy Review',
        description: 'Evaluate your trading strategy effectiveness',
        template: 'Is my current trading strategy working? What changes would you recommend?'
      },
      {
        id: 'emotional-trading',
        name: 'Emotional Analysis',
        description: 'Analyze emotional factors in your trading',
        template: 'How are emotions affecting my trading decisions? What can I do to improve?'
      }
    ];

    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompts'
    });
  }
});

/**
 * @route   POST /api/reflection/generate
 * @desc    Generate custom AI reflection using new Gemini SDK
 * @access  Private
 */
router.post('/generate', protect, async (req, res) => {
  try {
    const { prompt, tradeData } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    let reflection;

    if (geminiService.isAvailable()) {
      try {
        // Create enhanced prompt with context
        const enhancedPrompt = `
          As a professional trading coach, analyze the following trading data and provide insights based on this prompt: "${prompt}"

          Trading Data Context:
          ${tradeData ? JSON.stringify(tradeData, null, 2) : 'No specific trade data provided'}

          Please provide:
          1. Specific observations about the trading performance
          2. Actionable recommendations for improvement
          3. Risk management insights
          4. Strategic suggestions

          Keep your response practical and focused on actionable advice.
        `;

        const result = await geminiService.generateContent(enhancedPrompt, {
          temperature: 0.7,
          maxOutputTokens: 1024
        });

        reflection = result.text;
      } catch (error) {
        console.error('Gemini generation error:', error);
        reflection = 'Unable to generate reflection at this time. Please try again later.';
      }
    } else {
      reflection = 'AI reflection service is currently unavailable. Please check your configuration.';
    }

    res.json({
      success: true,
      reflection,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.0-flash-exp'
    });

  } catch (error) {
    console.error('Error generating reflection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reflection'
    });
  }
});

/**
 * Generate mock reflection data for fallback
 */
async function generateMockReflection(tradeData) {
  let sentiment = 'neutral';
  let score = 5;
  
  if (tradeData.profitLoss > 0) {
    sentiment = 'positive';
    score = Math.min(Math.floor(7 + (tradeData.profitLossPercentage / 5)), 10);
  } else if (tradeData.profitLoss < 0) {
    sentiment = 'negative';
    score = Math.max(Math.floor(5 - (Math.abs(tradeData.profitLossPercentage) / 5)), 1);
  }

  if (tradeData.profitLoss > 0) {
    return {
      summary: `This was a successful ${tradeData.direction} trade on ${tradeData.instrumentName}, resulting in a profit of ${tradeData.profitLoss}. The entry and exit points were well-timed, capturing a significant portion of the market move.`,
      strengths: [
        'Well-timed entry at a key support/resistance level',
        'Appropriate position sizing for the trade',
        'Good profit target placement',
        'Followed trading plan and strategy'
      ],
      weaknesses: [
        'Could have captured more of the move with a later exit',
        'Risk-reward ratio could be optimized',
        'Consider tighter stop loss placement'
      ],
      suggestions: [
        'Look for similar setups in the future',
        'Consider scaling out positions at key levels',
        'Document the exact entry criteria for replication',
        'Review market conditions that led to this success'
      ],
      sentiment,
      score
    };
  } else {
    return {
      summary: `This ${tradeData.direction} trade on ${tradeData.instrumentName} resulted in a loss of ${Math.abs(tradeData.profitLoss)}. The market moved against the position, highlighting areas for improvement in entry timing and risk management.`,
      strengths: [
        'Trade was closed according to stop loss rules',
        'Risk was controlled and predetermined',
        'Learning opportunity identified'
      ],
      weaknesses: [
        'Entry timing could be improved',
        'Market conditions may not have been optimal',
        'Consider better confirmation signals',
        'Risk-reward ratio needs adjustment'
      ],
      suggestions: [
        'Review entry criteria and market analysis',
        'Consider waiting for stronger confirmation signals',
        'Analyze market conditions that led to the loss',
        'Adjust position sizing or stop loss levels',
        'Practice patience in trade selection'
      ],
      sentiment,
      score
    };
  }
}

/**
 * @route   GET /api/reflection/test
 * @desc    Test reflection endpoints and Gemini service
 * @access  Private
 */
router.get('/test', protect, async (req, res) => {
  try {
    const serviceStatus = {
      geminiAvailable: geminiService.isAvailable(),
      timestamp: new Date().toISOString(),
      user: req.user.email, // Show authenticated user
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
      message: 'Reflection routes are working!',
      ...serviceStatus
    });
  } catch (error) {
    console.error('Reflection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Reflection service test failed'
    });
  }
});

module.exports = router;
