const express = require('express');
const router = express.Router();
const TradeEntry = require('../models/TradeEntry');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/metrics/summary
 * @desc    Get overall trading metrics summary
 * @access  Private
 */
router.get('/summary', protect, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      instrumentType, 
      instrumentName, 
      startDate,
      endDate,
      timeframe
    } = req.query;

    // Get user for initial balance
    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (instrumentType) filter.instrumentType = instrumentType;
    if (instrumentName) filter.instrumentName = { $regex: instrumentName, $options: 'i' };
    if (timeframe) filter.timeframe = timeframe;
    
    // Date range filter
    if (startDate || endDate) {
      filter.tradeDate = {};
      if (startDate) filter.tradeDate.$gte = new Date(startDate);
      if (endDate) filter.tradeDate.$lte = new Date(endDate);
    }

    // Get all trades matching the filter
    const trades = await TradeEntry.find(filter);

    // Calculate metrics
    const metrics = calculateMetrics(trades);

    res.json({
      success: true,
      data: {
        ...metrics,
        initialBalance: user ? user.initialBalance : 10000
      }
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
 * @route   GET /api/metrics/performance
 * @desc    Get performance metrics over time
 * @access  Private
 */
router.get('/performance', protect, async (req, res) => {
  try {
    // Get query parameters
    const { 
      period = 'monthly', // daily, weekly, monthly
      startDate,
      endDate,
      instrumentType
    } = req.query;

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (instrumentType) filter.instrumentType = instrumentType;
    
    // Date range filter
    if (startDate || endDate) {
      filter.tradeDate = {};
      if (startDate) filter.tradeDate.$gte = new Date(startDate);
      if (endDate) filter.tradeDate.$lte = new Date(endDate);
    }

    // Get all trades matching the filter
    const trades = await TradeEntry.find(filter).sort('entryDate');

    // Calculate performance metrics over time
    const performanceData = calculatePerformanceOverTime(trades, period);

    res.json({
      success: true,
      data: performanceData
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
 * @route   GET /api/metrics/instruments
 * @desc    Get metrics by instrument
 * @access  Private
 */
router.get('/instruments', protect, async (req, res) => {
  try {
    // Get all trades for the user
    const trades = await TradeEntry.find({ userId: req.user.id });

    // Group trades by instrument and calculate metrics
    const instrumentMetrics = calculateInstrumentMetrics(trades);

    res.json({
      success: true,
      data: instrumentMetrics
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
 * Calculate overall trading metrics
 * @param {Array} trades - Array of trade entries
 * @returns {Object} - Metrics object
 */
function calculateMetrics(trades) {
  // Initialize metrics
  const metrics = {
    totalTrades: trades.length,
    winningTrades: 0,
    losingTrades: 0,
    breakEvenTrades: 0,
    winRate: 0,
    totalProfit: 0,
    totalLoss: 0,
    netProfitLoss: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    averageRRR: 0,
    averageHoldingTime: 0
  };

  if (trades.length === 0) {
    return metrics;
  }

  // Calculate basic metrics
  let totalWinAmount = 0;
  let totalLossAmount = 0;
  let totalRRR = 0;
  let totalHoldingTimeMs = 0;
  let validHoldingTimeTrades = 0;

  trades.forEach(trade => {
    // Profit/loss metrics
    if (trade.profitLoss > 0) {
      metrics.winningTrades++;
      totalWinAmount += trade.profitLoss;
      metrics.largestWin = Math.max(metrics.largestWin, trade.profitLoss);
    } else if (trade.profitLoss < 0) {
      metrics.losingTrades++;
      totalLossAmount += Math.abs(trade.profitLoss);
      metrics.largestLoss = Math.max(metrics.largestLoss, Math.abs(trade.profitLoss));
    } else {
      metrics.breakEvenTrades++;
    }

    // Risk/reward ratio
    if (trade.riskRewardRatio) {
      totalRRR += trade.riskRewardRatio;
    }

    // Holding time
    if (trade.entryDate && trade.exitDate) {
      const holdingTime = new Date(trade.exitDate) - new Date(trade.entryDate);
      totalHoldingTimeMs += holdingTime;
      validHoldingTimeTrades++;
    }
  });

  // Calculate derived metrics
  metrics.winRate = (metrics.winningTrades / metrics.totalTrades) * 100;
  metrics.totalProfit = totalWinAmount;
  metrics.totalLoss = totalLossAmount;
  metrics.netProfitLoss = totalWinAmount - totalLossAmount;
  metrics.profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;
  metrics.averageWin = metrics.winningTrades > 0 ? totalWinAmount / metrics.winningTrades : 0;
  metrics.averageLoss = metrics.losingTrades > 0 ? totalLossAmount / metrics.losingTrades : 0;
  metrics.averageRRR = totalRRR > 0 ? totalRRR / trades.filter(t => t.riskRewardRatio).length : 0;
  
  // Average holding time in hours
  metrics.averageHoldingTime = validHoldingTimeTrades > 0 
    ? (totalHoldingTimeMs / validHoldingTimeTrades) / (1000 * 60 * 60) 
    : 0;

  return metrics;
}

/**
 * Calculate performance metrics over time
 * @param {Array} trades - Array of trade entries
 * @param {String} period - Time period (daily, weekly, monthly)
 * @returns {Array} - Performance data array
 */
function calculatePerformanceOverTime(trades, period) {
  if (trades.length === 0) {
    return [];
  }

  // Group trades by period
  const tradesByPeriod = {};
  
  trades.forEach(trade => {
    const date = trade.tradeDate || trade.entryDate;
    if (!date) return;
    
    let periodKey;
    const tradeDate = new Date(date);
    
    switch (period) {
      case 'daily':
        periodKey = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(tradeDate);
        const day = tradeDate.getDay();
        const diff = tradeDate.getDate() - day;
        firstDayOfWeek.setDate(diff);
        periodKey = firstDayOfWeek.toISOString().split('T')[0];
        break;
      case 'monthly':
      default:
        periodKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    if (!tradesByPeriod[periodKey]) {
      tradesByPeriod[periodKey] = [];
    }
    
    tradesByPeriod[periodKey].push(trade);
  });
  
  // Calculate metrics for each period
  const performanceData = [];
  let cumulativeProfitLoss = 0;
  
  Object.keys(tradesByPeriod).sort().forEach(periodKey => {
    const periodTrades = tradesByPeriod[periodKey];
    const metrics = calculateMetrics(periodTrades);
    
    cumulativeProfitLoss += metrics.netProfitLoss;
    
    performanceData.push({
      period: periodKey,
      trades: periodTrades.length,
      winRate: metrics.winRate,
      profitLoss: metrics.netProfitLoss,
      cumulativeProfitLoss
    });
  });
  
  return performanceData;
}

/**
 * Calculate metrics by instrument
 * @param {Array} trades - Array of trade entries
 * @returns {Array} - Instrument metrics array
 */
function calculateInstrumentMetrics(trades) {
  if (trades.length === 0) {
    return [];
  }

  // Group trades by instrument
  const tradesByInstrument = {};
  
  trades.forEach(trade => {
    const key = `${trade.instrumentType}:${trade.instrumentName}`;
    
    if (!tradesByInstrument[key]) {
      tradesByInstrument[key] = [];
    }
    
    tradesByInstrument[key].push(trade);
  });
  
  // Calculate metrics for each instrument
  const instrumentMetrics = [];
  
  Object.keys(tradesByInstrument).forEach(key => {
    const [instrumentType, instrumentName] = key.split(':');
    const instrumentTrades = tradesByInstrument[key];
    const metrics = calculateMetrics(instrumentTrades);
    
    instrumentMetrics.push({
      instrumentType,
      instrumentName,
      trades: instrumentTrades.length,
      winRate: metrics.winRate,
      profitLoss: metrics.netProfitLoss,
      profitFactor: metrics.profitFactor,
      averageRRR: metrics.averageRRR
    });
  });
  
  // Sort by profit/loss descending
  return instrumentMetrics.sort((a, b) => b.profitLoss - a.profitLoss);
}

module.exports = router;
