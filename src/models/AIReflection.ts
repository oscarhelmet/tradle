/**
 * AI Reflection model for trade analysis
 */

export interface AIReflection {
  reflection:{
    _id: string;
    tradeId: string;
    userId: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number; // 1-10 rating
    createdAt: string; // Changed from Date to string since API returns strings
    updatedAt: string; // Changed from Date to string since API returns strings
    __v?: number; // Optional field that MongoDB adds
  };
}

export interface AIAnalysisResult {
  instrumentType?: string;
  instrumentName?: string;
  direction?: 'LONG' | 'SHORT';
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profitLoss?: number;
  positionSize?: number;
  setupType?: string;
  timeframe?: string;
  analysis: string;
  keyLevels?: number[];
  patterns?: string[];
  indicators?: {
    name: string;
    value: string;
    interpretation: string;
  }[];
  imageUrl?: string;
}

export interface AIPerformanceInsight {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  winRate: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  averageWin: number;
  averageLoss: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
