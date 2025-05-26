import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api/ApiService';
import { geminiService } from '../../services/gemini/GeminiService';
import { InstrumentType, Direction, TradeEntry } from '../../models/TradeEntry';
import { AIAnalysisResult } from '../../models/AIReflection';
import TradeNotes from '../../components/forms/TradeNotes';

const EditTrade: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingTrade, setIsLoadingTrade] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [trade, setTrade] = useState<TradeEntry | null>(null);
  
  const [formData, setFormData] = useState({
    instrumentType: 'FOREX',
    instrumentName: '',
    direction: 'LONG',
    entryPrice: '',
    exitPrice: '',
    positionSize: '1',
    profitLoss: '',
    tradeDate: new Date().toISOString().split('T')[0],
    tags: '',
    notes: '',
    aiInsights: '',
    imageUrl: '',
  });
  
  const [notes, setNotes] = useState<string>('');
  
  useEffect(() => {
    const fetchTrade = async () => {
      if (!id) {
        setError('Trade ID is missing');
        setIsLoadingTrade(false);
        return;
      }
      
      try {
        setIsLoadingTrade(true);
        const tradeData = await apiService.getTrade(id);
        setTrade(tradeData);
        
        // Populate form with existing trade data
        setFormData({
          instrumentType: tradeData.instrumentType || 'FOREX',
          instrumentName: tradeData.instrumentName || '',
          direction: tradeData.direction || 'LONG',
          entryPrice: tradeData.entryPrice?.toString() || '',
          exitPrice: tradeData.exitPrice?.toString() || '',
          positionSize: tradeData.positionSize?.toString() || '1',
          profitLoss: tradeData.profitLoss?.toString() || '',
          tradeDate: tradeData.tradeDate ? new Date(tradeData.tradeDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tags: Array.isArray(tradeData.tags) ? tradeData.tags.join(', ') : '',
          notes: tradeData.notes || '',
          aiInsights: tradeData.aiInsights || '',
          imageUrl: tradeData.imageUrl || '',
        });
        
        // Set image preview if there's an existing image
        if (tradeData.imageUrl) {
          setImagePreview(tradeData.imageUrl);
        }
        
        setIsLoadingTrade(false);
      } catch (err) {
        console.error('Error loading trade:', err);
        setError('Failed to load trade data');
        setIsLoadingTrade(false);
      }
    };
    
    fetchTrade();
  }, [id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Ask if user wants to analyze the image with AI
    if (window.confirm('Would you like to analyze this chart image with AI?')) {
      analyzeImage(file);
    }
  };
  
  const analyzeImage = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const result: AIAnalysisResult = await geminiService.extractTradeData(file);
      
      if (result) {
        // Update form with extracted data (first pass)
        setFormData(prev => ({
          ...prev,
          instrumentType: result.instrumentType || prev.instrumentType,
          instrumentName: result.instrumentName || prev.instrumentName,
          direction: result.direction || prev.direction,
          entryPrice: result.entryPrice?.toString() || prev.entryPrice,
          exitPrice: result.exitPrice?.toString() || prev.exitPrice,
          // Use extracted position size and profit/loss if available
          positionSize: result.positionSize?.toString() || prev.positionSize,
          profitLoss: result.profitLoss?.toString() || prev.profitLoss,
          // Store AI insights in the dedicated field (second pass)
          aiInsights: result.analysis || '',
        }));
        
        // If profit/loss wasn't extracted, calculate it
        if (!result.profitLoss && result.entryPrice && result.exitPrice) {
          const entryPrice = parseFloat(result.entryPrice.toString());
          const exitPrice = parseFloat(result.exitPrice.toString());
          const direction = result.direction || 'LONG';
          const positionSize = result.positionSize || parseFloat(formData.positionSize);
          
          if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(positionSize)) {
            let profitLoss = 0;
            if (direction === 'LONG') {
              profitLoss = (exitPrice - entryPrice) * positionSize;
            } else {
              profitLoss = (entryPrice - exitPrice) * positionSize;
            }
            
            setFormData(prev => ({
              ...prev,
              profitLoss: profitLoss.toFixed(2),
            }));
          }
        }
      }
    } catch (err) {
      setError('Failed to analyze image. Please enter trade details manually.');
      console.error('Image analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !trade) {
      setError('Trade ID is missing');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Upload image if a new one was selected
      let imageUrl = formData.imageUrl;
      if (fileInputRef.current?.files?.[0]) {
        try {
          imageUrl = await apiService.uploadImage(fileInputRef.current.files[0]);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          setError('Failed to upload image. Continuing to save trade without new image.');
          // Continue with trade update even if image upload fails
        }
      }
      
      // Prepare trade data
      const entryDate = new Date(formData.tradeDate);
      const exitDate = new Date(formData.tradeDate);
      exitDate.setHours(entryDate.getHours() + 1); // Default to 1 hour trade duration
      
      // Calculate profit loss percentage safely
      const entryPriceValue = parseFloat(formData.entryPrice);
      const positionSizeValue = parseFloat(formData.positionSize);
      const profitLossValue = parseFloat(formData.profitLoss);
      
      let profitLossPercentage = 0;
      if (!isNaN(entryPriceValue) && !isNaN(positionSizeValue) && !isNaN(profitLossValue) && 
          entryPriceValue > 0 && positionSizeValue > 0) {
        profitLossPercentage = (profitLossValue / (entryPriceValue * positionSizeValue)) * 100;
      }
      
      const updatedTradeData = {
        instrumentType: formData.instrumentType as InstrumentType | string,
        instrumentName: formData.instrumentName,
        direction: formData.direction as Direction | 'LONG' | 'SHORT',
        entryPrice: entryPriceValue,
        exitPrice: parseFloat(formData.exitPrice),
        quantity: positionSizeValue,
        positionSize: positionSizeValue,
        profitLoss: profitLossValue,
        profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
        entryDate: entryDate,
        exitDate: exitDate,
        tradeDate: new Date(formData.tradeDate),
        duration: '1h', // Default duration
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        notes: notes,
        aiInsights: formData.aiInsights, // Include AI insights
        imageUrl,
        imageUrls: imageUrl ? [imageUrl] : []
      };
      
      // Update trade
      const updatedTrade = await apiService.updateTrade(id, updatedTradeData);
      
      // Navigate to trade detail page
      navigate(`/journal/${params.id}`);
      
    } catch (err) {
      setError('Failed to update trade. Please try again.');
      console.error('Update trade error:', err);
      setIsLoading(false);
    }
  };
  
  const calculateProfitLoss = () => {
    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const positionSize = parseFloat(formData.positionSize);
    
    if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(positionSize)) {
      let profitLoss = 0;
      if (formData.direction === 'LONG') {
        profitLoss = (exitPrice - entryPrice) * positionSize;
      } else {
        profitLoss = (entryPrice - exitPrice) * positionSize;
      }
      
      setFormData(prev => ({
        ...prev,
        profitLoss: profitLoss.toFixed(2),
      }));
    }
  };
  
  if (isLoadingTrade) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Loading trade data...</p>
        </div>
      </div>
    );
  }
  
  if (error && !trade) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/journal')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Back to Journal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-5 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">Edit Trade</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of your trade or upload a new chart image for AI analysis
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 glass-card card-hover shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Image Upload */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">
                Chart Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div>
                      <img 
                        src={imagePreview} 
                        alt="Chart preview" 
                        className="mx-auto h-64 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                        >
                          <span>Upload a chart image</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                  
                  {isAnalyzing && (
                    <div className="mt-2">
                      <p className="text-sm text-primary">Analyzing image with AI...</p>
                      <div className="mt-1 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="animate-pulse bg-primary h-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Instrument Type */}
            <div className="sm:col-span-3">
              <label htmlFor="instrumentType" className="block text-sm font-medium text-gray-700">
                Instrument Type
              </label>
              <div className="mt-1">
                <select
                  id="instrumentType"
                  name="instrumentType"
                  value={formData.instrumentType}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="FOREX">Forex</option>
                  <option value="STOCK">Stock</option>
                  <option value="CRYPTO">Cryptocurrency</option>
                  <option value="FUTURES">Futures</option>
                  <option value="OPTIONS">Options</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            {/* Instrument Name */}
            <div className="sm:col-span-3">
              <label htmlFor="instrumentName" className="block text-sm font-medium text-gray-700">
                Instrument Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="instrumentName"
                  id="instrumentName"
                  value={formData.instrumentName}
                  onChange={handleInputChange}
                  placeholder="e.g., EUR/USD, AAPL, BTC/USD"
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Direction */}
            <div className="sm:col-span-2">
              <label htmlFor="direction" className="block text-sm font-medium text-gray-700">
                Direction
              </label>
              <div className="mt-1">
                <select
                  id="direction"
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
            </div>
            
            {/* Entry Price */}
            <div className="sm:col-span-2">
              <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700">
                Entry Price
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="entryPrice"
                  id="entryPrice"
                  value={formData.entryPrice}
                  onChange={handleInputChange}
                  onBlur={calculateProfitLoss}
                  step="any"
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Exit Price */}
            <div className="sm:col-span-2">
              <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700">
                Exit Price
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="exitPrice"
                  id="exitPrice"
                  value={formData.exitPrice}
                  onChange={handleInputChange}
                  onBlur={calculateProfitLoss}
                  step="any"
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Position Size */}
            <div className="sm:col-span-2">
              <label htmlFor="positionSize" className="block text-sm font-medium text-gray-700">
                Position Size
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="positionSize"
                  id="positionSize"
                  value={formData.positionSize}
                  onChange={handleInputChange}
                  onBlur={calculateProfitLoss}
                  step="any"
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Profit/Loss */}
            <div className="sm:col-span-2">
              <label htmlFor="profitLoss" className="block text-sm font-medium text-gray-700">
                Profit/Loss
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="profitLoss"
                  id="profitLoss"
                  value={formData.profitLoss}
                  onChange={handleInputChange}
                  step="any"
                  className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${
                    parseFloat(formData.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                  required
                />
              </div>
            </div>
            
            {/* Trade Date */}
            <div className="sm:col-span-2">
              <label htmlFor="tradeDate" className="block text-sm font-medium text-gray-700">
                Trade Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="tradeDate"
                  id="tradeDate"
                  value={formData.tradeDate}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Tags */}
            <div className="sm:col-span-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (comma separated)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., trend, breakout, support"
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* AI Insights */}
            {formData.aiInsights && (
              <div className="sm:col-span-6">
                <label htmlFor="aiInsights" className="block text-sm font-medium text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  AI Insights
                </label>
                <div className="mt-1">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <textarea
                      id="aiInsights"
                      name="aiInsights"
                      rows={6}
                      value={formData.aiInsights}
                      onChange={handleInputChange}
                      className="bg-blue-50 w-full border-0 focus:ring-0 sm:text-sm text-gray-800"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    AI-generated analysis based on your chart image. You can edit this text if needed.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <TradeNotes 
            initialNotes={formData.notes || ''}
            onChange={(combinedNotes) => setNotes(combinedNotes)}
          />
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/journal/${params.id}`)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Cancel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              title={isLoading ? 'Updating...' : 'Update Trade'}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTrade;
