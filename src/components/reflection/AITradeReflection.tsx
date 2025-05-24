import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api/ApiService';
import { AIReflection } from '../../models/AIReflection';

interface AITradeReflectionProps {
  tradeId: string;
}

const AITradeReflection: React.FC<AITradeReflectionProps> = ({ tradeId }) => {
  const [reflection, setReflection] = useState<AIReflection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReflection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the AI reflection for this specific trade
        const reflectionData = await apiService.getTradeReflection(tradeId);
        setReflection(reflectionData);
      } catch (err: any) {
        console.error('Failed to fetch trade reflection:', err);
        // Don't show error if reflection just doesn't exist yet
        if (err.message?.includes('No reflection found') || err.message?.includes('404')) {
          setReflection(null);
        } else {
          setError(err.message || 'Failed to load trade reflection');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (tradeId) {
      fetchReflection();
    }
  }, [tradeId]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
            <div className="h-6 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!reflection) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm">No reflection data available for this trade</p>
          <p className="text-xs text-gray-400 mt-1">AI analysis will be generated automatically</p>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'negative': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Trade Reflection</h3>
            <p className="text-sm text-gray-500">AI-generated analysis and feedback on your trade</p>
          </div>
        </div>
        
        {/* Sentiment Badge */}
        <div className={`px-3 py-1 rounded-full border ${getSentimentBg(reflection.reflection.sentiment)}`}>
          <span className={`text-sm font-medium ${getSentimentColor(reflection.reflection.sentiment)}`}>
            {reflection.reflection.sentiment.charAt(0).toUpperCase() + reflection.reflection.sentiment.slice(1)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Summary</h4>
        <p className="text-gray-700 leading-relaxed">
          {reflection.reflection.summary || 'No summary available'}
        </p>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-green-700 mb-3">Strengths</h4>
        {reflection.reflection.strengths && reflection.reflection.strengths.length > 0 ? (
          <ul className="space-y-2">
            {reflection.reflection.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No strengths identified</p>
        )}
      </div>

      {/* Areas for Improvement */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-red-700 mb-3">Areas for Improvement</h4>
        {reflection.reflection.weaknesses && reflection.reflection.weaknesses.length > 0 ? (
          <ul className="space-y-2">
            {reflection.reflection.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{weakness}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No weaknesses identified</p>
        )}
      </div>

      {/* Suggestions */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-blue-700 mb-3">Suggestions</h4>
        {reflection.reflection.suggestions && reflection.reflection.suggestions.length > 0 ? (
          <ul className="space-y-2">
            {reflection.reflection.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No suggestions available</p>
        )}
      </div>

      {/* Score and Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">AI Analysis Score</span>
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(reflection.reflection.score * 10, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {reflection.reflection.score}/10
            </span>
          </div>
        </div>
        
        {/* Analysis Date */}
        <div className="text-xs text-gray-500">
          Generated: {new Date(reflection.reflection.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default AITradeReflection; 