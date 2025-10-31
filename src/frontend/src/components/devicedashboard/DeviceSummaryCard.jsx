import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCcw, Monitor, Activity, ChevronDown } from 'lucide-react';
import { useRefreshSettings } from '../../Contexts/RefreshContext';

const REFRESH_CHOICES = [1, 2, 5, 15, 30];

const summaryCardClass = (isDarkMode) =>
  `rounded-lg p-3 sm:p-4 border ${
    isDarkMode 
      ? 'bg-gray-800 text-white border-gray-700' 
      : 'bg-white text-gray-900 border-gray-200'
  }`;

export const DeviceSummaryCard = ({ isDarkMode, device, onRefresh }) => {
  const deviceName = device?.hostname || device?.name || 'Unknown Device';
  const deviceStatus = device?.status || 'Unknown';

  // Use global refresh context
  const { refreshInterval, setRefreshInterval } = useRefreshSettings();

  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalIdRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (refreshInterval) {
      intervalIdRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 60 * 1000);
    }
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [refreshInterval, onRefresh]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('[DeviceSummaryCard] Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  const handleRefreshIntervalChange = (min) => {
    setRefreshInterval(min);
    setDropdownOpen(false);
  };

  return (
    <div className={`${summaryCardClass(isDarkMode)} w-full`}>
      {/* ✅ RESPONSIVE LAYOUT: Stacks on mobile, horizontal on desktop */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        
        {/* ✅ RESPONSIVE Device Info Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          
          {/* Device Icon and Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-[#6366f1] flex-shrink-0">
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 
              className={`text-base sm:text-lg lg:text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              title={deviceName}
            >
              {deviceName}
            </h1>
          </div>

          {/* ✅ RESPONSIVE Status Badge */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Activity className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`hidden sm:inline ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Status:
            </span>
            <span 
              className={`font-semibold px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                deviceStatus === 'Active'
                  ? isDarkMode 
                    ? 'bg-green-900 text-green-300' 
                    : 'bg-green-100 text-green-700'
                  : isDarkMode 
                    ? 'bg-red-900 text-red-300' 
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {deviceStatus}
            </span>
          </div>
        </div>
        
        {/* ✅ RESPONSIVE Refresh Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            title="Device Refresh Options"
            aria-label="Device Refresh Options"
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md transition-colors font-medium whitespace-nowrap w-full sm:w-auto
              bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm`}
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* ✅ RESPONSIVE Dropdown Menu */}
          {dropdownOpen && (
            <div
              className={`absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-52 rounded-lg shadow-lg border z-30 transition-all duration-200
                ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
              role="menu"
              aria-label="Device refresh menu"
            >
              {/* Refresh Now Button */}
              <button
                onClick={() => { handleRefresh(); setDropdownOpen(false); }}
                disabled={isRefreshing}
                className={`flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                role="menuitem"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
              </button>

              <div className="border-t my-1" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />

              {/* Auto-Refresh Section Header */}
              <div
                className="px-4 py-2 text-xs sm:text-sm font-medium"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Auto-Refresh Rate
              </div>

              {/* Refresh Interval Options */}
              {REFRESH_CHOICES.map((val) => {
                const label = `Every ${val} minute${val === 1 ? '' : 's'}`;
                return (
                  <button
                    key={val}
                    onClick={() => handleRefreshIntervalChange(val)}
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition
                      ${refreshInterval === val ? 'font-semibold text-blue-500' : ''}`}
                    style={{
                      color: refreshInterval === val
                        ? (isDarkMode ? '#3B82F6' : '#2563EB')
                        : (isDarkMode ? '#D1D5DB' : '#374151')
                    }}
                    role="menuitem"
                  >
                    {label}
                  </button>
                );
              })}

              {/* Disable Auto-Refresh Option */}
              {refreshInterval && (
                <button
                  onClick={() => {
                    setRefreshInterval(null);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-400 hover:text-red-600 dark:hover:bg-red-400/10 transition"
                  role="menuitem"
                >
                  Disable Auto-Refresh
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
