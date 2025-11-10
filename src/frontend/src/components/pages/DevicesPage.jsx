import Windows from "../../assets/Windows_logo.svg";
import Ubuntu from "../../assets/Ubuntu_logo.svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useGetDevicesdataQuery } from "../../redux/apiSlice";
import Loading from "../User/Loading";
import { getUptimeDuration, formatDateTime } from "../Utilities/getUptimeDuration";
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";

const DevicesList = ({ isDarkMode = true }) => {
  useDocumentTitle('Devices');
  const [sortStack, setSortStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status');

  const { data: devicesData, isLoading, error, refetch } = useGetDevicesdataQuery();

  // Manual refresh handler (added for consistency with AlertDashboard)
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Memoized toggle sort function
  const toggleSort = useCallback((field) => {
    setSortStack(prev => {
      const existing = prev.find(s => s.field === field);
      if (existing) {
        return existing.direction === 'asc'
          ? prev.map(s => s.field === field ? { ...s, direction: 'desc' } : s)
          : prev.filter(s => s.field !== field);
      } else {
        return [...prev, { field, direction: 'asc' }];
      }
    });
  }, []);

  const getSortIcon = useCallback((field) => {
    const entry = sortStack.find(s => s.field === field);
    if (!entry) return null;
    return entry.direction === 'asc'
      ? <ChevronUp className="inline w-3 h-3 ml-1" />
      : <ChevronDown className="inline w-3 h-3 ml-1" />;
  }, [sortStack]);

  // Utility functions
  const ipToNumber = useCallback((ip) => {
    if (!ip || typeof ip !== 'string') return 0;
    try {
      return ip.split('.').reduce((acc, octet) => {
        const num = parseInt(octet, 10);
        return isNaN(num) ? acc : acc * 256 + num;
      }, 0);
    } catch {
      return 0;
    }
  }, []);

  const parseUptime = useCallback((uptime) => {
    if (!uptime || typeof uptime !== 'string') return 0;
    try {
      const d = parseInt(uptime.match(/(\d+)\s*d/)?.[1] || 0, 10);
      const h = parseInt(uptime.match(/(\d+)\s*h/)?.[12] || 0, 10);
      const m = parseInt(uptime.match(/(\d+)\s*m/)?.[12] || 0, 10);
      return d * 24 * 60 + h * 60 + m;
    } catch {
      return 0;
    }
  }, []);

  const compareValues = useCallback((a, b, field, direction) => {
    let valA, valB;
    
    try {
      switch (field) {
        case 'ip':
          valA = ipToNumber(a.ip || '');
          valB = ipToNumber(b.ip || '');
          break;
        case 'uptime':
          valA = parseUptime(a.uptime || '');
          valB = parseUptime(b.uptime || '');
          break;
        case 'status':
          valA = a.isActive === 'Active' ? 1 : 0;
          valB = b.isActive === 'Active' ? 1 : 0;
          break;
        case 'type':
          valA = (a.device_type || '').toLowerCase() === 'physical' ? 1 : 0;
          valB = (b.device_type || '').toLowerCase() === 'physical' ? 1 : 0;
          break;
        case 'device_name':
          valA = (a.device_name || '').toLowerCase();
          valB = (b.device_name || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        case 'os':
          valA = (a.os || '').toLowerCase();
          valB = (b.os || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        default:
          return 0;
      }
      return direction === 'asc' ? valA - valB : valB - valA;
    } catch {
      return 0;
    }
  }, [ipToNumber, parseUptime]);

  const osLogos = { Windows, Ubuntu };
  
  const handleRowClick = useCallback((id) => {
    if (id) {
      navigate(`/devices/${id}`);
    }
  }, [navigate]);

  // Memoized data processing
  const processedRows = useMemo(() => {
    if (!devicesData?.device || !Array.isArray(devicesData.device)) {
      return [];
    }

    return devicesData.device.map((device, index) => {
      // Safe property access with fallbacks
      const deviceData = device?.device || {};
      const nicData = deviceData.nic?.[0] || {};
      const portData = nicData.port?.[0] || {};
      const ipData = portData.ip?.[0] || {};

      return {
        sl: index + 1,
        id: device?.uuid || `device-${index}`,
        os: device?.os || 'Unknown',
        device_name: device?.hostname || 'Unknown Device',
        device_type: deviceData.dev_phy_vm || 'Virtual',
        ip: ipData.address || '0.0.0.0',
        uptime: device?.status === 'Active'
          ? getUptimeDuration(device?.last_uptime_duration)
          : formatDateTime(device?.last_seen),
        isActive: device?.status || 'Inactive',
      };
    });
  }, [devicesData]);

  // Memoized filtering and sorting
  const displayRows = useMemo(() => {
    return processedRows
      .filter(row => {
        // Safe string operations with fallbacks
        const deviceName = (row.device_name || '').toLowerCase();
        const os = (row.os || '').toLowerCase();
        const searchQuery = (searchTerm || '').toLowerCase().trim();
        
        const matchesSearch = !searchQuery || 
          deviceName.includes(searchQuery) || 
          os.includes(searchQuery);

        const matchesStatus = statusFilter === 'active'
          ? row.isActive === 'Active'
          : statusFilter === 'inactive'
            ? row.isActive !== 'Active'
            : true;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        for (const { field, direction } of sortStack) {
          const result = compareValues(a, b, field, direction);
          if (result !== 0) return result;
        }
        return 0;
      });
  }, [processedRows, searchTerm, statusFilter, sortStack, compareValues]);

  // Enhanced Error handling
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to Load Devices</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || error?.data?.message || 'An unexpected error occurred while fetching device data.'}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
        }}
      >
        {/* Header with search */}
        <div className="p-3 sm:p-4 flex justify-between items-center flex-wrap gap-2 font-medium tracking-wider text-sm text-gray-600">
          <span className="text-base sm:text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            Devices List ({displayRows.length})
          </span>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search devices or OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-1.5 rounded-md border text-sm shadow-sm w-full focus:outline-none focus:ring-2 transition-colors
                ${isDarkMode
                  ? 'bg-[#1F2937] text-white border-[#374151] placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-400 focus:ring-blue-300'}
              `}
              aria-label="Search devices by name or operating system"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="max-h-[25rem] overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced Empty State */}
            {processedRows.length === 0 ? (
              <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <div className="relative">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
                  No Device Data Available
                </h3>
                <p className="text-sm mb-4 max-w-md mx-auto">
                  No devices have been registered yet. Connect your agents to start monitoring devices.
                </p>
              </div>
            ) : displayRows.length === 0 ? (
              <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <div className="relative">
                  <Search className="w-16 h-16 mx-auto mb-6 opacity-30" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
                  No Devices Match Your Search
                </h3>
                <p className="text-sm mb-4 max-w-md mx-auto">
                  No devices match your search criteria. Try adjusting your search terms or check different filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </button>
                </div>
              </div>
            ) : (
              <table
                className={`w-full text-sm text-left border-collapse font-medium tracking-wider min-w-[700px] ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
                role="table"
                aria-label="Devices list table"
              >
                <thead>
                  <tr
                    className="sticky top-[-17px] z-10 font-normal"
                    style={{ backgroundColor: isDarkMode ? '#111827' : '#f2f5f7' }}
                  >
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap w-16 text-center">SL NO</th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap w-40 text-center" onClick={() => toggleSort('os')}>
                      <div className="flex items-center justify-center">
                        OPERATING SYSTEM
                        {getSortIcon('os')}
                      </div>
                    </th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap text-center" onClick={() => toggleSort('device_name')}>
                      <div className="flex items-center justify-center">
                        DEVICE NAME
                        {getSortIcon('device_name')}
                      </div>
                    </th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap w-32 text-center" onClick={() => toggleSort('type')}>
                      <div className="flex items-center justify-center">
                        DEVICE TYPE
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap w-32 text-center" onClick={() => toggleSort('ip')}>
                      <div className="flex items-center justify-center">
                        IP/DOMAIN
                        {getSortIcon('ip')}
                      </div>
                    </th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap w-32 text-center" onClick={() => toggleSort('uptime')}>
                      <div className="flex items-center justify-center">
                        UP TIME
                        {getSortIcon('uptime')}
                      </div>
                    </th>
                    <th role="columnheader" scope="col" className="py-2 sm:py-3 px-2 sm:px-4 cursor-pointer whitespace-nowrap w-24 text-center" onClick={() => toggleSort('status')}>
                      <div className="flex items-center justify-center">
                        STATUS
                        {getSortIcon('status')}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map(({ sl, id, os, ip, uptime, isActive, device_name, device_type }, index) => (
                    <tr
                      key={id}
                      role="row"
                      className={`cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? index % 2 === 0
                            ? 'bg-gray-800 hover:bg-gray-700'
                            : 'bg-gray-900 hover:bg-gray-800'
                          : index % 2 === 0
                          ? 'bg-gray-50 hover:bg-blue-50'
                          : 'bg-white hover:bg-blue-50'
                      } hover:shadow-sm`}
                      onClick={() => handleRowClick(id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(id);
                        }
                      }}
                    >
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center">{sl}</td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {osLogos[os] && (
                            <img 
                              src={osLogos[os]} 
                              alt={`${os} logo`} 
                              className="w-5 h-5 flex-shrink-0" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="truncate">{os}</span>
                        </div>
                      </td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center truncate max-w-0" title={device_name}>
                        {device_name}
                      </td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center truncate" title={device_type}>
                        <span className="font-medium">
                          {device_type}
                        </span>
                      </td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center truncate" title={ip}>
                        {ip}
                      </td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center truncate" title={uptime}>
                        {uptime}
                      </td>
                      <td role="cell" className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                            isActive === 'Active' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {isActive}
                        </span>
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

export default DevicesList;
