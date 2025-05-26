const TradeEntry = require('../models/TradeEntry');
const User = require('../models/User');

/**
 * Calculate profit/loss percentage based on current account balance
 * @param {number} profitLoss - The profit or loss amount
 * @param {string} userId - User ID to get current balance
 * @returns {Promise<number>} - Profit/loss percentage
 */
async function calculateProfitLossPercentage(profitLoss, userId) {
  try {
    // Get user's initial balance
    const user = await User.findById(userId);
    const initialBalance = user?.initialBalance || 10000;

    // Get all previous trades to calculate current balance
    const previousTrades = await TradeEntry.find({ userId }).sort({ createdAt: 1 });
    const netProfitLoss = previousTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    
    // Calculate current balance
    const currentBalance = initialBalance + netProfitLoss;

    // Avoid division by zero
    if (currentBalance <= 0) {
      console.warn('Current balance is zero or negative, cannot calculate percentage');
      return 0;
    }

    // Calculate percentage: (profitLoss / currentBalance) * 100
    const percentage = (profitLoss / currentBalance) * 100;
    
    return Math.round(percentage * 10000) / 10000; // Round to 4 decimal places
  } catch (error) {
    console.error('Error calculating profit/loss percentage:', error);
    return 0;
  }
}

/**
 * Calculate profit/loss percentage for multiple trades at once
 * @param {Array} trades - Array of trade objects with profitLoss
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of trades with updated profitLossPercentage
 */
async function calculateTradePercentages(trades, userId) {
  try {
    // Get user's initial balance
    const user = await User.findById(userId);
    const initialBalance = user?.initialBalance || 10000;

    // Get all existing trades to calculate running balance
    const existingTrades = await TradeEntry.find({ userId }).sort({ createdAt: 1 });
    let runningBalance = initialBalance + existingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);

    // Calculate percentages for each new trade
    return trades.map(trade => {
      if (runningBalance <= 0) {
        console.warn('Running balance is zero or negative, setting percentage to 0');
        return {
          ...trade,
          profitLossPercentage: 0
        };
      }

      const percentage = (trade.profitLoss / runningBalance) * 100;
      
      // Update running balance for next calculation
      runningBalance += trade.profitLoss;

      return {
        ...trade,
        profitLossPercentage: Math.round(percentage * 10000) / 10000
      };
    });
  } catch (error) {
    console.error('Error calculating trade percentages:', error);
    return trades.map(trade => ({ ...trade, profitLossPercentage: 0 }));
  }
}

module.exports = {
  calculateProfitLossPercentage,
  calculateTradePercentages
}; 