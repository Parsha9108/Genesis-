import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const EventLogs = ({ 
  eventLogs = [], 
  isDarkMode = false, 
  onRefresh = null,
  isRefreshing = false
}) => {
  const latestLogs = [...eventLogs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return (
    <div
      className="p-6 rounded-lg shadow-md"
      style={{
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>
          Events
        </h3>
        {/* Optional refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Refresh events"
            aria-label="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Enhanced conditional rendering based on logs availability */}
      {latestLogs.length === 0 ? (
        /* Enhanced No logs message */
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6">
            <AlertCircle className="w-12 h-12 mx-auto opacity-30" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
          </div>
          <div className="text-center">
            <h4 
              className="text-lg font-semibold mb-2"
              style={{ color: isDarkMode ? '#FFF' : '#374151' }}
            >
              No Event Logs Available
            </h4>
            <p 
              className="text-sm mb-4 max-w-sm mx-auto"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              Events will appear here once your agents start sending monitoring data.
            </p>
            {/* Optional action button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : 'Check for Events'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* FIXED: Single table structure with proper alignment */
        <div className="max-h-72 overflow-y-auto overflow-x-auto custom-scroll">
          <table 
            className="w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[700px]"
            style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
          >
            <thead>
              <tr 
                className="sticky top-[-15px] z-10 font-normal" 
                style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', color: isDarkMode ? '#D1D5DB' : '#6B7280' }}
              >
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">EVENT TYPE</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {latestLogs.map((log, index) => (
                <tr
                  key={log.id || index}
                  className={`${
                    isDarkMode
                      ? index % 2 === 0
                        ? 'bg-gray-800'
                        : 'bg-gray-900'
                      : index % 2 === 0
                      ? 'bg-gray-50'
                      : 'bg-white'
                  } hover:bg-opacity-80 transition-colors`}
                  style={{ color: isDarkMode ? '#D1D5DB' : '#525759' }}
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap w-32">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                    <span className="px-1 sm:px-2 py-1 rounded-full text-xs font-medium inline-block">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                    {log.component_type && log.component_type !== '' ? log.component_type : '------------'}
                  </td>
                  <td 
                    className="py-2 sm:py-3 px-2 sm:px-4 text-center"
                    style={{ 
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal'
                    }}
                    title={log.description}
                  >
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventLogs;
