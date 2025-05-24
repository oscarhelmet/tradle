import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QuickAddModal from '../modals/QuickAddModal';

const AddTradeDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuickAddClick = () => {
    setIsOpen(false);
    setShowQuickAddModal(true);
  };

  const handleTradesAdded = (trades: any[]) => {
    console.log(`Successfully added ${trades.length} trades`);
    // Refresh the page to show new trades
    window.location.reload();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Plus Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          title="Add Trade"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn">
            <button
              onClick={handleQuickAddClick}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors text-left"
            >
              {/* Much Better Magic Wand Icon */}
              <svg className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* Wand handle - diagonal line */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                {/* Wand tip star */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2" />
                {/* Small sparkles */}
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="15" r="0.5" fill="currentColor" />
                <circle cx="15" cy="9" r="0.5" fill="currentColor" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Quick Add</div>
                <div className="text-xs text-gray-500 truncate">AI-powered image analysis</div>
              </div>
            </button>
            
            <div className="h-px bg-gray-200 my-1"></div>
            
            <Link
              to="/journal/new"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Manual Input</div>
                <div className="text-xs text-gray-500 truncate">Add single trade</div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showQuickAddModal} 
        onClose={() => setShowQuickAddModal(false)}
        onTradesAdded={handleTradesAdded}
      />
    </>
  );
};

export default AddTradeDropdown; 