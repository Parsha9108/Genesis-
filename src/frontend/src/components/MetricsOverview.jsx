import React from 'react';
import PropTypes from 'prop-types';
import StatCard from './charts/StatCard';
import { MonitorCheck, Server, MonitorX, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MetricsOverview = ({ data, isDarkMode, activeDevicesCount, inactiveDevicesCount }) => {
  const navigate = useNavigate();

  const totalAlerts = Array.isArray(data)
    ? data.reduce((sum, device) => {
        const alerts = device?.monitoring_data?.alerts;
        return sum + (Array.isArray(alerts) ? alerts.length : 0);
      }, 0)
    : 0;

  const totalDevices = data.length;

  //  Conditional navigation handlers
  const handleTotalDevicesClick = () => {
    if (totalDevices > 0) {
      navigate('/devices');
    }
  };

  const handleActiveDevicesClick = () => {
    if (activeDevicesCount > 0) {
      navigate('/devices?status=active');
    }
  };

  const handleInactiveDevicesClick = () => {
    if (inactiveDevicesCount > 0) {
      navigate('/devices?status=inactive');
    }
  };

  const handleAlertsClick = () => {
    if (totalAlerts > 0) {
      navigate('/alerts');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Devices"
        value={totalDevices}
        color="#2563EB"
        icon={Server}
        isDarkMode={isDarkMode}
        onClick={handleTotalDevicesClick}
    
      />
      <StatCard
        title="Active Devices"
        value={activeDevicesCount}
        color="#10b981"
        icon={MonitorCheck}
        isDarkMode={isDarkMode}
        onClick={handleActiveDevicesClick}
     
      />
      <StatCard
        title="Inactive Devices"
        value={inactiveDevicesCount}
        color="#ef4444"
        icon={MonitorX}
        isDarkMode={isDarkMode}
        onClick={handleInactiveDevicesClick}

      />
      <StatCard
        title="Alerts"
        value={totalAlerts}
        color="#F59E0B"
        icon={TriangleAlert}
        isDarkMode={isDarkMode}
        onClick={handleAlertsClick}

      />
    </div>
  );
};

MetricsOverview.propTypes = {
  data: PropTypes.array.isRequired,
  isDarkMode: PropTypes.bool,
  activeDevicesCount: PropTypes.number.isRequired,
  inactiveDevicesCount: PropTypes.number.isRequired,
};

export default MetricsOverview;
