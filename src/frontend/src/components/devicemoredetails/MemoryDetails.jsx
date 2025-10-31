import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { Monitor, MemoryStick, Calendar, CalendarDays, ChevronDown, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

import {
  cardClass,
  flexibleCardClass,
  summaryCardClass,
  headerCardClass,
  getChartContainerClass,
  graphButtonClass,
  graphTypes,
  getOptimalPollingInterval,
  getCurrentHourLabel,
  getCurrentDayLabel,
  getCurrentWeekLabel,
  getCurrentMonthLabel,
  getCurrentMinuteLabel,
  transformStatsData,
  renderChart,
  getUsageColor,
  getPerformanceLevel,
} from './DetailsHelpers';

// ✅ Import custom range helpers
import {
  getPresetOptions,
  isPresetActive,
  applyPresetRange,
  getDateRangeDuration,
  validateDateRange,
  buildCustomRangeApiParams,
  formatDateForDisplay,
  shouldShowDateTimeInputs,
  isThirtyDaysRange
} from './CustomRangeHelpers';

import {
  useGetMemoryMinutelyStatsQuery,
  useGetMemoryHourlyStatsQuery,
  useGetMemoryDailyStatsQuery,
  useGetMemoryWeeklyStatsQuery,
  useGetMemoryMonthlyStatsQuery,
  useGetMemoryCustomRangeStatsMutation,
} from '../../redux/apiSlice';

import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';

const MemoryDetails = ({ isDarkMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: deviceData } = useGetDeviceDetailsByIdQuery(id);
  const device = deviceData?.device || {};
  const ip_address = device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address || 'Unknown IP';
  const os = device?.os || 'Unknown OS';
  const os_version = device?.os_version || '';

  const rawSize = device?.device?.memory?.[0]?.size || 'unknown';
  const memorySize = typeof rawSize === 'string'
    ? rawSize.replace(/\.00(?=GB)/, '')
    : rawSize;
  const memorySpeed = device?.device?.memory?.[0]?.speed || 'unknown';
  // Performance indicator helper function
  const getPerformanceIndicator = (value) => {
    const performance = getPerformanceLevel(value, 'memory');
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${performance.bgColor} ${performance.textColor}`}>
        {performance.level}
      </span>
    );
  };

  // Core state management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedGraphType, setSelectedGraphType] = useState('bar');
  
  // Custom range states
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [customRangeApplied, setCustomRangeApplied] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  
  // SEPARATE GRANULARITY STATES
  const [appliedGranularity, setAppliedGranularity] = useState('daily');
  const [tempGranularity, setTempGranularity] = useState('daily');

  // Production-ready validation and error states
  const [dateError, setDateError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activePreset, setActivePreset] = useState(null);
  const debounceTimeoutRef = useRef();
  const dropdownRef = useRef();

  // RTK Query hooks
  const {
    data: minutelyApiData,
    isLoading: isMinutelyLoading,
    error: minutelyError,
    refetch: refetchMinutely,
  } = useGetMemoryMinutelyStatsQuery(id, { skip: customRangeApplied || !id });

  const {
    data: hourlyApiData,
    isLoading: isHourlyLoading,
    error: hourlyError,
    refetch: refetchHourly,
  } = useGetMemoryHourlyStatsQuery(id, { skip: customRangeApplied || !id });
  
  const {
    data: dailyApiData,
    isLoading: isDailyLoading,
    error: dailyError,
    refetch: refetchDaily,
  } = useGetMemoryDailyStatsQuery(id, { skip: customRangeApplied || !id });
  
  const {
    data: weeklyApiData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useGetMemoryWeeklyStatsQuery(id, { skip: customRangeApplied || !id });
  
  const {
    data: monthlyApiData,
    isLoading: isMonthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useGetMemoryMonthlyStatsQuery(id, { skip: customRangeApplied || !id });
  
  const [getCustomStats, {
    data: customData,
    isLoading: isCustomLoading,
    error: customError,
    reset: resetCustomStats,
  }] = useGetMemoryCustomRangeStatsMutation();

  // Auto-refresh for real-time minutes data
  useEffect(() => {
    if (!customRangeApplied && id) {
      const interval = setInterval(() => {
        refetchMinutely();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [customRangeApplied, refetchMinutely, id]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCustomDropdown(false);
      }
    };

    if (showCustomDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomDropdown]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Use shared helpers for axis labels
  const minutelyLabel = getCurrentMinuteLabel();
  const hourlyLabel = getCurrentHourLabel();
  const dailyLabel = getCurrentDayLabel();
  const weeklyLabel = getCurrentWeekLabel();
  const monthlyLabel = getCurrentMonthLabel();

  // ✅ Use helper function
  const isThirtyDays = useMemo(() => 
    isThirtyDaysRange(customRangeApplied, customStartDate, customEndDate),
    [customRangeApplied, customStartDate, customEndDate]
  );

  // Data transforms for charts
  const minutelyData = useMemo(() => {
    try {
      return transformStatsData(minutelyApiData?.data, 'minutely', minutelyLabel, false);
    } catch (error) {
      console.error('Error transforming minutely data:', error);
      return [];
    }
  }, [minutelyApiData, minutelyLabel]);

  const hourlyData = useMemo(() => {
    try {
      return transformStatsData(hourlyApiData?.data, 'hourly', hourlyLabel, false);
    } catch (error) {
      console.error('Error transforming hourly data:', error);
      return [];
    }
  }, [hourlyApiData, hourlyLabel]);
  
  const dailyData = useMemo(() => {
    try {
      return transformStatsData(dailyApiData?.data, 'daily', dailyLabel, false);
    } catch (error) {
      console.error('Error transforming daily data:', error);
      return [];
    }
  }, [dailyApiData, dailyLabel]);
  
  const weeklyData = useMemo(() => {
    try {
      return transformStatsData(weeklyApiData?.data, 'weekly', weeklyLabel, false);
    } catch (error) {
      console.error('Error transforming weekly data:', error);
      return [];
    }
  }, [weeklyApiData, weeklyLabel]);
  
  const monthlyData = useMemo(() => {
    try {
      return transformStatsData(monthlyApiData?.data, 'monthly', monthlyLabel, false);
    } catch (error) {
      console.error('Error transforming monthly data:', error);
      return [];
    }
  }, [monthlyApiData, monthlyLabel]);

  // Transform custom data
  const customChartData = useMemo(() => {
    console.log('Processing custom Memory chart data:', { 
      customRangeApplied, 
      customData, 
      customError,
      isCustomLoading,
      appliedGranularity 
    });
    
    if (!customRangeApplied || !customData || customError) {
      return [];
    }

    try {
      let actualData = null;
      let detectedGranularity = appliedGranularity;
      
      if (customData?.data?.[appliedGranularity]) {
        actualData = customData.data[appliedGranularity];
        detectedGranularity = appliedGranularity;
      } else if (customData?.[appliedGranularity]) {
        actualData = customData[appliedGranularity];
        detectedGranularity = appliedGranularity;
      } else if (customData?.data?.minutely && appliedGranularity === 'minutely') {
        actualData = customData.data.minutely;
        detectedGranularity = 'minutely';
      } else if (customData?.data?.hourly) {
        actualData = customData.data.hourly;
        detectedGranularity = 'hourly';
      } else if (customData?.data?.daily) {
        actualData = customData.data.daily;
        detectedGranularity = 'daily';
      } else if (customData?.data?.weekly) {
        actualData = customData.data.weekly;
        detectedGranularity = 'weekly';
      } else if (customData?.data?.monthly) {
        actualData = customData.data.monthly;
        detectedGranularity = 'monthly';
      } else if (customData?.data?.custom) {
        actualData = customData.data.custom;
        detectedGranularity = appliedGranularity || 'custom';
      } else if (customData?.data) {
        actualData = customData.data;
        
        if (typeof actualData === 'object' && !Array.isArray(actualData)) {
          const keys = Object.keys(actualData);
          
          if (keys.some(key => key.includes(':') && key.length < 10)) {
            detectedGranularity = 'minutely';
          } else if (keys.some(key => key.includes('AM') || key.includes('PM'))) {
            detectedGranularity = 'hourly';
          } else if (keys.some(key => key.includes('Week'))) {
            detectedGranularity = 'weekly';
          } else if (keys.some(key => key.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/))) {
            detectedGranularity = 'monthly';
          } else {
            detectedGranularity = appliedGranularity || 'daily';
          }
        }
      } else if (customData?.minutely) {
        actualData = customData.minutely;
        detectedGranularity = 'minutely';
      } else if (customData?.hourly) {
        actualData = customData.hourly;
        detectedGranularity = 'hourly';
      } else if (customData?.daily) {
        actualData = customData.daily;
        detectedGranularity = 'daily';
      } else if (customData?.weekly) {
        actualData = customData.weekly;
        detectedGranularity = 'weekly';
      } else if (customData?.monthly) {
        actualData = customData.monthly;
        detectedGranularity = 'monthly';
      } else if (customData?.custom) {
        actualData = customData.custom;
        detectedGranularity = appliedGranularity || 'custom';
      } else if (Array.isArray(customData)) {
        actualData = { [appliedGranularity]: customData };
        detectedGranularity = appliedGranularity;
      } else {
        actualData = customData;
        detectedGranularity = appliedGranularity;
      }
      
      console.log('Extracted actual Memory data:', {
        actualData, 
        detectedGranularity,
        appliedGranularity,
        dataKeys: actualData && typeof actualData === 'object' ? Object.keys(actualData) : 'not an object'
      });
      
      if (actualData && typeof actualData === 'object') {
        const wrappedData = Array.isArray(actualData) 
          ? { [detectedGranularity]: actualData }
          : { [detectedGranularity]: actualData };
        
        const transformedData = transformStatsData(
          wrappedData, 
          detectedGranularity, 
          'Custom Range', 
          true
        );
        
        console.log('Transformed custom data:', {
          granularity: detectedGranularity,
          dataPoints: transformedData.length,
          sampleData: transformedData.slice(0, 3)
        });
        
        return transformedData;
      }
    } catch (error) {
      console.error('Error transforming custom Memory data:', error, { customData });
    }
    
    return [];
  }, [customRangeApplied, customData, customError, isCustomLoading, appliedGranularity]);

  // ✅ Use helper function for validation
  const validateRange = useCallback(() => {
    return validateDateRange(
      customStartDate,
      customEndDate,
      customStartTime,
      customEndTime,
      tempGranularity,
      setDateError
    );
  }, [customStartDate, customEndDate, customStartTime, customEndTime, tempGranularity]);

  // Debounced validation
  const debouncedValidation = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (customStartDate && customEndDate) {
        validateRange();
      }
    }, 500);
  }, [customStartDate, customEndDate, validateRange]);

  // Granularity change handler
  const handleGranularityChange = (granularity) => {
    setTempGranularity(granularity);
    setDateError('');
  };

  const handleDeviceClick = () => {
    if (id) { 
      navigate(`/devices/${id}`);
    }
  };

  // ✅ Use helper function for preset range
  const setPresetRange = useCallback((preset) => {
    applyPresetRange(
      preset,
      setCustomStartDate,
      setCustomStartTime,
      setCustomEndDate,
      setCustomEndTime,
      setDateError,
      setActivePreset
    );
  }, []);

  // Clear active preset when dates are manually changed
  const handleDateChange = useCallback((field, value) => {
    if (field === 'start') {
      setCustomStartDate(value);
    } else {
      setCustomEndDate(value);
    }
    setDateError('');
    setActivePreset(null);
    debouncedValidation();
  }, [debouncedValidation]);

  // ✅ Use helper function for duration
  const getDuration = useCallback(() => {
    return getDateRangeDuration(customStartDate, customEndDate, customStartTime, customEndTime, tempGranularity);
  }, [customStartDate, customEndDate, customStartTime, customEndTime, tempGranularity]);

  // ✅ Enhanced apply function with helper
  const applyCustomRange = async () => {
    if (!validateRange() || !id) return;
    
    setIsApplying(true);
    setDateError('');
    
    try {
      // ✅ Use helper to build API params
      const apiParams = buildCustomRangeApiParams(
        id,
        tempGranularity,
        customStartDate,
        customEndDate,
        customStartTime,
        customEndTime
      );

      console.log('Applying custom Memory range:', apiParams);

      resetCustomStats();
      
      const result = await getCustomStats(apiParams).unwrap();
      
      console.log('Custom Memory stats API result:', result);
      
      setAppliedGranularity(tempGranularity);
      setCustomRangeApplied(true);
      setShowCustomDropdown(false);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error applying custom Memory range:', error);
      
      if (error?.status === 404) {
        setDateError(`No Memory data available for the selected ${tempGranularity} range`);
      } else if (error?.status === 400) {
        setDateError('Invalid date range or granularity. Please check your selection.');
      } else if (error?.data?.message) {
        setDateError(error.data.message);
      } else {
        setDateError('Failed to apply custom range. Please try again.');
      }
      
      setCustomRangeApplied(false);
    } finally {
      setIsApplying(false);
    }
  };

  // Enhanced loading and error states
  const isLoading = customRangeApplied
    ? isCustomLoading
    : isMinutelyLoading || isHourlyLoading || isDailyLoading || isWeeklyLoading || isMonthlyLoading;
    
  const hasError = customRangeApplied
    ? customError
    : minutelyError || hourlyError || dailyError || weeklyError || monthlyError;

  // Enhanced retry functionality
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    if (customRangeApplied) {
      applyCustomRange();
    } else {
      Promise.all([
        refetchMinutely(),
        refetchHourly(),
        refetchDaily(),
        refetchWeekly(),
        refetchMonthly()
      ]).catch(console.error);
    }
  };

  // Handler for returning to live data
  const returnToLiveData = () => {
    setCustomRangeApplied(false);
    setShowCustomDropdown(false);
    resetCustomStats();
    setDateError('');
    setRetryCount(0);
    setActivePreset(null);
    setAppliedGranularity('daily');
    setTempGranularity('daily');
    setCustomStartTime('');
    setCustomEndTime('');
  };

  // Toggle dropdown handler
  const toggleCustomDropdown = () => {
    setShowCustomDropdown(prev => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header Card */}
      <div className={headerCardClass(isDarkMode)}>
        <div className="flex items-center space-x-4">
          <div className="flex items-start cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg p-2 -m-2"
               onClick={handleDeviceClick}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-[#6366f1]">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ip_address}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{os} {os_version}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center space-x-2">
          {/* Enhanced Custom Date Button with Granularity Support */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleCustomDropdown}
              className={`${graphButtonClass(showCustomDropdown, isDarkMode)} flex items-center`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Custom Range
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showCustomDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Custom Date Dropdown */}
            {showCustomDropdown && (
              <div className={`absolute top-full left-0 mt-2 p-4 rounded-lg shadow-xl border z-20 min-w-[400px] ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 shadow-gray-900/50' 
                  : 'bg-white border-gray-200 shadow-black/10'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center mb-3">
                    <CalendarDays className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Select Date Range & Granularity
                    </span>
                  </div>
                  
                  {/* Granularity Selection */}
                  <div className="mb-4">
                    <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Data Granularity
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'minutely', label: 'Minutes', icon: Clock },
                        { value: 'hourly', label: 'Hours', icon: Calendar },
                        { value: 'daily', label: 'Days', icon: CalendarDays },
                        { value: 'weekly', label: 'Weeks', icon: Calendar }
                      ].map(option => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleGranularityChange(option.value)}
                            className={`px-2 py-1.5 text-xs rounded transition-all font-medium flex items-center justify-center ${
                              tempGranularity === option.value
                                ? isDarkMode
                                  ? 'bg-[#6366f1] text-white shadow-md'
                                  : 'bg-[#6366f1] text-white shadow-md'
                                : isDarkMode 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Quick preset buttons - ✅ Using helper */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {getPresetOptions(tempGranularity).map((preset, index) => {
                      const isActivePresetCheck = isPresetActive(
                        preset, 
                        customStartDate, 
                        customEndDate, 
                        customStartTime, 
                        customEndTime, 
                        tempGranularity
                      );
                      
                      return (
                        <button
                          key={`${tempGranularity}-${index}`}
                          onClick={() => setPresetRange(preset)}
                          className={`px-2 py-1.5 text-xs rounded transition-all hover:scale-105 font-medium border ${
                            isActivePresetCheck
                              ? isDarkMode
                                ? 'bg-[#6366f1] text-white shadow-lg border-blue-400 ring-2 ring-blue-300'
                                : 'bg-[#6366f1] text-white shadow-lg border-blue-500 ring-2 ring-blue-200'
                              : isDarkMode 
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 hover:border-gray-500'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Enhanced date inputs - ✅ Using helper */}
                  {shouldShowDateTimeInputs(tempGranularity, customStartTime, customEndTime) ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={`${customStartDate}T${customStartTime || '00:00'}`}
                          onChange={e => {
                            const [date, time] = e.target.value.split('T');
                            setCustomStartDate(date);
                            setCustomStartTime(time);
                            setDateError('');
                            setActivePreset(null);
                            debouncedValidation();
                          }}
                          max={`${customEndDate}T${customEndTime || '23:59'}`}
                          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            dateError && (dateError.includes('start') || dateError.includes('Start')) 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={`${customEndDate}T${customEndTime || '23:59'}`}
                          onChange={e => {
                            const [date, time] = e.target.value.split('T');
                            setCustomEndDate(date);
                            setCustomEndTime(time);
                            setDateError('');
                            setActivePreset(null);
                            debouncedValidation();
                          }}
                          min={`${customStartDate}T${customStartTime || '00:00'}`}
                          max={new Date().toISOString().slice(0, 16)}
                          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            dateError && (dateError.includes('end') || dateError.includes('End')) 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={e => handleDateChange('start', e.target.value)}
                          max={customEndDate}
                          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            dateError && (dateError.includes('start') || dateError.includes('Start'))
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={e => handleDateChange('end', e.target.value)}
                          min={customStartDate}
                          max={new Date().toISOString().split('T')[0]}
                          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            dateError && (dateError.includes('end') || dateError.includes('End')) 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced error display */}
                  {dateError && (
                    <div className="flex items-start space-x-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{dateError}</span>
                    </div>
                  )}
                  
                  {/* Date range info - ✅ Using helper */}
                  {!dateError && customStartDate && customEndDate && (
                    <div className={`text-xs p-2 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                      <span className="font-medium">Selected range:</span> {getDuration()} • {tempGranularity}
                      {tempGranularity === 'minutely' && (
                        <div className="mt-1 text-blue-600 dark:text-blue-400 font-medium">
                          Max 60 minutes allowed • Same day only
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Enhanced action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={applyCustomRange}
                      disabled={isApplying || !!dateError || !customStartDate || !customEndDate}
                      className={`flex-1 px-3 py-2 text-sm rounded transition-all flex items-center justify-center font-medium ${
                        isApplying || dateError || !customStartDate || !customEndDate
                          ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                          : isDarkMode
                          ? 'bg-[#6366f1] hover:bg-blue-700 text-white hover:shadow-lg'
                          : 'bg-[#6366f1] hover:bg-blue-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Applying...
                        </>
                      ) : (
                        'Apply Range'
                      )}
                    </button>
                    
                    {customRangeApplied && (
                      <button
                        onClick={returnToLiveData}
                        className={`px-3 py-2 text-sm rounded transition-all border font-medium ${
                          isDarkMode
                            ? 'border-gray-600 hover:bg-gray-700 text-gray-300 hover:border-gray-500'
                            : 'border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Live Data
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Graph Type Buttons */}
          {graphTypes.map(({ id: graphId, label, icon: Icon }) => (
            <button
              key={graphId}
              onClick={() => setSelectedGraphType(graphId)}
              className={graphButtonClass(selectedGraphType === graphId, isDarkMode)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Performance Info Card */}
      <div className={headerCardClass(isDarkMode)}>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-[#6366f1] rounded flex items-center justify-center">
            <MemoryStick className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Memory Performance Analytics</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {memorySize} {memorySpeed}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-600 whitespace-nowrap text-right">
          <div className="font-medium">{currentTime.toLocaleString()}</div>
          {customRangeApplied && (
            <div className="text-xs text-green-500 mt-1 font-medium">
              {formatDateForDisplay(customStartDate)} - {formatDateForDisplay(customEndDate)}
              {appliedGranularity === 'minutely' && customStartTime && customEndTime && (
                <div className="text-xs text-blue-500 mt-0.5">
                  {customStartTime} - {customEndTime}
                </div>
              )}
              {appliedGranularity === 'hourly' && customStartTime && customEndTime && (
                <div className="text-xs text-blue-500 mt-0.5">
                  {customStartTime} - {customEndTime}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading, Error, and Content States */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loading {customRangeApplied ? `custom range (${appliedGranularity})` : 'live'} Memory statistics...
            </div>
            <div className="text-sm text-gray-500">
              {customRangeApplied && `${formatDateForDisplay(customStartDate)} - ${formatDateForDisplay(customEndDate)}`}
            </div>
          </div>
        </div>
      ) : hasError ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <div className="text-red-600 dark:text-red-400 mb-2 font-semibold text-lg">
              Error Loading Memory Statistics
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
              {customError?.data?.message || 
               hasError?.data?.message || 
               'Unable to fetch Memory data. This might be due to a network issue or server error.'}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleRetry}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry {retryCount > 0 && `(${retryCount})`}
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chart Display Logic */}
          {customRangeApplied ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                <div className={cardClass(isDarkMode)}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold flex items-center">
                      <span>Custom Range Memory Usage ({appliedGranularity})</span>
                    </h4>
              
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {formatDateForDisplay(customStartDate)} - {formatDateForDisplay(customEndDate)}
                      </span>
                    </div>
                  </div>
              
                  <div className={getChartContainerClass(customChartData.length, customChartData.length > 20)}>
                    <ResponsiveContainer 
                      width={customChartData.length > 20 ? Math.max(800, customChartData.length * 40 + 60) : "100%"} 
                      height="100%"
                    >
                      {renderChart({
                        data: customChartData,
                        color: appliedGranularity === 'minutely' ? '#10B981' : 
                               appliedGranularity === 'hourly' ? '#8B5CF6' : 
                               appliedGranularity === 'weekly' ? '#F97316' : '#06B6D4',
                        title: 'Time Period',
                        selectedGraphType,
                        isDarkMode,
                        hasError: !customChartData || customChartData.length === 0,
                        isCustomRange: true,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        yAxisOnly: false,
                        scrollable: customChartData.length > 20,
                        useConditionalColors: true,
                        tooltipLabel: 'Memory Usage',
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                  
                  {customChartData.length === 0 && !isCustomLoading && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                        <div className="text-sm font-medium mb-1">No Memory data available</div>
                        <div className="text-xs">for the selected {appliedGranularity} range ({getDuration()})</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              {customChartData.length > 0 && (
                <div className="w-100 mx-auto">
                  <div className={summaryCardClass(isDarkMode)}>
                    <h4 className={`text-sm font-medium mb-3 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> 
                      <span>Summary Statistics</span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full font-medium">
                          {getDuration()}
                        </span>
                      </div>
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Points</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {(customChartData.length)-1}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {customChartData.length > 0 
                            ? (customChartData.reduce((sum, item) => sum + (item.utilization || item.value || 0), 0) / customChartData.length).toFixed(1)
                            : '0'
                          }%
                        </div>
                        <div className="mt-1">
                          {customChartData.length > 0 && getPerformanceIndicator(
                            customChartData.reduce((sum, item) => sum + (item.utilization || item.value || 0), 0) / customChartData.length
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Peak</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {customChartData.length > 0 
                            ? Math.max(...customChartData.map(item => item.utilization || item.value || 0)).toFixed(1)
                            : '0'
                          }%
                        </div>
                        <div className="mt-1">
                          {customChartData.length > 0 && getPerformanceIndicator(
                            Math.max(...customChartData.map(item => item.utilization || item.value || 0))
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs uppercase tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {getDuration().split(' ')[0]}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {getDuration().split(' ')[1]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Real-time Minutes Chart */}
              <div className="grid grid-cols-1 gap-6">
                <div className={cardClass(isDarkMode)}>
                  <h4 className="text-md font-semibold mb-2 flex items-center justify-between">
                    <span>Real-time Memory Usage</span>
                    <span className="text-xs text-gray-500 font-normal">Last 30 Minutes</span>
                  </h4>
                  <div className={getChartContainerClass(minutelyData.length, false)}>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        data: minutelyData,
                        color: '#10B981',
                        title: 'Minute',
                        selectedGraphType,
                        isDarkMode,
                        hasError: minutelyError,
                        isCustomRange: false,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        tooltipLabel: 'Memory Usage',
                        scrollable: false,
                        useConditionalColors: true,
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Live Data Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hourly Chart */}
                <div className={cardClass(isDarkMode)}>
                  <h4 className="text-md font-semibold mb-2 flex items-center justify-between">
                    <span>Hourly Memory Usage</span>
                    <span className="text-xs text-gray-500 font-normal">Last 7 Hours</span>
                  </h4>
                  <div className={getChartContainerClass(hourlyData.length, false)}>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        data: hourlyData,
                        color: '#8B5CF6',
                        title: 'Hour',
                        selectedGraphType,
                        isDarkMode,
                        hasError: hourlyError,
                        isCustomRange: false,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        scrollable: false,
                        tooltipLabel: 'Memory Usage',
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Daily Chart */}
                <div className={cardClass(isDarkMode)}>
                  <h4 className="text-md font-semibold mb-2 flex items-center justify-between">
                    <span>Daily Memory Usage</span>
                    <span className="text-xs text-gray-500 font-normal">Last 7 Days</span>
                  </h4>
                  <div className={getChartContainerClass(dailyData.length, false)}>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        data: dailyData,
                        color: '#06B6D4',
                        title: 'Day',
                        selectedGraphType,
                        isDarkMode,
                        hasError: dailyError,
                        isCustomRange: false,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        scrollable: false,
                        tooltipLabel: 'Memory Usage',
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Weekly & Monthly */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={cardClass(isDarkMode)}>
                  <h4 className="text-md font-semibold mb-2 flex items-center justify-between">
                    <span>Weekly Memory Usage</span>
                    <span className="text-xs text-gray-500 font-normal">Last 7 Weeks</span>
                  </h4>
                  <div className={getChartContainerClass(weeklyData.length, false)}>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        data: weeklyData,
                        color: '#F97316',
                        title: 'Week',
                        selectedGraphType,
                        isDarkMode,
                        hasError: weeklyError,
                        isCustomRange: false,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        scrollable: false,
                        tooltipLabel: 'Memory Usage',
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className={cardClass(isDarkMode)}>
                  <h4 className="text-md font-semibold mb-2 flex items-center justify-between">
                    <span>Monthly Memory Usage</span>
                    <span className="text-xs text-gray-500 font-normal">Last 7 Months</span>
                  </h4>
                  <div className={getChartContainerClass(monthlyData.length, false)}>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart({
                        data: monthlyData,
                        color: '#EF4444',
                        title: 'Month',
                        selectedGraphType,
                        isDarkMode,
                        hasError: monthlyError,
                        isCustomRange: false,
                        showYAxis: true,
                        showXAxis: true,
                        showDataOnly: true,
                        scrollable: false,
                        tooltipLabel: 'Memory Usage',
                        dataType: 'memory'
                      })}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MemoryDetails;
