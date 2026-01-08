import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import "../index.css";

const IPModal = ({ 
  show, 
  onHide, 
  onSuccess, 
  isDarkMode = false, 
  mode = 'add', // 'add' or 'edit'
  ipData = null, // Existing IP data for edit mode
  createIP, // RTK mutation hook passed from parent
  updateIPs, // RTK mutation hook passed from parent
}) => {
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens or ipData changes
  useEffect(() => {
    if (mode === 'edit' && ipData) {
      setFormData({
        name: ipData.name || '',
        ip_address: ipData.ip_address || '',
      });
    } else {
      setFormData({
        name: '',
        ip_address: '',
      });
    }
    setErrors({});
  }, [mode, ipData, show]);

  // Field enabling logic
  const isFieldEnabled = (fieldName) => {
    switch (fieldName) {
      case 'ip_address':
        return true;
      case 'name':
        return formData.ip_address.trim() !== '' && isValidIPAddress(formData.ip_address);
      default:
        return true;
    }
  };

  // IP Address validation
  const isValidIPAddress = (ip) => {
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ip.trim());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (!isFieldEnabled(name)) return;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP Address is required';
    } else if (!isValidIPAddress(formData.ip_address)) {
      newErrors.ip_address = 'Please enter a valid IPv4 address (e.g., 192.168.1.1)';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    name: formData.name.trim(),
    ip_address: formData.ip_address.trim(),
  };

  setLoading(true);

  try {
    let response;
    
    if (mode === 'edit' && ipData?.id) {
      // Send as object for single update with uuid
      response = await updateIPs({ uuid: ipData.id, ...payload }).unwrap();
    } else {
      // Create new IP
      response = await createIP(payload).unwrap();
    }
    
    setLoading(false);
    handleReset();
    
    if (onSuccess) {
      onSuccess();
    }
    
    onHide();

    // Show success message from backend or use default
    setTimeout(() => {
      if (response?.message) {
        toast.success(response.message);
      } else if (response?.detail) {
        toast.success(response.detail);
      } else {
        toast.success(
          mode === 'edit' 
            ? `IP Address "${payload.name}" updated successfully!`
            : `IP Address "${payload.name}" added successfully!`
        );
      }
    }, 300);
    
  } catch (error) {
    setLoading(false);
    
    console.log('Error response:', error);
    
    // Handle Django/DRF validation errors (field-specific)
    if (error?.data) {
      const backendErrors = {};
      let hasFieldErrors = false;
      
      // Check for field-specific errors
      Object.keys(error.data).forEach((field) => {
        // Skip non-field error keys
        if (field === 'message' || field === 'detail' || field === 'non_field_errors') {
          return;
        }
        
        const errorValue = error.data[field];
        
        // Handle array of errors
        if (Array.isArray(errorValue) && errorValue.length > 0) {
          backendErrors[field] = errorValue[0];
          hasFieldErrors = true;
          
          // Also show as toast for visibility
          toast.error(errorValue[0]);
        } 
        // Handle string errors
        else if (typeof errorValue === 'string') {
          backendErrors[field] = errorValue;
          hasFieldErrors = true;
          
          // Also show as toast for visibility
          toast.error(errorValue);
        }
      });
      
      // Set field errors if any
      if (hasFieldErrors) {
        setErrors(backendErrors);
        return; // Don't show additional error messages
      }
      
      // Handle general error message
      if (error.data.message) {
        toast.error(error.data.message);
        return;
      }
      
      // Handle detail message
      if (error.data.detail) {
        toast.error(error.data.detail);
        return;
      }
      
      // Handle non_field_errors
      if (error.data.non_field_errors) {
        const errorMsg = Array.isArray(error.data.non_field_errors)
          ? error.data.non_field_errors[0]
          : error.data.non_field_errors;
        toast.error(errorMsg);
        return;
      }
    }
    
    // Handle HTTP status codes
    if (error?.status === 'FETCH_ERROR') {
      toast.error('Network error. Please check your connection.');
    }
    else if (error?.status === 401) {
      toast.error('Unauthorized. Please log in again.');
    }
    else if (error?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }
    else if (error?.status === 404) {
      toast.error('Resource not found.');
    }
    else if (error?.status === 500) {
      toast.error('Server error. Please try again later.');
    }
    // Default fallback
    else {
      toast.error(
        mode === 'edit' 
          ? 'Failed to update IP address. Please try again.'
          : 'Failed to add IP address. Please try again.'
      );
    }
  }
};


  const handleReset = () => {
    if (mode === 'edit' && ipData) {
      setFormData({
        name: ipData.name || '',
        ip_address: ipData.ip_address || '',
      });
    } else {
      setFormData({
        name: '',
        ip_address: '',
      });
    }
    setErrors({});
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onHide();
  };

  const getInputStyling = (fieldName) => {
    const isEnabled = isFieldEnabled(fieldName);

    if (!isEnabled) {
      return isDarkMode
        ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
    }

    if (errors[fieldName]) {
      return isDarkMode
        ? 'border-red-500 bg-gray-600 text-gray-300 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'
        : 'border-red-500 bg-gray-100 text-gray-700 placeholder-gray-500 focus:border-red-500 focus:ring-red-500';
    }

    // Show green border for valid IP
    if (fieldName === 'ip_address' && formData.ip_address && isValidIPAddress(formData.ip_address)) {
      return isDarkMode
        ? 'border-green-500 bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
        : 'border-green-500 bg-white text-gray-900 focus:border-green-500 focus:ring-green-500';
    }

    return isDarkMode
      ? 'border-gray-600 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500'
      : 'border-gray-300 focus:border-blue-500 bg-white text-gray-900 focus:ring-blue-500';
  };

  const hasFormData = () => {
    return formData.ip_address || formData.name;
  };

  const hasChanges = () => {
    if (mode === 'add') return hasFormData();
    if (!ipData) return false;
    return formData.name !== ipData.name || formData.ip_address !== ipData.ip_address;
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-xl p-6 max-w-lg w-full relative shadow-2xl border mx-4"
        style={{
          background: isDarkMode
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(246, 245, 248, 1)',
          borderColor: isDarkMode
            ? 'rgba(51, 65, 85, 0.4)'
            : 'rgba(203, 213, 225, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <h3
          className="text-xl font-semibold mb-5 flex items-center"
          style={{ color: isDarkMode ? '#F1F5F9' : '#1E293B' }}
        >
          {mode === 'edit' ? (
            <>
              <PencilSquareIcon
                className="w-5 h-5 mr-2"
                style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }}
              />
              Edit IP Address
            </>
          ) : (
            <>
              <GlobeAltIcon
                className="w-5 h-5 mr-2"
                style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }}
              />
              Add New IP Address
            </>
          )}
        </h3>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IP Address Input */}
          <div>
            <label
              htmlFor="ip_address"
              className="block text-sm font-medium mb-1"
              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
            >
              IP Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ip_address"
              value={formData.ip_address}
              onChange={handleChange}
              placeholder="e.g., 192.168.1.100"
              disabled={!isFieldEnabled('ip_address')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors font-mono ${getInputStyling('ip_address')}`}
            />
            {errors.ip_address ? (
              <p className="mt-1 text-xs text-red-600">{errors.ip_address}</p>
            ) : formData.ip_address && isValidIPAddress(formData.ip_address) ? (
              <p className="mt-1 text-xs text-green-600">✓ Valid IP address</p>
            ) : null}
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1"
              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Production Server, Office Router"
              disabled={!isFieldEnabled('name')}
              maxLength={50}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${getInputStyling('name')}`}
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>
              <p
                className="text-xs"
                style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
              >
                {formData.name.length}/50
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div
            className={`p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-blue-900/20 border-blue-800/30'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <p
              className="text-xs"
              style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}
            >
              <strong>Note:</strong> The IP address will be monitored for connectivity and response time. Make sure the IP is accessible from your network.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
            {hasChanges() && !loading && (
              <button
                type="button"
                onClick={handleReset}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !hasChanges()}
              className={`inline-flex items-center px-5 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-2'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? (
                    <>
                      <PencilSquareIcon className="w-4 h-4 mr-2" />
                      Update IP Address
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add IP Address
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPModal;
