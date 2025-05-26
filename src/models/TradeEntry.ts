/**
 * Trade entry model and related types
 */

export enum InstrumentType {
  FOREX = 'FOREX',
  CRYPTO = 'CRYPTO',
  STOCKS = 'STOCKS',
  FUTURES = 'FUTURES',
  OPTIONS = 'OPTIONS',
  COMMODITIES = 'COMMODITIES',
  INDICES = 'INDICES',
  OTHER = 'OTHER'
}

export enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface TradeEntry {
  _id: string;
  // id?: string;
  userId: string;
  instrumentType: InstrumentType | string;  // e.g., "FOREX", "CRYPTO", "STOCKS"
  instrumentName: string;  // e.g., "EUR/USD", "AAPL", "BTC/USD"
  direction: Direction | 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  positionSize?: number;  // Alias for quantity for backward compatibility
  profitLoss: number;
  profitLossPercentage: number;
  entryDate: Date;
  exitDate: Date;
  tradeDate: Date;  // This should be a Date object
  duration: string;  // Calculated field: time between entry and exit
  setupType?: string;  // e.g., "Breakout", "Reversal", "Trend Continuation"
  timeframe?: string;  // e.g., "1H", "4H", "1D"
  riskRewardRatio?: number;
  notes?: string;      // Trader's personal notes
  aiInsights?: string; // AI-generated insights about the trade
  tags?: string[];
  imageUrls?: string[];  // URLs to chart images
  imageUrl?: string;     // Single image URL for backward compatibility
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
  averageProfit: number;
  averageLoss: number;
  largestProfit: number;
  largestLoss: number;
  profitFactor: number;  // Total profit / Total loss
  expectancy: number;    // (Win rate * Average win) - (Loss rate * Average loss)
  averageRiskRewardRatio: number;
}

export interface TradeFilter {
  instrumentType?: string;
  instrumentName?: string;
  direction?: 'LONG' | 'SHORT';
  setupType?: string;
  timeframe?: string;
  profitableOnly?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageRiskRewardRatio: number;
  sharpeRatio?: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  bestDay?: {
    date: Date;
    profit: number;
  };
  worstDay?: {
    date: Date;
    loss: number;
  };
}
