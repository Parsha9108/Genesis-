import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { Donut, PieChart as LucidePieChart, Monitor, HardDrive, AlertCircle } from 'lucide-react';
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useParams } from 'react-router-dom';
import Loading from '../../components/User/Loading';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const formatDiskSize = (sizeStr) => {
  if (!sizeStr) return '0 GB';

  if (typeof sizeStr === 'string' && (sizeStr.includes('GB') || sizeStr.includes('TB') || sizeStr.includes('MB'))) {
    return sizeStr;
  }

  const size = parseFloat(sizeStr);
  if (isNaN(size)) return '0 GB';
  if (size >= 1024) return `${(size / 1024).toFixed(1)} TB`;
  return `${size.toFixed(1)} GB`;
};

const parseSize = (sizeStr) => {
  if (!sizeStr) return 0;
  const value = parseFloat(sizeStr);
  if (isNaN(value)) return 0;
  if (sizeStr.includes('TB')) return value * 1024;
  if (sizeStr.includes('MB')) return value / 1024;
  return value; // GB
};

const StorageUsage = ({ isDarkMode = false, diskMap }) => {
  useDocumentTitle("Overview");
  const isInitializedRef = useRef(false);
  const { id } = useParams();
  const [selectedGraph, setSelectedGraph] = useState('donut');
  const { data, isLoading } = useGetDeviceDetailsByIdQuery(id);
  const [diskData, setDiskData] = useState({});

  const liveDisk = diskMap?.[id];

  const chartOptions = [
    { id: 'donut', label: 'Donut', icon: Donut },
    { id: 'pie', label: 'Pie', icon: LucidePieChart },
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

  // Initialize disk data structure - FILTER OUT FLAGGED DISKS
  useEffect(() => {
    if (!isLoading && data?.device && !isInitializedRef.current) {
      const disk = {};
      const disks = Array.isArray(data.device.device.storage) ? data.device.device.storage : [];

      // Filter out flagged disks
      const activeDisks = disks.filter(diskInfo => !diskInfo.is_flagged);

      activeDisks.forEach((diskInfo) => {
        const serial_number = diskInfo?.serial_number;
        const uuid = diskInfo?.uuid;

        if (uuid) {
          disk[uuid] = {
            name: serial_number,
            data: [],
            total: 0,
            used: 0,
            free: 0,
            unallocated: 0,
            partitions: []
          };
        }
      });

      setDiskData(disk);
      isInitializedRef.current = true;
    }
  }, [data, isLoading]);

  // Update disk data when liveDisk changes
  useEffect(() => {
    if (!liveDisk || !Array.isArray(liveDisk)) {
      return;
    }

    const now = new Date();
    const timeLabel = `${now.getMinutes()}m:${now.getSeconds()}s`;

    setDiskData(prevMap => {
      const newMap = { ...prevMap };

      Object.entries(prevMap).forEach(([uuid, diskInfo]) => {
        const matchingDisk = liveDisk.find(disk => disk.uuid === uuid);

        if (matchingDisk) {
          const totalSize = parseSize(matchingDisk.total_disk_size);
          const usedSize = parseSize(matchingDisk.total_disk_usage);
          const allocatedSize = parseSize(matchingDisk.allocated_disk_space);
          const unallocated = parseSize(matchingDisk.unallocated_disk_space);
          const freeSize = Math.max(0, allocatedSize - usedSize);

          const newDataPoint = {
            name: timeLabel,
            total: totalSize > 0 ? totalSize : allocatedSize,
            used: usedSize,
            free: freeSize,
            unallocated: unallocated,
            timestamp: now.getTime()
          };

          const newDataArray = [...diskInfo.data, newDataPoint];
          if (newDataArray.length > 10) newDataArray.shift();

          newMap[uuid] = {
            ...diskInfo,
            data: newDataArray,
            total: newDataPoint.total,
            used: newDataPoint.used,
            free: newDataPoint.free,
            unallocated: newDataPoint.unallocated,
            partitions: matchingDisk.partitions || []
          };
        }
      });

      return newMap;
    });
  }, [liveDisk]);

  if (isLoading || !data) return <Loading />;

  const device = data?.device;

  if (!liveDisk) {
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
                  <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    Disk Usage Overview
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
            <div className="relative mb-4 sm:mb-6">
              <AlertCircle className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-30 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              No Data Available
            </h3>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-500">
              <HardDrive className="w-4 h-4" />
              <span>Waiting for disk monitoring data...</span>
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
                  <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-base sm:text-lg lg:text-xl font-bold truncate"
                    style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
                  >
                    Disk Usage Overview
                  </h1>
                  <p 
                    className="text-xs truncate"
                    style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  >
                    {device?.hostname || 'Unknown Device'} • {device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address || 'Unknown IP'}
                  </p>
                </div>
              </div>

              {/* Chart type buttons - Stack on mobile */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {chartOptions.map((type) => {
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
      <div className="pt-10 sm:pt-24 space-y-4 sm:space-y-5 px-3 sm:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(diskData).map(([uuid, diskInfo]) => (
            <DiskCard
              key={uuid}
              uuid={uuid}
              diskInfo={diskInfo}
              selectedGraph={selectedGraph}
              isDarkMode={isDarkMode}
              tooltipStyle={tooltipStyle}
              device={device}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Memoized Disk Card Component with responsive design
const DiskCard = React.memo(({ uuid, diskInfo, selectedGraph, isDarkMode, tooltipStyle, device }) => {
  const usagePercentage = useMemo(() => 
    diskInfo.total > 0 ? Math.round((diskInfo.used / diskInfo.total) * 100) : 0,
    [diskInfo.used, diskInfo.total]
  );

  const freePercentage = useMemo(() =>
    diskInfo.total > 0 ? Math.round((diskInfo.free / diskInfo.total) * 100) : 0,
    [diskInfo.free, diskInfo.total]
  );

  const unallocatedPercentage = useMemo(() =>
    diskInfo.total > 0 ? Math.round((diskInfo.unallocated / diskInfo.total) * 100) : 0,
    [diskInfo.unallocated, diskInfo.total]
  );

  const chartData = useMemo(() => [
    { name: 'Used', value: diskInfo.used, color: '#3B82F6' },
    { name: 'Free', value: diskInfo.free, color: '#c9ccd2ff' },
    { name: 'Unallocated', value: diskInfo.unallocated, color: '#80aef9ff' }
  ], [diskInfo.used, diskInfo.free, diskInfo.unallocated]);

  if (diskInfo.total === 0 && diskInfo.data.length === 0) {
    return (
      <div className={`rounded-lg shadow-md p-3 sm:p-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <HardDrive className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-xs sm:text-sm text-gray-500">Loading disk data...</p>
        </div>
      </div>
    );
  }

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
        <Tooltip
          {...tooltipStyle}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const { name, value } = payload[0];
            const percent = diskInfo.total > 0 ? Math.round((value / diskInfo.total) * 100) : 0;
            return (
              <div className="px-2 py-1 rounded text-xs shadow-md" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB', color: isDarkMode ? '#F9FAFB' : '#111827', border: '1px solid #ccc' }}>
                <div>{name}: {formatDiskSize(value)} ({percent}%)</div>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`rounded-lg shadow-md p-3 sm:p-4 flex flex-col ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      {/* Disk Header - Responsive */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <HardDrive className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
          <h4 className="text-xs sm:text-sm font-semibold truncate">{diskInfo.name}</h4>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xs sm:text-sm font-medium">{formatDiskSize(diskInfo.total)}</div>
        </div>
      </div>

      {/* Stats - Responsive grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-2 rounded ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Used</div>
          <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatDiskSize(diskInfo.used)}</div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{usagePercentage}%</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Free</div>
          <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDiskSize(diskInfo.free)}</div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{freePercentage}%</div>
        </div>
        <div className={`p-2 rounded col-span-2 ${isDarkMode ? 'bg-blue-800/30' : 'bg-blue-200'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unallocated</div>
          <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDiskSize(diskInfo.unallocated)}</div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unallocatedPercentage}%</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {renderChart()}
      </div>

      {/* Legend - Responsive with wrap */}
      <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-xs mt-2">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-[#3B82F6] flex-shrink-0" />
          <span className="whitespace-nowrap">Used ({usagePercentage}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-[#c9ccd2ff] flex-shrink-0" />
          <span className="whitespace-nowrap">Free ({freePercentage}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-[#80aef9ff] flex-shrink-0" />
          <span className="whitespace-nowrap">Unalloc ({unallocatedPercentage}%)</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`mt-3 px-3 py-1.5 rounded-md text-xs font-medium text-center ${
        usagePercentage > 90
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          : usagePercentage > 80
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      }`}>
        {usagePercentage > 90 ? 'Critical Space' : usagePercentage > 80 ? 'Low Space' : 'Normal Space'}
      </div>

      {/* Partitions - Responsive */}
      {diskInfo.partitions?.length > 0 && (
        <div className="mt-4 space-y-3">
          {diskInfo.partitions.map((partition, index) => {
            const matchedPartition = device?.device?.storage
              ?.flatMap(storage => storage.partition || [])
              ?.find(p => p.uuid === partition.partition_id);

            return (
              <div key={index} className="text-xs">
                <div className="font-semibold mb-1 truncate">Mountpoint: {matchedPartition?.name || 'N/A'}</div>
                <div className={`relative h-4 rounded overflow-hidden mb-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="absolute top-0 left-0 h-full bg-[#6366f1]"
                    style={{ width: `${parseFloat(partition.used_space_perc)}%` }}
                  />
                  <div
                    className={`absolute top-0 h-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                    style={{ left: `${parseFloat(partition.used_space_perc)}%`, width: `${(100 - parseFloat(partition.used_space_perc)).toFixed(1)}%` }}
                  />
                  <span className="absolute left-2 text-[10px] text-white font-semibold">
                    {partition.used_space_perc}
                  </span>
                  <span className="absolute right-2 text-[10px] text-white font-semibold">
                    {(100 - parseFloat(partition.used_space_perc)).toFixed(1)}%
                  </span>
                </div>
                <div className={`flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div><strong>Used:</strong> {partition.used_space}</div>
                  <div><strong>Free:</strong> {partition.free_space}</div>
                  <div>
                    <strong>Total:</strong>{' '}
                    {(
                      parseFloat(partition.used_space.replace('GB', '')) +
                      parseFloat(partition.free_space.replace('GB', ''))
                    ).toFixed(2)} GB
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.diskInfo.used === nextProps.diskInfo.used &&
    prevProps.diskInfo.free === nextProps.diskInfo.free &&
    prevProps.diskInfo.total === nextProps.diskInfo.total &&
    prevProps.diskInfo.unallocated === nextProps.diskInfo.unallocated &&
    prevProps.diskInfo.partitions.length === nextProps.diskInfo.partitions.length &&
    prevProps.selectedGraph === nextProps.selectedGraph &&
    prevProps.isDarkMode === nextProps.isDarkMode
  );
});

export default StorageUsage;
