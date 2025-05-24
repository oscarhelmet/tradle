import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MobileAddButton from './MobileAddButton';
import QuickAddModal from '../modals/QuickAddModal';

const MobileBottomNav: React.FC = () => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleQuickAdd = () => {
    setShowQuickAddModal(true);
  };

  return (
    <>
      {/* Mobile Bottom Navigation - ONLY show on mobile, hide on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {/* More Menu Dropdown */}
        {showMoreMenu && (
          <div className="absolute bottom-20 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[180px] z-50">
            <Link
              to="/analysis"
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowMoreMenu(false)}
            >
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analysis
            </Link>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 px-4 py-3 safe-area-pb">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14" />
              </svg>
            </Link>

            {/* Journal */}
            <Link
              to="/journal"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/journal') 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>

            {/* Add Trade Button - Pass handler down */}
            <div className="flex flex-col items-center py-2 px-3">
              <MobileAddButton onQuickAdd={handleQuickAdd} />
            </div>

            {/* Account */}
            <Link
              to="/settings"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/settings') 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* More - Rightmost */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                showMoreMenu 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Click Outside Overlay for More Menu */}
        {showMoreMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMoreMenu(false)}
          />
        )}
      </div>

      {/* Quick Add Modal - Render outside navigation context */}
      {showQuickAddModal && (
        <QuickAddModal
          isOpen={showQuickAddModal}
          onClose={() => setShowQuickAddModal(false)}
        />
      )}
    </>
  );
};

export default MobileBottomNav; 