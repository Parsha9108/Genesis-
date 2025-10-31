import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Cpu, Donut, PieChart as PieIcon, AlertCircle } from 'lucide-react';
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useParams } from 'react-router-dom';
import Loading from '../../components/User/Loading';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const CPUUsageCard = ({ isDarkMode = false, cpuMap }) => {
  useDocumentTitle('UsageOverview');
  const isInitializedRef = useRef(false);
  const { id } = useParams();
  const [selectedGraph, setSelectedGraph] = useState('donut');
  const { data, isLoading } = useGetDeviceDetailsByIdQuery(id);
  const [cpuData, setCpuData] = useState({});

  const liveCpu = cpuMap?.[id];
  console.log("live", liveCpu);

  useEffect(() => {
    if (!isLoading && data?.device && !isInitializedRef.current) {
      const cpu = {};
      const cpus = Array.isArray(data.device.device.cpu) ? data.device.device.cpu : [];
      cpus.forEach(cpuInfo => {
        const model = cpuInfo?.model;
        const cores = cpuInfo?.p_cores;
        const uuid = cpuInfo?.uuid;
        if (uuid) {
          cpu[uuid] = {
            name: `${model} ${cores} cores`,
            data: []
          };
        }
      });
      setCpuData(cpu);
      isInitializedRef.current = true;
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!liveCpu || !liveCpu.uuid) {
      return;
    }

    const now = new Date();
    const timeLabel = `${now.getMinutes()}m:${now.getSeconds()}s`;

    setCpuData(prevMap => {
      if (!prevMap[liveCpu.uuid]) {
        return prevMap;
      }

      const utilization = parseFloat(liveCpu.cpu_utilization) || 0;
      const updatedCpu = { ...prevMap[liveCpu.uuid] };
      const newData = [...updatedCpu.data, { name: timeLabel, value: utilization }];
      if (newData.length > 10) newData.shift();
      updatedCpu.data = newData;

      return {
        ...prevMap,
        [liveCpu.uuid]: updatedCpu
      };
    });
  }, [liveCpu]);

  if (isLoading) return <Loading />;

  const device = data?.device;
  const chartOptions = [
    { id: 'donut', label: 'Donut', icon: Donut },
    { id: 'pie', label: 'Pie', icon: PieIcon },
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '12px',
    },
    itemStyle: {
      color: isDarkMode ? '#ffffff' : '#000000',
      fontSize: '12px',
    }
  };

  if (!liveCpu) {
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
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    CPU Usage Overview
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

        <div className="pt-10 sm:pt-24 space-y-4 sm:space-y-5 px-3 sm:px-0">
          <div className={`rounded-lg shadow-md p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px] ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="relative mb-4 sm:mb-6">
              <AlertCircle className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-30 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              No Data Available
            </h3>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-500">
              <Cpu className="w-4 h-4" />
              <span>Waiting for CPU monitoring data...</span>
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
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    CPU Usage Overview
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
                {chartOptions.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedGraph(type.id)}
                      className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                        selectedGraph === type.id
                          ? 'bg-[#6366f1] text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area - Responsive grid */}
      <div className="pt-24 sm:pt-28 space-y-4 sm:space-y-5 px-3 sm:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(cpuData).map(([uuid, cpuObj]) => {
            const latestUsage = cpuObj.data[cpuObj.data.length - 1]?.value || 0;
            const chartData = [
              { name: 'Used', value: latestUsage, color: '#3B82F6' },
              { name: 'Free', value: 100 - latestUsage, color: '#E5E7EB' }
            ];

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
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            );

            return (
              <div 
                key={uuid} 
                className={`rounded-lg shadow-md p-3 sm:p-4 flex flex-col justify-between ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}
              >
                {/* CPU name header */}
                <div className="flex items-center space-x-2 mb-2">
                  <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <h4 className="text-xs sm:text-sm font-semibold truncate">{cpuObj.name}</h4>
                </div>

                {/* Chart container */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-full">{renderChart()}</div>

                  {/* Legend - Responsive layout */}
                  <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-xs mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-sm bg-[#3B82F6] flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Used ({latestUsage}%)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-sm bg-gray-300 flex-shrink-0"></div>
                      <span className="whitespace-nowrap">Free ({(100 - latestUsage).toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Usage status badge */}
                  <div className={`mt-3 w-full px-3 py-1.5 rounded-md text-xs font-medium text-center ${
                    latestUsage > 85
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : latestUsage > 70
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {latestUsage > 85 ? 'High Usage' : latestUsage > 70 ? 'Moderate Usage' : 'Normal Usage'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CPUUsageCard;
