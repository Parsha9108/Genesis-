import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useGetDevicesdataQuery } from '../../redux/apiSlice';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const MemoryHealth = ({ isDarkMode = true, memoryMap }) => {
  useDocumentTitle('Health');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState([]);
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetDevicesdataQuery();

  const MemoryHealthData = useMemo(() => {
    if (!data?.device) return [];

    const devices = Array.isArray(data.device) ? data.device : [data.device];

    return devices.map((device) => {
      const uuid = device?.uuid;
      const memoryEntry = memoryMap?.[uuid];

      const usage = memoryEntry?.memory_utilization
        ? parseFloat(memoryEntry.memory_utilization.replace('%', ''))
        : 0;

      return {
        id: uuid,
        device: device?.hostname || 'Unknown Device',
        memory: device?.device?.dev_phy_vm || 'Available memory',
        used: memoryEntry?.memory_used || '0B',
        total: memoryEntry?.total_memory || '0B',
        free: memoryEntry?.memory_available || '0B',
        usage,
        trend: 'stable',
        trendValue: 0,
      };
    });
  }, [data, memoryMap]);

  useEffect(() => {
    MemoryHealthData.forEach((device, index) => {
      console.log(`Device ${index + 1}:`, {
        id: device.id,
        hostname: device.device,
        usage: device.usage,
        used: device.used,
        total: device.total
      });
    });
  }, [MemoryHealthData]);

  const convertToBytes = (value) => {
    if (!value || typeof value !== 'string') return 0;
    if (value.includes('TB')) return parseFloat(value) * 1024 ** 4;
    if (value.includes('GB')) return parseFloat(value) * 1024 ** 3;
    if (value.includes('MB')) return parseFloat(value) * 1024 ** 2;
    if (value.includes('KB')) return parseFloat(value) * 1024;
    if (value.includes('B')) return parseFloat(value);
    return parseFloat(value);
  };

  const convertBytesToReadable = (bytes) => {
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + 'GB';
    if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(2) + 'MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + 'KB';
    return bytes.toFixed(2) + 'B';
  };

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      const existingIndex = prev.findIndex((s) => s.key === key);
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        return existing.direction === 'asc'
          ? prev.map(s => s.key === key ? { ...s, direction: 'desc' } : s)
          : prev.filter(s => s.key !== key);
      } else {
        return [...prev, { key, direction: 'asc' }];
      }
    });
  };

  const getSortIcon = (key) => {
    const sortEntry = sortConfig.find((s) => s.key === key);
    if (!sortEntry) return null;
    return sortEntry.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const getTrendIcon = (trend, trendValue) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" title={`Increasing by ${trendValue}%`} />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-500" title={`Decreasing by ${Math.abs(trendValue)}%`} />;
    return <Minus className="w-4 h-4 text-gray-400" title="Stable" />;
  };

  const getUsageColor = (usage) => {
    if (usage <= 50) return 'bg-green-500';
    if (usage <= 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getUsageBarColor = (usage) => {
    if (usage <= 50) return 'bg-green-400';
    if (usage <= 80) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const filteredAndSortedData = useMemo(() => {
    let items = MemoryHealthData.map(item => {
      const total = convertToBytes(item.total);
      const used = convertToBytes(item.used);
      const free = convertToBytes(item.free)
      return { ...item, freeBytes: free, free: convertBytesToReadable(free) };
    });

    items = items.filter(item =>
      item.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.memory.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.length === 0) return items;

    return items.sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        let aVal = a[key], bVal = b[key];

        if (["used", "total", "free"].includes(key)) {
          aVal = convertToBytes(a[key]);
          bVal = convertToBytes(b[key]);
        }

        if (key === 'trend') {
          const trendOrder = { 'up': 2, 'stable': 1, 'down': 0 };
          aVal = trendOrder[aVal];
          bVal = trendOrder[bVal];
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [MemoryHealthData, searchTerm, sortConfig]);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
        }}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 flex justify-between items-center flex-wrap gap-2 font-medium tracking-wider text-sm text-gray-600">
          <span
            className="text-base sm:text-lg font-semibold"
            style={{ color: isDarkMode ? '#FFF' : '#525759' }}
          >
            Memory Health ({filteredAndSortedData.length})
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search devices or memory types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-1.5 rounded-md border text-sm shadow-sm w-full focus:outline-none focus:ring-2 ${isDarkMode
                  ? 'bg-[#1F2937] text-white border-[#374151] placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-400 focus:ring-blue-300'
                  }`}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.82 4.82a1 1 0 01-1.42 1.42l-4.82-4.82A6 6 0 012 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table with horizontal scroll */}
        <div className="max-h-[25rem] overflow-y-auto overflow-x-auto px-2 sm:px-4 py-4 custom-scroll">
          <div className="min-w-[900px]"> {/* 👈 ensures horizontal scroll if table wider */}
            {isLoading ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                Loading Memory data...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading memory health data: {error.message || 'Unknown error'}
              </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                No Memory health data available.
              </div>
            ) : (
              <table className={`w-full text-sm text-left border-collapse font-medium tracking-wider whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <thead>
                  <tr className="sticky top-[-17px] z-10 font-normal" style={{ backgroundColor: isDarkMode ? '#111827' : '#f2f5f7' }}>
                    {['device', 'memory', 'used', 'free', 'total', 'usage'].map((key) => {
                      const displayName = {
                        device: 'Device',
                        memory: 'Memory Type',
                        used: 'Used',
                        total: 'Total',
                        free: 'Free',
                        usage: 'Usage'
                      }[key];

                      const isSortable = ['used', 'free', 'total', 'usage'].includes(key);
                      const sortIcon = getSortIcon(key);

                      return (
                        <th
                          key={key}
                          className={`py-2 sm:py-3 px-2 sm:px-4 ${isSortable ? 'cursor-pointer' : ''}`}
                          onClick={isSortable ? () => toggleSort(key) : undefined}
                        >
                          <div className="flex items-center">
                            {displayName}
                            {isSortable && sortIcon}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/memory/${item.id}`)}
                      className={`cursor-pointer transition-all duration-200 ${isDarkMode
                        ? index % 2 === 0
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                        : index % 2 === 0
                          ? 'bg-gray-50 hover:bg-blue-50'
                          : 'bg-white hover:bg-blue-50'
                        } hover:shadow-sm`}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 flex items-center">
                        <div className="w-1 h-6 bg-cyan-400 rounded-full mr-2"></div>
                        {item.device}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{item.memory}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{item.used}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{item.free}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">{item.total}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend, item.trendValue)}
                          <div className="relative w-[100px] h-[8px] rounded-full bg-gray-300 dark:bg-[#374151] overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full ${getUsageBarColor(item.usage)} rounded-full`}
                              style={{ width: `${item.usage}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded ${getUsageColor(item.usage)} min-w-[36px] text-center`}>
                            {item.usage}%
                          </span>
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

export default MemoryHealth;
