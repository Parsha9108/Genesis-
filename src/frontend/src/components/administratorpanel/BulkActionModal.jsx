import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  UserGroupIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react';
import "../index.css";

/* ------------------------------------------------------------------ */
/* Dropdown stays the same (reusable) */
/* ------------------------------------------------------------------ */

const BulkActionDropdown = ({
  options,
  selectedValue,
  setSelectedValue,
  isDarkMode,
  disabled = false,
  isLoading = false,
  placeholder = "Select an option"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (value) => {
    setSelectedValue(value);
    setIsOpen(false);
  };

  const getSelectedLabel = () => {
    const selectedOption = options.find(opt => opt.value === selectedValue);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const getDropdownStyling = () => {
    if (disabled || isLoading) {
      return isDarkMode
        ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
    }

    return isDarkMode
      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400';
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`flex items-center justify-between w-full px-3 py-1.5 text-sm border rounded-lg cursor-pointer transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${getDropdownStyling()}
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
      >
        <span className={selectedValue ? '' : 'text-gray-500 dark:text-gray-400'}>
          {isLoading ? 'Loading...' : getSelectedLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          } ${disabled || isLoading ? 'opacity-50' : ''}`}
        />
      </button>

      <div
        className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
          ${isOpen && !disabled && !isLoading
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }
        `}
      >
        <div className="py-0.5 max-h-36 overflow-y-auto custom-scroll">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                  ${selectedValue === option.value
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'text-gray-200 hover:bg-gray-600'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BULK_ACTION_TYPES = {
  EDIT_ROLES: 'edit_roles',
  ENABLE_EMAIL: 'enable_email',
  TOGGLE_STATUS: 'toggle_status',
  DELETE_USERS: 'delete_users',
};

/* ------------------------------------------------------------------ */
/* NEW: Generic, dynamic BulkActionModal                              */
/* ------------------------------------------------------------------ */

const BulkActionModal = ({
  show,
  onHide,
  selectedItems = [],      // generic IDs (users, devices, logs)
  isDarkMode = false,
  config,                  // dynamic config object
  onSuccess,
}) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!show) {
      setSelectedValue('');
    }
  }, [show]);

  if (!show || !config) return null;

  const {
    title = 'Bulk Action',
    message = 'Please confirm this bulk action.',
    icon: Icon = UserGroupIcon,
    iconColor = isDarkMode ? '#60A5FA' : '#2563EB',
    itemLabel = 'Selected Items',
    itemUnit = 'item(s)',
    dropdownLabel,
    dropdownPlaceholder = 'Select an option',
    options = [],
    showDropdown = false,
    requireSelection = false,
    cancelValue,                 
    buttonText = 'Apply',
    buttonColor = 'blue',         
    processingText = 'Applying...',
    isLoading = false,          
    onAction,                    
  } = config;

  const handleClose = () => {
    setSelectedValue('');
    onHide();
  };

  const getButtonColorClasses = () => {
    switch (buttonColor) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'yellow':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'blue':
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requireSelection && !selectedValue) {
      toast.error('Please select an option');
      return;
    }

    if (cancelValue && selectedValue === cancelValue) {
      handleClose();
      return;
    }

    try {
      setIsProcessing(true);
      if (typeof onAction === 'function') {
        await onAction(selectedItems, selectedValue);
      }
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to apply changes');
    } finally {
      setIsProcessing(false);
    }
  };

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
        <button
          onClick={handleClose}
          disabled={isProcessing || isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <h3
          className="text-xl font-semibold mb-4 flex items-center"
          style={{ color: isDarkMode ? '#F1F5F9' : '#1E293B' }}
        >
          {Icon && (
            <Icon
              className="w-5 h-5 mr-2"
              style={{ color: iconColor }}
            />
          )}
          {title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p
              className="text-sm"
              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
            >
              {message}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
            >
              {itemLabel}:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDarkMode
                  ? 'bg-blue-900/30 text-blue-300'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {selectedItems.length} {itemUnit}
            </span>
          </div>

          {showDropdown && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                {dropdownLabel}
              </label>

              <BulkActionDropdown
                options={options}
                selectedValue={selectedValue}
                setSelectedValue={setSelectedValue}
                isDarkMode={isDarkMode}
                isLoading={isLoading}
                placeholder={dropdownPlaceholder}
              />
            </div>
          )}

          <div
            className="flex justify-end space-x-3 pt-3 border-t"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing || isLoading}
              className={`inline-flex items-center px-4 py-1.5 font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                  : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isProcessing ||
                isLoading ||
                (requireSelection && !selectedValue)
              }
              className={`inline-flex items-center px-5 py-1.5 font-medium rounded-lg text-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${getButtonColorClasses()}`}
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {processingText}
                </>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;
