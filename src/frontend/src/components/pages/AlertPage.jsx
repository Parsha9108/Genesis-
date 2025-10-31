import React from 'react';
import AlertDashboard from '../tables/AlertsDashboard';

const AlertPage = ({ isDarkMode }) => {
  return (
    <div>
      <AlertDashboard isDarkMode={isDarkMode} />
    </div>
  );
};

export default AlertPage;
