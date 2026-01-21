import React from 'react';
import PropTypes from 'prop-types';

function SummaryCard({
  summary = {},
  title = 'Summary',
  isDarkMode = false,
  isFiltered = false,
}) {
  return (
    <div
      className="p-4 sm:p-6 rounded-lg shadow-md"
      style={{
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
      }}
    >
      <h3
        className="text-base sm:text-lg font-semibold mb-4"
        style={{ color: isDarkMode ? '#FFFFFF' : '#525759' }}
      >
        {title} {isFiltered && '(Filtered)'}
      </h3>

      <div className="space-y-3 sm:space-y-4">
        <SummaryRow
          label="Critical"
          value={summary.Critical || 0}
          valueClass="text-red-600"
          isDarkMode={isDarkMode}
        />
        <SummaryRow
          label="Warning"
          value={summary.Warning || 0}
          valueClass="text-yellow-600"
          isDarkMode={isDarkMode}
        />
        <SummaryRow
          label="Info"
          value={summary.Info || 0}
          valueClass="text-green-600"
          isDarkMode={isDarkMode}
        />

        <hr style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />

        <SummaryRow
          label="Total"
          value={summary.total || 0}
          valueClass="text-blue-600 font-semibold"
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass, isDarkMode }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
        {label}
      </span>
      <span className={`px-2 py-1 rounded font-bold ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

SummaryCard.propTypes = {
  summary: PropTypes.object,
  title: PropTypes.string,
  isDarkMode: PropTypes.bool,
  isFiltered: PropTypes.bool,
};

export default SummaryCard;
