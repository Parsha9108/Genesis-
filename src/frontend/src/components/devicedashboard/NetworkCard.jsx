import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Network, ChevronDown, BarChart2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useRefreshSettings } from '../../Contexts/RefreshContext';
import '../index.css';

export const NetworkCard = ({ isDarkMode, networkMap }) => {
  const [networkPortMap, setNetworkPortMap] = useState({});
  const [selectedInterface, setSelectedInterface] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // Global refresh interval (minutes)
  const { refreshInterval } = useRefreshSettings();

  const liveNetwork = networkMap?.[id];
  const utilization = parseFloat(liveNetwork?.network_utilization) || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { interval: refreshInterval > 0 ? refreshInterval : 1 };
      const res = await axios.get(`/api/webuser/device/network-utilization/${id}/`, { params });

      const rawMap = {};
      for (const iface in res.data) rawMap[iface] = res.data[iface];
      setNetworkPortMap(rawMap);

      const interfaces = Object.keys(rawMap);
      if (interfaces.length && !selectedInterface) setSelectedInterface(interfaces[0]);
    } catch (err) {
      console.error('[NetworkCard] Error fetching network data:', err.response?.data || err.message);
      setNetworkPortMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalMs = Math.max(refreshInterval, 1) * 60 * 1000;
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [id, refreshInterval]);

  const networkData = networkPortMap[selectedInterface] || [];
  const interfaces = Object.keys(networkPortMap);
  const isEmpty = !loading && (!interfaces.length || !networkData.length);

  const handleCardClick = () => navigate(`/devices/${id}/network_details`);
  const stopPropagation = (e) => e.stopPropagation();

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleInterfaceSelect = (iface, e) => {
    e.stopPropagation();
    setSelectedInterface(iface);
    setIsDropdownOpen(false);
  };
  
  return (
    <div
      onClick={!isEmpty ? handleCardClick : undefined}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
        rounded-lg shadow p-4 h-60 w-75 flex flex-col justify-between 
        ${!isEmpty ? 'cursor-pointer hover:shadow-md transition' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Network className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Network Traffic
          </span>
        </div>

        {/* Dropdown */}
        {!isEmpty && (
          <div className="relative" ref={dropdownRef} onClick={stopPropagation}>
            <button
              onClick={handleDropdownToggle}
              className={`flex items-center justify-between px-3 py-1.5 text-xs border rounded-md cursor-pointer min-w-[80px] transition-all duration-200 hover:shadow-md
                ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                ${isDropdownOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            >
              <span>{selectedInterface || 'Select'}</span>
              <ChevronDown
                className={`w-3 h-3 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 top-full mt-1 w-full min-w-[80px] rounded-md shadow-lg border z-50 transition-all duration-200 origin-top
                ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                ${isDropdownOpen
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
            >
              <div className="py-1 max-h-32 overflow-y-auto custom-scroll">
                {interfaces.map((iface) => (
                  <button
                    key={iface}
                    onClick={(e) => handleInterfaceSelect(iface, e)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${selectedInterface === iface
                        ? 'bg-[#6366f1] text-white'
                        : isDarkMode
                          ? 'text-gray-200 hover:bg-gray-600'
                          : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {iface}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <BarChart2 className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No network data available
          </p>
        </div>
      ) : (
        <>
          {/* Live usage */}
          <div className="mb-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Live: {utilization}%
            </span>
          </div>

          {/* Line Chart */}
          <div className="h-32" onClick={stopPropagation}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={networkData} margin={{ left: 11, right: 11 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                  itemStyle={{ margin: 0 }}
                  labelStyle={{ display: 'none' }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value) => [`${value}%`, 'Usage']}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Footer */}
          <div className="flex justify-end -mt-1 -mb-0.1">
            <button
              className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
              onClick={handleCardClick}
            >
              View details
            </button>
          </div>
        </>
      )}
    </div>
  );
};
