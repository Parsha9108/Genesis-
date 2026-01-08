import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import "../../components/index.css"

const BulkUploadIPModal = ({ 
  show, 
  onHide, 
  onSuccess, 
  isDarkMode = false,
  bulkUploadIPs
}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendErrors, setBackendErrors] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  // Handle file selection
  const handleFileImport = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setFileError('Please upload a valid CSV file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFileError(null);
    setBackendErrors(null);
    setUploadSummary(null);
  };

  // Handle upload - send CSV file directly to backend using RTK mutation
  // Handle upload - send CSV file directly to backend using RTK mutation
const handleUpload = async () => {
  if (!file) {
    setFileError('Please select a CSV file to upload');
    return;
  }

  setLoading(true);
  setBackendErrors(null);
  setUploadSummary(null);

  try {
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('csv_file', file); // Backend expects 'csv_file'
    
    console.log('Uploading file:', file.name);
    
    // Use RTK mutation to upload file - pass FormData directly
    const response = await bulkUploadIPs(formData).unwrap();
    
    console.log('Upload response:', response);
    
    setLoading(false);
    
    const hasCreated = response.created > 0;
    const hasDuplicatesInCSV = response.duplicates_in_csv > 0;
    const hasDuplicatesInDB = response.duplicates_in_database > 0;
    const hasDuplicates = hasDuplicatesInCSV || hasDuplicatesInDB;
    
    // Store summary
    setUploadSummary({
      total_rows: response.total_rows,
      created: response.created,
      duplicates_count: response.duplicates_in_csv + response.duplicates_in_database,
    });
    
    // Build error messages if there are duplicates
    const errors = {};
    
    if (hasDuplicatesInCSV && response.duplicates_in_csv_details) {
      errors.duplicates = response.duplicates_in_csv_details.map(dup => 
        `Row ${dup.row}: Duplicate IP "${dup.ip}" (${dup.name}) within CSV`
      );
    }
    
    if (hasDuplicatesInDB && response.duplicates_in_database_details) {
      const dbDuplicates = response.duplicates_in_database_details.map(dup => 
        `Row ${dup.row}: IP "${dup.ip}" (${dup.name}) already exists in database`
      );
      
      if (errors.duplicates) {
        errors.duplicates = [...errors.duplicates, ...dbDuplicates];
      } else {
        errors.duplicates = dbDuplicates;
      }
    }
    
    // Scenario 1: Has duplicates (regardless of created count)
    if (hasDuplicates) {
      setBackendErrors(errors);
      
      // Show appropriate toast
      if (hasCreated) {
        // Partial success - show warning toast
        toast.warning(
          `${response.created} IP(s) uploaded successfully. ${response.duplicates_in_csv + response.duplicates_in_database} duplicate(s) skipped.`,
          { autoClose: 6000 }
        );
      } else {
        // Nothing created - all duplicates - show error toast
        toast.error(response.message || 'No IP addresses were uploaded. All entries were duplicates.');
      }
      
      // Keep modal open to show duplicate details
      // DON'T call onSuccess() or onHide() here
      return;
    }
    
    // Scenario 2: Complete success - no duplicates
    handleReset();
    
    if (onSuccess) {
      onSuccess();
    }
    
    onHide();

    // Show success toast after modal closes
    setTimeout(() => {
      toast.success(
        `Successfully uploaded ${response.created} IP address(es) from ${response.total_rows} row(s)!`
      );
    }, 300);
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    setLoading(false);
    
    // Handle backend error response
    if (error?.data) {
      const errorData = error.data;
      const errors = {};
      
      console.log('Error data:', errorData);
      
      // Check for field-specific errors (validation and duplicates)
      if (errorData.validation || errorData.duplicates || errorData.csv_file) {
        // Handle csv_file errors
        if (errorData.csv_file) {
          const csvError = Array.isArray(errorData.csv_file) 
            ? errorData.csv_file[0] 
            : errorData.csv_file;
          setFileError(csvError);
          toast.error(csvError);
          return;
        }
        
        // Handle validation errors
        if (errorData.validation && Array.isArray(errorData.validation)) {
          errors.validation = errorData.validation;
        }
        
        // Handle duplicate errors
        if (errorData.duplicates && Array.isArray(errorData.duplicates)) {
          errors.duplicates = errorData.duplicates;
        }
        
        if (Object.keys(errors).length > 0) {
          setBackendErrors(errors);
        }
        
        // Show general message if provided
        if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        }
      } 
      // Handle general error message
      else if (errorData.message) {
        setBackendErrors({
          validation: [errorData.message]
        });
        toast.error(errorData.message);
      } else if (errorData.detail) {
        setBackendErrors({
          validation: [errorData.detail]
        });
        toast.error(errorData.detail);
      } 
      // Handle any other field errors
      else {
        const validationErrors = [];
        Object.keys(errorData).forEach(field => {
          const fieldError = errorData[field];
          const errorMsg = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          validationErrors.push(`${field}: ${errorMsg}`);
        });
        
        if (validationErrors.length > 0) {
          setBackendErrors({
            validation: validationErrors
          });
          toast.error('Please check the validation errors.');
        }
      }
    } else {
      setBackendErrors({
        validation: ['Failed to upload CSV file. Please try again.']
      });
      toast.error('Failed to upload CSV file. Please try again.');
    }
  }
};


  const handleReset = () => {
    setFile(null);
    setBackendErrors(null);
    setFileError(null);
    setUploadSummary(null);
    setLoading(false);
    // Reset file input
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    handleReset();
    onHide();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-xl p-6 max-w-2xl w-full relative shadow-2xl border mx-4 max-h-[90vh] overflow-y-auto custom-scroll"
        style={{
          background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.3)',
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
          <CloudArrowUpIcon
            className="w-5 h-5 mr-2"
            style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }}
          />
          Bulk Upload IP Addresses
        </h3>

        {/* Import CSV Button */}
        <div className="mb-6">
          <label
            htmlFor="csv-file-input"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90'
                : 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90'
            }`}
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            Select CSV File
          </label>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <p
            className="text-xs mt-2"
            style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
          >
            Upload a CSV file with columns: <strong>name</strong>, <strong>ip_address</strong>
          </p>
        </div>

        {/* Selected File Info */}
        {file && !fileError && !uploadSummary && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-800/30'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <CloudArrowUpIcon
                    className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                    style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}
                    >
                      Selected File
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}
                    >
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
                    color: isDarkMode ? '#6EE7B7' : '#065F46',
                  }}
                >
                  Ready to upload
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {uploadSummary && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-blue-900/20 border-blue-800/30'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <h4
                className="text-sm font-semibold mb-3 flex items-center"
                style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Upload Summary
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>Total Rows</p>
                  <p className="text-lg font-bold" style={{ color: isDarkMode ? '#93C5FD' : '#1E40AF' }}>
                    {uploadSummary.total_rows}
                  </p>
                </div>
                <div>
                  <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>Created</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {uploadSummary.created}
                  </p>
                </div>
                <div>
                  <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>Duplicates</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {uploadSummary.duplicates_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Error */}
        {fileError && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-800/30'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start">
                <ExclamationCircleIcon
                  className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                  style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                />
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                  >
                    Invalid File
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                  >
                    {fileError}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backend Error Section */}
        {backendErrors && (
          <div className="mb-6 space-y-3">
            {/* Validation Errors */}
            {backendErrors.validation && backendErrors.validation.length > 0 && (
              <div
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-red-900/20 border-red-800/30'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start mb-2">
                  <ExclamationCircleIcon
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                  >
                    Validation Errors ({backendErrors.validation.length})
                  </p>
                </div>
                <ul className="ml-7 space-y-1 max-h-40 overflow-y-auto custom-scroll">
                  {backendErrors.validation.map((error, index) => (
                    <li
                      key={index}
                      className="text-xs"
                      style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626' }}
                    >
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Duplicate Errors */}
            {backendErrors.duplicates && backendErrors.duplicates.length > 0 && (
              <div
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-yellow-900/20 border-yellow-800/30'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start mb-2">
                  <ExclamationCircleIcon
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    style={{ color: isDarkMode ? '#FCD34D' : '#D97706' }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: isDarkMode ? '#FCD34D' : '#D97706' }}
                  >
                    Duplicates Found ({backendErrors.duplicates.length})
                  </p>
                </div>
                <ul className="ml-7 space-y-1 max-h-40 overflow-y-auto custom-scroll">
                  {backendErrors.duplicates.map((error, index) => (
                    <li
                      key={index}
                      className="text-xs"
                      style={{ color: isDarkMode ? '#FCD34D' : '#D97706' }}
                    >
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div
          className={`p-3 rounded-lg border mb-6 ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <p
            className="text-xs"
            style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
          >
            <strong>Note:</strong> The CSV file will be validated by the server. Make sure your file contains the required columns: <strong>name</strong> and <strong>ip_address</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className="flex justify-end space-x-3 pt-3 border-t"
          style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
        >
          {(file || fileError || backendErrors) && !loading && (
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
            type="button"
            onClick={handleUpload}
            disabled={loading || !file || fileError}
            className={`inline-flex items-center px-5 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-2'
            }`}
          >
            {loading ? (
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
                Uploading...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Upload CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadIPModal;
