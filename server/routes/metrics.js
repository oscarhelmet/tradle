const express = require('express');
const router = express.Router();
const TradeEntry = require('../models/TradeEntry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/metrics/summary
 * @desc    Get comprehensive trading metrics
 * @access  Private
 */
router.get('/summary', protect, async (req, res) => {
  try {
    // Get user's initial balance
    const user = await User.findById(req.user.id);
    const initialBalance = user.initialBalance || 10000;

    // Get all trades for the user
    const trades = await TradeEntry.find({ userId: req.user.id }).sort({ tradeDate: 1 });

    if (trades.length === 0) {
      return res.json({
        success: true,
        data: {
          totalTrades: 0,
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
          averageHoldingTime: 0,
          initialBalance,
          currentBalance: initialBalance,
          totalProfitLossPercentage: 0
        }
      });
    }

    // Calculate basic metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.profitLoss > 0);
    const losingTrades = trades.filter(trade => trade.profitLoss < 0);
    const breakEvenTrades = trades.filter(trade => trade.profitLoss === 0);

    const winRate = (winningTrades.length / totalTrades) * 100;

    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
    const netProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);

    // Calculate current balance
    const currentBalance = initialBalance + netProfitLoss;

    // Calculate total profit/loss percentage based on initial balance
    const totalProfitLossPercentage = (netProfitLoss / initialBalance) * 100;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitLoss)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitLoss)) : 0;

    // Calculate average risk-reward ratio
    const tradesWithRRR = trades.filter(trade => trade.riskRewardRatio && trade.riskRewardRatio > 0);
    const averageRRR = tradesWithRRR.length > 0 
      ? tradesWithRRR.reduce((sum, trade) => sum + trade.riskRewardRatio, 0) / tradesWithRRR.length 
      : 0;

    // Calculate average holding time
    const tradesWithDuration = trades.filter(trade => trade.entryDate && trade.exitDate);
    let averageHoldingTime = 0;
    if (tradesWithDuration.length > 0) {
      const totalHoldingTimeMs = tradesWithDuration.reduce((sum, trade) => {
        const duration = new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
        return sum + duration;
      }, 0);
      averageHoldingTime = totalHoldingTimeMs / tradesWithDuration.length;
    }

    res.json({
      success: true,
      data: {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        breakEvenTrades: breakEvenTrades.length,
        winRate: Math.round(winRate * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalLoss: Math.round(totalLoss * 100) / 100,
        netProfitLoss: Math.round(netProfitLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        averageWin: Math.round(averageWin * 100) / 100,
        averageLoss: Math.round(averageLoss * 100) / 100,
        largestWin: Math.round(largestWin * 100) / 100,
        largestLoss: Math.round(largestLoss * 100) / 100,
        averageRRR: Math.round(averageRRR * 100) / 100,
        averageHoldingTime: Math.round(averageHoldingTime),
        initialBalance: Math.round(initialBalance * 100) / 100,
        currentBalance: Math.round(currentBalance * 100) / 100,
        totalProfitLossPercentage: Math.round(totalProfitLossPercentage * 100) / 100
      }
    });
  } catch (err) {
    console.error('Metrics summary error:', err.message);
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
