import React, { useState } from "react";
import { AlertCircle, Circle, CheckCheck } from 'lucide-react';
import {
  useGetAlertsQuery,
  useGetAlertFilterOptionsQuery,
  useUnreadCountsQuery,
  useMarkAlertAsReadMutation,
  useMarkAllAlertsAsReadMutation,
} from '../../redux/alertFilterApi';
import '../../components/index.css';
import FilterDropdown from '../tables/FilterDropdown';
import { useAuth } from "../../Contexts/AuthContext";

export const AlertsCard = ({ isDarkMode = false, deviceId, limit = 100 }) => {
  const table_columns = [
    { id: 1, name: "TIME" },
    { id: 2, name: "COMPONENT" },
    { id: 3, name: "SEVERITY" },
    { id: 4, name: "DESCRIPTION" },
  ];

  const { user, authenticated } = useAuth();

  const [filters, setFilters] = useState({
    alert_type: "",
    severity: "",
    dateFrom: "",
    dateTo: "",
  });

  const [markAlertAsRead, { isLoading: isMarkingRead }] = useMarkAlertAsReadMutation();
  const [markAllAlertsAsRead, { isLoading: isMarkingAllRead }] = useMarkAllAlertsAsReadMutation();

  const { data: filterOptionsData } = useGetAlertFilterOptionsQuery(deviceId);
  const filterOptions = {
    device: filterOptionsData?.device || [],
    component: filterOptionsData?.component || [],
    severity: filterOptionsData?.severity || [],
  };

  const queryParams = {
    device_id: deviceId,
    ...(filters.alert_type && { alert_type: filters.alert_type }),
    ...(filters.severity && { severity: severity }),
    ...(filters.dateFrom && { start_date: filters.dateFrom }),
    ...(filters.dateTo && { end_date: filters.dateTo }),
  };

  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useGetAlertsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: unreadData,
    isFetching: isUnreadFetching,
    refetch: refetchUnread
  } = useUnreadCountsQuery(deviceId, { skip: !deviceId });

  const displayAlerts = apiResponse?.results?.alerts || [];
  const totalCount = apiResponse?.count || 0;
  const unreadCount = unreadData?.unread_count || 0;
  const hasUnread = unreadCount > 0;

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleRowClick = async (alert) => {
    if (alert.is_read) {
      console.log("Alert already read, skipping");
      return;
    }

    if (!authenticated || !user || !alert.uuid) {
      console.warn("User not authenticated or missing alert UUID");
      return;
    }

    try {
      console.log(`Marking alert ${alert.uuid} as read...`);
      await markAlertAsRead(alert.uuid).unwrap();
      console.log("Alert marked as read, refetching data...");
      
      await Promise.all([
        refetch(),
        refetchUnread()
      ]);
      
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  //  just send device UUID
  const handleMarkAllAsRead = async () => {
    if (!authenticated || !user) {
      console.warn("User not authenticated");
      return;
    }

    if (!hasUnread) {
      console.log("No unread alerts to mark");
      return;
    }

    if (!deviceId) {
      console.warn("No device ID provided");
      return;
    }

    try {
      console.log(`Marking all alerts as read for device: ${deviceId}`);

      // Send only device UUID to backend
      await markAllAlertsAsRead(deviceId).unwrap();

      console.log("All alerts marked as read, refetching data...");

      await Promise.all([
        refetch(),
        refetchUnread()
      ]);

      console.log("Data refreshed successfully");
    } catch (error) {
      console.error(" Failed to mark all alerts as read:", error);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filterConfig = [
    { key: "alert_type", label: "Component", type: "select", optionsKey: "component" },
    { key: "severity", label: "Severity", type: "select", optionsKey: "severity" },
    { key: "date", label: "Date Range", type: "dateRange" },
  ];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const severityColor = {
    Critical: 'bg-red-100 text-red-600 w-20',
    Warning: 'bg-yellow-100 text-yellow-700 w-20',
    Info: 'bg-green-100 text-green-600 w-20',
  };

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0 mt-4">
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
        }}
      >
        <div className="p-3 sm:p-4 flex justify-between items-center font-medium tracking-wider text-xs py-3 px-4 text-gray-600">
          <span className="text-base sm:text-lg font-semibold flex items-center gap-2"
            style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
            Alerts ({isLoading ? '...' : displayAlerts.length})

            {hasUnread && (
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1
                  bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-700
                  ${isUnreadFetching ? 'animate-pulse' : ''}`}>
                  <Circle className="w-3 h-3 fill-current" />
                  <span>{unreadCount}</span>
                </span>
              </div>
            )}

            {hasActiveFilters && totalCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-2">
                Filtered ({totalCount})
              </span>
            )}
          </span>

          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${isDarkMode
                    ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/30'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                  }
                  ${isMarkingAllRead ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
                title="Mark all unread alerts as read"
              >
                <CheckCheck className="w-4 h-4" />
                {isMarkingAllRead ? 'Marking...' : 'Mark All Read'}
              </button>
            )}

            <FilterDropdown
              filterConfig={filterConfig}
              filters={filters}
              filterOptions={filterOptions}
              onFiltersChange={handleFiltersChange}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto overflow-x-auto px-4 py-4 custom-scroll">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p>{hasActiveFilters ? 'Loading filtered alerts...' : 'Loading alerts...'}</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Alerts</h3>
                <p>{error?.data?.message || 'Failed to load alerts. Please try again.'}</p>
              </div>
            ) : displayAlerts.length === 0 ? (
              <div className="text-center py-8" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                  {hasActiveFilters ? 'No Alerts Match Filters' : 'No Alerts Available'}
                </h3>
                <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  {hasActiveFilters
                    ? `No alerts match your filters (${totalCount} total available).`
                    : 'No alerts have been generated for this device yet.'
                  }
                </p>
              </div>
            ) : (
              <table
                className={`w-full text-xs text-left border-collapse font-medium tracking-wider min-w-[600px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
              >
                <thead>
                  <tr className="sticky top-[-17px] z-5 font-normal" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                    {table_columns.map((column) => (
                      <th key={column.id} className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayAlerts.map((alert, index) => (
                    <tr
                      key={alert.uuid || `alert-${index}`}
                      onClick={() => handleRowClick(alert)}
                      className={`
                        transition-all duration-300 ease-in-out
                        py-1.5 my-0.5 
                        ${!alert.is_read
                          ? "cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 border-l-4 border-indigo-500"
                          : isDarkMode
                            ? index % 2 === 0
                              ? "bg-gray-800 hover:bg-gray-700"
                              : "bg-gray-900 hover:bg-gray-800"
                            : index % 2 === 0
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-white hover:bg-gray-50"
                        }
                      `}
                      title={!alert.is_read ? "Click to mark as read" : "Already read"}
                    >
                      <td className="py-3 px-4 text-center text-xs whitespace-nowrap">
                        {formatDateTime(alert.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {alert.alert_type || alert.component}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${severityColor[alert.severity] || 'bg-gray-100 text-gray-600'}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" title={alert.message || alert.description}>
                        <div className="max-w-md break-words">
                          {alert.message || alert.description || alert.details}
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
