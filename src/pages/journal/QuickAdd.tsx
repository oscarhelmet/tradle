import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickAdd: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen animated-gradient">
      {/* Header */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Quick Add Trades</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload multiple trades at once via CSV or manual batch entry
          </p>
        </div>
        <button
          onClick={() => navigate('/journal')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back to Journal
        </button>
      </div>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="glass-card shadow-sm rounded-lg p-8">
          
          {/* CSV Upload Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop as any}
              onDragOver={handleDragOver as any}
              onDragLeave={handleDragLeave as any}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop your CSV file here, or <span className="text-primary">browse</span>
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">CSV files up to 10MB</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h3>
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

          {/* CSV Format Guide */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
            <p className="text-xs text-blue-700 mb-2">Your CSV should include the following columns:</p>
            <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
              instrumentName, direction, entryPrice, exitPrice, quantity, entryDate, exitDate, profitLoss
            </div>
            <p className="text-xs text-blue-600 mt-2">
              <span className="font-medium">Example:</span> AAPL, LONG, 150.00, 155.00, 100, 2024-01-15, 2024-01-20, 500.00
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/journal')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            
            <button
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              disabled={files.length === 0}
            >
              Upload & Process Trades
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuickAdd; 