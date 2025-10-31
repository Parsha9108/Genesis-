import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import DeviceStatusChart from './DeviceStatusChart';
import DeviceTypeChart from './DeviceTypeChart';

/**
 * Renders either a status or type donut chart depending on the props passed.
 * @param {string} title - Chart title
 * @param {number} value - Optional value for single metric display
 * @param {number} activeCount - Active device count
 * @param {number} inactiveCount - Inactive device count
 * @param {object} deviceTypes - Optional object with type breakdown (used instead of active/inactive)
 * @param {boolean} isDarkMode - Enables dark styling
 */
const DonutChart = ({
  title,
  value,
  activeCount,
  inactiveCount,
  deviceTypes,
  isDarkMode
}) => {
  const isTypeChart = useMemo(() => {
    return deviceTypes && typeof deviceTypes === 'object' && Object.keys(deviceTypes).length > 0;
  }, [deviceTypes]);

  return isTypeChart ? (
    <DeviceTypeChart
      title={title}
      deviceTypes={deviceTypes}
      isDarkMode={isDarkMode}
    />
  ) : (
    <DeviceStatusChart
      title={title}
      value={value}
      activeCount={activeCount}
      inactiveCount={inactiveCount}
      isDarkMode={isDarkMode}
    />
  );
};

DonutChart.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number,
  activeCount: PropTypes.number,
  inactiveCount: PropTypes.number,
  deviceTypes: PropTypes.object,
  isDarkMode: PropTypes.bool
};

export default React.memo(DonutChart);
