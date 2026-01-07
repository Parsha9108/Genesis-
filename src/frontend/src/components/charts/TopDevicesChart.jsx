import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const getBarColor = (value) => {
  if (value >= 75) return '#10b981'; // green
  if (value >= 50) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

const TopDevicesChart = ({ devices = [], isDarkMode = false }) => {
  const [tooltip, setTooltip] = useState(null);

  const styles = useMemo(() => ({
    bgColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
    textColor: isDarkMode ? '#FFFFFF' : '#1F2937',
    labelColor: isDarkMode ? '#D1D5DB' : '#6B7280',
    barBackground: isDarkMode ? '#374151' : '#E5E7EB',
  }), [isDarkMode]);

  // Sort devices by value and pick top 5
  const topDevices = useMemo(() => {
    return [...devices]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [devices]);

  return (
    <div
      className="p-6 rounded-lg shadow-md relative"
      style={{
        backgroundColor: styles.bgColor,
        border: `1px solid ${styles.borderColor}`,
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: styles.textColor }}>
        Top Devices
      </h3>

      <div className="space-y-4">
        {topDevices.length > 0 ? (
          topDevices.map((device) => {
            const barColor = getBarColor(device.value);
            const valuePosition = device.value > 15 ? 'right-3' : 'left-3';

            return (
              <div
                key={device.id}
                className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 relative group"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    top: rect.top,
                    left: rect.left + rect.width / 2,
                    value: device.value,
                    id: device.id,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <span
                  className="text-sm font-medium w-24 truncate"
                  style={{ color: styles.labelColor }}
                  title={device.id}
                >
                  {device.id}
                </span>
                <div
                  className="flex-1 h-8 rounded-full relative overflow-hidden"
                  style={{ backgroundColor: styles.barBackground }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${device.value}%`,
                      backgroundColor: barColor,
                    }}
                  />
                  <span
                    className={`absolute ${valuePosition} top-1/2 transform -translate-y-1/2 text-xs font-medium`}
                    style={{ color: styles.textColor }}
                  >
                    {device.value}%
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm" style={{ color: styles.labelColor }}>
            No data available.
          </p>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute px-2 py-1 text-xs rounded shadow-lg z-50"
          style={{
            left: tooltip.left,
            top: tooltip.top - 40,
            transform: 'translateX(-50%)',
            backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
            color: isDarkMode ? '#FFFFFF' : '#1F2937',
            pointerEvents: 'none'
          }}
        >
          <div className="font-semibold">{tooltip.id}</div>
          <div>{tooltip.value}% usage</div>
        </div>
      )}
    </div>
  );
};

TopDevicesChart.propTypes = {
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  isDarkMode: PropTypes.bool,
};

export default React.memo(TopDevicesChart);
