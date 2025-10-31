// // src/utils/bandwidthUtils.js

// /**
//  * Format bandwidth from Kbps to appropriate units (like Task Manager)
//  * @param {number} kbps - Bandwidth in Kbps from backend
//  * @returns {object} - {value, unit, formatted}
//  */
// export const formatBandwidth = (kbps) => {
//   if (!kbps || kbps === 0) {
//     return { value: 0, unit: 'Kbps', formatted: '0.0 Kbps' };
//   }

//   const absKbps = Math.abs(kbps);
  
//   if (absKbps >= 1000000) {
//     // Gbps (1,000,000 Kbps = 1 Gbps)
//     const gbps = kbps / 1000000;
//     return { 
//       value: parseFloat(gbps.toFixed(2)), 
//       unit: 'Gbps', 
//       formatted: `${gbps.toFixed(2)} Gbps` 
//     };
//   } else if (absKbps >= 1000) {
//     // Mbps (1,000 Kbps = 1 Mbps)
//     const mbps = kbps / 1000;
//     return { 
//       value: parseFloat(mbps.toFixed(3)), 
//       unit: 'Mbps', 
//       formatted: `${mbps.toFixed(3)} Mbps` 
//     };
//   } else {
//     // Kbps
//     return { 
//       value: parseFloat(kbps.toFixed(3)), 
//       unit: 'Kbps', 
//       formatted: `${kbps.toFixed(3)} Kbps` 
//     };
//   }
// };

// /**
//  * Get performance color based on bandwidth thresholds
//  * @param {number} kbps - Bandwidth in Kbps
//  * @returns {string} - Color code
//  */
// export const getBandwidthColor = (kbps) => {
//   const mbps = kbps / 1000;
  
//   if (mbps >= 100) return '#10B981';      // Green - Excellent (>=100 Mbps)
//   else if (mbps >= 25) return '#3B82F6';  // Blue - Good (25-100 Mbps)
//   else if (mbps >= 5) return '#F59E0B';   // Orange - Moderate (5-25 Mbps)
//   else if (mbps >= 1) return '#F97316';   // Dark orange - Low (1-5 Mbps)
//   else return '#6B7280';                  // Gray - Very low (<1 Mbps)
// };

// /**
//  * Get performance level description and styling
//  * @param {number} kbps - Bandwidth in Kbps
//  * @returns {object} - Performance info with colors and labels
//  */
// export const getBandwidthPerformance = (kbps) => {
//   const mbps = kbps / 1000;
  
//   if (mbps >= 100) {
//     return { 
//       level: 'Excellent', 
//       color: '#10B981', 
//       bgColor: 'bg-green-100', 
//       textColor: 'text-green-800' 
//     };
//   } else if (mbps >= 25) {
//     return { 
//       level: 'Good', 
//       color: '#3B82F6', 
//       bgColor: 'bg-blue-100', 
//       textColor: 'text-blue-800' 
//     };
//   } else if (mbps >= 5) {
//     return { 
//       level: 'Moderate', 
//       color: '#F59E0B', 
//       bgColor: 'bg-orange-100', 
//       textColor: 'text-orange-800' 
//     };
//   } else if (mbps >= 1) {
//     return { 
//       level: 'Low', 
//       color: '#F97316', 
//       bgColor: 'bg-orange-100', 
//       textColor: 'text-orange-800' 
//     };
//   } else {
//     return { 
//       level: 'Very Low', 
//       color: '#EF4444', 
//       bgColor: 'bg-red-100', 
//       textColor: 'text-red-800' 
//     };
//   }
// };

// /**
//  * Calculate interface utilization percentage
//  * @param {number} currentKbps - Current bandwidth usage in Kbps
//  * @param {number} maxKbps - Maximum interface speed in Kbps (default: 1 Gbps)
//  * @returns {number} - Utilization percentage
//  */
// export const calculateUtilization = (currentKbps, maxKbps = 1000000) => {
//   if (!currentKbps || !maxKbps) return 0;
//   return Math.min((currentKbps / maxKbps) * 100, 100);
// };

// /**
//  * Convert bytes to Kbps (for raw byte data from SNMP)
//  * @param {number} bytes - Bytes transferred
//  * @param {number} intervalSeconds - Time interval in seconds (default: 5)
//  * @returns {number} - Bandwidth in Kbps
//  */
// export const bytesToKbps = (bytes, intervalSeconds = 5) => {
//   if (!bytes || !intervalSeconds) return 0;
  
//   // Convert: bytes → bits → per second → kilobits per second
//   const bits = bytes * 8;
//   const bitsPerSecond = bits / intervalSeconds;
//   const kbps = bitsPerSecond / 1000;
  
//   return Math.max(0, kbps); // Ensure non-negative
// };

// /**
//  * Format bytes to human readable format
//  * @param {number} bytes - Number of bytes
//  * @returns {string} - Formatted string (e.g., "1.5 MB")
//  */
// export const formatBytes = (bytes) => {
//   if (!bytes || bytes === 0) return '0 B';
  
//   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
//   const absBytes = Math.abs(bytes);
//   const unitIndex = Math.floor(Math.log(absBytes) / Math.log(1024));
//   const value = bytes / Math.pow(1024, unitIndex);
  
//   return `${value.toFixed(2)} ${units[unitIndex]}`;
// };

// /**
//  * Get bandwidth threshold for alerts based on resource type
//  * @param {string} type - Resource type ('wan', 'lan', 'wifi', etc.)
//  * @returns {object} - Threshold values in Kbps
//  */
// export const getBandwidthThresholds = (type = 'lan') => {
//   switch (type.toLowerCase()) {
//     case 'wan':
//     case 'internet':
//       return {
//         excellent: 100000,   // 100 Mbps
//         good: 25000,        // 25 Mbps
//         moderate: 5000,     // 5 Mbps
//         low: 1000          // 1 Mbps
//       };
    
//     case 'lan':
//     case 'ethernet':
//       return {
//         excellent: 800000,   // 800 Mbps (80% of 1 Gbps)
//         good: 500000,       // 500 Mbps
//         moderate: 100000,   // 100 Mbps
//         low: 10000         // 10 Mbps
//       };
    
//     case 'wifi':
//     case 'wireless':
//       return {
//         excellent: 200000,   // 200 Mbps
//         good: 50000,        // 50 Mbps
//         moderate: 10000,    // 10 Mbps
//         low: 1000          // 1 Mbps
//       };
    
//     default:
//       return {
//         excellent: 100000,
//         good: 25000,
//         moderate: 5000,
//         low: 1000
//       };
//   }
// };

// /**
//  * Create bandwidth alert based on thresholds
//  * @param {number} kbps - Current bandwidth in Kbps
//  * @param {string} type - Interface type
//  * @returns {object|null} - Alert object or null if no alert needed
//  */
// export const createBandwidthAlert = (kbps, type = 'lan') => {
//   const thresholds = getBandwidthThresholds(type);
//   const performance = getBandwidthPerformance(kbps);
  
//   if (kbps < thresholds.low) {
//     return {
//       level: 'warning',
//       message: `Low bandwidth detected: ${formatBandwidth(kbps).formatted}`,
//       color: '#F59E0B',
//       severity: 'medium'
//     };
//   }
  
//   if (kbps < thresholds.moderate) {
//     return {
//       level: 'info',
//       message: `Moderate bandwidth usage: ${formatBandwidth(kbps).formatted}`,
//       color: '#3B82F6',
//       severity: 'low'
//     };
//   }
  
//   return null; // No alert needed
// };

// // Export all functions as default object for convenience
// export default {
//   formatBandwidth,
//   getBandwidthColor,
//   getBandwidthPerformance,
//   calculateUtilization,
//   bytesToKbps,
//   formatBytes,
//   getBandwidthThresholds,
//   createBandwidthAlert
// };
