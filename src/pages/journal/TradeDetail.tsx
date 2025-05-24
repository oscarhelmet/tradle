import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api/ApiService';
import { geminiService } from '../../services/gemini/GeminiService';
import { TradeEntry } from '../../models/TradeEntry';
import { AIReflection } from '../../models/AIReflection';
import { markdownToHtml } from '../../utils/markdownToHtml';

const TradeDetail: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  
  const [trade, setTrade] = useState<TradeEntry | null>(null);
  const [reflection, setReflection] = useState<AIReflection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!id || id === 'undefined') {
          throw new Error('Trade ID is missing or invalid');
        }
        
        const tradeData = await apiService.getTrade(id);
        setTrade(tradeData);
        
        // Generate reflection automatically
        generateTradeReflection(tradeData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading trade:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trade data');
        setIsLoading(false);
      }
    };
    
    fetchTradeData();
  }, [id]);
  
  const generateTradeReflection = async (tradeData: TradeEntry) => {
    try {
      setIsGeneratingReflection(true);
      const reflectionData = await geminiService.generateReflection(tradeData);
      setReflection(reflectionData);
    } catch (err) {
      console.error('Error generating reflection:', err);
    } finally {
      setIsGeneratingReflection(false);
    }
  };
  
  const handleDelete = async () => {
    if (!trade || !window.confirm('Are you sure you want to delete this trade?')) {
      return;
    }
    
    try {
      await apiService.deleteTrade(trade._id);
      navigate('/journal');
    } catch (err) {
      setError('Failed to delete trade');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen animated-gradient">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <p className="text-gray-500">Loading trade data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !trade) {
    return (
      <div className="min-h-screen animated-gradient">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || 'Trade not found'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/journal" className="text-primary hover:text-primary-dark">
              Back to Journal
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen animated-gradient pb-20 lg:pb-0">
      {/* Header with Back Button - Show on all screen sizes */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          {/* Back Button - Icon Only */}
          <Link 
            to="/journal" 
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white/90 transition-all duration-200 shadow-sm"
            title="Back to Journal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Action Buttons - Right Side */}
          <div className="flex space-x-3">
            <Link
              to={`/journal/${trade._id}/edit`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              title="Edit trade"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Delete trade"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Asset Name Card - Pretty with 70% Opacity */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 px-8 py-6 max-w-2xl">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
                {trade.instrumentName}
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  trade.direction === 'LONG' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {trade.direction}
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {trade.instrumentType}
                </span>
              </div>

              {/* Tags - underneath the badges with smaller font */}
              {trade.tags && trade.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {trade.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-sm text-gray-600 font-medium">
                {new Date(trade.tradeDate || trade.entryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      
      {/* Trade Details Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Trade Info Cards */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Price Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Entry Price</span>
              <span className="text-sm font-semibold text-gray-900">${trade.entryPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Exit Price</span>
              <span className="text-sm font-semibold text-gray-900">${trade.exitPrice || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Quantity</span>
              <span className="text-sm font-semibold text-gray-900">{trade.quantity}</span>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
              (trade.profitLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <svg className={`w-5 h-5 ${
                (trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P&L</span>
              <span className={`text-sm font-semibold ${
                (trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(trade.profitLoss || 0) >= 0 ? '+' : ''}${(trade.profitLoss || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P&L %</span>
              <span className={`text-sm font-semibold ${
                (trade.profitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(trade.profitLossPercentage || 0) >= 0 ? '+' : ''}{(trade.profitLossPercentage || 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Position Size</span>
              <span className="text-sm font-semibold text-gray-900">{trade.positionSize || trade.quantity}</span>
            </div>
          </div>
        </div>

        {/* Timing Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Timing</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Entry Date</span>
              <span className="text-sm font-semibold text-gray-900">
                {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Exit Date</span>
              <span className="text-sm font-semibold text-gray-900">
                {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="text-sm font-semibold text-gray-900">{trade.duration || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Chart Image Card */}
        {trade.imageUrl && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 md:col-span-2 lg:col-span-3">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Chart Image</h3>
            </div>
            <img
              src={trade.imageUrl}
              alt="Trade chart"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
      
      {/* AI Insights Card (separate from notes) */}
      {trade.aiInsights && (
        <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          </div>
          <div 
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(trade.aiInsights) }}
          />
        </div>
      )}

      {/* Notes Section - Keep as original table format for trade review */}
      {trade.notes && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Trade Notes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal notes and observations</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{trade.notes}</p>
          </div>
        </div>
      )}
      
      {/* AI Reflection */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">AI Trade Reflection</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            AI-generated analysis and feedback on your trade
          </p>
        </div>
        <div className="border-t border-gray-200">
          {isGeneratingReflection ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">Generating trade reflection.reflection...</p>
              <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="animate-pulse bg-primary h-full"></div>
              </div>
            </div>
          ) : reflection ? (
            <div className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-md font-medium text-gray-900">Summary</h4>
                <p className="mt-1 text-sm text-gray-600">{reflection.reflection.summary}</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-md font-medium text-green-700">Strengths</h4>
                <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {reflection.reflection.strengths && Array.isArray(reflection.reflection.strengths) ? reflection.reflection.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  )) : <li>No strengths identified</li>}
                </ul>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-md font-medium text-red-700">Areas for Improvement</h4>
                <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {reflection.reflection.weaknesses && Array.isArray(reflection.reflection.weaknesses) ? reflection.reflection.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  )) : <li>No weaknesses identified</li>}
                </ul>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-md font-medium text-blue-700">Suggestions</h4>
                <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {reflection.reflection.suggestions && Array.isArray(reflection.reflection.suggestions) ? reflection.reflection.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  )) : <li>No suggestions available</li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">Failed to generate reflection</p>
              <button
                onClick={() => trade && generateTradeReflection(trade)}
                className="mt-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                title="Try again"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      </main>
    </div>
  );
};

export default TradeDetail;
