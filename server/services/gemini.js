/**
 * Gemini API Service for image analysis and trade insights
 */

const { GoogleGenAI } = require('@google/genai');
const { calculateProfitLossPercentage } = require('../utils/tradeCalculations');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      this.client = null;
      return;
    }

    try {
      this.client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });
      console.log('✓ Gemini AI service initialized');
    } catch (error) {
      console.error('✗ Failed to initialize Gemini AI service:', error.message);
      this.client = null;
    }
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable() {
    return this.client !== null;
  }

  /**
   * Generate content using Gemini
   */
  async generateContent(prompt, config = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available');
    }

    try {
      const defaultConfig = {
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
          topK: 40,
          ...config
        }
      };

      console.log('Generating content with Gemini:', {
        model: defaultConfig.model,
        promptLength: prompt.length,
        config: defaultConfig.config
      });

      const response = await this.client.models.generateContent(defaultConfig);
      
      return {
        success: true,
        text: response.text,
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  /**
   * Generate content from image using Files API (recommended for production)
   */
  async generateContentFromImage(imageBuffer, mimeType, prompt, config = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available');
    }

    try {
      console.log('Uploading image to Gemini Files API...');
      
      // Upload image to Gemini Files API
      const uploadedFile = await this.client.files.upload({
        file: imageBuffer,
        config: { mimeType }
      });

      console.log('Image uploaded to Gemini:', uploadedFile.name);

      // Generate content with image
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { 
                fileData: {
                  fileUri: uploadedFile.uri,
                  mimeType: uploadedFile.mimeType
                }
              }
            ]
          }
        ],
        config: {
          temperature: 0.1, // Lower temperature for better accuracy
          maxOutputTokens: 4096,
          ...config
        }
      });

      // Clean up uploaded file
      try {
        await this.client.files.delete({ name: uploadedFile.name });
        console.log('Cleaned up uploaded file from Gemini');
      } catch (deleteError) {
        console.warn('Failed to delete uploaded file:', deleteError.message);
      }

      return {
        success: true,
        text: response.text,
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      };
  } catch (error) {
      console.error('Gemini image analysis error:', error);
      throw new Error(`Gemini image analysis failed: ${error.message}`);
  }
}

/**
   * Generate content from image using inline data (for smaller images)
   */
  async generateContentFromImageInline(imageBuffer, mimeType, prompt, config = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available');
    }

    try {
      console.log('Analyzing image with inline data...');
      
      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Generate content with inline image
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          ...config
        }
      });

      return {
        success: true,
        text: response.text,
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      };
  } catch (error) {
      console.error('Gemini inline image analysis error:', error);
      throw new Error(`Gemini inline image analysis failed: ${error.message}`);
  }
}

/**
   * Generate structured JSON response with image
   */
  async generateStructuredContentWithImage(imageBuffer, mimeType, prompt, schema, config = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available');
    }

    try {
      // Determine whether to use Files API or inline data based on image size
      const imageSizeMB = imageBuffer.length / (1024 * 1024);
      const useFilesAPI = imageSizeMB > 15;

      let response;

      if (useFilesAPI) {
        console.log(`Image size: ${imageSizeMB.toFixed(2)}MB - Using Files API`);
        
        const uploadedFile = await this.client.files.upload({
          file: imageBuffer,
          config: { mimeType }
        });

        response = await this.client.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { 
                  fileData: {
                    fileUri: uploadedFile.uri,
                    mimeType: uploadedFile.mimeType
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.05,
            maxOutputTokens: 4096,
            ...config
          }
        });

        // Clean up uploaded file
        try {
          await this.client.files.delete({ name: uploadedFile.name });
        } catch (deleteError) {
          console.warn('Failed to delete uploaded file:', deleteError.message);
        }
      } else {
        console.log(`Image size: ${imageSizeMB.toFixed(2)}MB - Using inline data`);
        
    const base64Image = imageBuffer.toString('base64');

        response = await this.client.models.generateContent({
          model: 'gemini-2.0-flash-exp',
        contents: [
          {
              role: 'user',
            parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.05,
            maxOutputTokens: 4096,
            ...config
          }
        });
      }

      console.log('Raw Gemini response text:', response.text);

      // Better JSON parsing with multiple fallback strategies
      let parsedData;
      
      try {
        // First attempt: direct JSON parse
        parsedData = JSON.parse(response.text);
        console.log('Successfully parsed JSON directly');
      } catch (parseError) {
        console.warn('Direct JSON parse failed, trying fallback strategies...');
        
        try {
          // Second attempt: Clean and extract JSON array
          let cleanText = response.text.trim();
          
          // Remove any markdown code blocks
          cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Extract array from text
          const arrayMatch = cleanText.match(/\[[\s\S]*?\]/);
          if (arrayMatch) {
            parsedData = JSON.parse(arrayMatch[0]);
            console.log('Successfully extracted JSON array from response');
          } else {
            throw new Error('No JSON array found in response');
          }
        } catch (extractError) {
          console.error('All JSON parsing strategies failed:', extractError);
          // Return empty array as fallback
          parsedData = [];
        }
      }

      // Validate and clean the parsed data
      if (Array.isArray(parsedData)) {
        parsedData = parsedData.map(trade => this.cleanTradeData(trade));
      }

      return {
        success: true,
        data: parsedData,
        text: response.text,
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      };
  } catch (error) {
      console.error('Gemini structured image generation error:', error);
      throw new Error(`Gemini structured image generation failed: ${error.message}`);
  }
}

/**
   * Clean and validate trade data from Gemini response
   */
  cleanTradeData(trade) {
    const cleaned = {};
    
    // Clean each field individually
    Object.keys(trade).forEach(key => {
      let value = trade[key];
      
      // Handle corrupted string values that contain JSON
      if (typeof value === 'string' && value.includes('"')) {
        // Try to extract just the first part before any JSON corruption
        const firstPart = value.split('",')[0].replace(/"/g, '');
        if (firstPart && firstPart !== value) {
          console.warn(`Cleaning corrupted field ${key}: "${value}" -> "${firstPart}"`);
          value = firstPart;
        }
      }
      
      // Type-specific cleaning
      switch (key) {
        case 'entryPrice':
        case 'exitPrice':
        case 'stopLoss':
        case 'takeProfit':
        case 'quantity':
        case 'positionSize':
        case 'profitLoss':
        case 'profitLossPercentage':
          cleaned[key] = value ? parseFloat(value) : 0;
          break;
          
        case 'entryDate':
        case 'exitDate':
        case 'tradeDate':
          if (value) {
            // Ensure it's a valid ISO date string
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                cleaned[key] = date.toISOString();
              } else {
                // Fallback to current date
                cleaned[key] = new Date().toISOString();
              }
            } catch (dateError) {
              cleaned[key] = new Date().toISOString();
            }
          }
          break;
          
        case 'tags':
          cleaned[key] = Array.isArray(value) ? value : [];
          break;
          
        case 'notes':
        case 'duration':
          cleaned[key] = typeof value === 'string' ? value : '';
          break;
          
        case 'instrumentType':
          const validTypes = ['FOREX', 'STOCK', 'CRYPTO', 'FUTURES', 'OPTIONS', 'OTHER'];
          cleaned[key] = validTypes.includes(value) ? value : 'OTHER';
          break;
          
        case 'direction':
          const validDirections = ['LONG', 'SHORT'];
          let cleanDirection = typeof value === 'string' ? value.toUpperCase() : 'LONG';
          if (cleanDirection === 'BUY') cleanDirection = 'LONG';
          if (cleanDirection === 'SELL') cleanDirection = 'SHORT';
          cleaned[key] = validDirections.includes(cleanDirection) ? cleanDirection : 'LONG';
          break;
          
        default:
          cleaned[key] = value;
      }
    });
    
    console.log('Cleaned trade data:', cleaned);
    return cleaned;
  }

  /**
   * Extract trade data from image with correct schema and actual image analysis
   */
  async extractTradeDataFromImage(imageBuffer, mimeType, userId = null) {
    const extractionPrompt = `
      Analyze this trading chart/screenshot and extract all visible trade information.
      
      Look for and extract:
      - Instrument/Symbol name (e.g., EUR/USD, AAPL, BTC/USD)
      - Instrument type (CRITICAL: Determine from the symbol using rules below)
      - Trade direction (LONG/SHORT) - Convert BUY to LONG, SELL to SHORT
      - Entry price
      - Exit price (if closed)
      - Quantity/Lot size
      - Position size (usually same as quantity)
      - Profit/Loss amount
      - Profit/Loss percentage
      - Entry date/time
      - Exit date/time (if closed)
      - Trade date (usually same as entry date)
      - Duration (calculate from entry to exit time)
      - Any visible notes or comments
      - Tags (any categories or labels visible)
      
      INSTRUMENT TYPE DETECTION RULES (MUST FOLLOW):
      
      1. FOREX - Currency pairs with "/" separator:
         Examples: EUR/USD, GBP/JPY, USD/CHF, AUD/CAD, NZD/USD, USD/JPY, GBP/USD, EUR/GBP
         Pattern: [CURRENCY]/[CURRENCY] where currencies are USD, EUR, GBP, JPY, CHF, AUD, CAD, NZD
      
      2. CRYPTO - Cryptocurrency symbols:
         Examples: BTC/USD, ETH/USD, BTC/USDT, ETH/BTC, SOL/USD, ADA/USD, DOT/USD
         Pattern: Contains BTC, ETH, SOL, ADA, DOT, USDT, USDC, or ends with cryptocurrency names
      
      3. STOCK - Individual company stocks:
         Examples: AAPL, TSLA, GOOGL, MSFT, AMZN, NVDA, META, NFLX
         Pattern: 1-5 uppercase letters, no "/" separator, not a currency or crypto
      
      4. FUTURES - Futures contracts:
         Examples: ES, NQ, YM, CL, GC, SI, /ES, /NQ, /CL
         Pattern: 1-3 letters, often starting with "/" or contains ES, NQ, YM, CL, GC, SI
      
      5. OPTIONS - Options contracts:
         Examples: AAPL240315C150, SPY_240315_C_450, contains CALL/PUT
         Pattern: Contains CALL, PUT, or has expiration date format (YYMMDD)
      
      6. OTHER - Use only when none of the above patterns match
      
      CRITICAL EXTRACTION RULES:
      1. Only extract data that is clearly visible in the image
      2. For instrumentType: ALWAYS determine using the rules above, DO NOT use OTHER unless absolutely no pattern matches
      3. For direction: Convert BUY → LONG, SELL → SHORT (ONLY use LONG or SHORT)
      4. For dates: Use ISO format YYYY-MM-DDTHH:MM:SS.000Z (if only date visible, use T00:00:00.000Z)
      5. For duration: Use "1h", "30m", "2d" format
      6. Convert percentages to decimal (5% = 5.0)
      7. quantity and positionSize should be the same value
      8. If no tags visible, use empty array []
      9. If notes not visible, use empty string ""
      
      EXAMPLES:
      - "EUR/USD" → instrumentType: "FOREX"
      - "AAPL" → instrumentType: "STOCK"  
      - "BTC/USD" → instrumentType: "CRYPTO"
      - "ES" or "/ES" → instrumentType: "FUTURES"
      - "AAPL240315C150" → instrumentType: "OPTIONS"
      
      Return JSON array format:
      [
        {
          "instrumentType": "FOREX|STOCK|CRYPTO|FUTURES|OPTIONS|OTHER",
          "instrumentName": "string",
          "direction": "LONG|SHORT",
          "entryPrice": number,
          "exitPrice": number,
          "quantity": number,
          "positionSize": number,
          "profitLoss": number,
          "profitLossPercentage": number,
          "entryDate": "YYYY-MM-DDTHH:MM:SS.000Z",
          "exitDate": "YYYY-MM-DDTHH:MM:SS.000Z",
          "tradeDate": "YYYY-MM-DDTHH:MM:SS.000Z",
          "duration": "string",
          "notes": "string",
          "tags": []
        }
      ]
      
      If you cannot extract any trade data, return: []
    `;

    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          instrumentType: { 
            type: 'string', 
            enum: ['FOREX', 'STOCK', 'CRYPTO', 'FUTURES', 'OPTIONS', 'OTHER'],
            description: 'Must be determined using the instrument detection rules'
          },
          instrumentName: { type: 'string' },
          direction: { type: 'string', enum: ['LONG', 'SHORT'] },
          entryPrice: { type: 'number', minimum: 0 },
          exitPrice: { type: 'number', minimum: 0 },
          quantity: { type: 'number', minimum: 0 },
          positionSize: { type: 'number', minimum: 0 },
          profitLoss: { type: 'number' },
          profitLossPercentage: { type: 'number' },
          entryDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$' },
          exitDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$' },
          tradeDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$' },
          duration: { type: 'string' },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['instrumentType', 'instrumentName', 'direction', 'entryPrice']
      }
    };

    try {
      console.log('Extracting trade data from image using Gemini with actual image analysis...');
      
      const result = await this.generateStructuredContentWithImage(
        imageBuffer,
        mimeType,
        extractionPrompt,
        schema
      );

      console.log('Raw Gemini extraction result:', result);

      // Validate and enhance the extracted data with proper percentage calculation
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('Raw extracted trades:', result.data);
        
        // Process trades sequentially to ensure proper percentage calculation
        const enhancedTrades = [];
        for (const trade of result.data) {
          const enhanced = await this.enhanceTradeData(trade, userId);
          enhancedTrades.push(enhanced);
        }
        
        console.log('Enhanced trades:', enhancedTrades);
        
        return {
          success: true,
          data: enhancedTrades
        };
      }

      return result;
    } catch (error) {
      console.error('Trade extraction error:', error);
      throw error;
    }
  }

  /**
   * Enhance and validate extracted trade data with proper percentage calculation
   */
  async enhanceTradeData(trade, userId = null) {
    const enhanced = { ...trade };

    console.log('Enhancing trade:', trade);

    // Ensure required fields have default values
    enhanced.tags = Array.isArray(enhanced.tags) ? enhanced.tags : [];
    enhanced.notes = typeof enhanced.notes === 'string' ? enhanced.notes : '';

    // Set positionSize to quantity if not provided
    if (!enhanced.positionSize && enhanced.quantity) {
      enhanced.positionSize = enhanced.quantity;
    }

    // Handle dates properly
    const now = new Date();
    
    // Ensure entryDate is valid
    if (enhanced.entryDate) {
      try {
        const entryDate = new Date(enhanced.entryDate);
        enhanced.entryDate = isNaN(entryDate.getTime()) ? now.toISOString() : entryDate.toISOString();
      } catch (e) {
        enhanced.entryDate = now.toISOString();
      }
    } else {
      enhanced.entryDate = now.toISOString();
    }

    // Ensure exitDate is valid
    if (enhanced.exitDate) {
      try {
        const exitDate = new Date(enhanced.exitDate);
        enhanced.exitDate = isNaN(exitDate.getTime()) ? now.toISOString() : exitDate.toISOString();
      } catch (e) {
        enhanced.exitDate = now.toISOString();
      }
    } else {
      enhanced.exitDate = now.toISOString();
    }

    // Set tradeDate to entryDate if not provided
    if (!enhanced.tradeDate) {
      enhanced.tradeDate = enhanced.entryDate;
    } else {
      try {
        const tradeDate = new Date(enhanced.tradeDate);
        enhanced.tradeDate = isNaN(tradeDate.getTime()) ? enhanced.entryDate : tradeDate.toISOString();
      } catch (e) {
        enhanced.tradeDate = enhanced.entryDate;
      }
    }

    // Calculate duration if missing but we have entry and exit dates
    if (!enhanced.duration && enhanced.entryDate && enhanced.exitDate) {
      try {
        const entryTime = new Date(enhanced.entryDate);
        const exitTime = new Date(enhanced.exitDate);
        const diffMs = exitTime.getTime() - entryTime.getTime();
        
        if (diffMs > 0) {
          const diffMinutes = Math.round(diffMs / (1000 * 60));
          const diffHours = Math.round(diffMs / (1000 * 60 * 60));
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffMinutes < 60) {
            enhanced.duration = `${diffMinutes}m`;
          } else if (diffHours < 24) {
            enhanced.duration = `${diffHours}h`;
          } else {
            enhanced.duration = `${diffDays}d`;
          }
        } else {
          enhanced.duration = '1h';
        }
      } catch (error) {
        console.warn('Duration calculation error:', error);
        enhanced.duration = '1h';
      }
    } else if (!enhanced.duration) {
      enhanced.duration = '1h';
    }

    // Calculate profit/loss percentage based on current account balance
    if (enhanced.profitLoss && userId) {
      try {
        console.log('Calculating percentage for profit/loss:', enhanced.profitLoss, 'for user:', userId);
        enhanced.profitLossPercentage = await calculateProfitLossPercentage(enhanced.profitLoss, userId);
        console.log('Calculated percentage:', enhanced.profitLossPercentage);
  } catch (error) {
        console.warn('Profit/loss percentage calculation error:', error);
        enhanced.profitLossPercentage = 0;
      }
    } else if (!enhanced.profitLossPercentage) {
      enhanced.profitLossPercentage = 0;
    }

    // ONLY use fallback detection if instrumentType is missing or explicitly OTHER
    if (!enhanced.instrumentType || enhanced.instrumentType === 'OTHER') {
      console.log('Using fallback instrument type detection for:', enhanced.instrumentName);
      enhanced.instrumentType = this.detectInstrumentType(enhanced.instrumentName);
    }

    console.log('Enhanced trade result:', enhanced);
    return enhanced;
  }

  /**
   * Fallback instrument type detection (should rarely be needed now)
   */
  detectInstrumentType(instrumentName) {
    if (!instrumentName) return 'OTHER';
    
    const name = instrumentName.toUpperCase();
    
    console.log('Fallback detection for instrument:', name);
    
    // Forex pairs (currency/currency)
    if (name.includes('/') && (
      name.includes('USD') || name.includes('EUR') || name.includes('GBP') || 
      name.includes('JPY') || name.includes('CHF') || name.includes('AUD') || 
      name.includes('CAD') || name.includes('NZD')
    )) {
      return 'FOREX';
    }
    
    // Crypto
    if (name.includes('BTC') || name.includes('ETH') || name.includes('CRYPTO') || 
        name.includes('USDT') || name.includes('USDC') || name.includes('SOL') ||
        name.includes('ADA') || name.includes('DOT')) {
      return 'CRYPTO';
    }
    
    // Futures (common symbols)
    if (name.includes('ES') || name.includes('NQ') || name.includes('YM') || 
        name.includes('CL') || name.includes('GC') || name.includes('SI') ||
        name.startsWith('/')) {
      return 'FUTURES';
    }
    
    // Options (usually have expiration dates or CALL/PUT)
    if (name.includes('CALL') || name.includes('PUT') || 
        /\d{6}[CP]\d+/.test(name)) {
      return 'OPTIONS';
    }
    
    // Stock (most common symbols are 1-5 characters)
    if (/^[A-Z]{1,5}$/.test(name)) {
      return 'STOCK';
    }
    
    return 'OTHER';
  }
}

// Export singleton instance
module.exports = new GeminiService();
