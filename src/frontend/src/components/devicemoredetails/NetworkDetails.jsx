import React, { useState, useEffect, useRef } from 'react';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Cpu, Monitor, BarChart3, TrendingUp, Activity, Network, Upload, Download, ChevronDown } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom"
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';
const NetworkDetails = ({ isDarkMode, networkMap }) => {
  // Simulating dark mode state
  useDocumentTitle('IO Stats');

  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, error } = useGetDeviceDetailsByIdQuery(id);
  const [currentTime] = useState(new Date());
  const [selectedGraphType, setSelectedGraphType] = useState('bar');

  const interfaceList = (data?.device?.device?.nic || [])
    .flatMap(nic => nic?.port || [])
    .filter(port => port.interface_name && port.uuid)
    .map(port => ({
      name: port.interface_name,
      uuid: port.uuid
    }));

  const [selectedInterface, setSelectedInterface] = useState('');
  const [selectedInterfaceUuid, setSelectedInterfaceUuid] = useState('');
  const [isInterfaceDropdownOpen, setIsInterfaceDropdownOpen] = useState(false);
  const interfaceDropdownRef = useRef(null);

  const handleDeviceClick = () => {
    if (id) {
      navigate(`/devices/${id}`);
    }
  };

  useEffect(() => {
    if (interfaceList.length > 0) {
      setSelectedInterface(interfaceList[0].name);
      setSelectedInterfaceUuid(interfaceList[0].uuid);
    }
  }, [interfaceList.length]);

  // Close interface dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (interfaceDropdownRef.current && !interfaceDropdownRef.current.contains(event.target)) {
        setIsInterfaceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Interface dropdown handlers
  const handleInterfaceDropdownToggle = () => {
    setIsInterfaceDropdownOpen(!isInterfaceDropdownOpen);
  };

  const handleInterfaceSelect = (interfaceItem) => {
    setSelectedInterface(interfaceItem.name);
    setSelectedInterfaceUuid(interfaceItem.uuid);
    setIsInterfaceDropdownOpen(false);
  };

  const liveNetwork = networkMap?.[id];
  const selectedNetworkData = liveNetwork?.find(item => item.uuid === selectedInterfaceUuid);
  const cardClass = `rounded-lg shadow-md p-4 h-88 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

  const graphTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart3 },
    { id: 'line', label: 'Line', icon: TrendingUp },
    { id: 'area', label: 'Area', icon: Activity }
  ];

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
      'sent', 'received',
      'errorOut', 'errorIn',
      'packetsent', 'packetreceived',
      'dropOut', 'dropIn'
    ];

    const keys = chartData?.length
      ? preferredOrder.filter(k => k in chartData[0])
      : [];

    // Map each key to a specific color
    const colorMap = {
      sent: '#22c55e',            // green
      received: '#3b82f6',        // blue
      errorOut: '#22c55e',        // green
      errorIn: '#3b82f6',         // blue
      packetsent: '#f97316',      // orange
      packetreceived: '#a855f7',  // purple
      dropOut: '#f97316',         // orange
      dropIn: '#a855f7'           // purple
    };

    // Unit mapping based on any matching key
    let unit = 'value/s';
    if (keys.some(k => ['sent', 'received'].includes(k))) unit = 'Kbps';
    else if (keys.some(k => ['errorOut', 'errorIn'].includes(k))) unit = 'errors/s';
    else if (keys.some(k => ['packetsent', 'packetreceived'].includes(k))) unit = 'pps';
    else if (keys.some(k => ['dropIn', 'dropOut'].includes(k))) unit = 'drops/s';

    const tooltipFormatter = (value, name) => {
      if (value === undefined || value === null) return [`0.000 ${unit}`, name];

      const formattedValue = ['sent', 'received'].includes(name) && typeof value === 'number'
        ? value.toFixed(2)
        : value;

      return [`${formattedValue} ${unit}`, name];
    };

    const yAxisFormatter = (value) => {
      const hasBytes = keys.some(k => ['sent', 'received'].includes(k));
      return hasBytes && typeof value === 'number' ? value.toFixed(2) : value;
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
  // Network bytes state with previous values tracking
  const [networkData, setNetworkData] = useState({
    bytesSentPerSec: 0,
    bytesReceivedPerSec: 0
  });

  const [networkChartData, setNetworkChartData] = useState([]);

  // Store previous values to calculate rate
  const networkRef = useRef({
    prevBytesSent: 0,
    prevBytesReceived: 0,
    prevTimestamp: Date.now(),
    lastDataHash: null  // Track when data actually changes
  });

  // Calculate rate from cumulative totals (Task Manager style)
  useEffect(() => {
    if (selectedNetworkData) {
      const currentTimestamp = Date.now();

      // Get current cumulative totals from backend
      const currentBytesSent = Number(selectedNetworkData?.bytes_sent || 0);
      const currentBytesReceived = Number(selectedNetworkData?.bytes_received || 0);

      // Create a hash to detect actual data changes
      const currentDataHash = `${currentBytesSent}-${currentBytesReceived}`;



      const { prevBytesSent, prevBytesReceived, prevTimestamp, lastDataHash } = networkRef.current;

      // Only update if data actually changed
      if (currentDataHash !== lastDataHash && lastDataHash !== null) {
        const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // Convert to seconds

        if (timeDiff > 0) {
          // Calculate bytes per second (rate calculation)
          const bytesSentPerSec = Math.max(0, (currentBytesSent - prevBytesSent) / timeDiff);
          const bytesReceivedPerSec = Math.max(0, (currentBytesReceived - prevBytesReceived) / timeDiff);


          // Convert bytes per second to Kbps
          const kbpsSent = (bytesSentPerSec * 8) / 1000;
          const kbpsReceived = (bytesReceivedPerSec * 8) / 1000;

          setNetworkData({
            bytesSentPerSec: kbpsSent,
            bytesReceivedPerSec: kbpsReceived
          });

          // Update chart data ONLY when data changes
          const timestamp = new Date().toLocaleTimeString();
          setNetworkChartData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                sent: kbpsSent,
                received: kbpsReceived
              }
            ];
            return updated.slice(-20);
          });
        }
      }

      // Update previous values for next calculation
      networkRef.current = {
        prevBytesSent: currentBytesSent,
        prevBytesReceived: currentBytesReceived,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash
      };
    }
  }, [selectedNetworkData]); // Remove interval, trigger only on data change

  const [networkPacketData, setNetworkPacketData] = useState({
    packetsSentPerSec: 0,
    packetsReceivedPerSec: 0,
  });

  const [chartPacketData, setChartPacketData] = useState([]);

  // Store previous values to calculate packet rate
  const packetRef = useRef({
    prevPacketsSent: 0,
    prevPacketsReceived: 0,
    prevTimestamp: Date.now(),
    lastDataHash: null  // Track when data actually changes
  });

  // Calculate packet rate from cumulative totals (Task Manager style)
  useEffect(() => {
    if (selectedNetworkData) {
      const currentTimestamp = Date.now();

      // Get current cumulative totals from backend
      const currentPacketsSent = Number(selectedNetworkData?.packet_sent || 0);
      const currentPacketsReceived = Number(selectedNetworkData?.packet_received || 0);

      // Create a hash to detect actual data changes
      const currentDataHash = `${currentPacketsSent}-${currentPacketsReceived}`;



      const { prevPacketsSent, prevPacketsReceived, prevTimestamp, lastDataHash } = packetRef.current;

      // Only update if data actually changed
      if (currentDataHash !== lastDataHash && lastDataHash !== null) {
        const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // Convert to seconds

        if (timeDiff > 0) {
          // Calculate packets per second (rate calculation)
          const packetsSentPerSec = Math.max(0, (currentPacketsSent - prevPacketsSent) / timeDiff);
          const packetsReceivedPerSec = Math.max(0, (currentPacketsReceived - prevPacketsReceived) / timeDiff);



          // Round to integers (packets are discrete units)
          const packetsSentPPS = Math.round(packetsSentPerSec);
          const packetsReceivedPPS = Math.round(packetsReceivedPerSec);

          setNetworkPacketData({
            packetsSentPerSec: packetsSentPPS,
            packetsReceivedPerSec: packetsReceivedPPS,
          });

          // Update chart data ONLY when data changes
          const timestamp = new Date().toLocaleTimeString();
          setChartPacketData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                packetsent: packetsSentPPS,
                packetreceived: packetsReceivedPPS,
              }
            ];
            return updated.slice(-20);
          });
        }
      }

      // Update previous values for next calculation
      packetRef.current = {
        prevPacketsSent: currentPacketsSent,
        prevPacketsReceived: currentPacketsReceived,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash
      };
    }
  }, [selectedNetworkData]); // Remove interval, trigger only on data change



  // Packet error state
  const [packetErrorData, setPacketErrorData] = useState({
    errorInPerSec: 0,
    errorOutPerSec: 0,
  });

  const [chartPacketErrorData, setChartPacketErrorData] = useState([]);

  // Store previous values to calculate error rate
  const packetErrorRef = useRef({
    prevErrorIn: 0,
    prevErrorOut: 0,
    prevTimestamp: Date.now(),
    lastDataHash: null  // Track when data actually changes
  });

  // Calculate error rate from cumulative totals (Task Manager style)
  useEffect(() => {
    if (selectedNetworkData) {
      const currentTimestamp = Date.now();

      // Get current cumulative error totals from backend
      const currentErrorIn = Number(selectedNetworkData?.error_in || 0);
      const currentErrorOut = Number(selectedNetworkData?.error_out || 0);

      // Create a hash to detect actual data changes
      const currentDataHash = `${currentErrorIn}-${currentErrorOut}`;



      const { prevErrorIn, prevErrorOut, prevTimestamp, lastDataHash } = packetErrorRef.current;

      // Only update if data actually changed
      if (currentDataHash !== lastDataHash && lastDataHash !== null) {
        const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // Convert to seconds

        if (timeDiff > 0) {
          // Calculate errors per second (rate calculation)
          const errorInPerSec = Math.max(0, (currentErrorIn - prevErrorIn) / timeDiff);
          const errorOutPerSec = Math.max(0, (currentErrorOut - prevErrorOut) / timeDiff);



          // Round to reasonable precision (errors can be fractional rates)
          const errorInRate = Math.round(errorInPerSec * 100) / 100; // 2 decimal places
          const errorOutRate = Math.round(errorOutPerSec * 100) / 100;

          setPacketErrorData({
            errorInPerSec: errorInRate,
            errorOutPerSec: errorOutRate,
          });

          // Update chart data ONLY when data changes
          const timestamp = new Date().toLocaleTimeString();
          setChartPacketErrorData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                errorIn: errorInRate,
                errorOut: errorOutRate,
              }
            ];
            return updated.slice(-20);
          });
        }
      }
      // Update previous values for next calculation
      packetErrorRef.current = {
        prevErrorIn: currentErrorIn,
        prevErrorOut: currentErrorOut,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash
      };
    }
  }, [selectedNetworkData]); // Remove interval, trigger only on data change

  // Drop packet state
  const [packetDropData, setPacketDropData] = useState({
    dropInPerSec: 0,
    dropOutPerSec: 0,
  });

  const [chartPacketDropData, setChartPacketDropData] = useState([]);

  // Store previous values to calculate drop rate
  const packetDropRef = useRef({
    prevDropIn: 0,
    prevDropOut: 0,
    prevTimestamp: Date.now(),
    lastDataHash: null  // Track when data actually changes
  });

  // Calculate drop rate from cumulative totals (Task Manager style)
  useEffect(() => {
    if (selectedNetworkData) {
      const currentTimestamp = Date.now();

      // Get current cumulative drop totals from backend
      const currentDropIn = Number(selectedNetworkData?.drop_in || 0);
      const currentDropOut = Number(selectedNetworkData?.drop_out || 0);

      // Create a hash to detect actual data changes
      const currentDataHash = `${currentDropIn}-${currentDropOut}`;



      const { prevDropIn, prevDropOut, prevTimestamp, lastDataHash } = packetDropRef.current;

      // Only update if data actually changed
      if (currentDataHash !== lastDataHash && lastDataHash !== null) {
        const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // Convert to seconds

        if (timeDiff > 0) {
          // Calculate drops per second (rate calculation)
          const dropInPerSec = Math.max(0, (currentDropIn - prevDropIn) / timeDiff);
          const dropOutPerSec = Math.max(0, (currentDropOut - prevDropOut) / timeDiff);



          // Round to reasonable precision (drops can be fractional rates)
          const dropInRate = Math.round(dropInPerSec * 100) / 100; // 2 decimal places
          const dropOutRate = Math.round(dropOutPerSec * 100) / 100;

          setPacketDropData({
            dropInPerSec: dropInRate,
            dropOutPerSec: dropOutRate,
          });

          // Update chart data ONLY when data changes
          const timestamp = new Date().toLocaleTimeString();
          setChartPacketDropData(prev => {
            const updated = [
              ...prev,
              {
                time: timestamp,
                dropIn: dropInRate,
                dropOut: dropOutRate,
              }
            ];
            return updated.slice(-20);
          });
        }
      }

      // Update previous values for next calculation
      packetDropRef.current = {
        prevDropIn: currentDropIn,
        prevDropOut: currentDropOut,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash
      };
    }
  }, [selectedNetworkData]); // Remove interval, trigger only on data change

  useEffect(() => {
    setNetworkChartData([]);
    setChartPacketData([]);
    setChartPacketErrorData([]);
    setChartPacketDropData([]);

    setNetworkData({ bytesSentPerSec: 0, bytesReceivedPerSec: 0 });
    setNetworkPacketData({ packetsSentPerSec: 0, packetsReceivedPerSec: 0 });
    setPacketErrorData({ errorInPerSec: 0, errorOutPerSec: 0 });
    setPacketDropData({ dropInPerSec: 0, dropOutPerSec: 0 });

    networkRef.current = {
      prevBytesSent: 0,
      prevBytesReceived: 0,
      prevTimestamp: Date.now(),
      lastDataHash: null
    };
    packetRef.current = {
      prevPacketsSent: 0,
      prevPacketsReceived: 0,
      prevTimestamp: Date.now(),
      lastDataHash: null
    };
    packetErrorRef.current = {
      prevErrorIn: 0,
      prevErrorOut: 0,
      prevTimestamp: Date.now(),
      lastDataHash: null
    };
    packetDropRef.current = {
      prevDropIn: 0,
      prevDropOut: 0,
      prevTimestamp: Date.now(),
      lastDataHash: null
    };
  }, [selectedInterfaceUuid]);


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-1 sticky">
        <div className={`rounded-lg shadow-md p-4 h-20 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          {/* Icon + Text Group */}
          <div className="flex items-center space-x-4">
            <div className="flex items-start cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg p-2 -m-2"
              onClick={handleDeviceClick}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-[#6366f1]">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{data?.device?.device?.nic?.[0]?.port?.[0]?.ip?.[0]?.address}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{`${data?.device?.os}  ${data?.device?.os_version}`}</p>
              </div>
            </div>
          </div>
          {/* Graph Type Selection */}
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

      {/* Row 1: System Info */}
      <div className="grid grid-cols-1">
        <div className={`rounded-lg shadow-md p-4 h-20 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          {/* Icon + Text Group */}
          <div className="flex items-center space-x-4">
            {/* CPU Icon */}
            <div className="w-8 h-8 bg-[#6366f1] rounded flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
            {/* Title & Description */}
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Network I/O Monitoring
              </h3>

              {/* Custom Styled Interface Dropdown */}
              <div className="relative mt-1" ref={interfaceDropdownRef}>
                <button
                  onClick={handleInterfaceDropdownToggle}
                  className={`flex items-center justify-between px-3 py-1.5 text-sm border rounded-md cursor-pointer min-w-[200px] transition-all duration-200 hover:shadow-md
                    ${isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                    ${isInterfaceDropdownOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                  `}
                >
                  <span>{selectedInterface || 'Select Interface'}</span>
                  <ChevronDown
                    className={`w-3 h-3 ml-2 transition-transform duration-200 ${isInterfaceDropdownOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute left-0 top-full mt-1 w-full min-w-[200px] rounded-md shadow-lg border z-50 transition-all duration-200 origin-top
                    ${isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-200'
                    }
                    ${isInterfaceDropdownOpen
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                    }
                  `}
                >
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {interfaceList.map((interfaceItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleInterfaceSelect(interfaceItem)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                          ${selectedInterface === interfaceItem.name
                            ? 'bg-[#6366f1] text-white'
                            : isDarkMode
                              ? 'text-gray-200 hover:bg-gray-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {interfaceItem.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Time */}
          <div className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentTime.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Row 2: Network Traffic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <div className="flex items-center gap-1 mb-2">
            <h4 className="text-md font-semibold">Network Bits: Sent & Received</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Bytes Sent */}
            <div className="bg-green-50 p-2 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Sent</span>
                </div>

              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {networkData.bytesSentPerSec.toFixed(2)} Kbps
                </div>
              </div>
            </div>
            {/* Bytes Received */}
            <div className="bg-blue-50 p-2 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Received</span>
                </div>

              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {networkData.bytesReceivedPerSec.toFixed(2)} Kbps
                </div>
              </div>
            </div>
          </div>
          {/* Graph */}
          <div className="mb- " >
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Network Bits (Kbps)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-[#6366f1]"></div>
                  <span>Received</span>
                </div>
              </div>
            </div>
            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(networkChartData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Network Packets */}
        <div className={cardClass}>
          <div className="flex items-center gap- mb-2">
            <h4 className="text-md font-semibold">Network Packets: Sent & Received</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Packets Sent */}
            <div className="bg-orange-50 p-2 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500">Sent</span>
                </div>

              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {networkPacketData.packetsSentPerSec} pps
                </div>
              </div>
            </div>
            {/* Packets Received */}
            <div className="bg-purple-50 p-2 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-800">Received</span>
                </div>

              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {networkPacketData.packetsReceivedPerSec} pps
                </div>
              </div>
            </div>
          </div>
          {/* Graph */}
          <div className="mb-">
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Network Packets (pps)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-orange-600"></div>
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-purple-500"></div>
                  <span>Received</span>
                </div>
              </div>
            </div>
            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(chartPacketData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Packet Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h4 className="text-md font-semibold mb-2">Network PacketErrors Overview</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Error Out */}
            <div className="bg-green-50 p-2 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Out</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${(packetErrorData.errorOutPerSec).color}`}></div>
                  <span className="text-xs text-gray-600">
                    {(packetErrorData.errorOutPerSec).label}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {packetErrorData.errorOutPerSec} errors/s
                </div>
              </div>
            </div>
            {/* Error In */}
            <div className="bg-blue-50 p-2 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-800">In</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${(packetErrorData.errorInPerSec).color}`}></div>
                  <span className="text-xs text-gray-600">
                    {(packetErrorData.errorInPerSec).label}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {packetErrorData.errorInPerSec} errors/s
                </div>
              </div>
            </div>
          </div>
          {/* Graph */}
          <div className="mb-">
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-sm font-medium">Network PacketErrors (error/sec)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-green-600"></div>
                  <span>Out</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-[#6366f1]"></div>
                  <span>In</span>
                </div>
              </div>
            </div>
            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(chartPacketErrorData, selectedGraphType, isDarkMode)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Packet Drops Placeholder */}
        <div className={cardClass}>
          <h4 className="text-md font-semibold mb-2">Network PacketDrops Overview</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Error Out */}
            <div className="bg-orange-50 p-2 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500">Out</span>
                </div>

              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {packetDropData.dropOutPerSec} drops/s
                </div>
              </div>
            </div>
            {/* Error In */}
            <div className="bg-purple-50 p-2 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-900">In</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-semibold text-gray-700 dark:text-white`}>
                  {packetDropData.dropInPerSec} drops/sec
                </div>
              </div>
            </div>
          </div>
          {/* Graph */}
          <div className="mb-4" >
            <div className={`flex items-center justify-between mb-3 ${isDarkMode ? 'text-white' : 'bg-white text-gray-900'}`}>
              <h3 className={'text-sm font-medium'}>Network PacketDrops (drops/sec)</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-orange-500"></div>
                  <span>Out</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-purple-500"></div>
                  <span>In</span>
                </div>
              </div>
            </div>
            <div className="h-40 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <div className="h-48">
                  {renderChart(chartPacketDropData, selectedGraphType)}
                </div>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NetworkDetails
