import React from 'react';
import { 
  AreaChart, 
  BarChart, 
  LineChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell, 
  ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';


// ✅ UNIFIED: Single color function for all resource types
export const getUsageColor = (percentage, type = 'cpu') => {
  switch(type) {
    case 'cpu':
      if (percentage <= 50) return '#10B981';  // Good
      else if (percentage <= 80) return '#F59E0B';  // Moderate
      else return '#EF4444';  // High

    case 'disk':
    case 'storage':  // Support both 'disk' and 'storage'
      if (percentage <= 70) return '#10B981';  // Healthy
      else if (percentage <= 85) return '#F59E0B';  // Warning
      else return '#EF4444';  // Critical

    case 'memory':
      if (percentage <= 75) return '#10B981';  // Good
      else if (percentage <= 90) return '#F59E0B';  // High
      else return '#EF4444';  // Critical

    default: // Default to CPU thresholds
      if (percentage <= 50) return '#10B981';
      else if (percentage <= 80) return '#F59E0B';
      else return '#EF4444';
  }
};


// ✅ UNIFIED: Single performance level function for all resource types
export const getPerformanceLevel = (percentage, type = 'cpu') => {
  switch(type) {
    case 'cpu':
      if (percentage <= 50) {
        return { level: 'Good', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      } else if (percentage <= 80) {
        return { level: 'Moderate', color: '#F59E0B', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      } else {
        return { level: 'High', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      }

    case 'disk':
    case 'storage':  // Support both 'disk' and 'storage'
      if (percentage <= 70) {
        return { level: 'Healthy', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      } else if (percentage <= 85) {
        return { level: 'Warning', color: '#F59E0B', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      } else {
        return { level: 'Critical', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      }

    case 'memory':
      if (percentage <= 75) {
        return { level: 'Good', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      } else if (percentage <= 90) {
        return { level: 'High', color: '#F59E0B', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      } else {
        return { level: 'Critical', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      }

    default: // Default to CPU thresholds
      if (percentage <= 50) {
        return { level: 'Good', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      } else if (percentage <= 80) {
        return { level: 'Moderate', color: '#F59E0B', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      } else {
        return { level: 'High', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      }
  }
};


// Alternative more granular thresholds (keeping for backwards compatibility)
export const getCpuUsageColorDetailed = (percentage) => {
  if (percentage <= 30) {
    return '#10B981'; // green - excellent
  } else if (percentage <= 60) {
    return '#3B82F6'; // blue - good
  } else if (percentage <= 80) {
    return '#F59E0B'; // orange - moderate
  } else if (percentage <= 90) {
    return '#F97316'; // dark orange - high
  } else {
    return '#EF4444'; // red - critical
  }
};


// ✅ RESPONSIVE: Enhanced card styling classes with mobile support
export const cardClass = (isDarkMode) =>
  `rounded-lg shadow-md p-3 sm:p-4 h-48 sm:h-60 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

export const flexibleCardClass = (isDarkMode) =>
  `rounded-lg shadow-md p-3 sm:p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

export const summaryCardClass = (isDarkMode) =>
  `rounded-lg shadow-md p-2 sm:p-3 h-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;

export const headerCardClass = (isDarkMode) =>
  `rounded-lg shadow-md p-3 sm:p-4 min-h-[80px] sm:h-20 flex items-center justify-between ${
    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
  }`;


// ✅ RESPONSIVE: Enhanced chart container classes with mobile optimization
export const getChartContainerClass = (dataLength = 0, isCustomRange = false, granularity = null) => {
  // Special handling for minutely data within 60-minute range
  if (granularity === 'minutely' && dataLength > 0) {
    if (dataLength > 30) {
      return '-ml-2 -mr-2 h-40 sm:h-48 overflow-x-auto custom-scrollbar-horizontal';
    }
  }
  
  if (isCustomRange && dataLength > 20) {
    return '-ml-2 -mr-2 h-40 sm:h-48 overflow-x-auto custom-scrollbar-horizontal';
  }
  return '-ml-2 -mr-2 h-40 sm:h-48';
};


// Graph button classes
export const graphButtonClass = (isActive, isDarkMode) =>
  `flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[#6366f1] text-white'
      : isDarkMode
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;

export const horizontalScrollbarClass = 'custom-scroll';


// Graph types configuration
export const graphTypes = [
  { id: 'bar', label: 'Bar', icon: BarChart3 },
  { id: 'line', label: 'Line', icon: TrendingUp },
  { id: 'area', label: 'Area', icon: Activity },
];


// Polling interval function - Updated with minutely support
export function getOptimalPollingInterval(dataType, useCustomDate) {
  if (useCustomDate) return 0;
  switch (dataType) {
    case 'minutely': return 60000; // 1 minute for real-time updates
    case 'hourly': return 300000;  // 5 minutes
    case 'daily': return 3600000;  // 1 hour
    case 'weekly': return 21600000; // 6 hours
    case 'monthly': return 86400000; // 24 hours
    default: return 300000;
  }
}


// Time label functions - Enhanced getCurrentMinuteLabel for better precision
export function getCurrentMinuteLabel() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function getCurrentHourLabel() {
  const now = new Date();
  const hour = now.getHours();
  const ampm = hour === 0 ? '12AM' :
               hour === 12 ? '12PM' :
               hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  return `${dayName} ${ampm}`;
}

export function getCurrentDayLabel() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${dayName} ${month}/${day}`;
}

export function getCurrentWeekLabel() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + firstDay.getDay() + 1) / 7);
  return `Week ${weekNum}`;
}

export function getCurrentMonthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short' });
}


// Data ordering constants
export const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


// Helper functions
function parseDateFromLabel(label) {
  try {
    if (!label || typeof label !== 'string') {
      console.warn('Invalid label for date parsing:', label);
      return new Date();
    }
    const parts = label.split(' ');
    if (parts.length < 2) {
      console.warn('Invalid label format:', label);
      return new Date();
    }
    const datePart = parts[1];
    if (!datePart || !datePart.includes('/')) {
      console.warn('Invalid date part:', datePart);
      return new Date();
    }
    const now = new Date();
    const fullDateStr = `${now.getFullYear()}-${datePart.replace('/', '-')}`;
    const parsedDate = new Date(fullDateStr);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid parsed date:', fullDateStr);
      return new Date();
    }
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date from label:', label, error);
    return new Date();
  }
}


// Enhanced parseMinuteFromLabel function for minutely data with datetime support
function parseMinuteFromLabel(label) {
  try {
    if (!label || typeof label !== 'string') {
      console.warn('Invalid label for minute parsing:', label);
      return new Date();
    }
    
    // Handle HH:MM format
    if (label.includes(':')) {
      const [hours, minutes] = label.split(':');
      const now = new Date();
      const parsedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                  parseInt(hours) || 0, parseInt(minutes) || 0);
      return parsedTime;
    }
    
    // Handle ISO datetime strings
    if (label.includes('T') || label.length > 10) {
      const parsedDate = new Date(label);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return new Date();
  } catch (error) {
    console.error('Error parsing minute from label:', label, error);
    return new Date();
  }
}


// Enhanced helper functions for 60-minute range validation
export function isValidMinuteRange(startDate, endDate, startTime, endTime) {
  try {
    const start = new Date(`${startDate}T${startTime || '00:00'}`);
    const end = new Date(`${endDate}T${endTime || '23:59'}`);
    const diffMinutes = (end - start) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 60;
  } catch (error) {
    console.error('Error validating minute range:', error);
    return false;
  }
}

export function getMinuteRangeDuration(startDate, endDate, startTime, endTime) {
  try {
    const start = new Date(`${startDate}T${startTime || '00:00'}`);
    const end = new Date(`${endDate}T${endTime || '23:59'}`);
    const diffMinutes = Math.ceil((end - start) / (1000 * 60));
    return Math.max(1, diffMinutes);
  } catch (error) {
    console.error('Error calculating minute range duration:', error);
    return 1;
  }
}

export function isThirtyDaysRange(customStartDate, customEndDate) {
  if (!customStartDate || !customEndDate) return false;
  const start = new Date(customStartDate);
  const end = new Date(customEndDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays === 30;
}


// Enhanced scrolling functions with minutely support
export function shouldUseScrolling(dataLength, isCustomRange = false, granularity = null) {
  // Special case for minutely data: scroll if more than 30 data points
  if (granularity === 'minutely' && dataLength > 30) {
    return true;
  }
  return isCustomRange && dataLength > 20;
}

export function getScrollableChartWidth(dataLength, isCustomRange = false, granularity = null) {
  // Enhanced width calculation for minutely data
  if (granularity === 'minutely' && dataLength > 30) {
    const minBarWidth = 25; // Smaller bars for minute data
    const padding = 60;
    return Math.max(600, dataLength * minBarWidth + padding);
  }
  
  if (isCustomRange && dataLength > 20) {
    const minBarWidth = 40;
    const padding = 60;
    return Math.max(800, dataLength * minBarWidth + padding);
  }
  return '100%';
}


// Enhanced detectDataGranularity with better minutely detection
export function detectDataGranularity(data) {
  if (!data || data.length === 0) return 'unknown';
  const sampleLabels = data.slice(0, 5).map(item => item.name || item.label || '');
  
  // Enhanced minute format detection
  if (sampleLabels.some(label => /^\d{1,2}:\d{2}$/.test(label))) return 'minutely';
  if (sampleLabels.some(label => /^\d{2}:\d{2}$/.test(label))) return 'minutely';
  if (sampleLabels.some(label => label.includes(':') && label.length <= 5)) return 'minutely';
  
  if (sampleLabels.some(label => /\d+(AM|PM)/i.test(label))) return 'hourly';
  if (sampleLabels.some(label => /Week \d+/i.test(label))) return 'weekly';
  if (sampleLabels.some(label => monthsOrder.some(month => label.includes(month)))) return 'monthly';
  if (sampleLabels.some(label => /^[A-Za-z]{3} \d{2}\/\d{2}$/.test(label))) return 'daily';
  return 'daily';
}


// ✅ UPDATED: Enhanced data transformation function with corrected hourly and weekly labels
export function transformStatsData(apiData, dataKey, currentLabel, useCustomDate = false) {
  try {
    console.log(`Transforming ${dataKey} data`, apiData);
    if (!apiData) {
      console.warn(`No ${dataKey} data available:`, apiData);
      return [];
    }
    const dataStructure = apiData;
    const actualData = dataStructure[dataKey];
    if (!actualData || typeof actualData !== 'object') {
      console.warn(`Invalid ${dataKey} data structure:`, actualData);
      return [];
    }

    // ✅ ENHANCED: Pre-analyze data for multi-day detection (for hourly labels)
    let isMultiDayData = false;
    let uniqueDates = new Set();
    
    if (dataKey === 'hourly') {
      const allLabels = Object.keys(actualData);
      allLabels.forEach(label => {
        try {
          // Try to parse as ISO date first
          let date = new Date(label);
          if (isNaN(date.getTime())) {
            // Fallback: try to extract day from label like "Mon 3PM"
            const dayMatch = label.match(/^([A-Za-z]{3})/);
            if (dayMatch) {
              uniqueDates.add(dayMatch[1]);
            }
          } else {
            uniqueDates.add(date.toDateString());
          }
        } catch (e) {
          // If parsing fails, assume single day
        }
      });
      isMultiDayData = uniqueDates.size > 1;
      console.log('Multi-day detection:', { isMultiDayData, uniqueDates: [...uniqueDates] });
    }

    // Enhanced formatLabel function with FIXED hourly and weekly support
    const formatLabel = (label, dataType = dataKey) => {
      if (!label || label === 'undefined' || label === 'null' || typeof label !== 'string') {
        console.warn('Invalid label encountered:', label);
        return null;
      }
      try {
        switch (dataType) {
          case 'minutely': {
            // Handle various minute formats including datetime strings
            if (label.includes('T')) {
              // ISO datetime format
              const date = new Date(label);
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            
            if (label.includes(':')) {
              // Already in HH:MM format, ensure proper padding
              const [hours, minutes] = label.split(':');
              return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }
            
            // If it's just a number, assume it's minutes past the hour
            const minuteMatch = label.match(/(\d+)/);
            if (minuteMatch) {
              const minute = parseInt(minuteMatch[1]);
              const now = new Date();
              const hour = now.getHours();
              return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            }
            return label;
          }
          
          case 'hourly': {
            // ✅ FIXED: Enhanced hourly label formatting with multi-day support
            if (isMultiDayData) {
              // For multi-day ranges, include date + time
              try {
                const date = new Date(label);
                if (!isNaN(date.getTime())) {
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  const hour = date.getHours();
                  const ampm = hour === 0 ? '12AM' : 
                              hour === 12 ? '12PM' : 
                              hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
                  return `${month}/${day} ${ampm}`;
                }
              } catch (e) {
                // Continue to fallback logic
              }
              
              // Fallback: try to enhance existing format
              if (label.match(/^[A-Za-z]{3} \d{1,2}[AP]M$/)) {
                // Format like "Mon 3PM" - try to add date
                const parts = label.split(' ');
                if (parts.length === 2) {
                  const dayName = parts[0];
                  const time = parts[1];
                  // For now, return as-is but could be enhanced with actual dates
                  return `${dayName} ${time}`;
                }
              }
            } else {
              // Single day: use simpler format
              if (label.match(/^[A-Za-z]{3} \d{1,2}[AP]M$/)) return label;
            }
            
            // Original logic for other cases
            const parts = label.split(' ');
            if (parts.length < 2) return label;
            const dayPart = parts[0];
            const timePart = parts.slice(1).join('').toUpperCase();
            const hour = parseInt(timePart.replace(/\D/g, ''));
            const period = timePart.replace(/[^APM]/gi, '');
            return `${dayPart} ${hour}${period}`;
          }
          
          case 'daily':
            return label;
            
          case 'weekly': {
            // ✅ FIXED: Enhanced weekly label formatting with year for uniqueness
            if (label.startsWith('Week ')) {
              const parts = label.split(' ');
              const weekNum = parseInt(parts[1]);
              
              // If there's already year/month info, keep it
              if (parts.length > 2) {
                return label;
              }
              
              // Otherwise, add year for uniqueness
              const currentYear = new Date().getFullYear();
              return weekNum ? `Week ${weekNum}` : label;
            }
            
            // Handle numeric week labels
            const match = label.match(/(\d+)/);
            if (match) {
              const weekNum = parseInt(match[1]);
              const currentYear = new Date().getFullYear();
              return `Week ${weekNum} ${currentYear}`;
            }
            
            return label;
          }
          
          case 'monthly': {
            if (monthsOrder.includes(label)) return label;
            const monthMatch = label.match(/^([A-Za-z]{3})/);
            return monthMatch ? monthMatch[1] : label;
          }
          
          default:
            return label;
        }
      } catch (error) {
        console.error('Error formatting label:', label, error);
        return label;
      }
    };

    const transformedData = Object.entries(actualData)
      .map(([label, value]) => {
        try {
          const formattedLabel = formatLabel(label, dataKey);
          if (!formattedLabel) return null;

          const now = new Date();
          const isFullDayComplete = now.getHours() >= 23;

          const shouldHighlightCurrent = !useCustomDate &&
            formattedLabel === currentLabel &&
            (dataKey === 'daily' ? isFullDayComplete : true);

          return {
            name: formattedLabel,
            label: formattedLabel,
            rawDate: label,
            value: typeof value === 'number' && !isNaN(value) ? Math.round(value * 100) / 100 : 0,
            utilization: typeof value === 'number' && !isNaN(value) ? Math.round(value * 100) / 100 : 0,
            isCurrentTime: shouldHighlightCurrent,
            // Add original data for drill-down functionality
            originalKey: label,
            granularity: dataKey,
            date: label, // Keep original date/time string for drill-down calculations
            time: label,
            // Add timestamp for better sorting of minutely data
            timestamp: dataKey === 'minutely' ? parseMinuteFromLabel(label).getTime() : Date.now()
          };
        } catch (error) {
          console.error('Error processing data entry:', label, value, error);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        try {
          switch (dataKey) {
            case 'minutely': {
              // Enhanced sorting for minutely data using timestamp
              return a.timestamp - b.timestamp;
            }
            case 'hourly': {
              if (!a.name || !b.name) return 0;
              
              // ✅ ENHANCED: Better sorting for multi-day hourly data
              if (isMultiDayData) {
                // Sort by date first, then time
                try {
                  const dateA = new Date(a.rawDate);
                  const dateB = new Date(b.rawDate);
                  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return dateA - dateB;
                  }
                } catch (e) {
                  // Fall through to original logic
                }
              }
              
              // Original sorting logic for single day
              const partsA = a.name.split(' ');
              const partsB = b.name.split(' ');
              if (partsA.length < 2 || partsB.length < 2) return 0;
              const [dayA, timeA] = partsA;
              const [dayB, timeB] = partsB;
              const hourA = parseInt(timeA.replace(/\D/g, '')) || 0;
              const hourB = parseInt(timeB.replace(/\D/g, '')) || 0;
              const isPmA = timeA.includes('PM');
              const isPmB = timeB.includes('PM');
              const adjustedHourA = isPmA && hourA !== 12 ? hourA + 12 : !isPmA && hourA === 12 ? 0 : hourA;
              const adjustedHourB = isPmB && hourB !== 12 ? hourB + 12 : !isPmB && hourB === 12 ? 0 : hourB;
              const dayComparison = daysOrder.indexOf(dayA) - daysOrder.indexOf(dayB);
              return dayComparison !== 0 ? dayComparison : adjustedHourA - adjustedHourB;
            }
            case 'daily': {
              const dateA = parseDateFromLabel(a.name);
              const dateB = parseDateFromLabel(b.name);
              return dateA - dateB;
            }
            case 'weekly': {
              // ✅ ENHANCED: Better sorting for weekly data with year support
              const weekNumA = parseInt(a.name.replace(/Week (\d+).*/, '$1')) || 0;
              const weekNumB = parseInt(b.name.replace(/Week (\d+).*/, '$1')) || 0;
              
              // Extract year if present
              const yearA = parseInt(a.name.match(/\d{4}$/)?.[0]) || new Date().getFullYear();
              const yearB = parseInt(b.name.match(/\d{4}$/)?.[0]) || new Date().getFullYear();
              
              // Sort by year first, then by week number
              if (yearA !== yearB) {
                return yearA - yearB;
              }
              return weekNumA - weekNumB;
            }
            case 'monthly': {
              const indexA = monthsOrder.indexOf(a.name);
              const indexB = monthsOrder.indexOf(b.name);
              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            }
            default:
              return (a.name || '').localeCompare(b.name || '');
          }
        } catch (error) {
          console.error('Error sorting data:', error);
          return 0;
        }
      });

    // Enhanced data point limits: 60 for minutely (matching 60-minute limit), 30 for real-time minutely, 7 for others
    let maxDataPoints;
    if (dataKey === 'minutely') {
      maxDataPoints = useCustomDate ? 60 : 30; // 60 minutes max for custom, 30 for real-time
    } else {
      maxDataPoints = 7;
    }
    
    const finalData = useCustomDate ? transformedData : transformedData.slice(-maxDataPoints);
    return finalData || [];
  } catch (e) {
    console.error(`Error transforming ${dataKey} data`, e);
    return [];
  }
}


// ✅ RESPONSIVE: Enhanced Custom Tooltip with mobile optimization
const CustomTooltip = ({ active, payload, label, isDarkMode, clickable, onDataClick, granularity, tooltipLabel, dataType = 'cpu' }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = data.value;
    const usageLabel = tooltipLabel || 'Usage';
    
    // ✅ Use unified functions with dataType parameter
    const actualColor = getUsageColor(percentage, dataType);
    const performance = getPerformanceLevel(percentage, dataType);
    
    return (
      <div className={`p-2 sm:p-3 rounded-lg shadow-lg border text-xs sm:text-sm ${
        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <p className="font-medium mb-1">
          {granularity === 'minutely' ? `Time: ${label}` : label}
        </p>
        <p>
          <span className="font-medium" style={{ color: actualColor }}>
            {usageLabel}: {percentage?.toFixed(1)}%
          </span>
        </p>
        <p className="text-xs mt-1" style={{ color: actualColor }}>
          Status: {performance.level}
        </p>
        {granularity === 'minutely' && (
          <p className="text-xs text-gray-500 mt-1">
            Minute-level data
          </p>
        )}
        {clickable && (
          <p className="text-xs mt-2 opacity-75 flex items-center">
            <span className="mr-1">🔍</span>
            Click to view breakdown
          </p>
        )}
      </div>
    );
  }
  return null;
};


// ✅ RESPONSIVE: Enhanced chart rendering function with mobile optimization
export function renderChart({
  data,
  color,
  title,
  selectedGraphType,
  isDarkMode,
  hasError,
  isCustomRange = false,
  showYAxis = true,
  showXAxis = true,
  showDataOnly = true,
  onChartClick = null,
  dataGranularity = null,
  customTooltip = null,
  tooltipLabel = null,
  onDataClick = null,
  clickable = false,
  useConditionalColors = false,
  dataType = 'cpu'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
        <div className="text-xs sm:text-sm">No data available</div>
        {hasError && <div className="text-xs text-red-500 mt-2">Error loading data</div>}
      </div>
    );
  }

  const dataLength = data.length;
  const detectedGranularity = dataGranularity || detectDataGranularity(data);
  const shouldScroll = shouldUseScrolling(dataLength, isCustomRange, detectedGranularity);
  const chartWidth = getScrollableChartWidth(dataLength, isCustomRange, detectedGranularity);
  const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
  
  // Enhanced click handling logic
  const shouldEnableClick = clickable && onDataClick && (detectedGranularity === 'weekly' || onChartClick);
  const actualClickHandler = onDataClick || onChartClick;

  // ✅ RESPONSIVE: Dynamic chart margins based on screen size
  const chartMargins = { 
    top: 5, 
    right: 5, 
    bottom: 10, 
    left: 5
  };

  // Enhanced click handler for chart elements
  const handleChartElementClick = (chartData, event) => {
    if (shouldEnableClick && actualClickHandler && chartData && chartData.activePayload) {
      const clickedData = chartData.activePayload[0]?.payload;
      if (clickedData) {
        console.log('Chart element clicked:', clickedData);
        actualClickHandler(clickedData, event);
      }
    }
  };

  const commonProps = {
    data,
    width: chartWidth,
    height: '100%',
    margin: chartMargins,
    // Add onClick handler for drill-down
    onClick: shouldEnableClick ? handleChartElementClick : undefined
  };

  // ✅ Use unified function
  const getConditionalColor = (percentage) => {
    return getUsageColor(percentage, dataType);
  };

  // ✅ RESPONSIVE: Enhanced tooltip with proper color sync and data type support
  const tooltipProps = showDataOnly ? (customTooltip ? {
    content: customTooltip
  } : clickable && onDataClick ? {
    content: <CustomTooltip 
      isDarkMode={isDarkMode} 
      clickable={clickable} 
      onDataClick={onDataClick}
      granularity={detectedGranularity}
      tooltipLabel={tooltipLabel}
      dataType={dataType}
    />
  } : {
    content: useConditionalColors ? (
      // ✅ Use custom tooltip when conditional colors are enabled
      <CustomTooltip 
        isDarkMode={isDarkMode} 
        granularity={detectedGranularity}
        tooltipLabel={tooltipLabel}
        dataType={dataType}
      />
    ) : undefined,
    contentStyle: !useConditionalColors ? {
      padding: '6px 10px',
      fontSize: window.innerWidth < 640 ? '10px' : '12px',
      backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
      borderRadius: '6px',
      border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    } : undefined,
    itemStyle: !useConditionalColors ? { color } : undefined,
    labelStyle: !useConditionalColors ? { fontWeight: 'bold', color: isDarkMode ? '#F3F4F6' : '#1F2937' } : undefined,
    formatter: !useConditionalColors ? ((value, name, props) => {
      // ✅ Use unified performance function based on data type
      const performance = getPerformanceLevel(value, dataType);
      
      return [
        `${value}% (${performance.level})`,
        props.payload.isCurrentTime ? `Current ${title} Usage` : 
        tooltipLabel || (detectedGranularity === 'minutely' ? `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Usage` : 'Usage')
      ];
    }) : undefined
  }) : {};

  // ✅ RESPONSIVE: Enhanced tick interval calculation with mobile optimization
  const calculateTickInterval = (len, isScrolling = false, granularity = null) => {
    const isMobile = window.innerWidth < 640;
    
    if (granularity === 'minutely') {
      // For minutely data, show fewer ticks to avoid crowding
      if (isMobile) {
        if (len <= 10) return 0;
        if (len <= 20) return 3;
        if (len <= 40) return 5;
        return Math.max(6, Math.ceil(len / 10));
      } else {
        if (len <= 10) return 0;
        if (len <= 20) return 2;
        if (len <= 40) return 4;
        return Math.max(5, Math.ceil(len / 12));
      }
    }
    
    if (isScrolling) {
      if (isMobile) {
        if (len <= 10) return 1;
        if (len <= 30) return 2;
        return Math.max(3, Math.ceil(len / 15));
      } else {
        if (len <= 10) return 0;
        if (len <= 30) return 1;
        return Math.max(2, Math.ceil(len / 20));
      }
    }
    
    if (isMobile) {
      if (len <= 7) return 0;
      if (len <= 15) return 2;
      if (len <= 30) return 3;
      return Math.max(4, Math.ceil(len / 8));
    } else {
      if (len <= 10) return 0;
      if (len <= 15) return 1;
      if (len <= 30) return 2;
      return Math.max(3, Math.ceil(len / 10));
    }
  };

  // ✅ RESPONSIVE: Enhanced custom tick with mobile support
  const customTick = ({ x, y, payload }) => {
    if (!showXAxis) return null;
    const isMobile = window.innerWidth < 640;
    
    let fontSize;
    if (shouldScroll) {
      fontSize = isMobile ? (dataLength > 50 ? 6 : 7) : (dataLength > 50 ? 8 : 9);
    } else {
      // Optimized font sizes for minutely data
      if (detectedGranularity === 'minutely') {
        fontSize = isMobile 
          ? (dataLength > 40 ? 6 : dataLength > 25 ? 7 : 8)
          : (dataLength > 40 ? 7 : dataLength > 25 ? 8 : 9);
      } else {
        fontSize = isMobile
          ? (dataLength > 20 ? 6 : dataLength > 15 ? 7 : 8)
          : (dataLength > 20 ? 7 : dataLength > 15 ? 8 : 9);
      }
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={isMobile ? 12 : 16}
          textAnchor="middle"
          fill={isDarkMode ? '#D1D5DB' : '#6B7280'}
          fontSize={fontSize}
          style={{ 
            fontSize: `${fontSize}px`,
            cursor: shouldEnableClick ? 'pointer' : 'default'
          }}
        >
          {payload.value || ''}
        </text>
      </g>
    );
  };

  // ✅ RESPONSIVE: Dynamic Y-axis width based on screen size
  const yAxisProps = showYAxis ? {
    tick: { fontSize: window.innerWidth < 640 ? 8 : 10, fill: isDarkMode ? '#D1D5DB' : '#6B7280' },
    domain: [0, 100],
    ticks: [0, 20, 40, 60, 80, 100],
    tickFormatter: v => `${v}%`,
    width: window.innerWidth < 640 ? 28 : 35,
    allowDataOverflow: false
  } : false;

  const xAxisProps = showXAxis ? {
    dataKey: 'name',
    tick: customTick,
    height: window.innerWidth < 640 ? 30 : 35,
    interval: calculateTickInterval(dataLength, shouldScroll, detectedGranularity),
    axisLine: { stroke: isDarkMode ? '#374151' : '#E5E7EB' },
    tickLine: { stroke: isDarkMode ? '#374151' : '#E5E7EB' },
    padding: { left: window.innerWidth < 640 ? 5 : 10, right: window.innerWidth < 640 ? 5 : 10 }
  } : false;

  const chartColor = showDataOnly ? color : 'transparent';
  const dataKey = 'value';
  
  // Enhanced cursor style for clickable charts
  const cursorStyle = shouldEnableClick ? { cursor: 'pointer' } : {};

  // ✅ RESPONSIVE: Optimized bar size calculation with mobile support
  const getBarSize = () => {
    const isMobile = window.innerWidth < 640;
    
    // Smaller bars for minutely data to fit more data points within 60-minute range
    if (detectedGranularity === 'minutely') {
      if (shouldScroll) {
        return isMobile ? (dataLength > 50 ? 15 : 20) : (dataLength > 50 ? 20 : 25);
      }
      return isMobile 
        ? (dataLength > 40 ? 15 : dataLength > 25 ? 20 : 25)
        : (dataLength > 40 ? 20 : dataLength > 25 ? 25 : 30);
    }
    return isMobile ? (shouldScroll ? 30 : 30) : (shouldScroll ? 40 : 40);
  };

  // Enhanced chart elements with hover effects for clickable items
  const getElementProps = (isClickable) => ({
    style: isClickable ? { 
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } : {},
    className: isClickable ? 'hover:opacity-80' : ''
  });

  switch (selectedGraphType) {
    case 'line':
      // ✅ PRIORITY-BASED LINE COLOR: Use highest severity value in data
      const maxSeverityValue = Math.max(...data.map(item => item.value || 0));
      const lineColor = useConditionalColors ? getConditionalColor(maxSeverityValue) : chartColor;

      return (
        <LineChart {...commonProps} style={cursorStyle}>
          {showXAxis && <XAxis {...xAxisProps} padding={{ left: window.innerWidth < 640 ? 10 : 20, right: window.innerWidth < 640 ? 10 : 20 }} />}
          {showYAxis && <YAxis {...yAxisProps} />}
          {showDataOnly && <Tooltip {...tooltipProps} />}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={detectedGranularity === 'minutely' ? (window.innerWidth < 640 ? 1.2 : 1.5) : (window.innerWidth < 640 ? 1.5 : 2)}
            {...getElementProps(shouldEnableClick)}
            dot={({ cx, cy, payload }) => {
              const isZero = payload.value === 0;
              const isMobile = window.innerWidth < 640;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={
                    isZero
                      ? (isMobile ? 1.5 : 2) // small gray dot for zeros
                      : payload.isCurrentTime
                      ? (isMobile ? 3 : 4)
                      : detectedGranularity === 'minutely'
                      ? isMobile ? (dataLength > 40 ? 1 : 1.5) : (dataLength > 40 ? 1.5 : 2)
                      : shouldScroll
                      ? (isMobile ? 2 : 3)
                      : dataLength > 20
                      ? (isMobile ? 1.5 : 2)
                      : (isMobile ? 2 : 3)
                  }
                  fill={
                    isZero
                      ? '#cccccc' // gray for zero values
                      : useConditionalColors
                      ? getConditionalColor(payload.value)
                      : chartColor
                  }
                  stroke={payload.isCurrentTime ? '#ffffff' : 'none'}
                  strokeWidth={payload.isCurrentTime ? (isMobile ? 1.5 : 2) : 0}
                  opacity={showDataOnly ? 1 : 0}
                  style={shouldEnableClick ? { cursor: 'pointer' } : {}}
                  className={
                    shouldEnableClick ? 'hover:r-4 transition-all duration-200' : ''
                  }
                />
              );
            }}
            activeDot={({ cx, cy, payload }) => {
              const isZero = payload.value === 0;
              const isMobile = window.innerWidth < 640;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isMobile ? (isZero ? 4 : 5) : (isZero ? 5 : 6)} // slightly smaller for zero highlight
                  fill={
                    isZero
                      ? '#cccccc'
                      : useConditionalColors
                      ? getConditionalColor(payload.value)
                      : chartColor
                  }
                  stroke="#ffffff"
                  strokeWidth={isMobile ? 2 : 3}
                  opacity={1}
                />
              );
            }}
            connectNulls={false}
          />
        </LineChart>
      );

    
    case 'area':
      // ✅ PRIORITY-BASED AREA COLOR: Use highest severity value in data
      const maxAreaValue = Math.max(...data.map(item => item.value || 0));
      const areaColor = useConditionalColors ? getConditionalColor(maxAreaValue) : chartColor;
      
      return (
        <AreaChart {...commonProps} style={cursorStyle}>
          {showXAxis && <XAxis {...xAxisProps} padding={{ left: window.innerWidth < 640 ? 10 : 20, right: window.innerWidth < 640 ? 10 : 20 }} />}
          {showYAxis && <YAxis {...yAxisProps} />}
          {showDataOnly && <Tooltip {...tooltipProps} />}
          
          {/* ✅ PRIORITY-BASED: Area shows worst-case scenario color */}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={areaColor}       
            fill={areaColor}        
            fillOpacity={showDataOnly ? 0.3 : 0}
            strokeWidth={detectedGranularity === 'minutely' ? (window.innerWidth < 640 ? 1.2 : 1.5) : (window.innerWidth < 640 ? 1.5 : 2)}
            {...getElementProps(shouldEnableClick)}
            className={shouldEnableClick ? 'hover:fill-opacity-50 transition-all duration-200' : ''}
          />
        </AreaChart>
      );
    
    default: // Bar chart
      return (
        <BarChart {...commonProps} style={cursorStyle}>
          {showXAxis && <XAxis {...xAxisProps} />}
          {showYAxis && <YAxis {...yAxisProps} />}
          {showDataOnly && <Tooltip {...tooltipProps} />}
          <Bar 
            dataKey={dataKey} 
            radius={window.innerWidth < 640 ? [3, 3, 0, 0] : [4, 4, 0, 0]} 
            barSize={getBarSize()}
            fill={useConditionalColors ? undefined : chartColor}
            opacity={showDataOnly ? 1 : 0}
            {...getElementProps(shouldEnableClick)}
            className={shouldEnableClick ? 'hover:opacity-80 transition-all duration-200' : ''}
          >
            {/* ✅ Keep conditional bar coloring - works perfectly */}
            {useConditionalColors && data.map((entry, index) => (
              <Cell 
                key={`bar-cell-${index}`} 
                fill={getConditionalColor(entry.value)}
              />
            ))}
          </Bar>
        </BarChart>
      );
  }
}
