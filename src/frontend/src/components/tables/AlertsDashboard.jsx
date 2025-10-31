import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SlidersHorizontal, AlertCircle, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import '../index.css';
import { useGetDevicesdataQuery } from "../../redux/apiSlice";
import { useGetFilteredAlertsQuery, useGetAlertFilterOptionsQuery } from '../../redux/alertFilterApi';
import AlertModal from './AlertModal';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomTimeRangeModal from '../../components/pages/CustomTimeRangeModal';

// Configuration constants
const ALERT_CONFIG = {
  SEVERITY_COLORS: {
    Critical: 'bg-red-100 text-red-600 w-20',
    Warning: 'bg-yellow-100 text-yellow-700 w-20',
    Info: 'bg-green-100 text-green-600 w-20',
  },
  MAX_ALERTS_DISPLAY: 100,
};

const AlertDashboard = ({ isDarkMode = false }) => {
  useDocumentTitle('Alerts');
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ Fetch devices data with monitoring data
  const { data: devicesData, isLoading: devicesLoading, error: devicesError } = useGetDevicesdataQuery();

  // State management
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('All');
  
  // Custom Time Range State
  const [customTimeRange, setCustomTimeRange] = useState({ start: null, end: null });
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dropdownRef = useRef(null);

  // ✅ Check if any filters are active
  const hasActiveFilters = selectedDevice !== 'All' || 
                          selectedComponent !== 'All' || 
                          selectedSeverity !== 'All' || 
                          selectedTimeRange !== 'All';

  // ✅ Aggregate all alerts from monitoring data (live data)
  const liveAlerts = useMemo(() => {
    if (!devicesData?.device || !Array.isArray(devicesData.device)) return [];
    
    return devicesData.device.flatMap(device => {
      const deviceAlerts = device?.monitoring_data?.alerts || [];
      return deviceAlerts.map(alert => ({
        ...alert,
        device_name: device.device?.name || device.hostname || 'Unknown Device',
        device_uuid: device.device?.uuid,
        alert_type: alert.alert_type || 'Unknown',
        severity: alert.severity || 'Info',
        message: alert.message || 'No message available',
      }));
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [devicesData]);

  // Map time range display values to API values
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

  // Build query params for alerts API (only when filtering)
  const alertsQueryParams = useMemo(() => {
    if (!hasActiveFilters) return null; // ✅ Don't fetch if no filters

    const params = {
      limit: 5000, // Large limit for filtering
      offset: 0,
    };

    // Device filter
    if (selectedDevice !== 'All') {
      const deviceItem = devicesData?.device?.find(
        deviceItem => (deviceItem.device?.name || deviceItem.hostname) === selectedDevice
      );
      if (deviceItem?.device?.uuid) {
        params.device_id = deviceItem.device.uuid;
      }
    }

    // Other filters
    if (selectedComponent !== 'All') {
      params.alert_type = selectedComponent;
    }
    if (selectedSeverity !== 'All') {
      params.severity = selectedSeverity;
    }

    // Handle custom time range
    if (selectedTimeRange === 'Custom' && customTimeRange.start && customTimeRange.end) {
      params.start_date = customTimeRange.start.toISOString();
      params.end_date = customTimeRange.end.toISOString();
    } else if (selectedTimeRange !== 'All') {
      params.time_range = mapTimeRangeToAPI(selectedTimeRange);
    }

    return params;
  }, [selectedDevice, selectedComponent, selectedSeverity, selectedTimeRange, customTimeRange, devicesData, hasActiveFilters]);

  // ✅ Only fetch from API when filters are active
  const { 
    data: alertsApiResponse, 
    isLoading: alertsApiLoading, 
    error: alertsApiError,
    isFetching: alertsApiFetching 
  } = useGetFilteredAlertsQuery(alertsQueryParams || {}, {
    skip: !hasActiveFilters, // ✅ Skip API call when no filters
    refetchOnMountOrArgChange: true,
  });

  // Get filter options from the alert API
  const selectedDeviceId = selectedDevice !== 'All' 
    ? devicesData?.device?.find(
        deviceItem => (deviceItem.device?.name || deviceItem.hostname) === selectedDevice
      )?.device?.uuid
    : undefined;

  const { data: filterOptions } = useGetAlertFilterOptionsQuery(selectedDeviceId);

  // ✅ Client-side filtering for live data (when no filters active)
  const applyClientSideFilters = useCallback((alertsData) => {
    return alertsData.filter(alert => {
      const deviceMatch = selectedDevice === 'All' || alert.device_name === selectedDevice;
      const componentMatch = selectedComponent === 'All' || alert.alert_type === selectedComponent;
      const severityMatch = selectedSeverity === 'All' || alert.severity === selectedSeverity;

      // Time filtering
      const timeMatch = (() => {
        if (selectedTimeRange === 'All') return true;
        
        try {
          const alertTime = new Date(alert.created_at);
          if (isNaN(alertTime.getTime())) return false;
          
          const now = new Date();
          
          if (selectedTimeRange === 'Custom' && customTimeRange.start && customTimeRange.end) {
            return alertTime >= customTimeRange.start && alertTime <= customTimeRange.end;
          }

          switch (selectedTimeRange) {
            case 'Previous Hour': {
              const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
              return alertTime >= hourAgo;
            }
            case 'Yesterday': {
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
              const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
              const yesterdayEnd = new Date(todayStart.getTime() - 1);
              return alertTime >= yesterdayStart && alertTime <= yesterdayEnd;
            }
            case 'Last Week': {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return alertTime >= weekAgo;
            }
            case 'Last Month': {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return alertTime >= monthAgo;
            }
            default:
              return true;
          }
        } catch (error) {
          console.error('Error filtering alert by time:', error);
          return false;
        }
      })();

      return deviceMatch && componentMatch && severityMatch && timeMatch;
    });
  }, [selectedDevice, selectedComponent, selectedSeverity, selectedTimeRange, customTimeRange]);

  // ✅ Use API data when filtering, otherwise use live data
  const alerts = useMemo(() => {
    if (hasActiveFilters) {
      // Use API data when filtering
      return alertsApiResponse?.results || [];
    } else {
      // Use live monitoring data (no client-side filtering needed when All)
      return liveAlerts.slice(0, ALERT_CONFIG.MAX_ALERTS_DISPLAY);
    }
  }, [hasActiveFilters, alertsApiResponse, liveAlerts]);

  const totalCount = hasActiveFilters 
    ? (alertsApiResponse?.count || 0) 
    : liveAlerts.length;

  const isLoading = hasActiveFilters ? alertsApiLoading : devicesLoading;
  const error = hasActiveFilters ? alertsApiError : devicesError;

  // Generate filter options from live data and API
  const filterOptionsData = useMemo(() => {
    const deviceNames = devicesData?.device?.map(
      deviceItem => deviceItem.device?.name || deviceItem.hostname
    ).filter(name => name) || [];
    
    const options = {
      devices: ['All', ...Array.from(new Set(deviceNames)).sort()],
      components: ['All', ...(filterOptions?.alert_types || Array.from(new Set(liveAlerts.map(a => a.alert_type))))],
      severities: ['All', ...(filterOptions?.severities || ['Critical', 'Warning', 'Info'])],
      times: ['All', 'Previous Hour', 'Yesterday', 'Last Week', 'Last Month', 'Custom']
    };

    return options;
  }, [devicesData, filterOptions, liveAlerts]);

  // Alert summary calculation
  const alertSummary = useMemo(() => {
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, { Critical: 0, Warning: 0, Info: 0, total: 0 });
  }, [alerts]);

  // Modal handlers
  const handleRowClick = useCallback((alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAlert(null);
    setIsModalOpen(false);
  }, []);

  // Custom Range Apply Handler
  const handleCustomRangeApply = useCallback((range) => {
    setCustomTimeRange(range);
    setSelectedTimeRange('Custom');
    setShowCustomRangeModal(false);
    setActiveFilter(null);
  }, []);

  // Filter handlers
  const handleFilterSelection = useCallback((filterType, value) => {
    try {
      switch (filterType) {
        case 'Device':
          setSelectedDevice(value);
          break;
        case 'Component':
          setSelectedComponent(value);
          break;
        case 'Severity':
          setSelectedSeverity(value);
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
          console.warn('Unknown filter type:', filterType);
          break;
      }
      
      if (value !== 'Custom') {
        setShowFilterDropdown(false);
        setActiveFilter(null);
      }
    } catch (error) {
      console.error('Error handling filter selection:', error);
    }
  }, []);

  const getFilterOptions = useCallback((filterType) => {
    switch (filterType) {
      case 'Device': return filterOptionsData.devices;
      case 'Component': return filterOptionsData.components;
      case 'Severity': return filterOptionsData.severities;
      case 'Time Range': return filterOptionsData.times;
      default: return [];
    }
  }, [filterOptionsData]);

  const getCurrentFilterValue = useCallback((filterType) => {
    switch (filterType) {
      case 'Device': return selectedDevice;
      case 'Component': return selectedComponent;
      case 'Severity': return selectedSeverity;
      case 'Time Range': return selectedTimeRange;
      default: return 'All';
    }
  }, [selectedDevice, selectedComponent, selectedSeverity, selectedTimeRange]);

  const clearAllFilters = useCallback(() => {
    setSelectedDevice('All');
    setSelectedComponent('All');
    setSelectedSeverity('All');
    setSelectedTimeRange('All');
    setCustomTimeRange({ start: null, end: null });
    setActiveFilter(null);
    setShowFilterDropdown(false);
  }, []);

  const clearIndividualFilter = useCallback((filterType) => {
    switch (filterType) {
      case 'Device':
        setSelectedDevice('All');
        break;
      case 'Component':
        setSelectedComponent('All');
        break;
      case 'Severity':
        setSelectedSeverity('All');
        break;
      case 'Time Range':
        setSelectedTimeRange('All');
        setCustomTimeRange({ start: null, end: null });
        break;
    }
  }, []);

  // Format date helper
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

  // Text truncation function
  const truncateText = useCallback((text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  // Handle clicks outside dropdown
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

  // Handle navigation from notification
  useEffect(() => {
    const { findAlertId, fromNotification } = location.state || {};
    
    if (findAlertId && fromNotification && alerts.length > 0) {
      const targetAlert = alerts.find(alert => alert.uuid === findAlertId);

      if (targetAlert) {
        setSelectedAlert(targetAlert);
        setIsModalOpen(true);
        
        navigate(location.pathname, { 
          replace: true,
          state: null
        });
      }
    }
  }, [location.state, alerts, navigate, location.pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to Load Alerts</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || error?.data?.message || 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            Alerts Dashboard
          </h2>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {selectedDevice !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Device: {selectedDevice}
                <button
                  onClick={() => clearIndividualFilter('Device')}
                  className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            )}
            {selectedComponent !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Component: {selectedComponent}
                <button
                  onClick={() => clearIndividualFilter('Component')}
                  className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSeverity !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Severity: {selectedSeverity}
                <button
                  onClick={() => clearIndividualFilter('Severity')}
                  className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTimeRange !== 'All' && (
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Time: {selectedTimeRange === 'Custom' && customTimeRange.start && customTimeRange.end 
                  ? `${formatDate(customTimeRange.start.toISOString())} - ${formatDate(customTimeRange.end.toISOString())}`
                  : selectedTimeRange}
                <button
                  onClick={() => clearIndividualFilter('Time Range')}
                  className="ml-1 sm:ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Alerts Table */}
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
                  All Device Alerts ({totalCount})
                  {alertsApiFetching && (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>
                  )}
                </>
              ) : (
                <>Latest Alerts ({totalCount})</>
              )}
            </span>
            
            <div className="relative" ref={dropdownRef}>
              <button
                title="Filter alerts"
                onClick={() => setShowFilterDropdown(prev => !prev)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Filter Dropdown - same as before */}
              {showFilterDropdown && (
                <div 
                  className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-2xl border z-[100]"
                  style={{ 
                    backgroundColor: isDarkMode ? '#191c3a' : '#FFFFFF', 
                    borderColor: isDarkMode ? '#374151' : '#E5E7EB' 
                  }}
                >
                  {['Device', 'Component', 'Severity', 'Time Range'].map((filter) => (
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
                          className="absolute right-full top-0 ml-1 w-40 rounded-md shadow-2xl border max-h-48 overflow-y-auto z-[110] custom-scroll"
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
                              className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-200 flex items-center gap-2 ${
                                isDarkMode 
                                  ? `hover:bg-[#1f2537] focus:bg-[#1f2537] ${getCurrentFilterValue(filter) === item ? 'bg-blue-900/50' : ''}` 
                                  : `hover:bg-gray-50 focus:bg-gray-50 ${getCurrentFilterValue(filter) === item ? 'bg-blue-50' : ''}`
                              }`}
                              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                            >
                              {item === 'Custom' && <Calendar className="w-4 h-4" />}
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

          {/* Table Content - same as before */}
          <div className="max-h-72 overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
            <div className="max-w-5xl mx-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                  <AlertCircle 
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                  />
                  <h3 className="text-lg font-semibold mb-2">No Alerts Available</h3>
                  <p>{hasActiveFilters
                    ? 'No alerts match the current filters.'
                    : 'No alerts have been generated yet.'}</p>
                </div>
              ) : (
                <table 
                  className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[600px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
                >
                  <thead>
                    <tr className="sticky top-[-17px] z-5 font-normal" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DEVICE</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">SEVERITY</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, index) => (
                      <tr 
                        key={alert.uuid || `alert-${index}`}
                        onClick={() => handleRowClick(alert)}
                        className={`${
                          isDarkMode 
                            ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900' 
                            : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-opacity-80 transition-colors duration-200 cursor-pointer`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap">
                          {formatDate(alert.created_at)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          {alert.device_name}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                          {alert.alert_type}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <span 
                            className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium inline-block ${ALERT_CONFIG.SEVERITY_COLORS[alert.severity] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center" title={alert.message}>
                          <div className="max-w-md break-words">
                            {truncateText(alert.message)}
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

        {/* Summary & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div
            className="p-4 sm:p-6 rounded-lg shadow-md"
            style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
            }}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>
              Alert Summary {hasActiveFilters && '(Filtered)'}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>Critical</span>
                <span className="font-bold text-red-600 px-2 py-1 rounded">
                  {alertSummary.Critical}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>Warning</span>
                <span className="font-bold text-yellow-600 px-2 py-1 rounded">
                  {alertSummary.Warning}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>Info</span>
                <span className="font-bold text-green-600 px-2 py-1 rounded">
                  {alertSummary.Info}
                </span>
              </div>
              <hr style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />
              <div className="flex justify-between items-center font-semibold">
                <span style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>Total</span>
                <span className="text-blue-600 px-2 py-1 rounded">
                  {alertSummary.total}
                </span>
              </div>
            </div>
          </div>

          <div
            className="p-4 sm:p-6 rounded-lg shadow-md"
            style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
              border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
            }}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}>
              Recent Activity
            </h3>
            <div className="space-y-2">
              <p style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <span className="font-medium">{alerts.length}</span> alerts shown
                {totalCount > alerts.length && (
                  <span className="text-sm"> (of {totalCount} total)</span>
                )}
              </p>
              {alerts.length > 0 && (
                <p className="text-sm" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  Latest: {formatDate(alerts[0]?.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        alert={selectedAlert}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

AlertDashboard.propTypes = {
  isDarkMode: PropTypes.bool,
};

AlertDashboard.defaultProps = {
  isDarkMode: false,
};

export default AlertDashboard;
