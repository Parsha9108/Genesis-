import React, { useCallback, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useMarkAlertAsReadMutation } from '../../redux/alertFilterApi';
import '../../components/index.css';

const NotificationDropdown = ({
  isDarkMode,
  setShowNotificationModal,
  openDropdown,
  toggleDropdown,
  buttonStyles,
  dropdownStyles,
  textColor,
  secondaryTextColor,
  borderColor,
  alerts = [],
}) => {
  const navigate = useNavigate();
  // ✅ Track which specific notification is sliding out by UUID
  const [slidingOutId, setSlidingOutId] = useState(null);
  const [markAsRead] = useMarkAlertAsReadMutation();

  // ✅ Simple filter: Critical + unread (is_read === false)
  const criticalUnreadAlerts = useMemo(() => {
    return alerts
      .filter(alert => 
        alert.severity?.toLowerCase() === 'critical' && 
        alert.is_read === false
      )
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [alerts]);

  const unreadCount = criticalUnreadAlerts.length;

  const viewAllNotifications = useCallback(() => {
    setShowNotificationModal(true);
    toggleDropdown(null);
  }, [setShowNotificationModal, toggleDropdown]);

  const handleNotificationClick = useCallback(async (notification) => {
    // ✅ Set the specific notification ID that's sliding out
    setSlidingOutId(notification.uuid);

    try {
      // ✅ Call API to mark as read
      await markAsRead(notification.uuid).unwrap();
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
    }

    // ✅ Navigate after animation
    setTimeout(() => {
      setSlidingOutId(null);
      navigate('/alerts', {
        state: {
          findAlertId: notification.uuid,
          fromNotification: true,
        },
      });
      toggleDropdown(null);
    }, 300);
  }, [navigate, toggleDropdown, markAsRead]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => toggleDropdown(openDropdown === 'notifications' ? null : 'notifications')}
        className="p-2 rounded-lg transition-opacity duration-300 hover:opacity-80 active:scale-[0.98]"
        style={buttonStyles}
        aria-label={`Notifications ${unreadCount ? `(${unreadCount})` : ''}`}
      >
        <Bell className={`w-5 h-5 ${unreadCount ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {openDropdown === 'notifications' && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-30"
          style={dropdownStyles}
        >
          {/* Header */}
          <div
            className="p-4 font-semibold text-sm border-b flex justify-between items-center"
            style={{ color: textColor, borderColor }}
          >
            <span>Critical Notifications</span>
          </div>

          {/* List */}
          <div className="overflow-y-auto text-sm max-h-80 custom-scroll">
            {criticalUnreadAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium" style={{ color: textColor }}>
                  All Clear!
                </p>
                <p className="text-xs mt-1 text-gray-500">
                  No critical notifications
                </p>
              </div>
            ) : (
              criticalUnreadAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.uuid}
                  onClick={() => handleNotificationClick(alert)}
                  className={`p-4 cursor-pointer border-b transition-all duration-300
                    ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                    ${slidingOutId === alert.uuid ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                  `}
                  style={{ borderColor }}
                >
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium mb-1" style={{ color: textColor }}>
                        {alert.message}
                      </p>
                      {alert.device_name && (
                        <p className="text-xs text-gray-500 mb-1">
                          {alert.device_name}
                        </p>
                      )}
                      {alert.alert_type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                          {alert.alert_type}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {criticalUnreadAlerts.length > 0 && (
            <div className="p-3 border-t" style={{ borderColor }}>
              <button
                onClick={viewAllNotifications}
                className="w-full py-2 px-4 text-sm font-medium rounded-lg bg-[#6366f1] text-white hover:bg-[#6366f1]/80"
              >
                View All ({unreadCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NotificationDropdown.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
  setShowNotificationModal: PropTypes.func.isRequired,
  openDropdown: PropTypes.string,
  toggleDropdown: PropTypes.func.isRequired,
  buttonStyles: PropTypes.object.isRequired,
  dropdownStyles: PropTypes.object.isRequired,
  textColor: PropTypes.string.isRequired,
  secondaryTextColor: PropTypes.string.isRequired,
  borderColor: PropTypes.string.isRequired,
  alerts: PropTypes.array.isRequired,
};

export default NotificationDropdown;
