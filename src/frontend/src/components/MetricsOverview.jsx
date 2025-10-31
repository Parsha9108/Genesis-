import React ,{useState,useEffect}from 'react';
import PropTypes from 'prop-types';
import StatCard from './charts/StatCard';
import { MonitorCheck, Server, MonitorX,  TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MetricsOverview = ({ data, isDarkMode,activeDevicesCount,inactiveDevicesCount }) => {
  const navigate=useNavigate();
  
  

const totalAlerts = Array.isArray(data)
  ? data.reduce((sum, device) => {
      const alerts = device?.monitoring_data?.alerts;
      return sum + (Array.isArray(alerts) ? alerts.length : 0);
    }, 0)
  : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Devices"
        value={data.length}
        color="#2563EB" 
        icon={Server}
        isDarkMode={isDarkMode}
        onClick={() => navigate('/devices')}
      />
      <StatCard
        title="Active Devices"
        value={activeDevicesCount}
        color="#10b981" 
        icon={MonitorCheck}
        isDarkMode={isDarkMode}
         onClick={() => navigate('/devices?status=active')}
      />
      <StatCard
        title="Inactive Devices"
        value={inactiveDevicesCount}
        color="#ef4444" 
        icon={MonitorX}
        isDarkMode={isDarkMode}
         onClick={() => navigate('/devices?status=inactive')}
      />
      <StatCard
        title="Alerts"
        value={totalAlerts}
        color="#F59E0B" 
        icon={ TriangleAlert}
        isDarkMode={isDarkMode}
        onClick={()=>navigate('/alerts')}
      />
    </div>
  );
};

MetricsOverview.propTypes = {
  data: PropTypes.shape({
    totalDevices: PropTypes.number,
    activeDevices: PropTypes.number,
    inactiveDevices: PropTypes.number,
    recentAlerts: PropTypes.number
  }).isRequired,
  isDarkMode: PropTypes.bool
};

export default MetricsOverview;
