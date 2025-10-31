import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useGetFilteredEventLogsQuery, useGetEventLogFilterOptionsQuery } from '../../redux/eventLogFilterApi';
import '../../components/index.css';

export const EventLogsTable = ({ isDarkMode = false, deviceId, eventLogs = [], defaultLimit = 100 }) => {
  const [selectedEventType, setSelectedEventType] = useState('All');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('All');
  const [activeFilter, setActiveFilter] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch filter options from backend
  const { data: filterOptions } = useGetEventLogFilterOptionsQuery(deviceId);

  // Map frontend display names to backend API values
  const mapTimeRangeToAPI = (displayValue) => {
    const timeRangeMap = {
      'Previous Hour': 'last_hour',
      'Yesterday': 'yesterday',
      'Last Week': 'last_week',
      'Last Month': 'last_month',
      'All': null
    };
    return timeRangeMap[displayValue] || null;
  };

  // Check if any filters are active
  const hasActiveFilters = selectedEventType !== 'All' || 
                          selectedComponent !== 'All' || 
                          selectedTimeRange !== 'All';

  // Build query params for API - ALWAYS includes device_id
  const queryParams = {
    device_id: deviceId,
    ...(selectedEventType !== 'All' && { event_type: selectedEventType }),
    ...(selectedComponent !== 'All' && { component_type: selectedComponent }),
    ...(selectedTimeRange !== 'All' && { time_range: mapTimeRangeToAPI(selectedTimeRange) }),
    limit: 5000,
    offset: 0,
  };

  // Only fetch from API when filters are active
  const { 
    data: apiResponse, 
    isLoading: isApiLoading, 
    isError, 
    error,
    isFetching 
  } = useGetFilteredEventLogsQuery(queryParams, {
    skip: !hasActiveFilters,  // ✅ Skip API call when no filters active
    refetchOnMountOrArgChange: true,
    pollingInterval: hasActiveFilters ? 10000 : 0  // ✅ Poll every 10s when filtering
  });

  // Client-side filtering function (same as your old code)
  const applyClientSideFilters = (logs) => {
    return logs.filter(log => {
      const eventTypeMatch = selectedEventType === 'All' || log.event_type === selectedEventType;
      const componentMatch = selectedComponent === 'All' || log.component_type === selectedComponent;

      // Discrete time period filtering
      const timeMatch = (() => {
        if (selectedTimeRange === 'All') return true;
        try {
          const logTime = new Date(log.created_at);
          if (isNaN(logTime.getTime())) return false;
          
          const now = new Date();
          switch (selectedTimeRange) {
            case 'Previous Hour': {
              const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
              const previousHourStart = new Date(currentHourStart.getTime() - (60 * 60 * 1000));
              const previousHourEnd = new Date(currentHourStart.getTime() - 1);
              return logTime >= previousHourStart && logTime <= previousHourEnd;
            }
            case 'Yesterday': {
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
              const yesterdayStart = new Date(todayStart.getTime() - (24 * 60 * 60 * 1000));
              const yesterdayEnd = new Date(todayStart.getTime() - 1);
              return logTime >= yesterdayStart && logTime <= yesterdayEnd;
            }
            case 'Last Week': {
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const currentWeekStart = new Date(today);
              currentWeekStart.setDate(today.getDate() - today.getDay() + 1);
              const lastWeekStart = new Date(currentWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
              const lastWeekEnd = new Date(currentWeekStart.getTime() - 1);
              return logTime >= lastWeekStart && logTime <= lastWeekEnd;
            }
            case 'Last Month': {
              const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
              const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
              const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);
              return logTime >= lastMonthStart && logTime <= lastMonthEnd;
            }
            default:
              return true;
          }
        } catch (error) {
          console.error('Error filtering log by time:', error, log);
          return false;
        }
      })();

      return eventTypeMatch && componentMatch && timeMatch;
    });
  };

  // ✅ Use API data when filtering, otherwise use props data with client-side filtering
  const displayData = hasActiveFilters 
    ? (apiResponse?.results || []) 
    : applyClientSideFilters(eventLogs || []);
    
  const totalCount = hasActiveFilters 
    ? (apiResponse?.count || 0) 
    : displayData.length;
    
  const isLoading = hasActiveFilters ? isApiLoading : false;

  // Get filter options - prioritize API data, fallback to client-side extraction
  const eventTypes = ['All', ...(filterOptions?.event_types || Array.from(new Set(eventLogs.map(log => log.event_type))))];
  const components = ['All', ...(filterOptions?.component_types || Array.from(new Set(eventLogs.map(log => log.component_type))))];
  const timeRanges = ['All', 'Previous Hour', 'Yesterday', 'Last Week', 'Last Month'];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug logging for filter changes
  useEffect(() => {
    if (hasActiveFilters) {
      console.group(`EventLogsTable Filter Applied`);
      console.log(`Mode: ${hasActiveFilters ? 'API' : 'Client-side'}`);
      console.log(`Event Type: ${selectedEventType}`);
      console.log(`Component: ${selectedComponent}`);
      console.log(`Time Range: ${selectedTimeRange}`);
      console.log(`Total Results: ${totalCount}`);
      console.groupEnd();
    }
  }, [selectedEventType, selectedComponent, selectedTimeRange, totalCount, hasActiveFilters]);

  const handleFilterSelection = (filterType, value) => {
    switch (filterType) {
      case 'Event Type':
        setSelectedEventType(value);
        break;
      case 'Component':
        setSelectedComponent(value);
        break;
      case 'Time Range':
        setSelectedTimeRange(value);
        break;
    }
    setShowFilterDropdown(false);
    setActiveFilter(null);
  };

  const getFilterOptions = (filterType) => {
    switch (filterType) {
      case 'Event Type': return eventTypes;
      case 'Component': return components;
      case 'Time Range': return timeRanges;
      default: return [];
    }
  };

  const getCurrentFilterValue = (filterType) => {
    switch (filterType) {
      case 'Event Type': return selectedEventType;
      case 'Component': return selectedComponent;
      case 'Time Range': return selectedTimeRange;
      default: return 'All';
    }
  };

  const clearAllFilters = () => {
    setSelectedEventType('All');
    setSelectedComponent('All');
    setSelectedTimeRange('All');
    setActiveFilter(null);
    setShowFilterDropdown(false);
  };

  return (
    <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {selectedEventType !== 'All' && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Type: {selectedEventType}
              <button
                onClick={() => setSelectedEventType('All')}
                className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}
          {selectedComponent !== 'All' && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Component: {selectedComponent}
              <button
                onClick={() => setSelectedComponent('All')}
                className="ml-1 sm:ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}
          {selectedTimeRange !== 'All' && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              Time: {selectedTimeRange}
              <button
                onClick={() => setSelectedTimeRange('All')}
                className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
        }}
      >
        {/* Table Header with Filter Button */}
        <div className="p-3 sm:p-4 flex justify-between items-center font-medium tracking-wider text-xs py-3 px-4 text-gray-600">
          <span className="text-base sm:text-lg font-semibold flex items-center gap-2" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            {hasActiveFilters ? (
              <>
                Event Logs ({isLoading ? '...' : totalCount})
                {isFetching && (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>
                )}
              </>
            ) : (
              <>Latest Event Logs ({Math.min(displayData.length, defaultLimit)})</>
            )}
            {hasActiveFilters && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Filtered
              </span>
            )}
          </span>
          <div className="relative" ref={dropdownRef}>
            <button
              title="Filter"
              onClick={() => setShowFilterDropdown(prev => !prev)}
              className={`p-2 rounded-md transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-2xl border z-[100]"
                style={{ 
                  backgroundColor: isDarkMode ? '#191c3a' : '#FFFFFF', 
                  borderColor: isDarkMode ? '#374151' : '#E5E7EB' 
                }}
              >
                {['Event Type', 'Component', 'Time Range'].map((filter) => (
                  <div key={filter} className="relative">
                    <div
                      className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center transition-colors duration-200 ${
                        isDarkMode 
                          ? 'hover:bg-[#242a42] focus:bg-[#242a42]' 
                          : 'hover:bg-gray-50 focus:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilter(activeFilter === filter ? null : filter);
                      }}
                      style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                    >
                      <span>{filter}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getCurrentFilterValue(filter) !== 'All' ? getCurrentFilterValue(filter) : ''}
                      </span>
                    </div>

                    {/* Submenu */}
                    {activeFilter === filter && (
                      <div 
                        className="absolute right-full top-0 ml-1 w-40 rounded-md shadow-2xl border max-h-48 overflow-y-auto z-[110]"
                        style={{ 
                          backgroundColor: isDarkMode ? '#151829' : '#FFFFFF', 
                          borderColor: isDarkMode ? '#374151' : '#E5E7EB' 
                        }}
                      >
                        {getFilterOptions(filter).map((item) => (
                          <div 
                            key={item} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleFilterSelection(filter, item); 
                            }}
                            className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-200 ${
                              isDarkMode 
                                ? `hover:bg-[#1f2537] focus:bg-[#1f2537] ${getCurrentFilterValue(filter) === item ? 'bg-blue-900/50' : ''}` 
                                : `hover:bg-gray-50 focus:bg-gray-50 ${getCurrentFilterValue(filter) === item ? 'bg-blue-50' : ''}`
                            }`}
                            style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Clear All Filters Button */}
                {hasActiveFilters && (
                  <>
                    <hr className="my-1" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />
                    <div 
                      className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'hover:bg-red-900/30 focus:bg-red-900/30 text-red-400' 
                          : 'hover:bg-red-50 focus:bg-red-50 text-red-600'
                      }`}
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="max-h-72 overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p>Loading filtered event logs...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }}>
                <AlertCircle 
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-lg font-semibold mb-2">Error Loading Event Logs</h3>
                <p>{error?.data?.message || 'Failed to load event logs. Please try again.'}</p>
              </div>
            ) : eventLogs.length === 0 && !hasActiveFilters ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle 
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }}
                />
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                  No Event Log Data Available
                </h3>
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  Event log information will appear here when available.
                </p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle 
                  className="w-12 h-12 mx-auto mb-4 opacity-50"
                  style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }}
                />
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  No event logs match the current filters.
                </p>
              </div>
            ) : (
              <table 
                className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[700px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
              >
                <thead>
                  <tr className="sticky top-[-17px] z-5 font-normal" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">EVENT TYPE</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.slice(0, hasActiveFilters ? undefined : defaultLimit).map((log, index) => (
                    <tr
                      key={log.id || index}
                      className={`${isDarkMode
                          ? index % 2 === 0
                            ? 'bg-gray-800'
                            : 'bg-gray-900'
                          : index % 2 === 0
                            ? 'bg-gray-50'
                            : 'bg-white'
                        } hover:bg-opacity-80 transition-colors`}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Kolkata'
                        })}
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
                        {log.description}
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
