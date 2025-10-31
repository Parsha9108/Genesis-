import { useEffect, useState } from 'react';
import { Cpu, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useRefreshSettings } from '../../Contexts/RefreshContext';

export const CPUCard = ({ isDarkMode, cpuMap }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshInterval } = useRefreshSettings();
  const liveCpu = cpuMap?.[id];
  const utilization = parseFloat(liveCpu?.cpu_utilization) || 0;
  const [cpuData, setCpuData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { interval: refreshInterval > 0 ? refreshInterval : 1 };
      const res = await axios.get(`/api/webuser/device/cpu-utilization/${id}/`, { params });
      setCpuData(res.data);
    } catch (err) {
      console.error('[CPUCard] Error fetching CPU data:', err.response?.data || err.message);
      setCpuData([]);
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

  const handleCardClick = () => navigate(`/devices/${id}/cpu_details`);
  const stopPropagation = (e) => e.stopPropagation();

  const isEmpty = !loading && (!cpuData || cpuData.length === 0);

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
          <Cpu className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            CPU Usage
          </span>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <BarChart2 className={`w-10 h-10 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No CPU data available
          </p>
        </div>
      ) : (
        <>
          {/* Live usage display */}
          <div className="mb-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Live: {utilization}%
            </span>
          </div>

          {/* Bar Chart */}
          <div className="h-32" onClick={stopPropagation}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpuData} margin={{ left: 11, right: 11 }}>
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
                <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              </BarChart>
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
