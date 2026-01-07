import React, { useState, useEffect, useRef, useMemo } from 'react';
import Loading from '../../components/User/Loading';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Donut, PieChart as PieIcon, Monitor, MemoryStick, AlertCircle, Activity } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const MemoryUsageCard = ({ isDarkMode = false, memoryMap }) => {
  useDocumentTitle('UsageOverview');
  const isInitializedRef = useRef(false);
  const { id } = useParams();
  const [MemoryData, setMemoryData] = useState({});
  const [selectedGraph, setSelectedGraph] = useState('donut');
  const { data, isLoading } = useGetDeviceDetailsByIdQuery(id);
  const liveMemory = memoryMap?.[id];

  useEffect(() => {
    if (!isLoading && data?.device && !isInitializedRef.current) {
      const newMemoryData = {};
      const memories = Array.isArray(data.device.device.memory) ? data.device.device.memory : [];
      memories.forEach(mem => {
        const make = mem?.make;
        if (mem.uuid) {
          newMemoryData[mem.uuid] = {
            name: `${make} Memory`,
            total: 0,
            used: 0,
            free: 0,
            data: [],
          };
        }
      });
      setMemoryData(newMemoryData);
      isInitializedRef.current = true;
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!liveMemory || !liveMemory.uuid) {
      return;
    }

    const now = new Date();
    const label = `${now.getMinutes()}m:${now.getSeconds()}s`;

    setMemoryData(prevMap => {
      if (!prevMap[liveMemory.uuid]) {
        return prevMap;
      }

      const currentMem = prevMap[liveMemory.uuid];
      const used = parseFloat(liveMemory.memory_used) || currentMem.used || 0;
      const total = parseFloat(liveMemory.total_memory) || currentMem.total || 0;
      const free = parseFloat(liveMemory.memory_available) || currentMem.free || 0;
      const usageRaw = parseFloat(liveMemory.memory_utilization) || 0;

      // Calculate usage percentage
      const usage = total > 0 ? (used / total) * 100 : usageRaw;

      const updatedMem = { ...currentMem };
      const newData = [...updatedMem.data, { name: label, value: usage }];
      if (newData.length > 10) newData.shift();

      updatedMem.total = total;
      updatedMem.used = used;
      updatedMem.free = free;
      updatedMem.data = newData;

      return {
        ...prevMap,
        [liveMemory.uuid]: updatedMem
      };
    });
  }, [liveMemory]);

  if (isLoading) return <Loading />;

  const device = data?.device;
  const chartOptions = [
    { id: 'donut', label: 'Donut', icon: Donut },
    { id: 'pie', label: 'Pie', icon: PieIcon },
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderRadius: 4,
      border: '1px solid #ccc',
      fontSize: 12,
    },
    itemStyle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 12,
    },
  };

  if (!liveMemory) {
    return (
      <div className="min-h-[85vh]">
        <div 
          className="fixed top-16 left-0 lg:left-64 right-0 z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 rounded-lg mt-1.8"
          style={{
            backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(240, 244, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-[1440px] mx-auto">
            <div 
              className={`rounded-lg p-3 sm:p-4 border shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : 'bg-white/50 border-gray-200/50'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-[#6366f1] rounded-lg shadow flex-shrink-0">
                  <MemoryStick className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    Memory Usage Overview
                  </h1>
                  <p 
                    className="text-xs truncate"
                    style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  >
                    {device?.hostname || 'Unknown Device'} • Waiting for data...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-24 sm:pt-28 space-y-4 sm:space-y-5 px-3 sm:px-0">
          <div className={`rounded-lg shadow-md p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px] ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="mb-4 sm:mb-6">
              <AlertCircle className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-30 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>No Data Available</h3>
            <div className="text-blue-500 flex items-center justify-center space-x-2 text-xs sm:text-sm mt-2">
              <MemoryStick className="w-4 h-4" />
              <span>Waiting for memory monitoring data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh]">
      {/* Fixed Header - Responsive positioning */}
      <div 
        className="fixed top-16 left-0 lg:left-64 right-0 z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 rounded-lg mt-1.8"
        style={{
          backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(240, 244, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto">
          <div 
            className={`rounded-lg p-3 sm:p-4 border shadow-sm ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700/50' 
                : 'bg-white/50 border-gray-200/50'
            }`}
          >
            {/* Responsive header layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Device info section */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-[#6366f1] rounded-lg shadow flex-shrink-0">
                  <MemoryStick className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    Memory Usage Overview
                  </h1>
                  <p 
                    className="text-xs truncate"
                    style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  >
                    {device?.hostname || 'Unknown Device'} • {device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address || 'Unknown IP'}
                  </p>
                </div>
              </div>

              {/* Chart type buttons - Stack on mobile, inline on desktop */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {chartOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedGraph(id)}
                    className={`flex items-center justify-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none
                    ${selectedGraph === id ? 'bg-[#6366f1] text-white' : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="ml-1">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area - Responsive grid */}
      <div className="pt-10 sm:pt-24 space-y-4 sm:space-y-5 px-3 sm:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(MemoryData).map(([uuid, mem]) => (
            <MemoryCard
              key={uuid}
              uuid={uuid}
              mem={mem}
              selectedGraph={selectedGraph}
              isDarkMode={isDarkMode}
              tooltipStyle={tooltipStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Memoized Memory Card Component with responsive design
const MemoryCard = React.memo(({ uuid, mem, selectedGraph, isDarkMode, tooltipStyle }) => {
  const usagePercent = useMemo(() => 
    mem.total ? (mem.used / mem.total) * 100 : 0,
    [mem.used, mem.total]
  );

  const chartData = useMemo(() => [
    { name: 'Used', value: mem.used, color: '#3B82F6' },
    { name: 'Free', value: mem.free, color: '#E5E7EB' },
  ], [mem.used, mem.free]);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={selectedGraph === 'donut' ? 60 : 70}
          innerRadius={selectedGraph === 'donut' ? 40 : 0}
          paddingAngle={2}
          animationDuration={300}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(value, name) => [`${value} GB`, name]} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`rounded-lg shadow-md p-3 sm:p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header section with responsive spacing */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <MemoryStick className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
          <div className="text-xs sm:text-sm font-semibold truncate">{mem.name}</div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-sm font-medium">{mem.total} GB</div>
        </div>
      </div>

      {/* Stats grid - Responsive */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-2 rounded ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Used</div>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{mem.used} GB</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Free</div>
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{mem.free} GB</div>
        </div>
      </div>

      {/* Chart and legend section */}
      <div className="flex-1 mt-2 flex flex-col items-center justify-center">
        <div className="w-full">{renderChart()}</div>

        {/* Legend - Responsive layout */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-xs mt-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-[#3B82F6] flex-shrink-0"></div>
            <span className="whitespace-nowrap">Used {usagePercent.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-gray-300 flex-shrink-0"></div>
            <span className="whitespace-nowrap">Free {(100 - usagePercent).toFixed(1)}%</span>
          </div>
        </div>

        {/* Usage status badge */}
        <div className={`mt-3 w-full px-3 py-1.5 rounded-md text-xs font-medium text-center ${
          usagePercent > 85
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            : usagePercent > 60
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          {usagePercent > 85 ? 'High Usage' : usagePercent > 60 ? 'Moderate Usage' : 'Normal Usage'}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if actual data values change
  return (
    prevProps.mem.used === nextProps.mem.used &&
    prevProps.mem.free === nextProps.mem.free &&
    prevProps.mem.total === nextProps.mem.total &&
    prevProps.selectedGraph === nextProps.selectedGraph &&
    prevProps.isDarkMode === nextProps.isDarkMode
  );
});

export default MemoryUsageCard;
