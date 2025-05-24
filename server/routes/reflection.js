const express = require('express');
const router = express.Router();
const AIReflection = require('../models/AIReflection');
const TradeEntry = require('../models/TradeEntry');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

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
 * @desc    Generate AI reflection for a specific trade
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

    // Check if the trade belongs to the authenticated user
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

    // Generate reflection using Gemini API (if available) or mock data
    let reflectionData;
    
    if (process.env.GEMINI_API_KEY) {
      // Use Gemini API for real analysis
      try {
        // Make API call to Gemini
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this trade and provide a detailed reflection. Include a summary, strengths, weaknesses, and suggestions for improvement. Format your response as JSON with the following structure: {"summary": "string", "strengths": ["string"], "weaknesses": ["string"], "suggestions": ["string"], "sentiment": "positive|neutral|negative", "score": number}. The score should be between 1-10 with 10 being excellent. The trade data is: ${JSON.stringify(tradeData)}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          }
          // {
          //   headers: {
          //     'Content-Type': 'application/json',
          //     // 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
          //   }
          // }
        );
        
        // Parse the response to extract reflection
        if (response.data && 
            response.data.candidates && 
            response.data.candidates[0] && 
            response.data.candidates[0].content && 
            response.data.candidates[0].content.parts && 
            response.data.candidates[0].content.parts[0]) {
          
          const text = response.data.candidates[0].content.parts[0].text;
          
          try {
            // Try to parse the JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[0]);
              reflectionData = {
                summary: parsedData.summary || "No summary available",
                strengths: parsedData.strengths || [],
                weaknesses: parsedData.weaknesses || [],
                suggestions: parsedData.suggestions || [],
                sentiment: parsedData.sentiment || "neutral",
                score: parsedData.score || 5
              };
            } else {
              reflectionData = await generateMockReflection(tradeData);
            }
          } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            reflectionData = await generateMockReflection(tradeData);
          }
        } else {
          reflectionData = await generateMockReflection(tradeData);
        }
      } catch (error) {
        console.error('Gemini API error:', error);
        reflectionData = await generateMockReflection(tradeData);
      }
    } else {
      // Use mock data if no API key
      reflectionData = await generateMockReflection(tradeData);
    }

    // Create or update reflection
    if (reflection) {
      // Update existing reflection
      reflection = await AIReflection.findByIdAndUpdate(
        reflection._id,
        {
          ...reflectionData,
          updatedAt: Date.now()
        },
        { new: true }
      );
    } else {
      // Create new reflection
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
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// /**
//  * Generate mock reflection data for development/testing
//  * @param {Object} tradeData - Trade data to analyze
//  * @returns {Object} - Reflection data
//  */
// async function generateMockReflection(tradeData) {
//   // Determine sentiment and score based on profit/loss
//   let sentiment = 'neutral';
//   let score = 5;
  
//   if (tradeData.profitLoss > 0) {
//     sentiment = 'positive';
//     score = Math.min(Math.floor(7 + (tradeData.profitLossPercentage / 5)), 10);
//   } else if (tradeData.profitLoss < 0) {
//     sentiment = 'negative';
//     score = Math.max(Math.floor(5 - (Math.abs(tradeData.profitLossPercentage) / 5)), 1);
//   }

//   // Generate mock reflection based on trade data
//   if (tradeData.profitLoss > 0) {
//     return {
//       summary: `This was a successful ${tradeData.direction} trade on ${tradeData.instrumentName}, resulting in a profit of ${tradeData.profitLoss}. The entry and exit points were well-timed, capturing a significant portion of the market move.`,
//       strengths: [
//         'Well-timed entry at a key support/resistance level',
//         'Appropriate position sizing for the trade',
//         'Good profit target placement',
//         'Followed trading plan and strategy'
//       ],
//       weaknesses: [
//         'Could have captured more of the move with a later exit',
//         'Entry could have been slightly optimized',
//         'Trade documentation could be more detailed'
//       ],
//       suggestions: [
//         'Consider setting trailing stops to capture more of the move',
//         'Document pre-trade analysis more thoroughly',
//         'Look for similar setups in related instruments'
//       ],
//       sentiment,
//       score
//     };
//   } else {
//     return {
//       summary: `This ${tradeData.direction} trade on ${tradeData.instrumentName} resulted in a loss of ${Math.abs(tradeData.profitLoss)}. The market moved against the anticipated direction, but risk was managed with proper position sizing.`,
//       strengths: [
//         'Proper stop loss placement limited the downside',
//         'Position sizing kept the loss manageable',
//         'Quick decision to exit when conditions changed'
//       ],
//       weaknesses: [
//         'Entry signal may have been misinterpreted',
//         'Trade taken against the prevailing trend',
//         'Insufficient analysis of market conditions'
//       ],
//       suggestions: [
//         'Wait for stronger confirmation before entering similar trades',
//         'Review market conditions more thoroughly before entry',
//         'Consider reducing position size during high volatility'
//       ],
//       sentiment,
//       score
//     };
//   }
// }

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Helper function to convert image to base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

// POST /api/reflection/analyze-image - Analyze trading screenshots
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const imageBase64 = imageToBase64(imagePath);
    const mimeType = req.file.mimetype;

    // Enhanced prompt for trade extraction and normalization
    const prompt = `
Analyze this trading screenshot and extract all visible trade information. Return the data as a JSON array of trade objects.

IMPORTANT NORMALIZATION RULES:
- Convert "Buy" or "Bought" → "LONG"
- Convert "Sell" or "Sold" → "SHORT" 
- Convert any date formats to YYYY-MM-DD
- Extract numeric values without currency symbols
- Standardize instrument names (e.g., "AAPL Inc" → "AAPL", "Bitcoin USD" → "BTC/USD")
- Determine instrument type based on the symbol/name:
  * Forex pairs (USD/JPY, EUR/USD, GBP/USD) → "FOREX"
  * Stock symbols (AAPL, TSLA, MSFT) → "STOCK"
  * Crypto pairs (BTC/USD, ETH/USD) → "CRYPTO"
  * Futures contracts (ES, NQ, CL, GC) → "FUTURES"
  * Options contracts → "OPTIONS"
  * Everything else → "OTHER"
- If quantity is in shares/units, keep as number. If in dollar amounts, calculate shares if price is available
- Calculate profit/loss if entry and exit prices are available
- Extract all visible timestamps and convert to proper date format

Expected JSON structure:
[
  {
    "instrumentName": "AAPL",
    "instrumentType": "STOCK",
    "direction": "LONG" | "SHORT",
    "entryPrice": 150.00,
    "exitPrice": 155.00,
    "quantity": 100,
    "entryDate": "2024-01-15",
    "exitDate": "2024-01-20", 
    "profitLoss": 500.00,
    "notes": "Any additional context from the screenshot"
  }
]

Rules for extraction:
1. Only extract data that is clearly visible in the image
2. If a field is not visible, omit it from the JSON
3. Ensure all prices are positive numbers
4. Direction must be either "LONG" or "SHORT" (normalized from buy/sell)
5. InstrumentType must be one of: "FOREX", "STOCK", "CRYPTO", "FUTURES", "OPTIONS", "OTHER"
6. Calculate profit/loss if possible: (exitPrice - entryPrice) * quantity for LONG trades, (entryPrice - exitPrice) * quantity for SHORT trades
7. If multiple trades are visible, return an array with all trades
8. For instrument names, use the most standard ticker symbol format
9. If dates are partial, estimate based on screenshot context
10. If exit date is not visible, assume trade is closed today

Return only the JSON array, no additional text, no markdown formatting, no code blocks.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    try {
      // Clean the response text to remove markdown code blocks
      text = text.trim();
      
      // Remove markdown code blocks if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Additional cleanup for any remaining markdown
      text = text.trim();

      console.log('Cleaned AI response:', text);

      // Parse the JSON response
      const trades = JSON.parse(text);
      
      // Validate that we got an array
      if (!Array.isArray(trades)) {
        throw new Error('Response is not an array');
      }

      // Helper function to determine instrument type from name
      const determineInstrumentType = (instrumentName) => {
        const name = instrumentName.toUpperCase();
        
        // Forex pairs
        if (name.includes('/') && (name.includes('USD') || name.includes('EUR') || name.includes('GBP') || name.includes('JPY') || name.includes('AUD') || name.includes('CAD') || name.includes('CHF') || name.includes('NZD'))) {
          return 'FOREX';
        }
        
        // Crypto
        if (name.includes('BTC') || name.includes('ETH') || name.includes('CRYPTO') || name.includes('LTC') || name.includes('ADA') || name.includes('SOL')) {
          return 'CRYPTO';
        }
        
        // Futures - common futures symbols
        if (name.includes('ES') || name.includes('NQ') || name.includes('YM') || name.includes('RTY') || 
            name.includes('CL') || name.includes('GC') || name.includes('SI') || name.includes('NG') ||
            name.includes('NAS100') || name.includes('US30') || name.includes('US500') || name.includes('HK50') || name.includes('JPN225') || name.includes('US100')) {
          return 'FUTURES';
        }
        
        // Options - typically have strike prices or option indicators
        if (name.includes('CALL') || name.includes('PUT') || name.includes('OPT') || /\d{4}[CP]\d+/.test(name)) {
          return 'OPTIONS';
        }
        
        // Stock symbols - typically 1-5 letters
        if (/^[A-Z]{1,5}$/.test(name) || name.length <= 5) {
          return 'STOCK';
        }
        
        // Default to OTHER for everything else
        return 'OTHER';
      };

      // Helper function to calculate profit/loss percentage
      const calculateProfitLossPercentage = (entryPrice, exitPrice, direction) => {
        if (!entryPrice || !exitPrice || entryPrice === 0) return 0;
        
        if (direction === 'LONG') {
          return ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
          return ((entryPrice - exitPrice) / entryPrice) * 100;
        }
      };
      
      // Validate and sanitize the trades
      const validInstrumentTypes = ['FOREX', 'STOCK', 'CRYPTO', 'FUTURES', 'OPTIONS', 'OTHER'];
      const today = new Date().toISOString().split('T')[0];
      
      const validatedTrades = trades.map(trade => {
        const detectedType = trade.instrumentType || determineInstrumentType(trade.instrumentName || '');
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const exitPrice = parseFloat(trade.exitPrice) || 0;
        const direction = ['LONG', 'SHORT'].includes(trade.direction) ? trade.direction : 'LONG';
        
    return {
          instrumentName: trade.instrumentName || '',
          instrumentType: validInstrumentTypes.includes(detectedType) ? detectedType : 'OTHER',
          direction: direction,
          entryPrice: entryPrice,
          exitPrice: exitPrice,
          quantity: parseFloat(trade.quantity) || 0,
          entryDate: trade.entryDate || today,
          exitDate: trade.exitDate || null,
          profitLoss: parseFloat(trade.profitLoss) || 0,
          profitLossPercentage: calculateProfitLossPercentage(entryPrice, exitPrice, direction),
          notes: null,
          tags: [],
          reviewStatus: 'PENDING'
        };
      });

      console.log('Extracted trades:', validatedTrades);

      res.json({
        success: true,
        trades: validatedTrades,
        message: `Successfully extracted ${validatedTrades.length} trade(s) from the image`
      });

    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      console.error('Parse error:', parseError.message);
      
      // Fallback: try to extract basic info using regex patterns
      const today = new Date().toISOString().split('T')[0];
      const fallbackTrade = {
        instrumentName: 'UNKNOWN',
        instrumentType: 'OTHER',
        direction: 'LONG',
        entryPrice: 0,
        exitPrice: 0,
        quantity: 0,
        entryDate: today,
        exitDate: today,
        profitLoss: 0,
        profitLossPercentage: 0,
        notes: 'AI analysis incomplete - manual review required'
      };

      res.json({
        success: false,
        trades: [fallbackTrade],
        message: 'Could not parse trade data from image. Please try again or use manual input.',
        rawResponse: text,
        error: parseError.message
      });
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message
    });
  }
});

// GET /api/reflection/prompts - Get available reflection prompts (existing endpoint)
router.get('/prompts', async (req, res) => {
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
      }
    ];

    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// POST /api/reflection/generate - Generate AI reflection (existing endpoint)
router.post('/generate', async (req, res) => {
  try {
    const { prompt, tradeData } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Initialize Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Create enhanced prompt with trade data context
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

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const reflection = response.text();

    res.json({
      reflection,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating reflection:', error);
    res.status(500).json({ error: 'Failed to generate reflection' });
  }
});

// Test route to verify the reflection routes are working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Reflection routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
