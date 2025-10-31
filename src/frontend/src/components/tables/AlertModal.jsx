import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const timeAgo = (dateString) => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = Math.round((now - then) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const AlertModal = ({ isOpen, onClose, alert, isDarkMode }) => {
  const navigate = useNavigate();

  if (!isOpen || !alert) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return isDarkMode ? '#F87171' : '#DC2626';
      case 'Warning':
        return isDarkMode ? '#FBBF24' : '#CA8A04';
      case 'Info':
        return isDarkMode ? '#34D399' : '#059669';
      default:
        return isDarkMode ? '#CBD5E1' : '#64748B';
    }
  };

  const handleDeviceClick = () => {
    if ( alert.agent_id) {
      onClose(); 
      navigate(`/devices/${alert.agent_id}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 max-w-xl w-full relative shadow-2xl border"
        style={{
          background: isDarkMode
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(246, 245, 248, 1)',
          borderColor: isDarkMode
            ? 'rgba(51, 65, 85, 0.4)'
            : 'rgba(203, 213, 225, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2
          className="text-xl font-semibold mb-5"
          style={{ color: isDarkMode ? '#F1F5F9' : '#1E293B' }}
        >
          Alert Details
        </h2>

        {/* Alert content */}
        <div
          className="max-h-80 overflow-y-auto space-y-2 no-scrollbar"
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

          {/* Device info card - Now clickable */}
          <div
            className="p-3 rounded-md cursor-pointer hover:bg-opacity-80 transition-all duration-200"
            style={{
              color: isDarkMode ? '#E2E8F0' : '#334155',
              background: isDarkMode
                ? 'rgba(17,24,39,0.3)'
                : 'rgba(248,250,252,0.8)',
            }}
            onClick={handleDeviceClick}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div
                  className="text-xs uppercase mb-1"
                  style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
                >
                  Device
                </div>
                <div className="font-medium text-base hover:text-blue-500 transition-colors">
                  {alert.device_name || alert.hostname}
                </div>
              </div>
              <div>
                <div
                  className="text-xs uppercase mb-1"
                  style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
                >
                  Component
                </div>
                <div className="font-medium text-base">{alert.alert_type}</div>
              </div>
              <div>
                <div
                  className="text-xs uppercase mb-1"
                  style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
                >
                  Severity
                </div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: getSeverityColor(alert.severity) + '22',
                    color: getSeverityColor(alert.severity),
                    border: `1px solid ${getSeverityColor(alert.severity)}44`,
                  }}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
            
            {/* Visual indicator for clickable area */}
            <div className="mt-2 text-xs opacity-60 hover:opacity-100 transition-opacity">
              Click to view device details →
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px my-2"
            style={{
              background: isDarkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
            }}
          />

          {/* Time info card */}
          <div
            className="p-3 rounded-md"
            style={{
              color: isDarkMode ? '#E2E8F0' : '#334155',
              background: isDarkMode
                ? 'rgba(17,24,39,0.3)'
                : 'rgba(248,250,252,0.8)',
            }}
          >
            <div
              className="text-xs uppercase mb-1"
              style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
            >
              Time
            </div>
            <div className="font-medium">
              {alert.created_at}
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: '#94A3B8' }}
              >
                &middot; {timeAgo(alert.created_at)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px my-2"
            style={{
              background: isDarkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
            }}
          />

          {/* Message card */}
          <div
            className="p-3 rounded-md"
            style={{
              color: isDarkMode ? '#E2E8F0' : '#334155',
              background: isDarkMode
                ? 'rgba(17,24,39,0.3)'
                : 'rgba(248,250,252,0.8)',
            }}
          >
            <div
              className="text-xs uppercase mb-2"
              style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}
            >
              Message
            </div>
            <p className="font-medium leading-relaxed">{alert.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
