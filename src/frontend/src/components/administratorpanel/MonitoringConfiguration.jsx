// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { useSelector } from 'react-redux';
// import { useGetGlobalConfigQuery, useSaveGlobalConfigMutation } from '../../redux/globalApiSlice';
// import RenderIfAllowed from '../Utilities/RenderIfAllowed';

// const MonitoringConfiguration = ({ isDarkMode }) => {
//   const [saveMonitoringConfig, { isLoading: isSaving }] = useSaveGlobalConfigMutation();
//   const { data: existingConfig, isLoading: isLoadingConfig, isError } = useGetGlobalConfigQuery();
  
//   console.log("This is the existing data for the monitoring page", existingConfig);
  
//   const monitoringPermissions = useSelector((state) => state.userModPerm?.global_configuration);
//   const hasUpdatePermission = monitoringPermissions?.update || false;

//   const [monitoringConfig, setMonitoringConfig] = useState({
//     cpuThreshold: '',
//     ramThreshold: '',
//     diskThreshold: '',
//     networkThreshold: '',
//     repeatFrequency: ''
//   });

//   const [errors, setErrors] = useState({
//     cpuThreshold: '',
//     ramThreshold: '',
//     diskThreshold: '',
//     networkThreshold: '',
//     repeatFrequency: ''
//   });

//   useEffect(() => {
//     if (existingConfig) {
//       // Handle dot notation format
//       if (existingConfig['monitoring.cpuThreshold'] !== undefined) {
//         setMonitoringConfig({
//           cpuThreshold: existingConfig['monitoring.cpuThreshold'] || '',
//           ramThreshold: existingConfig['monitoring.ramThreshold'] || '',
//           diskThreshold: existingConfig['monitoring.diskThreshold'] || '',
//           networkThreshold: existingConfig['monitoring.networkThreshold'] || '',
//           repeatFrequency: existingConfig['monitoring.repeatFrequency'] || ''
//         });
//       } 
//       // Handle nested object format
//       else if (existingConfig.monitoring) {
//         setMonitoringConfig({
//           cpuThreshold: existingConfig.monitoring.cpuThreshold || '',
//           ramThreshold: existingConfig.monitoring.ramThreshold || '',
//           diskThreshold: existingConfig.monitoring.diskThreshold || '',
//           networkThreshold: existingConfig.monitoring.networkThreshold || '',
//           repeatFrequency: existingConfig.monitoring.repeatFrequency || ''
//         });
//       }
//     }
//   }, [existingConfig]);

//   const handleChange = (field, value) => {
//     if (!hasUpdatePermission) {
//       return;
//     }
//     setMonitoringConfig(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: ''
//       }));
//     }
//   };

//   const validateFields = () => {
//     const newErrors = {};
//     let isValid = true;

//     // Validate each field
//     const fields = ['cpuThreshold', 'ramThreshold', 'diskThreshold', 'networkThreshold', 'repeatFrequency'];
    
//     fields.forEach(field => {
//       const value = monitoringConfig[field];
      
//       // Check if empty
//       if (!value || value === '') {
//         newErrors[field] = 'This field is required';
//         isValid = false;
//       }
//       // Check if valid number
//       else if (isNaN(value) || isNaN(parseInt(value, 10))) {
//         newErrors[field] = 'Must be a valid number';
//         isValid = false;
//       }
//       // Check if integer
//       else if (!Number.isInteger(Number(value))) {
//         newErrors[field] = 'Must be a valid integer';
//         isValid = false;
//       }
//       // Additional validation for percentage fields
//       else if (['cpuThreshold', 'ramThreshold', 'diskThreshold'].includes(field)) {
//         const numValue = parseInt(value, 10);
//         if (numValue < 0 || numValue > 100) {
//           newErrors[field] = 'Must be between 0 and 100';
//           isValid = false;
//         }
//       }
//       // Validation for positive numbers
//       else {
//         const numValue = parseInt(value, 10);
//         if (numValue < 0) {
//           newErrors[field] = 'Must be a positive number';
//           isValid = false;
//         }
//       }
//     });

//     setErrors(newErrors);
//     return isValid;
//   };

//   const handleSaveConfiguration = async () => {
//     if (!hasUpdatePermission) return;

//     // Validate before saving
//     if (!validateFields()) {
//       toast.error('Please fix the validation errors before saving');
//       return;
//     }

//     try {
//       // Build payload in dot notation format with proper integer conversion
//       const payload = {
//         "monitoring.cpuThreshold": parseInt(monitoringConfig.cpuThreshold, 10),
//         "monitoring.ramThreshold": parseInt(monitoringConfig.ramThreshold, 10),
//         "monitoring.diskThreshold": parseInt(monitoringConfig.diskThreshold, 10),
//         "monitoring.networkThreshold": parseInt(monitoringConfig.networkThreshold, 10),
//         "monitoring.repeatFrequency": parseInt(monitoringConfig.repeatFrequency, 10)
//       };
      
//       console.log("This is the save payload", payload);
      
//       const response = await saveMonitoringConfig(payload).unwrap();
//       toast.success('Monitoring Configuration saved successfully');
//     } catch (error) {
//       console.error('Failed to save configuration:', error);
      
//       // Handle backend validation errors
//       if (error?.data?.errors && Array.isArray(error.data.errors)) {
//         // Display first error or all errors
//         const errorMessages = error.data.errors.map(err => err.error).join(', ');
//         toast.error(errorMessages);
        
//         // Set field-specific errors from backend
//         const backendErrors = {};
//         error.data.errors.forEach(err => {
//           if (err.key) {
//             // Convert "monitoring.cpuThreshold" to "cpuThreshold"
//             const fieldName = err.key.replace('monitoring.', '');
//             backendErrors[fieldName] = err.error;
//           }
//         });
//         setErrors(prev => ({ ...prev, ...backendErrors }));
//       } else {
//         toast.error(error?.data?.message || 'Failed to save configuration');
//       }
//     }
//   };

//   const inputClasses = (hasError) => `w-full px-3 py-2 rounded-lg border ${
//     hasError 
//       ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//       : isDarkMode
//         ? 'border-gray-600 focus:border-blue-500'
//         : 'border-gray-300 focus:border-blue-500'
//   } ${
//     isDarkMode
//       ? 'bg-gray-700 text-white placeholder-gray-400'
//       : 'bg-white text-gray-900 placeholder-gray-400'
//   } focus:outline-none focus:ring-2 ${
//     !hasUpdatePermission ? 'opacity-60 cursor-not-allowed' : ''
//   }`;

//   const labelClasses = `block text-sm font-medium mb-2 ${
//     isDarkMode ? 'text-gray-300' : 'text-gray-700'
//   }`;

//   const errorClasses = `text-xs mt-1 text-red-500`;

//   if (isLoadingConfig) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//         <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//           Loading configuration...
//         </span>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
//         <p className="font-medium">Failed to load configuration</p>
//         <p className="text-sm mt-1">Please try refreshing the page</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <h2 className={`text-lg font-semibold ${
//         isDarkMode ? 'text-white' : 'text-gray-900'
//       }`}>
//         MONITORING CONFIGURATION
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* CPU Threshold */}
//         <div>
//           <label className={labelClasses}>CPU Threshold (%)</label>
//           <input
//             type="number"
//             value={monitoringConfig.cpuThreshold}
//             onChange={(e) => handleChange('cpuThreshold', e.target.value)}
//             className={inputClasses(errors.cpuThreshold)}
//             placeholder="98"
//             min="0"
//             max="100"
//             disabled={!hasUpdatePermission}
//           />
//           {errors.cpuThreshold ? (
//             <p className={errorClasses}>{errors.cpuThreshold}</p>
//           ) : (
//             <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//               Alert when CPU usage exceeds this percentage
//             </p>
//           )}
//         </div>

//         {/* RAM Threshold */}
//         <div>
//           <label className={labelClasses}>RAM Threshold (%)</label>
//           <input
//             type="number"
//             value={monitoringConfig.ramThreshold}
//             onChange={(e) => handleChange('ramThreshold', e.target.value)}
//             className={inputClasses(errors.ramThreshold)}
//             placeholder="60"
//             min="0"
//             max="100"
//             disabled={!hasUpdatePermission}
//           />
//           {errors.ramThreshold ? (
//             <p className={errorClasses}>{errors.ramThreshold}</p>
//           ) : (
//             <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//               Alert when RAM usage exceeds this percentage
//             </p>
//           )}
//         </div>

//         {/* Disk Threshold */}
//         <div>
//           <label className={labelClasses}>Disk Threshold (%)</label>
//           <input
//             type="number"
//             value={monitoringConfig.diskThreshold}
//             onChange={(e) => handleChange('diskThreshold', e.target.value)}
//             className={inputClasses(errors.diskThreshold)}
//             placeholder="89"
//             min="0"
//             max="100"
//             disabled={!hasUpdatePermission}
//           />
//           {errors.diskThreshold ? (
//             <p className={errorClasses}>{errors.diskThreshold}</p>
//           ) : (
//             <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//               Alert when disk usage exceeds this percentage
//             </p>
//           )}
//         </div>

//         {/* Network Threshold */}
//         <div>
//           <label className={labelClasses}>Network Threshold (%)</label>
//           <input
//             type="number"
//             value={monitoringConfig.networkThreshold}
//             onChange={(e) => handleChange('networkThreshold', e.target.value)}
//             className={inputClasses(errors.networkThreshold)}
//             placeholder="10"
//             min="0"
//             disabled={!hasUpdatePermission}
//           />
//           {errors.networkThreshold ? (
//             <p className={errorClasses}>{errors.networkThreshold}</p>
//           ) : (
//             <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//               Alert when network usage exceeds this threshold
//             </p>
//           )}
//         </div>

//         {/* Repeat Frequency */}
//         <div>
//           <label className={labelClasses}>Repeat Frequency (minutes)</label>
//           <input
//             type="number"
//             value={monitoringConfig.repeatFrequency}
//             onChange={(e) => handleChange('repeatFrequency', e.target.value)}
//             className={inputClasses(errors.repeatFrequency)}
//             placeholder="5"
//             min="1"
//             disabled={!hasUpdatePermission}
//           />
//           {errors.repeatFrequency ? (
//             <p className={errorClasses}>{errors.repeatFrequency}</p>
//           ) : (
//             <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//               How often to repeat alerts for persistent issues
//             </p>
//           )}
//         </div>
//       </div>

//       <RenderIfAllowed module="global_configuration" action="update">
//         <div className="flex justify-end pt-4">
//           <button
//             onClick={handleSaveConfiguration}
//             disabled={isSaving}
//             className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
//               isDarkMode
//                 ? 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//                 : 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//             } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             {isSaving ? 'Saving...' : 'Save Configuration'}
//           </button>
//         </div>
//       </RenderIfAllowed>
//     </div>
//   );
// };

// export default MonitoringConfiguration;
