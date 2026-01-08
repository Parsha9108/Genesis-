import React, { useState } from "react";
import { AlertCircle } from 'lucide-react';
import { 
  useGetEventLogsQuery, 
  useGetEventLogFilterOptionsQuery 
} from '../../redux/eventLogFilterApi';
import '../../components/index.css';
import FilterDropdown from '../tables/FilterDropdown';

export const EventLogsTable = ({ isDarkMode = false, deviceId, limit = 100 }) => {
  const table_columns = [
    { id: 1, name: "TIME" },
    { id: 2, name: "EVENT TYPE" },
    { id: 3, name: "COMPONENT" },
    { id: 4, name: "DESCRIPTION" },
  ];
  
  // Filter state
  const [filters, setFilters] = useState({
    event_type: "",
    component_type: "",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch filter options
  const { data: filterOptionsData } = useGetEventLogFilterOptionsQuery(deviceId);
 const filterOptions = {
  event_type: Array.isArray(filterOptionsData?.event_type) ? filterOptionsData.event_type : [],
  component: Array.isArray(filterOptionsData?.component_type) ? filterOptionsData.component_type : [],
};

  // Dynamic Updates with filters
  const queryParams = {
    device_id: deviceId,
    ...(filters.event_type && { event_type: filters.event_type }),
    ...(filters.component_type && { component_type: filters.component_type }),
    ...(filters.dateFrom && { start_date: filters.dateFrom }),
    ...(filters.dateTo && { end_date: filters.dateTo }),
  };

  const { 
    data: apiResponse, 
    isLoading, 
    isError, 
    error 
  } = useGetEventLogsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  // const displayLogs = apiResponse?.results || [];
  const displayLogs = Array.isArray(apiResponse?.results?.events) 
  ? apiResponse.results.events 
  : [];

  const totalCount = apiResponse?.count || 0

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

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filterConfig = [
    { key: "event_type", label: "Event Type", type: "select", optionsKey: "event_type" },
    { key: "component_type", label: "Component", type: "select", optionsKey: "component" },
    { key: "date", label: "Date Range", type: "dateRange" },
  ];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
        }}
      >
        {/* Table Header with Filter Button on Right */}
        <div className="p-3 sm:p-4 flex justify-between items-center font-medium tracking-wider text-xs py-3 px-4 text-gray-600">
          <span className="text-base sm:text-lg font-semibold flex items-center gap-2" 
                style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            Event Logs ({isLoading ? '...' : displayLogs.length})
            {hasActiveFilters && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Filtered ({totalCount})
              </span>
            )}
          </span>

          {/* FilterDropdown - Top Right */}
          <FilterDropdown
            filterConfig={filterConfig}
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={handleFiltersChange}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Table Content */}
        <div className="max-h-72 overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p>{hasActiveFilters ? 'Loading filtered event logs...' : 'Loading event logs...'}</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Event Logs</h3>
                <p>{error?.data?.message || 'Failed to load event logs. Please try again.'}</p>
              </div>
            ) : displayLogs.length === 0 ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                  {hasActiveFilters ? 'No Event Logs Match Filters' : 'No Event Logs Available'}
                </h3>
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or clear them to see all event logs.' 
                    : 'Event log information will appear here when available.'
                  }
                </p>
              </div>
            ) : (
              <table 
                className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[700px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
              >
                <thead>
                  <tr className="sticky top-[-17px] z-5 font-normal" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                    {table_columns.map((column) => (
                      <th key={column.id} className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayLogs.map((log, index) => (
                    <tr 
                      key={log.id || `log-${index}`}
                      className={`${
                        isDarkMode 
                          ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900' 
                          : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-opacity-80 transition-all duration-300 ease-in-out`}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className="px-1 sm:px-2 py-1 rounded-full text-xs font-medium inline-block">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                        {log.component_type}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <div className="max-w-md break-words">
                          {log.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

