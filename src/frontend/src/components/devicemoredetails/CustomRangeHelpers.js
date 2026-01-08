/**
 * Get preset date range options based on granularity
 * @param {string} granularity - The selected granularity (minutely, hourly, daily, weekly)
 * @returns {Array} Array of preset options with label and time properties
 */
export const getPresetOptions = (granularity) => {
  switch (granularity) {
    case 'minutely':
      return [
        { label: 'Last 15 Min', minutes: 15 },
        { label: 'Last 30 Min', minutes: 30 },
        { label: 'Last 60 Min', minutes: 60 }
      ];
    case 'hourly':
      return [
        { label: 'Last 24 Hours', hours: 24 },
        { label: 'Last 3 Days', days: 3 },
        { label: 'Last 7 Days', days: 7 }
      ];
    case 'daily':
      return [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 }
      ];
    case 'weekly':
      return [
        { label: 'Last 4 Weeks', days: 28 },
        { label: 'Last 12 Weeks', days: 84 },
        { label: 'Last 26 Weeks', days: 182 }
      ];
    default:
      return [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 }
      ];
  }
};


/**
 * Check if a preset is currently active based on selected dates and times
 * @param {Object} preset - The preset object to check
 * @param {string} customStartDate - Selected start date
 * @param {string} customEndDate - Selected end date
 * @param {string} customStartTime - Selected start time
 * @param {string} customEndTime - Selected end time
 * @param {string} tempGranularity - Current granularity selection
 * @returns {boolean} Whether the preset matches current selection
 */
export const isPresetActive = (preset, customStartDate, customEndDate, customStartTime, customEndTime, tempGranularity) => {
  const now = new Date();
  let expectedStartDate, expectedEndDate, expectedStartTime, expectedEndTime;
  
  if (preset.minutes) {
    const startDate = new Date(now - preset.minutes * 60 * 1000);
    expectedStartDate = startDate.toISOString().split('T')[0];
    expectedStartTime = startDate.toTimeString().slice(0, 5);
    expectedEndDate = now.toISOString().split('T')[0];
    expectedEndTime = now.toTimeString().slice(0, 5);
    
    const startTimeMatch = Math.abs(
      new Date(`1970-01-01T${customStartTime}:00`) - 
      new Date(`1970-01-01T${expectedStartTime}:00`)
    ) <= 60000; // 1 minute tolerance
    
    const endTimeMatch = Math.abs(
      new Date(`1970-01-01T${customEndTime}:00`) - 
      new Date(`1970-01-01T${expectedEndTime}:00`)
    ) <= 60000; // 1 minute tolerance
    
    return tempGranularity === 'minutely' &&
           customStartDate === expectedStartDate &&
           customEndDate === expectedEndDate &&
           startTimeMatch &&
           endTimeMatch;
  } else if (preset.hours) {
    const startDate = new Date(now - preset.hours * 60 * 60 * 1000);
    expectedStartDate = startDate.toISOString().split('T')[0];
    expectedStartTime = startDate.toTimeString().slice(0, 5);
    expectedEndDate = now.toISOString().split('T')[0];
    expectedEndTime = now.toTimeString().slice(0, 5);
    
    const startTimeMatch = Math.abs(
      new Date(`1970-01-01T${customStartTime}:00`) - 
      new Date(`1970-01-01T${expectedStartTime}:00`)
    ) <= 300000; // 5 minute tolerance for 24-hour preset
    
    const endTimeMatch = Math.abs(
      new Date(`1970-01-01T${customEndTime}:00`) - 
      new Date(`1970-01-01T${expectedEndTime}:00`)
    ) <= 300000; // 5 minute tolerance
    
    return tempGranularity === 'hourly' &&
           customStartDate === expectedStartDate &&
           customEndDate === expectedEndDate &&
           startTimeMatch &&
           endTimeMatch;
  } else if (preset.days) {
    const startDate = new Date(now - preset.days * 24 * 60 * 60 * 1000);
    expectedStartDate = startDate.toISOString().split('T')[0];
    expectedEndDate = now.toISOString().split('T')[0];
    
    return customStartDate === expectedStartDate && customEndDate === expectedEndDate;
  }
  
  return false;
};


/**
 * Apply a preset date range
 * @param {Object} preset - The preset to apply
 * @param {Function} setCustomStartDate - State setter for start date
 * @param {Function} setCustomStartTime - State setter for start time
 * @param {Function} setCustomEndDate - State setter for end date
 * @param {Function} setCustomEndTime - State setter for end time
 * @param {Function} setDateError - State setter for date errors
 * @param {Function} setActivePreset - State setter for active preset
 */
export const applyPresetRange = (
  preset,
  setCustomStartDate,
  setCustomStartTime,
  setCustomEndDate,
  setCustomEndTime,
  setDateError,
  setActivePreset
) => {
  const now = new Date();
  let startDate;
  
  if (preset.minutes) {
    startDate = new Date(now - preset.minutes * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endDateStr = now.toISOString().split('T')[0];
    const endTimeStr = now.toTimeString().slice(0, 5);
    
    setCustomStartDate(startDateStr);
    setCustomStartTime(startTimeStr);
    setCustomEndDate(endDateStr);
    setCustomEndTime(endTimeStr);
  } else if (preset.hours) {
    startDate = new Date(now - preset.hours * 60 * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endDateStr = now.toISOString().split('T')[0];
    const endTimeStr = now.toTimeString().slice(0, 5);
    
    setCustomStartDate(startDateStr);
    setCustomStartTime(startTimeStr);
    setCustomEndDate(endDateStr);
    setCustomEndTime(endTimeStr);
  } else if (preset.days) {
    startDate = new Date(now - preset.days * 24 * 60 * 60 * 1000);
    const start = startDate.toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    setCustomStartDate(start);
    setCustomEndDate(end);
  }
  
  setDateError('');
  setActivePreset(preset);
};


/**
 * Calculate the duration of the selected date range
 * @param {string} customStartDate - Start date
 * @param {string} customEndDate - End date
 * @param {string} customStartTime - Start time
 * @param {string} customEndTime - End time
 * @param {string} tempGranularity - Current granularity
 * @returns {string} Formatted duration string
 */
export const getDateRangeDuration = (customStartDate, customEndDate, customStartTime, customEndTime, tempGranularity) => {
  if (!customStartDate || !customEndDate) return '';
  
  const start = new Date(tempGranularity === 'minutely' || (tempGranularity === 'hourly' && customStartTime) ? 
    `${customStartDate}T${customStartTime || '00:00'}:00` : customStartDate);
  const end = new Date(tempGranularity === 'minutely' || (tempGranularity === 'hourly' && customEndTime) ? 
    `${customEndDate}T${customEndTime || '23:59'}:00` : customEndDate);
  
  const diffTime = Math.abs(end - start);
  
  if (tempGranularity === 'minutely') {
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return `${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minutes'}`;
  } else if (tempGranularity === 'hourly' && customStartTime && customEndTime) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${diffHours} ${diffHours === 1 ? 'Hour' : 'Hours'}`;
  } else {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  }
};


/**
 * Validate the selected date range
 * @param {string} customStartDate - Start date
 * @param {string} customEndDate - End date
 * @param {string} customStartTime - Start time
 * @param {string} customEndTime - End time
 * @param {string} tempGranularity - Current granularity
 * @param {Function} setDateError - State setter for date errors
 * @returns {boolean} Whether the date range is valid
 */
export const validateDateRange = (
  customStartDate,
  customEndDate,
  customStartTime,
  customEndTime,
  tempGranularity,
  setDateError
) => {
  setDateError('');
  
  if (!customStartDate || !customEndDate) {
    setDateError('Both start and end dates are required');
    return false;
  }
  
  // ✅ Granularity-specific pre-validation for minutely
  if (tempGranularity === 'minutely') {
    // ✅ Check same day requirement first
    if (customStartDate !== customEndDate) {
      setDateError('For minute-level data, start and end dates must be the same day');
      return false;
    }
    
    // ✅ Require time inputs for minutely
    if (!customStartTime || !customEndTime) {
      setDateError('Both start and end times are required for minute-level data');
      return false;
    }
  }
  
  // ✅ Build proper datetime strings with seconds for accurate parsing
  const startDateTime = tempGranularity === 'minutely' || (tempGranularity === 'hourly' && customStartTime) ? 
    `${customStartDate}T${customStartTime || '00:00'}:00` : 
    `${customStartDate}T00:00:00`;
    
  const endDateTime = tempGranularity === 'minutely' || (tempGranularity === 'hourly' && customEndTime) ? 
    `${customEndDate}T${customEndTime || '23:59'}:00` : 
    `${customEndDate}T23:59:59`;
  
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const today = new Date();
  
  // ✅ Check for invalid date objects
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    setDateError('Invalid date or time format');
    return false;
  }
  
  // ✅ Basic date comparison validations
  if (start > end) {
    setDateError('Start date/time cannot be after end date/time');
    return false;
  }
  
  if (end > today) {
    setDateError('End date/time cannot be in the future');
    return false;
  }
  
  const timeDiff = end - start;
  const minutesDiff = Math.floor(timeDiff / (1000 * 60)); // ✅ Use Math.floor for accurate minute count
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // ✅ Granularity-specific validation
  if (tempGranularity === 'minutely') {
    if (minutesDiff < 1) {
      setDateError('End time must be at least 1 minute after start time');
      return false;
    }
    
    if (minutesDiff > 60) {
      setDateError('Minute-level data is only available for up to 60 minutes (1 hour)');
      return false;
    }
  }
  
  if (tempGranularity === 'hourly') {
    if (daysDiff > 30) {
      setDateError('Hour-level data is only available for up to 30 days');
      return false;
    }
  }
  
  // ✅ General validations
  if (daysDiff > 365) {
    setDateError('Date range cannot exceed 365 days');
    return false;
  }
  
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  if (start < threeYearsAgo) {
    setDateError('Start date cannot be more than 3 years in the past');
    return false;
  }
  
  return true;
};


/**
 * Build API parameters for custom range query
 * @param {string} id - Device UUID
 * @param {string} tempGranularity - Selected granularity
 * @param {string} customStartDate - Start date
 * @param {string} customEndDate - End date
 * @param {string} customStartTime - Start time
 * @param {string} customEndTime - End time
 * @returns {Object} API parameters object
 */
export const buildCustomRangeApiParams = (id, tempGranularity, customStartDate, customEndDate, customStartTime, customEndTime) => {
  const apiParams = {
    uuid: id,
    granularity: tempGranularity,
  };

  // ✅ Include time for minutely AND hourly with time components
  if (tempGranularity === 'minutely' || (tempGranularity === 'hourly' && customStartTime && customEndTime)) {
    apiParams.start_date = `${customStartDate}T${customStartTime || '00:00'}:00`;
    apiParams.end_date = `${customEndDate}T${customEndTime || '23:59'}:00`;
  } else {
    apiParams.start_date = customStartDate;
    apiParams.end_date = customEndDate;
  }

  return apiParams;
};


/**
 * Format date for display
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });


/**
 * Determine if datetime inputs should be shown
 * @param {string} tempGranularity - Current granularity
 * @param {string} customStartTime - Start time
 * @param {string} customEndTime - End time
 * @returns {boolean} Whether to show datetime inputs
 */
export const shouldShowDateTimeInputs = (tempGranularity, customStartTime, customEndTime) => {
  return tempGranularity === 'minutely' || (tempGranularity === 'hourly' && (customStartTime || customEndTime));
};


/**
 * Check if the selected range is exactly 30 days
 * @param {boolean} customRangeApplied - Whether custom range is applied
 * @param {string} customStartDate - Start date
 * @param {string} customEndDate - End date
 * @returns {boolean} Whether the range is 30 days
 */
export const isThirtyDaysRange = (customRangeApplied, customStartDate, customEndDate) => {
  if (!customRangeApplied || !customStartDate || !customEndDate) return false;
  const start = new Date(customStartDate);
  const end = new Date(customEndDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays === 30;
};
