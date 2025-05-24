import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api/ApiService';
import { TradeEntry } from '../../models/TradeEntry';
import { useAuth } from '../../context/AuthContext';
import TradePerformanceChart from '../../components/charts/TradePerformanceChart';
import TradingStatistics from '../../components/charts/TradingStatistics';
import AddTradeDropdown from '../../components/ui/AddTradeDropdown';
import MobilePageHeader from '../../components/ui/MobilePageHeader';

const Dashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const [allTrades, setAllTrades] = useState<TradeEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeEntry[]>([]);
  const [metrics, setMetrics] = useState({
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
    averageHoldingTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch recent trades for charts and display
        const tradesData = await apiService.getTrades({ limit: 10, sort: '-entryDate' });
        
        // Handle both old and new API response formats
        const recentTradesArray = Array.isArray(tradesData) ? tradesData : tradesData.trades;
        
        setAllTrades(recentTradesArray || []);
        setRecentTrades((recentTradesArray || []).slice(0, 5));
        
        // Fetch performance metrics
        const performanceMetrics = await apiService.getPerformanceMetrics();
        setMetrics(performanceMetrics);
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const initialBalance = authState.user?.initialBalance || 10000;
  
  // Calculate current balance
  const currentBalance = initialBalance + metrics.netProfitLoss;
  const returnPercentage = ((metrics.netProfitLoss / initialBalance) * 100);

  // Calculate best and worst trades for the cards below chart
  const getBestAndWorstTrades = () => {
    if (!allTrades || allTrades.length === 0) {
      return { bestTrade: 0, worstTrade: 0 };
    }
    const profits = allTrades.map(t => t.profitLoss || 0);
    return {
      bestTrade: Math.max(...profits, 0),
      worstTrade: Math.min(...profits, 0)
    };
  };

  const { bestTrade, worstTrade } = getBestAndWorstTrades();

  return (
    <div className="min-h-screen animated-gradient">
      {/* Mobile Header */}
      <MobilePageHeader
        title="Dashboard"
        subtitle="Your trading overview"
        icon={
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        }
      />

      {/* Desktop Header - Hide on mobile */}
      <div className="hidden lg:block max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Overview of your trading performance
            </p>
          </div>
          <div>
            <AddTradeDropdown />
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Account Overview - 3 Bigger Cards */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Initial Balance */}
                <div className="glass-card shadow-lg rounded-xl p-6 sm:p-8">
                  <div className="text-center">
                    <h3 className="text-base font-medium text-gray-500 mb-3">Initial Balance</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${initialBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total P/L */}
                <div className="glass-card shadow-lg rounded-xl p-6 sm:p-8">
                  <div className="text-center">
                    <h3 className="text-base font-medium text-gray-500 mb-3">Total P/L</h3>
                    <p className={`text-3xl sm:text-4xl font-bold ${
                      metrics.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.netProfitLoss >= 0 ? '+' : ''}${metrics.netProfitLoss.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Current Balance */}
                <div className="glass-card shadow-lg rounded-xl p-6 sm:p-8">
                  <div className="text-center">
                    <h3 className="text-base font-medium text-gray-500 mb-3">Current Balance</h3>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${currentBalance.toFixed(2)}
                    </p>
                    <p className={`text-sm mt-2 font-medium ${
                      returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}% return
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart, Statistics, and Best/Worst Cards - All in one row */}
            {allTrades.length > 0 && (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Chart takes 2 columns on desktop */}
                <div className="lg:col-span-2">
                  <div className="glass-card shadow-lg rounded-xl p-4 sm:p-6 h-full">
                    <h2 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-4">Performance Chart</h2>
                    <div className="h-64 sm:h-80 lg:h-80">
                      <TradePerformanceChart 
                        trades={allTrades} 
                        initialBalance={initialBalance} 
                        isMobile={window.innerWidth < 768}
                      />
                    </div>
                    
                    {/* Best and Worst Trade Cards below the chart */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Best Trade Card */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-center">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Best Trade</h4>
                          <p className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                            +${bestTrade.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">Single trade performance</p>
                        </div>
                      </div>
                      
                      {/* Worst Trade Card */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-center">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Worst Trade</h4>
                          <p className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
                            ${worstTrade.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">Single trade performance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Statistics take 1 column on desktop (right side) */}
                <div className="lg:col-span-1">
                  <div className="glass-card shadow-lg rounded-xl p-4 sm:p-6 h-full">
                    <h2 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-4 sm:mb-6">Trading Statistics</h2>
                    <TradingStatistics trades={allTrades} initialBalance={initialBalance} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions - Mobile: Single Row with Icons Only, Desktop: Grid with Text */}
            <div className="mb-6">
              {/* Mobile Layout - Single horizontal row with icons only */}
              <div className="grid grid-cols-4 gap-3 sm:hidden">
                <Link to="/journal/new" className="glass-card card-hover shadow-lg rounded-xl hover:shadow-md transition-shadow">
                  <div className="p-4 flex justify-center">
                    <div className="bg-green-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/journal" className="glass-card card-hover shadow-lg rounded-xl hover:shadow-md transition-shadow">
                  <div className="p-4 flex justify-center">
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/analysis" className="glass-card card-hover shadow-lg rounded-xl hover:shadow-md transition-shadow">
                  <div className="p-4 flex justify-center">
                    <div className="bg-purple-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/settings" className="glass-card card-hover shadow-lg rounded-xl hover:shadow-md transition-shadow">
                  <div className="p-4 flex justify-center">
                    <div className="bg-gray-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Desktop Layout - Grid with text descriptions */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <Link to="/journal/new" className="glass-card card-hover overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-2 sm:p-3">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                          Add New Trade
                        </dt>
                        <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                          Record Trade
                        </dd>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/journal" className="glass-card card-hover overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-2 sm:p-3">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                          View All Trades
                        </dt>
                        <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                          {metrics.totalTrades} Trades
                        </dd>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/analysis" className="glass-card card-hover overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-md p-2 sm:p-3">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                          AI Analysis
                        </dt>
                        <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                          Get Insights
                        </dd>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/settings" className="glass-card card-hover overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-gray-100 rounded-md p-2 sm:p-3">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                          Settings
                        </dt>
                        <dd className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                          Configure
                        </dd>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Trades Section */}
            <div className="glass-card shadow-lg rounded-xl overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Trades</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Your most recent trading activity
                    </p>
                  </div>
                  <Link to="/journal" className="text-sm font-medium text-primary hover:text-primary-dark">
                    View all →
                  </Link>
                </div>
              </div>
              <div className="bg-white">
                {recentTrades.length === 0 ? (
                  <div className="px-4 py-8 sm:p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No trades yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by recording your first trade.</p>
                    <div className="mt-6">
                      <Link to="/journal/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Record Your First Trade
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {recentTrades.map((trade, index) => (
                      <div key={trade._id}>
                        <Link to={`/journal/${trade._id}`} className="block hover:bg-gray-50 transition-colors">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-primary truncate">
                                  {trade.instrumentName}
                                </p>
                                <div className={`ml-2 flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                                  trade.direction === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.direction}
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  (trade.profitLoss || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {(trade.profitLoss || 0) >= 0 ? '+' : ''}${(trade.profitLoss || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  Entry: {trade.entryPrice || '0.00'} | 
                                  Exit: {trade.exitPrice || '0.00'}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  {trade.tradeDate ? new Date(trade.tradeDate).toLocaleDateString() : 
                                   trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'No date'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
