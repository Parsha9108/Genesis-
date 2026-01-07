import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Monitor, BarChart3, TrendingUp, Activity, ChevronDown, HardDrive } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const DiskIODetails = ({ isDarkMode, diskMap }) => {
  useDocumentTitle("IO Stats");
  const navigate = useNavigate();
  const [currentTime] = useState(new Date());
  const [selectedGraphType, setSelectedGraphType] = useState('bar');
  const { id } = useParams();

  const { data, isLoading, error } = useGetDeviceDetailsByIdQuery(id);

  // ✅ FIXED: Filter out flagged disks
  const diskList = useMemo(() => {
    const allDisks = data?.device?.device?.storage || [];

    // Filter out flagged disks
    const filteredDisks = allDisks.filter(storage => !storage.is_flagged);

    console.log(`[DiskIODetails] Filtered ${allDisks.length} disks down to ${filteredDisks.length} non-flagged disks`);

    return filteredDisks.map(storage => ({
      name: storage.serial_number,
      uuid: storage.uuid,
      is_flagged: storage.is_flagged
    }));
  }, [data]);

  const [selectedDisk, setSelectedDisk] = useState('');
  const [selectedDiskUuid, setSelectedDiskUuid] = useState('');
  const [isDiskDropdownOpen, setIsDiskDropdownOpen] = useState(false);
  const diskDropdownRef = useRef(null);

  // ✅ ENHANCED: Auto-select first non-flagged disk and handle empty state
  useEffect(() => {
    if (!selectedDiskUuid && diskList.length > 0) {
      console.log('[DiskIODetails] Auto-selecting first non-flagged disk:', diskList[0]);
      setSelectedDisk(diskList[0].name);
      setSelectedDiskUuid(diskList[0].uuid);
    } else if (diskList.length === 0) {
      console.log('[DiskIODetails] No non-flagged disks available');
      setSelectedDisk('');
      setSelectedDiskUuid('');
    }
  }, [diskList, selectedDiskUuid]);

  // ✅ Add debug logging for disk filtering
  useEffect(() => {
    console.log('[DiskIODetails] Debug Info:', {
      allStorageDevices: data?.device?.device?.storage?.length || 0,
      filteredDiskList: diskList.length,
      flaggedDisks: data?.device?.device?.storage?.filter(d => d.is_flagged)?.length || 0,
      selectedDisk,
      selectedDiskUuid,
      diskList: diskList.map(d => ({ name: d.name, uuid: d.uuid }))
    });
  }, [data, diskList, selectedDisk, selectedDiskUuid]);

  // Close disk dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (diskDropdownRef.current && !diskDropdownRef.current.contains(event.target)) {
        setIsDiskDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ ENHANCED: Disk dropdown handlers with validation
  const handleDiskDropdownToggle = () => {
    if (diskList.length > 0) {
      setIsDiskDropdownOpen(!isDiskDropdownOpen);
    }
  };

  const handleDiskSelect = (diskItem) => {
    setSelectedDisk(diskItem.name);
    setSelectedDiskUuid(diskItem.uuid);
    setIsDiskDropdownOpen(false);
  };

  const handleDeviceClick = () => {
    if (id) {
      navigate(`/devices/${id}`);
    }
  };

  // ✅ ENHANCED: Get selected disk name or show "No disks available"
  const getSelectedDiskName = () => {
    if (diskList.length === 0) {
      return 'No disks available';
    }
    return selectedDisk || 'Select Disk';
  };

  const liveDisk = diskMap?.[id];
  const selectedDiskData = liveDisk?.find(item => item.uuid === selectedDiskUuid);

  const cardClass = `rounded-lg shadow-md p-4 h-88 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

  const graphTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart3 },
    { id: 'line', label: 'Line', icon: TrendingUp },
    { id: 'area', label: 'Area', icon: Activity }
  ];

  // **FIXED RENDER CHART FUNCTION**
  const renderChart = (chartData, selectedGraphType, isDarkMode) => {
    if (!chartData || chartData.length === 0) {
      return <div className="flex items-center justify-center h-48 text-gray-500">No data available</div>;
    }

    const commonProps = {
      width: "100%",
      height: "100%"
    };

    const tooltipStyle = {
      fontSize: '10px',
      padding: '4px 6px',
      backgroundColor: isDarkMode ? '#1f2937' : '#f9f9f9',
      color: isDarkMode ? '#f9f9f9' : '#1f2937',
    };

    const preferredOrder = [
      'reads', 'writes',
      'read', 'write',
      'readtime', 'writetime'
    ];

    const keys = chartData?.length
      ? preferredOrder.filter(k => k in chartData[0])
      : [];

    const colorMap = {
      reads: '#22c55e',      // green
      writes: '#3b82f6',     // blue
      read: '#f97316',       // orange
      write: '#a855f7',      // purple
      readtime: '#22c55e',   // green
      writetime: '#3b82f6'   // blue
    };

    // **FIXED UNIT MAPPING**
    let unit = 'value/s';
    if (keys.some(k => ['reads', 'writes'].includes(k))) unit = 'ops/s';
    else if (keys.some(k => ['read', 'write'].includes(k))) unit = 'MB/s';
    else if (keys.some(k => ['readtime', 'writetime'].includes(k))) unit = 'ms/s';

    const tooltipFormatter = (value, name) => {
      if (value === undefined || value === null) return [`0 ${unit}`, name];

      const isByteMetric = ['read', 'write'].includes(name);
      const formattedValue = isByteMetric ? value.toFixed(2) : value;

      return [`${formattedValue} ${unit}`, name];
    };

    const yAxisFormatter = (value) => {
      const hasBytes = keys.some(k => ['read', 'write'].includes(k));
      return hasBytes ? value.toFixed(1) : value;
    };

    const renderLines = () =>
      keys.map((key) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={colorMap[key] || '#8884d8'}
          strokeWidth={2}
          dot={false}
          name={key}
        />
      ));

    const renderAreas = () =>
      keys.map((key) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          stackId="1"
          stroke={colorMap[key] || '#8884d8'}
          fill={colorMap[key] || '#8884d8'}
          fillOpacity={0.6}
          name={key}
        />
      ));

    const renderBars = () =>
      keys.map((key) => (
        <Bar
          key={key}
          dataKey={key}
          fill={colorMap[key] || '#8884d8'}
          name={key}
        />
      ));

    switch (selectedGraphType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={yAxisFormatter} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} itemStyle={{ fontSize: '12px' }} />
              {renderLines()}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={yAxisFormatter} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} itemStyle={{ fontSize: '12px' }} />
              {renderAreas()}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData.slice(-10)}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={yAxisFormatter} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} itemStyle={{ fontSize: '12px' }} />
              {renderBars()}
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  /// **COMBINED DISK I/O STATE AND LOGIC**
  const [diskIOData, setDiskIOData] = useState({
    readCountPerSec: 0,
    writeCountPerSec: 0,
    bytesReadPerSec: 0,
    bytesWrittenPerSec: 0,
    readTimePerSec: 0,
    writeTimePerSec: 0
  });

  const [diskChartData, setDiskChartData] = useState([]);
  const [diskByteChartData, setDiskByteChartData] = useState([]);
  const [diskTimeChartData, setDiskTimeChartData] = useState([]);

  // **SINGLE REF FOR ALL DISK METRICS - WITH HASH DETECTION**
  const diskRef = useRef({
    prevReadCount: 0,
    prevWriteCount: 0,
    prevBytesRead: 0,
    prevBytesWrite: 0,
    prevReadTime: 0,
    prevWriteTime: 0,
    prevTimestamp: Date.now(),
    lastDataHash: null  // **ADDED HASH DETECTION LIKE NETWORK**
  });

  // **CONSOLIDATED DISK I/O CALCULATION - EXACTLY LIKE NETWORK**
  useEffect(() => {
    if (selectedDiskData) {
      const currentTimestamp = Date.now();

      // Get all current values
      const currentReadCount = Number(selectedDiskData?.read_count_io || 0);
      const currentWriteCount = Number(selectedDiskData?.write_count_io || 0);
      const currentBytesRead = Number(selectedDiskData?.bytes_read_io || 0);
      const currentBytesWrite = Number(selectedDiskData?.bytes_write_io || 0);
      const currentReadTime = Number(selectedDiskData?.read_time_io || 0);
      const currentWriteTime = Number(selectedDiskData?.write_time_io || 0);

      // **CREATE HASH TO DETECT ACTUAL DATA CHANGES - EXACTLY LIKE NETWORK**
      const currentDataHash = `${currentReadCount}-${currentWriteCount}-${currentBytesRead}-${currentBytesWrite}-${currentReadTime}-${currentWriteTime}`;

      console.log('Current Cumulative Disk Data:', {
        currentReadCount, currentWriteCount, currentBytesRead,
        currentBytesWrite, currentReadTime, currentWriteTime
      });

      const {
        prevReadCount, prevWriteCount, prevBytesRead, prevBytesWrite,
        prevReadTime, prevWriteTime, prevTimestamp, lastDataHash
      } = diskRef.current;

      // **ONLY UPDATE IF DATA ACTUALLY CHANGED - EXACTLY LIKE NETWORK**
      if (currentDataHash !== lastDataHash && lastDataHash !== null) {
        const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // Convert to seconds

        if (timeDiff > 0) {
          // Calculate all rates
          const readCountPerSec = Math.max(0, (currentReadCount - prevReadCount) / timeDiff);
          const writeCountPerSec = Math.max(0, (currentWriteCount - prevWriteCount) / timeDiff);

          const bytesReadPerSec = Math.max(0, (currentBytesRead - prevBytesRead) / timeDiff);
          const bytesWritePerSec = Math.max(0, (currentBytesWrite - prevBytesWrite) / timeDiff);

          const readTimePerSec = Math.max(0, (currentReadTime - prevReadTime) / timeDiff);
          const writeTimePerSec = Math.max(0, (currentWriteTime - prevWriteTime) / timeDiff);

          console.log('Calculated Disk Rates:', {
            readCountPerSec, writeCountPerSec, bytesReadPerSec,
            bytesWritePerSec, readTimePerSec, writeTimePerSec
          });

          // Convert units
          const readIOPS = Math.round(readCountPerSec);
          const writeIOPS = Math.round(writeCountPerSec);
          const mbReadPerSec = bytesReadPerSec / (1024 * 1024);
          const mbWritePerSec = bytesWritePerSec / (1024 * 1024);
          const readTimeRate = Math.round(readTimePerSec * 100) / 100;
          const writeTimeRate = Math.round(writeTimePerSec * 100) / 100;

          // Update state
          setDiskIOData({
            readCountPerSec: readIOPS,
            writeCountPerSec: writeIOPS,
            bytesReadPerSec: mbReadPerSec,
            bytesWrittenPerSec: mbWritePerSec,
            readTimePerSec: readTimeRate,
            writeTimePerSec: writeTimeRate
          });

          // **UPDATE CHART DATA ONLY WHEN DATA CHANGES - EXACTLY LIKE NETWORK**
          const timestamp = new Date().toLocaleTimeString();

          setDiskChartData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                reads: readIOPS,
                writes: writeIOPS
              }
            ];
            return updated.slice(-20);
          });

          setDiskByteChartData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                read: mbReadPerSec,
                write: mbWritePerSec
              }
            ];
            return updated.slice(-20);
          });

          setDiskTimeChartData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                readtime: readTimeRate,
                writetime: writeTimeRate
              }
            ];
            return updated.slice(-20);
          });
        }
      }

      // **UPDATE PREVIOUS VALUES FOR NEXT CALCULATION - EXACTLY LIKE NETWORK**
      diskRef.current = {
        prevReadCount: currentReadCount,
        prevWriteCount: currentWriteCount,
        prevBytesRead: currentBytesRead,
        prevBytesWrite: currentBytesWrite,
        prevReadTime: currentReadTime,
        prevWriteTime: currentWriteTime,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash  // **STORE HASH LIKE NETWORK**
      };
    }
  }, [selectedDiskData]); // **ONLY TRIGGER ON DATA CHANGE - EXACTLY LIKE NETWORK**


  useEffect(() => {
    setDiskChartData([]);
    setDiskByteChartData([]);
    setDiskTimeChartData([]);

    setDiskIOData({
      readCountPerSec: 0,
      writeCountPerSec: 0,
      bytesReadPerSec: 0,
      bytesWrittenPerSec: 0,
      readTimePerSec: 0,
      writeTimePerSec: 0
    });
     diskRef.current = {
        prevReadCount: 0,
        prevWriteCount: 0,
        prevBytesRead: 0,
        prevBytesWrite: 0,
        prevReadTime: 0,
        prevWriteTime: 0,
        prevTimestamp: Date.now(),
        lastDataHash: null  // **STORE HASH LIKE NETWORK**
      };
  }, [selectedDiskUuid]);

  // ✅ ENHANCED: Handle case when no disks are available
  if (diskList.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-1 sticky">
          <div className={`rounded-lg shadow-md p-4 h-20 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex items-center space-x-4">
              <div className="flex items-start cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg p-2 -m-2"
                onClick={handleDeviceClick}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-[#6366f1]">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {data?.device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {`${data?.device?.os} ${data?.device?.os_version}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No Disks Available Message */}
        <div className={`rounded-lg shadow-md p-4 text-center py-12 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="flex flex-col items-center max-w-md mx-auto">
            <HardDrive className="w-16 h-16 text-gray-400 mb-4" />
            <div className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No Disk I/O Data Available
            </div>
            <div className={`text-sm mb-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              All disks for this device are currently flagged or no disks are configured for I/O monitoring.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-1 sticky">
        <div className={`rounded-lg shadow-md p-4 h-20 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-start cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg p-2 -m-2"
              onClick={handleDeviceClick}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-[#6366f1]">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data?.device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {`${data?.device?.os} ${data?.device?.os_version}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {graphTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedGraphType(type.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedGraphType === type.id
                    ? 'bg-[#6366f1] text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1">
        <div className={`rounded-lg shadow-md p-4 h-20 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-[#6366f1] rounded flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                DISK I/O Monitoring
              </h3>

              {/* ✅ ENHANCED: Dropdown with flagged disk filtering */}
              <div className="relative mt-1" ref={diskDropdownRef}>
                <button
                  onClick={handleDiskDropdownToggle}
                  disabled={diskList.length === 0}
                  className={`flex items-center justify-between px-3 py-1.5 text-sm border rounded-md cursor-pointer min-w-[200px] transition-all duration-200 hover:shadow-md
                    ${diskList.length === 0
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                    ${isDiskDropdownOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                  `}
                >
                  <span>{getSelectedDiskName()}</span>
                  {diskList.length > 0 && (
                    <ChevronDown
                      className={`w-3 h-3 ml-2 transition-transform duration-200 ${isDiskDropdownOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                    />
                  )}
                </button>

                {/* ✅ ENHANCED: Dropdown Menu - Only shows non-flagged disks */}
                {diskList.length > 0 && (
                  <div
                    className={`absolute left-0 top-full mt-1 w-full min-w-[200px] rounded-md shadow-lg border z-50 transition-all duration-200 origin-top
                      ${isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-200'
                      }
                      ${isDiskDropdownOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                      }
                    `}
                  >
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {diskList.map((disk, index) => (
                        <button
                          key={index}
                          onClick={() => handleDiskSelect(disk)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                            ${selectedDisk === disk.name
                              ? 'bg-[#6366f1] text-white'
                              : isDarkMode
                                ? 'text-gray-200 hover:bg-gray-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          {disk.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentTime.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Charts Row 1: Operations and Bytes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disk Operations */}
        <div className={cardClass}>
          <div className="flex items-center gap-1 mb-2">
            <h4 className="text-md font-semibold">Disk I/O: Read & Write Operations</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 p-2 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-green-800">Read Ops</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.readCountPerSec} ops/s
              </div>
            </div>

            <div className="bg-blue-50 p-2 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-blue-800">Write Ops</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.writeCountPerSec} ops/s
              </div>
            </div>
          </div>

          <div>
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Disk I/O Operations (ops/s)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span>Reads</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span>Writes</span>
                </div>
              </div>
            </div>

            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(diskChartData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Disk Bytes */}
        <div className={cardClass}>
          <div className="flex items-center gap-1 mb-2">
            <h4 className="text-md font-semibold">Disk I/O: Bytes Read & Written</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-orange-50 p-2 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-orange-600">Read Bytes</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.bytesReadPerSec.toFixed(2)} MB/s
              </div>
            </div>

            <div className="bg-purple-50 p-2 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-purple-800">Write Bytes</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.bytesWrittenPerSec.toFixed(2)} MB/s
              </div>
            </div>
          </div>

          <div>
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Disk Throughput (MB/s)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-orange-500"></div>
                  <span>Read</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-purple-500"></div>
                  <span>Write</span>
                </div>
              </div>
            </div>

            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(diskByteChartData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Response Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h4 className="text-md font-semibold mb-2">Disk I/O Response Time</h4>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 p-2 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-green-800">Read Time</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.readTimePerSec} ms/s
              </div>
            </div>

            <div className="bg-blue-50 p-2 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-blue-800">Write Time</span>
              </div>
              <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                {diskIOData.writeTimePerSec} ms/s
              </div>
            </div>
          </div>

          <div>
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Disk I/O Time (ms/s)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span>Read Time</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span>Write Time</span>
                </div>
              </div>
            </div>

            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(diskTimeChartData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiskIODetails;
