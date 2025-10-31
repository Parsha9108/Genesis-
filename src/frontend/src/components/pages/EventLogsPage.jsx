import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SlidersHorizontal, Download, AlertCircle, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import { useGetDevicesdataQuery } from "../../redux/apiSlice";
import { useGetFilteredEventLogsQuery, useGetEventLogFilterOptionsQuery } from '../../redux/eventLogFilterApi';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';
import CustomTimeRangeModal from './CustomTimeRangeModal';

// Configuration constants
const EVENT_CONFIG = {
  MAX_LOGS_DISPLAY: 100,
};

// Event type display mapping for user-friendly names
const EVENT_TYPE_DISPLAY = {
  'MON_DATA': 'Monitoring Data',
  'INFO': 'Info',
  'ALERT': 'Alert',
  'ERROR': 'Error',
  'UPDATE': 'Update',
  'DELETE': 'Delete',
  'CREATE': 'Create',
  'CONNECTION': 'Connection',
  'DISCONNECT': 'Disconnect'
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Event Logs Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Unable to load event logs</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

// Map frontend display names to backend API values for time range
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

const EventLogsPage = ({ isDarkMode = false }) => {
  useDocumentTitle('Event Logs');
  const deviceId = null;

  // ✅ Fetch devices data with monitoring data
  const { data: devicesData, isLoading: devicesLoading, error: devicesError } = useGetDevicesdataQuery();

  const [selectedEventType, setSelectedEventType] = useState('All');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('All');
  const [customTimeRange, setCustomTimeRange] = useState({ start: null, end: null });
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const dropdownRef = useRef(null);

  // ✅ Check if any filters are active
  const hasActiveFilters = selectedEventType !== 'All' || 
                          selectedComponent !== 'All' || 
                          selectedTimeRange !== 'All';

  // ✅ Aggregate all event logs from monitoring data (live data)
  const liveEventLogs = useMemo(() => {
    if (!devicesData?.device || !Array.isArray(devicesData.device)) return [];
    
    return devicesData.device.flatMap(device => {
      const deviceLogs = device?.monitoring_data?.events || [];
      return deviceLogs.map(log => ({
        ...log,
        device_name: device.device?.name || device.hostname || 'Unknown Device',
        device_uuid: device.device?.uuid,
      }));
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [devicesData]);

  // Build query params for event logs API (only when filtering)
  const queryParams = useMemo(() => {
    if (!hasActiveFilters) return null; // ✅ Don't fetch if no filters

    const params = {
      limit: 5000,
      offset: 0,
    };

    if (selectedEventType !== 'All') {
      params.event_type = selectedEventType;
    }
    if (selectedComponent !== 'All') {
      params.component_type = selectedComponent;
    }

    // Handle custom time range
    if (selectedTimeRange === 'Custom' && customTimeRange.start && customTimeRange.end) {
      params.start_date = customTimeRange.start.toISOString();
      params.end_date = customTimeRange.end.toISOString();
    } else if (selectedTimeRange !== 'All') {
      params.time_range = mapTimeRangeToAPI(selectedTimeRange);
    }

    return params;
  }, [selectedEventType, selectedComponent, selectedTimeRange, customTimeRange, hasActiveFilters]);

  // ✅ Only fetch from API when filters are active
  const { 
    data: apiResponse, 
    isLoading: apiLoading, 
    isError: apiError, 
    error: apiErrorData,
    isFetching: apiFetching 
  } = useGetFilteredEventLogsQuery(queryParams || {}, {
    skip: !hasActiveFilters, // ✅ Skip API call when no filters
    refetchOnMountOrArgChange: true,
  });

  const { data: filterOptions, isLoading: filterLoading } = useGetEventLogFilterOptionsQuery(deviceId);

  // ✅ Use API data when filtering, otherwise use live data
  const eventLogs = useMemo(() => {
    if (hasActiveFilters) {
      // Use API data when filtering
      return apiResponse?.results || [];
    } else {
      // Use live monitoring data
      return liveEventLogs.slice(0, EVENT_CONFIG.MAX_LOGS_DISPLAY);
    }
  }, [hasActiveFilters, apiResponse, liveEventLogs]);

  const totalCount = hasActiveFilters 
    ? (apiResponse?.count || 0) 
    : liveEventLogs.length;

  const isLoading = hasActiveFilters ? apiLoading : devicesLoading;
  const isError = hasActiveFilters ? apiError : !!devicesError;
  const error = hasActiveFilters ? apiErrorData : devicesError;

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedEventType('All');
    setSelectedComponent('All');
    setSelectedTimeRange('All');
    setCustomTimeRange({ start: null, end: null });
    setActiveFilter(null);
    setShowFilterDropdown(false);
  }, []);

  const clearIndividualFilter = useCallback((filterType) => {
    switch(filterType) {
      case 'Event Type':
        setSelectedEventType('All');
        break;
      case 'Component':
        setSelectedComponent('All');
        break;
      case 'Time Range':
        setSelectedTimeRange('All');
        setCustomTimeRange({ start: null, end: null });
        break;
      default:
        break;
    }
  }, []);

  const handleFilterSelection = useCallback((filterType, value) => {
    switch(filterType) {
      case 'Event Type':
        setSelectedEventType(value);
        break;
      case 'Component':
        setSelectedComponent(value);
        break;
      case 'Time Range':
        if (value === 'Custom') {
          setShowCustomRangeModal(true);
          setShowFilterDropdown(false);
        } else {
          setSelectedTimeRange(value);
          setCustomTimeRange({ start: null, end: null });
        }
        break;
      default:
        break;
    }
    if (value !== 'Custom') {
      setShowFilterDropdown(false);
      setActiveFilter(null);
    }
  }, []);

  const handleCustomRangeApply = useCallback((range) => {
    setCustomTimeRange(range);
    setSelectedTimeRange('Custom');
    setShowCustomRangeModal(false);
    setActiveFilter(null);
  }, []);

  const handleKeyDown = useCallback((e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
    if (e.key === 'Escape') {
      setShowFilterDropdown(false);
      setActiveFilter(null);
    }
  }, []);

  const getCurrentFilterValue = useCallback((filterType) => {
    switch(filterType) {
      case 'Event Type': return selectedEventType;
      case 'Component': return selectedComponent;
      case 'Time Range': return selectedTimeRange;
      default: return 'All';
    }
  }, [selectedEventType, selectedComponent, selectedTimeRange]);

  const getFilterOptions = useCallback((filterType) => {
    switch(filterType) {
      case 'Event Type': 
        return ['All', ...(filterOptions?.event_types || Array.from(new Set(liveEventLogs.map(log => log.event_type))))];
      case 'Component': 
        return ['All', ...(filterOptions?.component_types || Array.from(new Set(liveEventLogs.map(log => log.component_type).filter(Boolean))))];
      case 'Time Range': 
        return ['All', 'Previous Hour', 'Yesterday', 'Last Week', 'Last Month', 'Custom'];
      default: return ['All'];
    }
  }, [filterOptions, liveEventLogs]);

  const handleExport = useCallback(() => {
    if (eventLogs.length === 0) {
      alert('No logs to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvHeaders = ['Created At', 'Event Type', 'Component', 'Description'];
      const csvRows = eventLogs.map(log => [
        log.created_at,
        EVENT_TYPE_DISPLAY[log.event_type] || log.event_type,
        log.component_type || '------------',
        `"${(log.description || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `event-logs-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [eventLogs]);

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

  const logStatistics = useMemo(() => {
    const stats = {
      total: eventLogs.length,
      byType: {},
      successRate: 0,
      warnings: 0,
      errors: 0,
      info: 0,
      operations: 0
    };
    if (eventLogs.length === 0) return stats;

    eventLogs.forEach(log => {
      stats.byType[log.event_type] = (stats.byType[log.event_type] || 0) + 1;
    });

    const successTypes = ['MON_DATA', 'INFO', 'CONNECTION', 'CREATE', 'UPDATE'];
    const warningTypes = ['ALERT', 'DISCONNECT', 'DELETE'];
    const errorTypes = ['ERROR'];

    const successCount = eventLogs.filter(log => successTypes.includes(log.event_type)).length;
    const warningCount = eventLogs.filter(log => warningTypes.includes(log.event_type)).length;
    const errorCount = eventLogs.filter(log => errorTypes.includes(log.event_type)).length;

    stats.successRate = Math.round((successCount / eventLogs.length) * 100);
    stats.warnings = warningCount + errorCount;
    stats.errors = errorCount;

    return stats;
  }, [eventLogs]);

  if (isLoading || filterLoading) {
    return (
      <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to Load Event Logs</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || error?.data?.message || 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
        {/* Custom Time Range Modal */}
        {showCustomRangeModal && (
          <CustomTimeRangeModal
            isDarkMode={isDarkMode}
            onChange={handleCustomRangeApply}
            initialRange={customTimeRange}
            onClose={() => setShowCustomRangeModal(false)}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>
            Event Logs
          </h2>

          {eventLogs.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting || eventLogs.length === 0}
                className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={`Export ${eventLogs.length} logs to CSV`}
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {selectedEventType !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Type: {EVENT_TYPE_DISPLAY[selectedEventType] || selectedEventType}
                <button 
                  onClick={() => clearIndividualFilter('Event Type')}
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
                  onClick={() => clearIndividualFilter('Component')}
                  className="ml-1 sm:ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTimeRange !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Time: {selectedTimeRange === 'Custom' && customTimeRange.start && customTimeRange.end 
                  ? `${formatDate(customTimeRange.start.toISOString())} - ${formatDate(customTimeRange.end.toISOString())}`
                  : selectedTimeRange}
                <button 
                  onClick={() => clearIndividualFilter('Time Range')}
                  className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Event Logs Table */}
        <div
          className="rounded-lg shadow-md overflow-visible relative"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
          }}
        >
          <div className="p-3 sm:p-4 flex justify-between items-center font-medium tracking-wider text-xs py-3 px-4 text-gray-600">
            <span className="text-base sm:text-lg font-semibold flex items-center gap-2" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
              {hasActiveFilters ? (
                <>
                  Event Logs ({totalCount})
                  {apiFetching && (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>
                  )}
                </>
              ) : (
                <>Latest Event Logs ({Math.min(eventLogs.length, EVENT_CONFIG.MAX_LOGS_DISPLAY)})</>
              )}
            </span>

            {(eventLogs.length > 0 || selectedTimeRange !== 'All') && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(prev => !prev)}
                  className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
                  title="Filter logs"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                {/* Filter Dropdown - same structure as before */}
                {showFilterDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 w-56 rounded-md shadow-2xl border z-[100]"
                    style={{
                      backgroundColor: isDarkMode ? '#191c3a' : '#FFFFFF',
                      borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                    }}
                  >
                    {['Event Type', 'Component', 'Time Range'].filter(filter => {
                      const options = getFilterOptions(filter);
                      return options.length > 1;
                    }).map(filter => (
                      <div key={filter} className="relative">
                        <div
                          className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center transition-colors duration-200 ${
                            isDarkMode 
                              ? 'hover:bg-[#242a42]' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            setActiveFilter(activeFilter === filter ? null : filter);
                          }}
                          style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                        >
                          <span>{filter}</span>
                          <span className="text-xs text-gray-500">
                            {getCurrentFilterValue(filter) !== 'All'
                              ? (filter === 'Event Type' && EVENT_TYPE_DISPLAY[getCurrentFilterValue(filter)]) || getCurrentFilterValue(filter)
                              : ''}
                          </span>
                        </div>

                        {activeFilter === filter && (
                          <div
                            className="absolute right-full top-0 ml-1 w-44 rounded-md shadow-2xl border max-h-48 overflow-y-auto z-[110] custom-scroll"
                            style={{
                              backgroundColor: isDarkMode ? '#151829' : '#FFFFFF',
                              borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                            }}
                          >
                            {getFilterOptions(filter).map(item => (
                              <div
                                key={item}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleFilterSelection(filter, item);
                                }}
                                className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-200 flex items-center gap-2 ${
                                  isDarkMode
                                    ? `hover:bg-[#1f2537] ${getCurrentFilterValue(filter) === item ? 'bg-blue-900/50' : ''}`
                                    : `hover:bg-gray-50 ${getCurrentFilterValue(filter) === item ? 'bg-blue-50' : ''}`
                                }`}
                                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                              >
                                {item === 'Custom' && <Calendar className="w-4 h-4" />}
                                {filter === 'Event Type' && item !== 'All' ? (EVENT_TYPE_DISPLAY[item] || item) : item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {hasActiveFilters && (
                      <>
                        <hr className="my-1" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />
                        <div
                          className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors duration-200 ${
                            isDarkMode
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
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
            )}
          </div>

          {/* Table Content */}
          <div className="max-h-72 overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
            <div className="max-w-5xl mx-auto">
              {eventLogs.length === 0 ? (
                <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                  <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-30" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
                    No Event Logs Available
                  </h3>
                  <p className="text-sm">
                    {hasActiveFilters 
                      ? 'No logs match the current filters.' 
                      : 'Events will appear here once your agents start sending data.'}
                  </p>
                </div>
              ) : (
                <table
                  className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[700px] ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
                >
                  <thead>
                    <tr
                      className="sticky top-[-17px] z-10 font-normal"
                      style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}
                    >
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">EVENT TYPE</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center min-w-48">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventLogs.map((log, index) => (
                      <tr
                        key={log.id || `${log.event_type}-${log.created_at}-${index}`}
                        className={`${
                          isDarkMode
                            ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'
                            : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-opacity-80 transition-colors`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <span className="text-xs font-semibold">
                            {EVENT_TYPE_DISPLAY[log.event_type] || log.event_type}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                          {log.component_type || '------------'}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center" title={log.description}>
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

        {/* Statistics */}
        {eventLogs.length > 0 && (
          <div
            className="p-4 sm:p-6 rounded-lg shadow-md grid grid-cols-1 sm:grid-cols-3 text-center gap-4 sm:gap-6"
            style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
            }}
          >
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-500">{logStatistics.total}</p>
              <p className="text-xs sm:text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                Total Events
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-green-500">{logStatistics.successRate}%</p>
              <p className="text-xs sm:text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                Success Rate
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-red-500">{logStatistics.warnings}</p>
              <p className="text-xs sm:text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                Issues & Errors
              </p>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

EventLogsPage.propTypes = {
  isDarkMode: PropTypes.bool,
};

EventLogsPage.defaultProps = {
  isDarkMode: false,
};

export default EventLogsPage;
