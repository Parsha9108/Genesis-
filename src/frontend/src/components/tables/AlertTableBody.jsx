import React from 'react';

const AlertTableBody = ({ alerts = [], isDarkMode = false }) => {
  const cellTextColor = isDarkMode ? '#FFFFFF' : '#1F2937';
  const secondaryTextColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const rowBorderColor = isDarkMode ? '#374151' : '#F3F4F6';

  return alerts.map((alert, index) => (
    <tr key={index} style={{ borderBottom: `1px solid ${rowBorderColor}` }}>
      <td className="py-3 px-2" style={{ color: secondaryTextColor }}>
  {new Date(alert.created_at).toLocaleString()}
</td>
      <td className="py-3 px-2" style={{ color: cellTextColor }}>{alert.alert_type}</td>
      <td className="py-3 px-2" style={{ color: cellTextColor }}>{alert.hostname}</td>
    </tr>
  ));
};

export default AlertTableBody;
