import React, { useState } from 'react';
import { apiService } from '../../services/api/ApiService';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradesAdded?: (trades: any[]) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onTradesAdded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedTrades, setExtractedTrades] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'saving'>('upload');

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const allTrades: any[] = [];
    
    try {
      // Process each image with Gemini using the proper API base URL
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/reflection/analyze-image`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to process ${file.name}`);
        }

        const result = await response.json();
        if (result.success && result.trades) {
          allTrades.push(...result.trades);
        }
      }

      setExtractedTrades(allTrades);
      setCurrentStep('review');
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTrades = async () => {
    setCurrentStep('saving');
    
    try {
      const savedTrades = [];
      
      for (const trade of extractedTrades) {
        const savedTrade = await apiService.createTrade(trade);
        savedTrades.push(savedTrade);
      }

      onTradesAdded?.(savedTrades);
      onClose();
      
      // Reset state
      setFiles([]);
      setExtractedTrades([]);
      setCurrentStep('upload');
    } catch (error) {
      console.error('Error saving trades:', error);
      alert('Failed to save trades. Please try again.');
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setCurrentStep('upload');
    setExtractedTrades([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {currentStep === 'upload' && 'Quick Add Trades'}
                {currentStep === 'review' && 'Review Extracted Trades'}
                {currentStep === 'saving' && 'Saving Trades...'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Step */}
            {currentStep === 'upload' && (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  Upload trading screenshots for AI analysis and automatic trade extraction
                </p>

                {/* Image Upload Section */}
                <div className="mb-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop as any}
                    onDragOver={handleDragOver as any}
                    onDragLeave={handleDragLeave as any}
                  >
                    {/* Better Upload Icon */}
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Drop trading screenshots here, or <span className="text-primary">browse</span>
                        </span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Images:</h4>
                      <ul className="space-y-1">
                        {files.map((file, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI Processing Info */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">AI-Powered Trade Extraction</h4>
                  <p className="text-xs text-blue-700 mb-2">Our AI will analyze your trading screenshots and extract:</p>
                  <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                    <li>Instrument names and symbols</li>
                    <li>Entry and exit prices</li>
                    <li>Trade direction (Long/Short)</li>
                    <li>Quantity and profit/loss</li>
                    <li>Trade dates and times</li>
                  </ul>
                </div>
              </>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Review the extracted trades before saving to your journal. <span className="font-medium text-orange-600">Notes are required</span> - please add your observations for each trade.
                </p>
                
                <div className="max-h-96 overflow-y-auto">
                  {extractedTrades.map((trade, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-700">Instrument:</span> {trade.instrumentName}
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {trade.instrumentType}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Direction:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            trade.direction === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.direction}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Entry:</span> ${trade.entryPrice}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Exit:</span> ${trade.exitPrice}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span> {trade.quantity}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">P/L:</span>
                          <span className={trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${trade.profitLoss} ({trade.profitLossPercentage?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      
                      {/* Review Status and Notes Warning */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Review Status:</span>
                          <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                            {trade.reviewStatus || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          ⚠️ Notes required: Please add your analysis after saving this trade
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Saving Step */}
            {currentStep === 'saving' && (
              <div className="text-center py-8">
                <svg className="animate-spin mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-600">Saving trades to your journal...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {currentStep === 'upload' && (
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Process with AI'
                )}
              </button>
            )}

            {currentStep === 'review' && (
              <>
                <button
                  onClick={handleSaveTrades}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save {extractedTrades.length} Trade{extractedTrades.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={handleBack}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </>
            )}

            {currentStep !== 'saving' && (
              <button
                onClick={onClose}
                disabled={isUploading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal; 