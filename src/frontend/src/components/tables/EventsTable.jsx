import React from 'react';
import { useGetEventLogsQuery } from '../../redux/eventLogFilterApi';
import { AlertCircle } from 'lucide-react';

const EventLogs = ({ isDarkMode = false }) => {
  
  // Fetch all event logs using RTK Query
  const {
    data: eventLogsResponse,
    isLoading,
    isError,
    error,
  } = useGetEventLogsQuery({}, {
    refetchOnMountOrArgChange: true,
  });

  // Extract event logs from response
  const eventLogs = eventLogsResponse?.results?.events || [];
  const totalCount = eventLogsResponse?.count || 0;

  // Format date time
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div
      className="p-6 rounded-lg shadow-md"
      style={{
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>
          Events
          {!isLoading && totalCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {totalCount}
            </span>
          )}
        </h3>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
          <p>Loading events...</p>
        </div>
      ) : isError ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }} />
          <h4 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
            Error Loading Events
          </h4>
          <p className="text-sm mb-4" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
            {error?.data?.message || 'Failed to load event logs. Please try again.'}
          </p>
        </div>
      ) : eventLogs.length === 0 ? (
        /* Empty state */
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
          </div>
        </div>
      ) : (
        /* Event logs table */
        <div className="max-h-72 overflow-y-auto overflow-x-auto custom-scroll">
          <table 
            className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[700px] ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
          >
            <thead>
              <tr 
                className="sticky top-[-15px] z-10 font-normal" 
                style={{ 
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', 
                  color: isDarkMode ? '#D1D5DB' : '#6B7280' 
                }}
              >
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">EVENT TYPE</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {eventLogs.map((log, index) => (
                <tr
                  key={log.id || log.uuid || index}
                  className={`${
                    isDarkMode
                      ? index % 2 === 0
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                      : index % 2 === 0
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                  style={{ color: isDarkMode ? '#D1D5DB' : '#525759' }}
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap w-32">
                    {formatDateTime(log.created_at || log.timestamp)}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                    {log.component_type && log.component_type !== '' ? log.component_type : '---'}
                  </td>
                  <td 
                    className="py-2 sm:py-3 px-2 sm:px-4 text-center"
                    style={{ 
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal'
                    }}
                    title={log.description}
                  >
                    <div className="max-w-md break-words">
                      {log.description || log.message || '---'}
                    </div>
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
