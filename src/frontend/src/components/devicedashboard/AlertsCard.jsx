import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  useGetFilteredAlertsQuery, 
  useGetAlertFilterOptionsQuery, 
  useMarkAsReadMutation,
  alertFilterApi 
} from '../../redux/alertFilterApi';
import { selectNotifications } from '../../redux/notificationSlice';
import '../index.css';


const severityColor = {
  Critical: 'bg-red-100 text-red-600 w-20',
  Warning: 'bg-yellow-100 text-yellow-700 w-20',
  Info: 'bg-green-100 text-green-600 w-20',
};


export const AlertsCard = ({ isDarkMode = false, deviceId, alerts = [], defaultLimit = 100 }) => {
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedTime, setSelectedTime] = useState('All');
  const [activeFilter, setActiveFilter] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const [localReadAlerts, setLocalReadAlerts] = useState(new Set());
  
  const dispatch = useDispatch();
  const storeNotifications = useSelector(selectNotifications) || [];

  const [markAsReadMutation] = useMarkAsReadMutation();

  const { data: filterOptions } = useGetAlertFilterOptionsQuery(deviceId);

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

  const hasActiveFilters = selectedComponent !== 'All' || 
                          selectedSeverity !== 'All' || 
                          selectedTime !== 'All';

  const queryParams = {
    device_id: deviceId,
    ...(selectedComponent !== 'All' && { alert_type: selectedComponent }),
    ...(selectedSeverity !== 'All' && { severity: selectedSeverity }),
    ...(selectedTime !== 'All' && { time_range: mapTimeRangeToAPI(selectedTime) }),
    limit: 5000,
    offset: 0,
  };

  const { 
    data: apiResponse, 
    isLoading: isApiLoading, 
    isError, 
    error,
    isFetching 
  } = useGetFilteredAlertsQuery(queryParams, {
    skip: !hasActiveFilters,
    refetchOnMountOrArgChange: true,
    pollingInterval: hasActiveFilters ? 10000 : 0
  });

  const applyClientSideFilters = (alertsData) => {
    return alertsData.filter(alert => {
      const componentMatch = selectedComponent === 'All' || alert.alert_type === selectedComponent;
      const severityMatch = selectedSeverity === 'All' || alert.severity === selectedSeverity;

      const timeMatch = (() => {
        if (selectedTime === 'All') return true;
        try {
          const alertTime = new Date(alert.created_at);
          if (isNaN(alertTime.getTime())) return false;
          
          const now = new Date();
          switch (selectedTime) {
            case 'Previous Hour': {
              const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
              const previousHourStart = new Date(currentHourStart.getTime() - (60 * 60 * 1000));
              const previousHourEnd = new Date(currentHourStart.getTime() - 1);
              return alertTime >= previousHourStart && alertTime <= previousHourEnd;
            }
            case 'Yesterday': {
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
              const yesterdayStart = new Date(todayStart.getTime() - (24 * 60 * 60 * 1000));
              const yesterdayEnd = new Date(todayStart.getTime() - 1);
              return alertTime >= yesterdayStart && alertTime <= yesterdayEnd;
            }
            case 'Last Week': {
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const currentWeekStart = new Date(today);
              currentWeekStart.setDate(today.getDate() - today.getDay() + 1);
              const lastWeekStart = new Date(currentWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
              const lastWeekEnd = new Date(currentWeekStart.getTime() - 1);
              return alertTime >= lastWeekStart && alertTime <= lastWeekEnd;
            }
            case 'Last Month': {
              const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
              const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
              const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);
              return alertTime >= lastMonthStart && alertTime <= lastMonthEnd;
            }
            default:
              return true;
          }
        } catch (error) {
          console.error('Error filtering alert by time:', error, alert);
          return false;
        }
      })();

      return componentMatch && severityMatch && timeMatch;
    });
  };

  const displayAlerts = hasActiveFilters 
    ? (apiResponse?.results || []) 
    : applyClientSideFilters(alerts || []);
    
  const totalCount = hasActiveFilters 
    ? (apiResponse?.count || 0) 
    : displayAlerts.length;
    
  const isLoading = hasActiveFilters ? isApiLoading : false;

  const components = ['All', ...(filterOptions?.alert_types || Array.from(new Set(alerts.map(a => a.alert_type))))];
  const severities = ['All', ...(filterOptions?.severities || Array.from(new Set(alerts.map(a => a.severity))))];
  const timeRanges = ['All', 'Previous Hour', 'Yesterday', 'Last Week', 'Last Month'];

  // ✅ Helper to check if alert is read
  const isAlertRead = useCallback((alert) => {
    if (!alert) return false;
    
    if (localReadAlerts.has(alert.uuid)) return true;
    if (alert.is_read === true) return true;
    
    const storeNotification = storeNotifications.find(n => n.id === alert.uuid);
    if (storeNotification && storeNotification.is_read === true) return true;
    
    return false;
  }, [localReadAlerts, storeNotifications]);

  // ✅ Calculate unread count from displayed alerts
  const unreadCount = useMemo(() => {
    const visibleAlerts = hasActiveFilters 
      ? displayAlerts 
      : displayAlerts.slice(0, defaultLimit);
    
    return visibleAlerts.filter(alert => !isAlertRead(alert)).length;
  }, [displayAlerts, hasActiveFilters, defaultLimit, isAlertRead]);

  const handleRowClick = useCallback(async (alert) => {
    const storeNotification = storeNotifications.find(n => n.id === alert.uuid);
    const isEffectivelyRead = 
      alert.is_read === true || 
      localReadAlerts.has(alert.uuid) || 
      (storeNotification && storeNotification.is_read === true);
    
    if (!isEffectivelyRead) {
      setLocalReadAlerts(prev => new Set([...prev, alert.uuid]));

      let patchResult;
      if (hasActiveFilters) {
        patchResult = dispatch(
          alertFilterApi.util.updateQueryData('getFilteredAlerts', queryParams, (draft) => {
            const alertIndex = draft.results.findIndex(item => item.uuid === alert.uuid);
            if (alertIndex !== -1) {
              draft.results[alertIndex].is_read = true;
            }
          })
        );
      }

      try {
        await markAsReadMutation(alert.uuid).unwrap();
        console.log(`✅ Alert ${alert.uuid} marked as read`);
      } catch (error) {
        if (patchResult) patchResult.undo();
        setLocalReadAlerts(prev => {
          const newSet = new Set(prev);
          newSet.delete(alert.uuid);
          return newSet;
        });
        console.error('❌ Failed to mark alert as read:', error);
      }
    }
  }, [markAsReadMutation, dispatch, storeNotifications, queryParams, hasActiveFilters, localReadAlerts]);

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

  const handleFilterSelection = (filterType, value) => {
    try {
      switch(filterType) {
        case 'Component': 
          setSelectedComponent(value); 
          break;
        case 'Severity': 
          setSelectedSeverity(value); 
          break;
        case 'Time Range': 
          setSelectedTime(value); 
          break;
        default: 
          console.warn('Unknown filter type:', filterType);
      }
      setShowFilterDropdown(false);
      setActiveFilter(null);
    } catch (error) {
      console.error('Error handling filter selection:', error);
    }
  };

  const getFilterOptions = (filterType) => {
    switch(filterType) {
      case 'Component': return components;
      case 'Severity': return severities;
      case 'Time Range': return timeRanges;
      default: return [];
    }
  };

  const getCurrentFilterValue = (filterType) => {
    switch(filterType) {
      case 'Component': return selectedComponent;
      case 'Severity': return selectedSeverity;
      case 'Time Range': return selectedTime;
      default: return 'All';
    }
  };

  const clearAllFilters = () => {
    setSelectedComponent('All');
    setSelectedSeverity('All');
    setSelectedTime('All');
    setActiveFilter(null);
    setShowFilterDropdown(false);
  };

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

  const getRowBackground = (alert, index) => {
    const isUnread = !isAlertRead(alert);
    
    if (isUnread) {
      return isDarkMode 
        ? 'bg-blue-900/30 border-l-4 border-blue-400' 
        : 'bg-blue-50 border-l-4 border-blue-400';
    }
    
    return isDarkMode 
      ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900' 
      : index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
  };

  return (
    <div className="space-y-2 sm:space-y-6 px-2 sm:px-0 mt-4">
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {selectedComponent !== 'All' && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Component: {selectedComponent}
              <button 
                onClick={() => setSelectedComponent('All')} 
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
                onClick={() => setSelectedSeverity('All')} 
                className="ml-1 sm:ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
              >
                ×
              </button>
            </span>
          )}
          {selectedTime !== 'All' && (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Time: {selectedTime}
              <button 
                onClick={() => setSelectedTime('All')} 
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
        {/* Table Header with Filter Button */}
        <div className="p-3 sm:p-4 flex justify-between items-center font-medium tracking-wider text-xs py-3 px-4 text-gray-600">
          <span className="text-base sm:text-lg font-semibold flex items-center gap-2" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            {hasActiveFilters ? (
              <>
                Alerts ({isLoading ? '...' : totalCount})
                {isFetching && (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span>Alerts ({Math.min(displayAlerts.length, defaultLimit)})</span>
                {/* ✅ Styled "Unread" label with count - only shows when there are unread alerts */}
                {unreadCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-md">
                    <span className="text-[8px] sm:text-xs font-bold text-white uppercase tracking-wide">
                      Unread
                    </span>
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-white text-red-600 text-[10px] sm:text-xs font-extrabold shadow-sm">
                      {unreadCount}
                    </span>
                  </div>
                )}
              </div>
            )}
            {hasActiveFilters && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Filtered
              </span>
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

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div 
                className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-2xl border z-[100]"
                style={{ 
                  backgroundColor: isDarkMode ? '#191c3a' : '#FFFFFF', 
                  borderColor: isDarkMode ? '#374151' : '#E5E7EB' 
                }}
              >
                {['Component', 'Severity', 'Time Range'].map((filter) => (
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
                <p>Loading filtered alerts...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Alerts</h3>
                <p>{error?.data?.message || 'Failed to load alerts. Please try again.'}</p>
              </div>
            ) : alerts.length === 0 && !hasActiveFilters ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                  No Alerts Available
                </h3>
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  No alerts have been generated for this device yet.
                </p>
              </div>
            ) : displayAlerts.length === 0 ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  {hasActiveFilters ? 'No alerts match the current filters for this device.' : 'No alerts available.'}
                </p>
              </div>
            ) : (
              <table 
                className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[600px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
              >
                <thead>
                  <tr className="sticky top-[-17px] z-5 font-normal" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center w-32">TIME</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">COMPONENT</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">SEVERITY</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAlerts.slice(0, hasActiveFilters ? undefined : defaultLimit).map((alert, index) => (
                    <tr 
                      key={alert.uuid || `alert-${index}`}
                      onClick={() => handleRowClick(alert)}
                      className={`${getRowBackground(alert, index)} hover:bg-opacity-80 transition-all duration-300 ease-in-out cursor-pointer`}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs whitespace-nowrap">
                        {formatDateTime(alert.created_at)}
                        {!isAlertRead(alert) && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full inline-block ml-2" title="Unread alert"></div>
                        )}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center font-medium">
                        {alert.alert_type}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium inline-block ${severityColor[alert.severity] || 'bg-gray-100 text-gray-600'}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center" title={alert.message}>
                        <div className="max-w-md break-words">
                          {alert.message}
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
