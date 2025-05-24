import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api/ApiService';
import { geminiService } from '../../services/gemini/GeminiService';
import { TradeEntry } from '../../models/TradeEntry';
import MobilePageHeader from '../../components/ui/MobilePageHeader';

const Analysis: React.FC = () => {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
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
  
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch trades - handle both old and new API response formats
        const tradesData = await apiService.getTrades();
        const tradesArray = Array.isArray(tradesData) ? tradesData : tradesData.trades || [];
        setTrades(tradesArray);
        
        // Fetch performance metrics
        try {
          const metricsData = await apiService.getPerformanceMetrics();
          setMetrics(metricsData);
        } catch (metricsError) {
          console.warn('Failed to load metrics, using empty metrics');
        }
        
        // Generate analysis if we have trades
        if (tradesArray.length > 0) {
          generateAnalysis(tradesArray);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load analysis data');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const generateAnalysis = async (tradesData: TradeEntry[]) => {
    try {
      setIsGeneratingAnalysis(true);
      const analysisData = await apiService.analyzePerformance();
      setAnalysis(analysisData);
    } catch (err) {
      console.error('Error generating analysis:', err);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };
  
  // Calculate monthly performance data
  const getMonthlyPerformance = () => {
    // Ensure trades is an array before processing
    if (!Array.isArray(trades) || trades.length === 0) {
      return [];
    }
    
    const monthlyData: { [key: string]: { profit: number; trades: number } } = {};
    
    trades.forEach(trade => {
      // Use entryDate or tradeDate, whichever is available
      const dateStr = trade.entryDate || trade.tradeDate;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { profit: 0, trades: 0 };
      }
      
      monthlyData[monthYear].profit += trade.profitLoss || 0;
      monthlyData[monthYear].trades += 1;
    });
    
    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        profit: data.profit,
        trades: data.trades,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };
  
  // Calculate instrument performance
  const getInstrumentPerformance = () => {
    // Ensure trades is an array before processing
    if (!Array.isArray(trades) || trades.length === 0) {
      return [];
    }
    
    const instrumentData: { [key: string]: { profit: number; trades: number; wins: number } } = {};
    
    trades.forEach(trade => {
      const instrument = trade.instrumentName || 'Unknown';
      
      if (!instrumentData[instrument]) {
        instrumentData[instrument] = { profit: 0, trades: 0, wins: 0 };
      }
      
      instrumentData[instrument].profit += trade.profitLoss || 0;
      instrumentData[instrument].trades += 1;
      if ((trade.profitLoss || 0) > 0) {
        instrumentData[instrument].wins += 1;
      }
    });
    
    // Convert to array and sort by profit
    return Object.entries(instrumentData)
      .map(([instrument, data]) => ({
        instrument,
        profit: data.profit,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  };
  
  const monthlyPerformance = getMonthlyPerformance();
  const instrumentPerformance = getInstrumentPerformance();
  
  if (isLoading) {
    return (
      <div className="min-h-screen animated-gradient">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p className="text-gray-500">Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen animated-gradient">
      {/* Mobile Header */}
      <MobilePageHeader
        title="Analysis"
        subtitle="Performance insights"
        icon={
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {trades.length === 0 ? (
        <div className="glass-card shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">No trades recorded yet. Start adding trades to see analysis.</p>
        </div>
      ) : (
        <>
          {/* Performance metrics */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card card-hover overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Trades
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {trades.length}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card card-hover overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Win Rate
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metrics.winRate.toFixed(1)}%
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card card-hover overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Profit Factor
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card card-hover overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total P/L
                    </dt>
                    <dd className="flex items-baseline">
                      <div className={`text-2xl font-semibold ${
                        metrics.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metrics.netProfitLoss >= 0 ? '+' : ''}{metrics.netProfitLoss.toFixed(2)}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Analysis */}
          <div className="mt-8 glass-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">AI Performance Analysis</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                AI-generated insights about your trading performance
              </p>
            </div>
            <div className="border-t border-gray-200">
              {isGeneratingAnalysis ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Generating analysis...</p>
                  <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="animate-pulse bg-primary h-full"></div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="divide-y divide-gray-200">
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-md font-medium text-gray-900">Summary</h4>
                    <p className="mt-1 text-sm text-gray-600">{analysis.analysis}</p>
                  </div>
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-md font-medium text-green-700">Strengths</h4>
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-md font-medium text-red-700">Areas for Improvement</h4>
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-md font-medium text-blue-700">Recommendations</h4>
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Failed to generate analysis</p>
                  <button
                    onClick={() => generateAnalysis(trades)}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Instrument Performance */}
          <div className="mt-8 glass-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Instrument Performance</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Performance breakdown by trading instrument
              </p>
            </div>
            <div className="border-t border-gray-200">
              {instrumentPerformance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No instrument data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instrument
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trades
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Win Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit/Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {instrumentPerformance.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.instrument}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.trades}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.winRate.toFixed(1)}%
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Monthly Performance */}
          <div className="mt-8 glass-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Performance</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Performance breakdown by month
              </p>
            </div>
            <div className="border-t border-gray-200">
              {monthlyPerformance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No monthly data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trades
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit/Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyPerformance.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.trades}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default Analysis;
