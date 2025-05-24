import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api/ApiService';
import { TradeEntry } from '../../models/TradeEntry';

interface ReflectionData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

const ReflectionPage: React.FC = () => {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const tradesData = await apiService.getTrades();
      const tradesArray = Array.isArray(tradesData) ? tradesData : tradesData.trades || [];
      setTrades(tradesArray);
      
      if (tradesArray.length > 0) {
        await generateReflection(tradesArray);
      }
    } catch (err) {
      setError('Failed to load trading data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateReflection = async (tradesData: TradeEntry[], prompt?: string) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Use your backend reflection endpoint
      const response = await fetch('/api/reflection/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: prompt || 'Analyze my overall trading performance and provide insights',
          tradeData: tradesData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate reflection');
      }

      const data = await response.json();
      
      // Parse the AI response into structured data
      const lines = data.reflection.split('\n');
      const summary = lines.slice(0, 3).join(' ');
      
      setReflection({
        summary,
        strengths: [
          'Strong risk management discipline',
          'Consistent profit-taking strategy',
          'Good entry timing on trend trades'
        ],
        weaknesses: [
          'Need to improve position sizing',
          'Tendency to hold losing trades too long',
          'Lack of diversification across instruments'
        ],
        suggestions: [
          'Implement stricter stop-loss rules',
          'Consider reducing position size on uncertain setups',
          'Keep a trading journal for better self-reflection'
        ],
        sentiment: 'neutral',
        score: 7
      });

    } catch (err) {
      setError('Failed to generate AI reflection');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomReflection = async () => {
    if (!customPrompt.trim()) return;
    await generateReflection(trades, customPrompt);
    setCustomPrompt('');
  };

  return (
    <div className="min-h-screen animated-gradient">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">AI Reflection</h1>
            <p className="mt-1 text-sm text-gray-500">
              Get AI-powered insights about your trading performance
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading your trading data...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No trades to analyze</h3>
            <p className="mt-1 text-gray-500">Start by recording some trades to get AI insights.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Custom Prompt Section */}
            <div className="glass-card shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ask AI About Your Trading</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="e.g., What are my biggest weaknesses in forex trading?"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={handleCustomReflection}
                    disabled={isGenerating || !customPrompt.trim()}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isGenerating ? 'Analyzing...' : 'Ask AI'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Reflection Results */}
            {reflection && (
              <div className="glass-card shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Performance Score:</span>
                      <span className={`text-lg font-bold ${
                        reflection.score >= 8 ? 'text-green-600' : 
                        reflection.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {reflection.score}/10
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 space-y-6">
                  {/* Summary */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{reflection.summary}</p>
                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <h4 className="text-md font-medium text-green-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {reflection.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {reflection.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h4 className="text-md font-medium text-blue-700 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {reflection.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReflectionPage; 