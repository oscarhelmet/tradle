/**
 * Gemini API Service for image analysis and trade insights
 */

const axios = require('axios');
const fs = require('fs');
// const path = require('path');

// // Gemini API configuration
// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
// const GEMINI_VISION_MODEL = 'gemini-pro-vision';
// const GEMINI_TEXT_MODEL = 'gemini-pro';

/**
 * Analyze a trade chart image using Gemini API
 * @param {String} imagePath - Path to the image file
 * @returns {Object} - Analysis results
 */
async function analyzeTradeImage(imagePath) {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using mock analysis.');
      return generateMockAnalysis();
    }

    // Read image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare request to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this trading chart image. Identify the instrument (Must be one of [STOCK,FOREX,CRYPTO,FUTURES,OPTIONS,OTHER]), trend direction, key support/resistance levels, and any notable patterns. Provide insights on the trade setup and potential entry/exit points."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and return the analysis
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts[0]) {
      return {
        analysis: response.data.candidates[0].content.parts[0].text,
        success: true
      };
    } else {
      console.error('Unexpected Gemini API response format:', response.data);
      return generateMockAnalysis();
    }
  } catch (error) {
    console.error('Error analyzing image with Gemini API:', error);
    return generateMockAnalysis();
  }
}

/**
 * Generate trade insights based on trade data using Gemini API
 * @param {Object} tradeData - Trade data object
 * @returns {Object} - Insights results
 */
async function generateTradeInsights(tradeData) {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using mock insights.');
      return {
        insights: "This appears to be a well-executed trade with proper risk management. The entry point was at a key support level, and the exit captured a significant portion of the move. Consider setting a trailing stop to potentially capture more profit in similar setups.",
        success: true
      };
    }

    // Prepare trade data for analysis
    const tradePrompt = `
      Analyze this trade and provide insights:
      
      Instrument: ${tradeData.instrumentType} - ${tradeData.instrumentName}
      Direction: ${tradeData.direction}
      Entry Price: ${tradeData.entryPrice}
      Exit Price: ${tradeData.exitPrice}
      Profit/Loss: ${tradeData.profitLoss} (${tradeData.profitLossPercentage}%)
      ${tradeData.stopLoss ? `Stop Loss: ${tradeData.stopLoss}` : ''}
      ${tradeData.takeProfit ? `Take Profit: ${tradeData.takeProfit}` : ''}
      ${tradeData.riskRewardRatio ? `Risk/Reward Ratio: ${tradeData.riskRewardRatio}` : ''}
      ${tradeData.notes ? `Trader Notes: ${tradeData.notes}` : ''}
      
      Provide a concise analysis of this trade, including strengths, weaknesses, and suggestions for improvement.
    `;

    // Call Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: tradePrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and return the insights
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts[0]) {
      return {
        insights: response.data.candidates[0].content.parts[0].text,
        success: true
      };
    } else {
      console.error('Unexpected Gemini API response format:', response.data);
      return {
        insights: "Unable to generate insights due to API response format issue. Please try again later.",
        success: false
      };
    }
  } catch (error) {
    console.error('Error generating insights with Gemini API:', error);
    return {
      insights: "Unable to generate insights due to an API error. Please try again later.",
      success: false
    };
  }
}

/**
 * Generate mock analysis for development/testing
 * @returns {Object} - Mock analysis results
 */
function generateMockAnalysis() {
  return {
    analysis: `
      Chart Analysis:
      
      Instrument: Appears to be a forex pair or cryptocurrency chart
      Timeframe: Likely 1-hour or 4-hour chart
      
      Trend Analysis:
      - The overall trend appears to be bullish in the short term
      - Price is trading above the 20-period moving average
      - There's a series of higher highs and higher lows forming
      
      Key Levels:
      - Support: There's a strong support level around the recent swing low
      - Resistance: A key resistance level is visible at the recent swing high
      - The price recently broke above a previous resistance level, which may now act as support
      
      Pattern Recognition:
      - A bullish flag pattern appears to have formed recently
      - Volume is increasing on upward moves, confirming the bullish momentum
      
      Trade Setup:
      - Entry: A potential entry would be on a pullback to the newly formed support
      - Stop Loss: Below the most recent swing low
      - Take Profit: The next resistance level or a 1:2 risk-reward ratio
      
      Additional Insights:
      - RSI indicator shows the asset is not yet overbought
      - Consider trailing your stop loss to lock in profits as the trade moves in your favor
    `,
    success: true
  };
}

/**
 * Extract trade data from a chart image using Gemini API
 * @param {String} imagePath - Path to the image file
 * @returns {Object} - Extracted trade data
 */
async function extractTradeData(imagePath) {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using mock data extraction.');
      return generateMockTradeData();
    }

    // Read image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare request to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this trading chart image and extract ONLY the following information in JSON format:\n\n1. instrument type (FOREX, STOCK, CRYPTO, etc.)\n2. instrument name\n3. trade direction (LONG or SHORT)\n4. entry price\n5. exit price\n6. position size (in lots or units)\n7. actual profit/loss (in currency, NOT pips)\n\nIMPORTANT: For profit/loss, make sure to extract the ACTUAL monetary value, not pips. If the image shows both pips and monetary value, use the monetary value. Position size should be in lots (for forex) or units (for stocks/crypto).\n\nFormat your response as a valid JSON object with the following structure: {\"instrumentType\": string, \"instrumentName\": string, \"direction\": string, \"entryPrice\": number, \"exitPrice\": number, \"profitLoss\": number, \"positionSize\": number}. Do not include any explanations or analysis, just the JSON object."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and parse the JSON response
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
          return {
            instrumentType: parsedData.instrumentType || 'FOREX',
            instrumentName: parsedData.instrumentName || 'EUR/USD',
            direction: parsedData.direction || 'LONG',
            entryPrice: parsedData.entryPrice || 1.0850,
            exitPrice: parsedData.exitPrice || 1.0950,
            profitLoss: parsedData.profitLoss || 100,
            positionSize: parsedData.positionSize || 1.0,
            success: true
          };
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
      }
      
      return generateMockTradeData();
    } else {
      console.error('Unexpected Gemini API response format:', response.data);
      return generateMockTradeData();
    }
  } catch (error) {
    console.error('Error extracting trade data with Gemini API:', error);
    return generateMockTradeData();
  }
}

/**
 * Generate mock trade data for development/testing
 * @returns {Object} - Mock trade data
 */
function generateMockTradeData() {
  return {
    instrumentType: 'FOREX',
    instrumentName: 'EUR/USD',
    direction: 'LONG',
    entryPrice: 1.0850,
    exitPrice: 1.0920,
    profitLoss: 70,
    positionSize: 1.0,
    success: true
  };
}

/**
 * Analyze trading performance based on trade history
 * @param {Array} trades - Array of trade entries
 * @param {String} userId - User ID
 * @returns {Object} - Performance analysis results
 */
async function analyzePerformance(trades, userId) {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using mock performance analysis.');
      return generateMockPerformanceAnalysis(trades);
    }

    // Prepare trade data summary for analysis
    const tradesSummary = trades.map(trade => ({
      instrumentType: trade.instrumentType,
      instrumentName: trade.instrumentName,
      direction: trade.direction,
      profitLoss: trade.profitLoss,
      profitLossPercentage: trade.profitLossPercentage,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      riskRewardRatio: trade.riskRewardRatio || 'N/A'
    }));

    // Calculate some basic metrics to include in the prompt
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profitLoss > 0).length;
    const losingTrades = trades.filter(t => t.profitLoss < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalProfit = trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(trades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const prompt = `
      Analyze the performance of a trader based on their trading history and provide insights.
      
      Performance Metrics:
      - Total Trades: ${totalTrades}
      - Winning Trades: ${winningTrades}
      - Losing Trades: ${losingTrades}
      - Win Rate: ${winRate.toFixed(2)}%
      - Total Profit: ${totalProfit.toFixed(2)}
      - Total Loss: ${totalLoss.toFixed(2)}
      - Profit Factor: ${profitFactor.toFixed(2)}
      
      Trade History:
      ${JSON.stringify(tradesSummary, null, 2)}
      
      Provide a comprehensive analysis of the trading performance in this format:
      1. A detailed analysis paragraph (200-300 words)
      2. A list of 3-5 strengths (bullet points)
      3. A list of 3-5 weaknesses or areas for improvement (bullet points)
      4. A list of 3-5 specific recommendations for improving performance (bullet points)
      
      Format your response as a valid JSON object with the following structure:
      {
        "analysis": "string",
        "strengths": ["string", "string", ...],
        "weaknesses": ["string", "string", ...],
        "recommendations": ["string", "string", ...]
      }
    `;

    // Call Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and parse the response
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
          return {
            analysis: parsedData.analysis || "",
            strengths: parsedData.strengths || [],
            weaknesses: parsedData.weaknesses || [],
            recommendations: parsedData.recommendations || [],
            success: true
          };
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
      }
    }
    
    console.error('Unexpected Gemini API response format:', response.data);
    return generateMockPerformanceAnalysis(trades);
  } catch (error) {
    console.error('Error analyzing performance with Gemini API:', error);
    return generateMockPerformanceAnalysis(trades);
  }
}

/**
 * Generate mock performance analysis for development/testing
 * @param {Array} trades - Array of trade entries
 * @returns {Object} - Mock performance analysis
 */
function generateMockPerformanceAnalysis(trades) {
  const winningTrades = trades.filter(t => t.profitLoss > 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  let sentiment = 'neutral';
  let strengths = [];
  let weaknesses = [];
  let recommendations = [];
  let analysis = "";

  if (winRate >= 60) {
    sentiment = 'positive';
    analysis = "Your trading performance shows a strong win rate and consistent profitability. You've demonstrated good discipline in following your trading strategies and risk management practices. The data reveals a pattern of successful trades across multiple instruments, with particularly positive results in forex pairs.";
    strengths = [
      "Excellent win rate above industry averages",
      "Consistent profitability across different market conditions",
      "Good risk management with appropriate position sizing",
      "Patience in waiting for high-probability setups"
    ];
    weaknesses = [
      "Occasional premature exits on winning trades",
      "Some emotional decision-making during market volatility",
      "Slightly inconsistent performance between different asset classes"
    ];
    recommendations = [
      "Consider setting more defined profit targets to avoid early exits",
      "Develop a pre-trade checklist to ensure consistency",
      "Focus on trading during your historically most profitable market hours",
      "Increase position size gradually on your highest win-rate instruments"
    ];
  } else if (winRate >= 40) {
    sentiment = 'neutral';
    analysis = "Your trading performance shows a moderate win rate with mixed results. While you've had successful trades, there's room for improvement in consistency and risk management. The data indicates some good trading practices mixed with areas that need refinement.";
    strengths = [
      "Several consecutive winning trades showing good strategy implementation",
      "Reasonable risk management in most trades",
      "Good instrument selection in volatile markets"
    ];
    weaknesses = [
      "Inconsistent application of stop-loss levels",
      "Occasional overtrading during losing streaks",
      "Some trades taken against the prevailing trend"
    ];
    recommendations = [
      "Implement a more consistent stop-loss strategy",
      "Consider taking a break after 2-3 consecutive losses",
      "Focus on a smaller set of instruments to develop deeper expertise",
      "Keep a detailed trading journal with specific entry/exit reasons"
    ];
  } else {
    sentiment = 'negative';
    analysis = "Your trading performance indicates challenges that need addressing. The win rate is below average, and the data shows inconsistent application of trading principles. However, this presents an opportunity to reassess your approach and implement more structured strategies.";
    strengths = [
      "Willingness to try different strategies",
      "Some successful trades showing potential",
      "Reasonable position sizing in most cases"
    ];
    weaknesses = [
      "Low win rate indicating strategy issues",
      "Inconsistent risk management",
      "Possible emotional trading decisions",
      "Holding losing positions too long"
    ];
    recommendations = [
      "Review and revise your trading strategy fundamentals",
      "Implement strict stop-loss rules on every trade",
      "Consider paper trading while refining your approach",
      "Focus on one or two trading setups until consistently profitable",
      "Reduce position size until win rate improves"
    ];
  }

  return {
    analysis,
    strengths,
    weaknesses,
    recommendations,
    success: true
  };
}

module.exports = {
  analyzeTradeImage,
  generateTradeInsights,
  extractTradeData,
  analyzePerformance
};
