/**
 * Service for interacting with Gemini API via the backend server
 * This thin client forwards all requests to the backend API, with no client-side
 * processing or fallback logic.
 */

import { TradeEntry } from '../../models/TradeEntry';
import { AIReflection, AIAnalysisResult } from '../../models/AIReflection';
import { apiService } from '../api/ApiService';

class GeminiService {
  /**
   * Extract trade data from an image using the backend API
   * @param imageFile - Image file
   * @returns Promise resolving to extracted trade data
   */
  async extractTradeData(imageFile: File): Promise<AIAnalysisResult> {
    try {
      // Use the API service to extract trade data
      const result = await apiService.extractTradeData(imageFile);
      
      // Format the response
      return {
        instrumentType: result.extractedData.instrumentType as any,
        instrumentName: result.extractedData.instrumentName || '',
        direction: result.extractedData.direction as 'LONG' | 'SHORT',
        entryPrice: result.extractedData.entryPrice || 0,
        exitPrice: result.extractedData.exitPrice || 0,
        profitLoss: result.extractedData.profitLoss || 0,
        positionSize: result.extractedData.positionSize || 1,
        analysis: '',
        patterns: [],
        keyLevels: [],
        imageUrl: result.imageUrl
      };
    } catch (error) {
      console.error('Error extracting trade data:', error);
      throw error;
    }
  }

  /**
   * Generate reflective insights for a specific trade using the backend API
   * @param trade - Trade entry
   * @returns Promise resolving to insights
   */
  async generateTradeInsights(trade: TradeEntry): Promise<string> {
    try {
      // Use the API service to generate insights
      const result = await apiService.generateTradeInsights(trade._id);
      return result.insights;
    } catch (error) {
      console.error('Error generating trade insights:', error);
      throw error;
    }
  }

  /**
   * Generate a detailed reflection for a trade using the backend API
   * @param trade - Trade entry
   * @returns Promise resolving to AI reflection
   */
  async generateReflection(trade: TradeEntry): Promise<AIReflection> {
    try {
      // Use the API service to generate reflection
      return await apiService.generateTradeReflection(trade._id);
    } catch (error) {
      console.error('Error generating trade reflection:', error);
      throw error;
    }
  }
  
  /**
   * Analyze trading performance based on trade history
   * @param trades - Array of trade entries
   * @returns Promise resolving to performance analysis
   */
  async analyzePerformance(trades: TradeEntry[]): Promise<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      // TODO: Replace with actual backend API call once implemented
      // This is a placeholder and should be updated when the backend endpoint is available
      
      // In a proper implementation, we'd call something like:
      // return await apiService.request('/analysis/performance', 'POST', { trades: trades.map(t => t.id) });
      
      // For now, we'll pass through error to ensure frontend properly handles failure
      throw new Error('Performance analysis endpoint not yet implemented in backend');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
