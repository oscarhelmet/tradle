import React from 'react';

interface MobilePageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon, 
  actionButton 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 mb-6 lg:hidden">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                {icon}
              </div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          
          {/* Action Button (optional) */}
          {actionButton && (
            <div className="flex-shrink-0">
              {actionButton}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobilePageHeader; 