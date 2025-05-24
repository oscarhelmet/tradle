import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface MobileAddButtonProps {
  onQuickAdd: () => void;
}

const MobileAddButton: React.FC<MobileAddButtonProps> = ({ onQuickAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleQuickAdd = () => {
    setIsOpen(false); // Close dropdown
    onQuickAdd(); // Call parent handler
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Menu - Shows ABOVE the button */}
      {isOpen && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] z-50">
          <button
            onClick={handleQuickAdd}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
          >
            <svg className="w-4 h-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <div className="font-medium">Quick Add</div>
              <div className="text-xs text-gray-500">AI-powered image analysis</div>
            </div>
          </button>
          
          <Link
            to="/journal/new"
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <div className="font-medium">Manual Input</div>
              <div className="text-xs text-gray-500">Add single trade</div>
            </div>
          </Link>
        </div>
      )}

      {/* Add Button - Same size as other icons */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
};

export default MobileAddButton; 