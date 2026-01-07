import React, { useState, useCallback, useEffect } from 'react';
import GroupCreator from './GroupCreator';

const GroupManagement = ({ isDarkMode = true }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 

  // Configuration
  const TRANSITION_DELAY = 300;

  // Enhanced error handler
  const handleError = useCallback((error) => {
    console.error('GroupManagement Error:', error);
    setError(error);
    setIsLoading(false);
  }, []);

  // View change analytics
  useEffect(() => {
    console.log('📊 GroupManagement: Component mounted', {
      timestamp: new Date().toISOString()
    });
  }, []);

  // Error display with retry functionality
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="alert">
        <div 
          className="text-center p-6 rounded-lg border max-w-md w-full mx-4" 
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            borderColor: isDarkMode ? '#374151' : '#E5E7EB'
          }}
        >
          <div className="text-red-500 mb-4">
            <svg 
              className="w-12 h-12 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h3 
            className="text-lg font-semibold mb-2" 
            style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}
          >
            Something went wrong
          </h3>
          <p 
            className="text-sm mb-4" 
            style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}
          >
            {error.message || 'An unexpected error occurred while managing groups'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              style={{ 
                color: isDarkMode ? '#D1D5DB' : '#374151',
                borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render GroupCreator directly
  return (
    <div className="relative">
      {/* Optional loading overlay - uses local isLoading state */}
      {isLoading && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: isDarkMode 
              ? 'rgba(17, 24, 39, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-title"
        >
          <div 
            className="flex flex-col items-center justify-center p-6 rounded-lg shadow-lg border"
            style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              borderColor: isDarkMode ? '#374151' : '#E5E7EB'
            }}
          >
            {/* Enhanced spinning loader */}
            <div className="relative mb-4">
              <div 
                className="w-12 h-12 border-4 border-solid rounded-full animate-spin"
                style={{
                  borderColor: isDarkMode 
                    ? '#374151 #374151 #6366f1 #6366f1'
                    : '#E5E7EB #E5E7EB #6366f1 #6366f1'
                }}
                role="progressbar"
                aria-label="Loading"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"
                  style={{ opacity: 0.3 }}
                />
              </div>
            </div>
            
            {/* Loading text */}
            <p 
              id="loading-title"
              className="text-sm font-medium animate-pulse text-center"
              style={{ 
                color: isDarkMode ? '#D1D5DB' : '#6B7280' 
              }}
            >
              Loading Group Management...
            </p>
          </div>
        </div>
      )}

      {/* Main content with local isLoading state */}
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <GroupCreator 
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default GroupManagement;
