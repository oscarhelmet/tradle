import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api/ApiService';
import { TradeFilter } from '../../types/TradeFilter';
import AddTradeDropdown from '../../components/ui/AddTradeDropdown';
import MobilePageHeader from '../../components/ui/MobilePageHeader';

interface Trade {
  _id: string;
  instrumentName: string;
  instrumentType: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  profitLoss: number;
  profitLossPercentage: number;
  notes: string;
  tags: string[];
  reviewStatus: string;
}

const Journal: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TradeFilter>({
    instrumentName: '',
    direction: '',
    outcome: '',
    startDate: '',
    endDate: '',
    tags: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTrades, setTotalTrades] = useState(0);
  const tradesPerPage = 5;

  const fetchTrades = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getTrades({
        page: currentPage,
        limit: tradesPerPage
      });
      setTrades(data.trades);
      setTotalTrades(data.total);
      setFilteredTrades(data.trades);
      setError(null);
    } catch (err) {
      setError('Failed to fetch trades');
      console.error('Error fetching trades:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, tradesPerPage]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await apiService.deleteTrade(id);
        await fetchTrades(); // Refresh the list
      } catch (err) {
        setError('Failed to delete trade');
        console.error('Error deleting trade:', err);
      }
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = trades;

    if (filters.instrumentName) {
      filtered = filtered.filter(trade => 
        trade.instrumentName.toLowerCase().includes(filters.instrumentName.toLowerCase())
      );
    }

    if (filters.direction && filters.direction !== 'ALL') {
      filtered = filtered.filter(trade => trade.direction === filters.direction);
    }

    if (filters.outcome && filters.outcome !== 'ALL') {
      if (filters.outcome === 'WIN') {
        filtered = filtered.filter(trade => (trade.profitLoss || 0) > 0);
      } else if (filters.outcome === 'LOSS') {
        filtered = filtered.filter(trade => (trade.profitLoss || 0) < 0);
      } else if (filters.outcome === 'BREAKEVEN') {
        filtered = filtered.filter(trade => (trade.profitLoss || 0) === 0);
      }
    }

    if (filters.startDate) {
      filtered = filtered.filter(trade => {
        const tradeDate = trade.exitDate || trade.entryDate;
        return tradeDate && new Date(tradeDate) >= new Date(filters.startDate);
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(trade => {
        const tradeDate = trade.exitDate || trade.entryDate;
        return tradeDate && new Date(tradeDate) <= new Date(filters.endDate);
      });
    }

    setFilteredTrades(filtered);
  }, [trades, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setFilters({
      instrumentName: '',
      direction: '',
      outcome: '',
      startDate: '',
      endDate: '',
      tags: []
    });
    setFilteredTrades(trades);
  };

  const totalPages = Math.ceil(totalTrades / tradesPerPage);

  // Updated review status logic
  const getReviewStatus = (trade: Trade) => {
    if (trade.notes && trade.notes.trim().length > 0) {
      return {
        status: 'Reviewed',
        color: 'bg-green-100 text-green-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      };
    } else {
      return {
        status: 'No Review',
        color: 'bg-red-100 text-red-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      };
    }
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // This gives dd/mm/yyyy format
  };

  if (isLoading) {
    return (
      <div className="min-h-screen animated-gradient">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading trades...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen animated-gradient">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient">
      {/* Mobile Header */}
      <MobilePageHeader
        title="Journal"
        subtitle="Track your trades"
        icon={
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }
        actionButton={
          <button className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        }
      />

      {/* Desktop Content with proper padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Trading Journal</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and analyze your trading performance
              </p>
            </div>
            <AddTradeDropdown />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 glass-card shadow-lg rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Instrument Name Filter */}
                <div>
              <label htmlFor="instrumentName" className="block text-sm font-medium text-gray-700 mb-1">
                Instrument
                  </label>
              <input
                id="instrumentName"
                type="text"
                value={filters.instrumentName}
                onChange={(e) => setFilters({ ...filters, instrumentName: e.target.value })}
                placeholder="Search instruments..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
                </div>
                
            {/* Direction Filter */}
                <div>
              <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">
                    Direction
                  </label>
                  <select
                id="direction"
                value={filters.direction}
                onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Directions</option>
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
                
            {/* Outcome Filter */}
            <div>
              <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
                Outcome
              </label>
              <select
                id="outcome"
                value={filters.outcome}
                onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Outcomes</option>
                <option value="WIN">Winning</option>
                <option value="LOSS">Losing</option>
                <option value="BREAKEVEN">Break Even</option>
              </select>
            </div>

            {/* Date Range Filters */}
                <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
                  </label>
                  <input
                id="startDate"
                    type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
                  </label>
                  <input
                id="endDate"
                    type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {filteredTrades.length} of {totalTrades} trades
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              Clear Filters
            </button>
                </div>
              </div>

        {/* Trades Table */}
        <div className="glass-card rounded-lg shadow-lg overflow-hidden">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trades found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {totalTrades === 0 
                  ? "Get started by recording your first trade." 
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {totalTrades === 0 && (
                <div className="mt-6">
                    <Link
                      to="/journal/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    Record Your First Trade
                    </Link>
                  </div>
                )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">DATE</span>
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        INSTRUMENT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        DIRECTION
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        ENTRY/EXIT
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        P/L
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        TAGS & JOURNAL STATUS
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredTrades.map((trade) => {
                      const reviewStatus = getReviewStatus(trade);
                      return (
                        <tr key={trade._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(trade.entryDate)}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {trade.instrumentName}
                                </div>
                                <div className="text-xs font-medium text-gray-500 uppercase">
                              {trade.instrumentType}
                                </div>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              trade.direction === 'LONG' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.direction}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                          <div>Entry: {trade.entryPrice}</div>
                          <div>Exit: {trade.exitPrice}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${
                              trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss}
                            </div>
                            <div className={`text-xs ${
                              trade.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {trade.profitLossPercentage >= 0 ? '+' : ''}{trade.profitLossPercentage?.toFixed(2)}%
                            </div>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                            <div className="flex flex-wrap gap-1">
                                {trade.tags?.length > 0 ? (
                                  trade.tags.map((tag, index) => (
                                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                  <span className="text-xs text-gray-400">No tags</span>
                              )}
                            </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${reviewStatus.color}`}>
                                  {reviewStatus.icon}
                                  {reviewStatus.status}
                                </span>
                              </div>
                          </div>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <Link 
                                to={`/journal/${trade._id}`}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="View trade"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link 
                                to={`/journal/${trade._id}/edit`}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                                title="Edit trade"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            <button
                                onClick={() => handleDelete(trade._id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete trade"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination - Separate from the table card */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * tradesPerPage) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * tradesPerPage, totalTrades)}
                  </span> of{' '}
                  <span className="font-medium">{totalTrades}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
