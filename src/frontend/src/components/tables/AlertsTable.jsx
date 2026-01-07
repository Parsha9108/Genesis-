import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useGetAlertsQuery } from "../../redux/alertFilterApi";
import AlertTableBody from './AlertTableBody';

const AlertsTable = ({ isDarkMode = false }) => {
  const navigate = useNavigate();

  // Fetch all alerts using RTK Query
  const {
    data: apiResponse,
    isLoading,
    isError,
    error
  } = useGetAlertsQuery({}, {
    refetchOnMountOrArgChange: true,
  });

  // Extract alerts from response
  const alerts = apiResponse?.results?.alerts || [];

  const bgColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
  const cellTextColor = isDarkMode ? '#FFFFFF' : '#1F2937';
  const headerTextColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const placeholderTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  // Filter unread critical alerts, sort by creation time, and pick latest 3
  const latestUnreadAlerts = useMemo(() => {
    return alerts
      .filter(alert => 
        alert.severity?.toLowerCase() === 'critical' && 
        alert.is_read === false
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);
  }, [alerts]);

  return (
    <div
      className="p-6 rounded-lg shadow-md flex flex-col justify-between h-full"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: cellTextColor }}>
        Recent Alerts
      </h3>

      <div className="flex-1 mb-4 overflow-x-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <div style={{ color: placeholderTextColor }}>Loading alerts...</div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <AlertCircle
              className="w-10 h-10 mb-1"
              color={isDarkMode ? '#EF4444' : '#DC2626'}
            />
            <div style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }}>
              {error?.data?.message || 'Failed to load alerts'}
            </div>
          </div>
        ) : latestUnreadAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <AlertCircle
              className="w-10 h-10 mb-1"
              color={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
            <div style={{ color: placeholderTextColor }}>No recent critical alerts</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th className="text-left py-3 px-2 font-medium" style={{ color: headerTextColor }}>
                  Time
                </th>
                <th className="text-left py-3 px-2 font-medium" style={{ color: headerTextColor }}>
                  Alert Type
                </th>
                <th className="text-left py-3 px-2 font-medium" style={{ color: headerTextColor }}>
                  Device
                </th>
              </tr>
            </thead>
            <tbody>
              <AlertTableBody
                alerts={latestUnreadAlerts}
                isDarkMode={isDarkMode}
                isLoading={isLoading}
              />
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-auto text-right">
        <button
          onClick={() => navigate('/alerts')}
          className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm
            ${
              isDarkMode
                ? 'bg-[#6366F1] text-white hover:bg-[#4f46e5] hover:shadow-md'
                : 'bg-[#DDEBFF] text-[#4F6EF7] hover:bg-[#C8DFFF] hover:shadow-md'
            }`}
        >
          View All Alerts →
        </button>
      </div>
    </div>
  );
};

export default AlertsTable;
