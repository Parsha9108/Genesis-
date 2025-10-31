import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useMarkAllAsReadMutation } from '../../redux/alertFilterApi';
import { timeAgo } from './TimeAgo';

const PopupNotification = ({ isDarkMode, onClose }) => {

  // RTK Query mutation for marking all as read
  const [markAllAsRead, { isLoading: loading, isError, error }] = useMarkAllAsReadMutation();

  // Filter for critical unread notifications only
  const criticalNotifications = useMemo(() => {
    if (!alertsResponse?.results) return [];
    return alertsResponse.results
      .filter(alert => 
        alert.is_read === false && 
        alert.severity?.toLowerCase() === 'critical'
      )
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [alertsResponse?.results]);

  // Handle mark all as read using RTK Query mutation
  const handleMarkAllAsRead = async () => {
    if (criticalNotifications.length === 0) return;

    try {
      const allAlertIds = criticalNotifications.map(notification => notification.uuid);
      
      // Use RTK Query mutation instead of manual fetch
      await markAllAsRead(allAlertIds).unwrap();
      
      console.log(`${allAlertIds.length} critical alerts marked as read successfully`);
      onClose(); // Close modal on success
      
    } catch (err) {
      console.error('Failed to mark all critical notifications as read:', err);
      // Error is automatically tracked by RTK Query
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 max-w-xl w-full relative shadow-2xl border flex flex-col"
        style={{
          background: isDarkMode
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(246, 245, 248, 1)',
          borderColor: isDarkMode
            ? 'rgba(51, 65, 85, 0.4)'
            : 'rgba(203, 213, 225, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          disabled={loading}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2
          className="text-xl font-semibold mb-5"
          style={{ color: isDarkMode ? '#F1F5F9' : '#1E293B' }}
        >
          Critical Notifications
        </h2>

        {/* Error Message */}
        {isError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">
              Error: {error?.error || 'Failed to mark all alerts as read'}
            </p>
          </div>
        )}

        {/* Notifications content - flex-1 to take remaining space */}
        <div
          className="max-h-80 overflow-y-auto space-y-2 no-scrollbar flex-1 mb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {criticalNotifications.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: isDarkMode ? '#64748B' : '#94A3B8' }}
            >
              No critical notifications
            </p>
          ) : (
            criticalNotifications.map((alert, index) => (
              <div key={alert.uuid}>
                {/* Notification card */}
                <div
                  className="p-3 rounded-md"
                  style={{
                    color: isDarkMode ? '#E2E8F0' : '#334155',
                    background: isDarkMode
                      ? 'rgba(17,24,39,0.3)'
                      : 'rgba(248,250,252,0.8)',
                  }}
                >
                  <p className="font-medium leading-relaxed">{alert.message}</p>

                  {/* Time */}
                  {alert.created_at && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
                    >
                      {timeAgo(alert.created_at)}
                    </p>
                  )}
                </div>

                {/* Divider */}
                {index < criticalNotifications.length - 1 && (
                  <div
                    className="h-px my-2"
                    style={{
                      background: isDarkMode
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Mark All as Read Button - positioned at bottom left */}
        {criticalNotifications.length > 0 && (
          <div className="flex justify-start">
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className={`text-sm font-medium px-4 py-2 rounded-md transition relative
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                ${isDarkMode
                  ? 'bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:hover:bg-[#6366f1]'
                  : 'bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:hover:bg-[#6366f1]'
                }`}
            >
              {loading ? (
                <>
                  <span className="opacity-0">Mark All as Read</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                'Mark All as Read'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupNotification;
