import React from 'react';
import { TradeEntry } from '../../models/TradeEntry';

interface TradingStatisticsProps {
  trades: TradeEntry[];
  initialBalance: number;
}

const TradingStatistics: React.FC<TradingStatisticsProps> = ({ trades, initialBalance }) => {
  const stats = React.useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageTrade: 0,
        profitFactor: 0
      };
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.profitLoss || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.profitLoss || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const totalPL = trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const averageTrade = totalTrades > 0 ? totalPL / totalTrades : 0;
    
    const totalProfit = trades.filter(t => (t.profitLoss || 0) > 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalLoss = Math.abs(trades.filter(t => (t.profitLoss || 0) < 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      averageTrade,
      profitFactor
    };
  }, [trades, initialBalance]);

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    color?: string;
    className?: string;
  }> = ({
    title,
    value,
    subtitle,
    color = 'text-gray-900',
    className = ''
  }) => (
    <div className={`p-6 ${className}`}>
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
        <p className={`text-3xl font-bold ${color} mb-2`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <StatCard
        title="Total Trades"
        value={stats.totalTrades}
        className="border-b border-gray-100"
      />
      
      <StatCard
        title="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
        color={stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}
        className="border-b border-gray-100"
      />
      
      <StatCard
        title="Profit Factor"
        value={stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2)}
        subtitle="Gross Profit / Gross Loss"
        color={stats.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}
        className="border-b border-gray-100"
      />
      
      <StatCard
        title="Average Trade"
        value={`${stats.averageTrade >= 0 ? '+' : ''}$${stats.averageTrade.toFixed(2)}`}
        color={stats.averageTrade >= 0 ? 'text-green-600' : 'text-red-600'}
        className=""
      />
    </div>
  );
};

export default TradingStatistics; 