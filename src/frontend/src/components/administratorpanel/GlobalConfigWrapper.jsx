import React, { useState } from 'react';
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import SMTPConfiguration from './SMTPConfiguration';
import MonitoringConfiguration from './MonitoringConfiguration';

const GlobalConfiguration = ({ isDarkMode }) => {
  useDocumentTitle('Global Configuration');
  const [activeTab, setActiveTab] = useState('smtp');

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className={`rounded-lg shadow-md p-6 border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h1 className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Global Configuration
        </h1>
        <p className={`text-sm mt-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Manage system-wide settings including SMTP and Alert configurations
        </p>
      </div>

      {/* Main Configuration Card with Tabs */}
      <div className={`rounded-lg shadow-md border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        
        {/* Tab Navigation */}
        <div className={`border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'smtp'
                  ? isDarkMode
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              SMTP
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'monitoring'
                  ? isDarkMode
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MONITORING
            </button>
          </div>
        </div>

        {/* Tab Content - Child Components */}
        <div className="p-6">
          {activeTab === 'smtp' && (
            <SMTPConfiguration isDarkMode={isDarkMode} />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringConfiguration isDarkMode={isDarkMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalConfiguration;
