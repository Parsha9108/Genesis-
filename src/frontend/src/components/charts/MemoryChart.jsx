import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const MemoryChart = ({ usageData = [], isDarkMode = false }) => {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(400);
  const chartHeight = 200;
  const lineColor = '#3B82F6';

  const bgColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
  const labelColor = isDarkMode ? '#FFFFFF' : '#1F2937';
  const gridColor = isDarkMode ? '#374151' : '#E5E7EB';

  const pointGap = usageData.length > 1 ? chartWidth / (usageData.length - 1) : 0;

  const { areaPath, linePoints, points } = useMemo(() => {
    if (!usageData.length) return { areaPath: '', linePoints: '', points: [] };

    const points = usageData.map((point, index) => {
      const x = index * pointGap;
      const y = chartHeight - point.usage * 2;
      return { ...point, x, y };
    });

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `M 0,${points[0].y} ${linePoints} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

    return { areaPath, linePoints, points };
  }, [usageData, pointGap]);

  const [tooltip, setTooltip] = useState(null);

  //  ResizeObserver for dynamic width
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setChartWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="p-6 rounded-lg shadow-md relative"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: labelColor }}>
        Memory Usage
      </h3>

      <div className="relative h-48 w-full">
        <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={chartHeight - y * 2}
              x2={chartWidth}
              y2={chartHeight - y * 2}
              stroke={gridColor}
              strokeWidth="1"
            />
          ))}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#memoryGradient)" />}
          
          {/* Animated Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'dash 1.2s ease-out forwards'
            }}
          />

          {/* Data Points with Hover */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={lineColor}
              stroke="#FFFFFF"
              strokeWidth="2"
              onMouseEnter={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                setTooltip({
                  x: point.x,
                  y: point.y,
                  usage: point.usage,
                  time: point.time,
                  left: e.clientX - rect.left + 10,
                  top: e.clientY - rect.top - 10
                });
              }}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute px-2 py-1 rounded text-xs shadow-lg z-10"
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              left: tooltip.left,
              top: tooltip.top,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none'
            }}
          >
            <div><strong>{tooltip.usage}%</strong></div>
            <div>{tooltip.time}</div>
          </div>
        )}

        {/* Y-axis Labels */}
        <div
          className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs px-1"
          style={{ color: '#6B7280' }}
        >
          {[100, 80, 60, 40, 20, 0].map(val => (
            <span key={val}>{val}%</span>
          ))}
        </div>
      </div>

      {/* Line Animation CSS */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

MemoryChart.propTypes = {
  usageData: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      usage: PropTypes.number.isRequired
    })
  ),
  isDarkMode: PropTypes.bool
};

export default React.memo(MemoryChart);
