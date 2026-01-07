import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MemoryStick, BarChart2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRefreshSettings } from '../../Contexts/RefreshContext';

export const MemoryCard = ({ isDarkMode, memoryMap }) => {
  const { id } = useParams();
  const [memoryData, setMemoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { refreshInterval } = useRefreshSettings();
  const liveMemory = memoryMap?.[id];
  const utilization = parseFloat(liveMemory?.memory_utilization) || 0;

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { interval: refreshInterval > 0 ? refreshInterval : 1 };
      const res = await axios.get(`/api/webapp/v1/device/memory-utilization/${id}/`, { params });
      setMemoryData(res.data);
    } catch (err) {
      console.error('[MemoryCard] Error fetching memory data:', err.response?.data || err.message);
      setMemoryData([]);
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

  const handleCardClick = () => navigate(`/devices/${id}/memory_details`);
  const stopPropagation = (e) => e.stopPropagation();

  const isEmpty = !loading && (!memoryData || memoryData.length === 0);

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
          <MemoryStick className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Memory Usage
          </span>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <BarChart2 className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No memory data available
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

          {/* Area Chart */}
          <div className="h-32" onClick={stopPropagation}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoryData} margin={{ left: 11, right: 11 }}>
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#93C5FD"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
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
