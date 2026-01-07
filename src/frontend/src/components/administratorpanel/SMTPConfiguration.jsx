// import React, { useState, useEffect, useRef } from 'react';
// import { toast } from 'react-toastify';
// import { ChevronDown, Eye, EyeOff } from 'lucide-react';
// import { useSelector } from 'react-redux';
// import { useGetGlobalConfigQuery, useSaveGlobalConfigMutation, useTestGlobalConfigMutation } from '../../redux/globalApiSlice';
// import RenderIfAllowed from '../Utilities/RenderIfAllowed';
// import TestConfigModal from './TestConfigModal';
// import { useAuth } from '../../Contexts/AuthContext'; 

// const SMTPConfiguration = ({ isDarkMode }) => {
//   // RTK Query hooks
//   const { data: existingConfig, isLoading: isLoadingConfig, isError } = useGetGlobalConfigQuery();

//   console.log("This is the data for the smtp:", existingConfig);

//   const [saveSmtpConfig, { isLoading: isSaving }] = useSaveGlobalConfigMutation();

//   // Testing
//   const [testSmtpConfig, { isLoading: isTesting }] = useTestGlobalConfigMutation();

//   // Modal visibility state
//   const [showTestModal, setShowTestModal] = useState(false);

//   // Get user from AuthContext
//   const { user } = useAuth();

//   // show password
//   const [showPassword, setShowPassword] = useState(false);

//   // Permission check
//   const smtpPermissions = useSelector((state) => state.userModPerm?.global_configuration);
//   const hasUpdatePermission = smtpPermissions?.update || false;

//   // Dropdown state and ref
//   const [isEncryptionDropdownOpen, setIsEncryptionDropdownOpen] = useState(false);
//   const encryptionDropdownRef = useRef(null);

//   // SMTP State
//   const [smtpConfig, setSmtpConfig] = useState({
//     smtpHost: '',
//     smtpPort: '',
//     username: '',
//     password: '',
//     encryptionType: '',
//     fromEmail: ''
//   });

//   // Alert State
//   const [alertConfig, setAlertConfig] = useState({
//     toEmails: '',
//     ccEmails: ''
//   });

//   // Error State
//   const [errors, setErrors] = useState({
//     smtpHost: '',
//     smtpPort: '',
//     username: '',
//     password: '',
//     encryptionType: '',
//     fromEmail: '',
//     toEmails: '',
//     ccEmails: ''
//   });

//   // Populate form with fetched data
//   useEffect(() => {
//     if (!existingConfig) return;

//     console.log("Populating form with:", existingConfig);

//     if (existingConfig["smtp.host"]) {
//       setSmtpConfig({
//         smtpHost: existingConfig["smtp.host"] || "",
//         smtpPort: existingConfig["smtp.port"] || "",
//         username: existingConfig["smtp.username"] || "",
//         password: existingConfig["smtp.password"] || "",
//         encryptionType: (existingConfig["smtp.encryption_type"] || "").toLowerCase(),
//         fromEmail: existingConfig["smtp.from_email"] || "",
//       });
//     }
//     if (existingConfig["alert.to_emails"] || existingConfig["alert.cc_emails"]) {
//       const toEmails = existingConfig["alert.to_emails"];
//       const ccEmails = existingConfig["alert.cc_emails"];

//       setAlertConfig({
//         toEmails: Array.isArray(toEmails) ? toEmails.join(", ") : toEmails || "",
//         ccEmails: Array.isArray(ccEmails) ? ccEmails.join(", ") : ccEmails || "",
//       });
//     }
//   }, [existingConfig]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (encryptionDropdownRef.current && !encryptionDropdownRef.current.contains(event.target)) {
//         setIsEncryptionDropdownOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleSmtpChange = (field, value) => {
//     if (!hasUpdatePermission) return;
//     setSmtpConfig(prev => ({
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

//   const handleAlertChange = (field, value) => {
//     if (!hasUpdatePermission) return;
//     setAlertConfig(prev => ({
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

//   const handleEncryptionSelect = (value) => {
//     if (!hasUpdatePermission) return;
//     handleSmtpChange('encryptionType', value);
//     setIsEncryptionDropdownOpen(false);
//   };

//   // Email validation regex
//   const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const validateFields = () => {
//     const newErrors = {};
//     let isValid = true;

//     // Validate SMTP Host
//     if (!smtpConfig.smtpHost || smtpConfig.smtpHost.trim() === '') {
//       newErrors.smtpHost = 'SMTP Host is required';
//       isValid = false;
//     }

//     // Validate SMTP Port
//     if (!smtpConfig.smtpPort || smtpConfig.smtpPort === '') {
//       newErrors.smtpPort = 'SMTP Port is required';
//       isValid = false;
//     } else if (isNaN(smtpConfig.smtpPort) || parseInt(smtpConfig.smtpPort, 10) <= 0) {
//       newErrors.smtpPort = 'Must be a valid port number';
//       isValid = false;
//     }

//     // Validate Username
//     if (!smtpConfig.username || smtpConfig.username.trim() === '') {
//       newErrors.username = 'Username is required';
//       isValid = false;
//     }

//     // Validate Password
//     if (!smtpConfig.password || smtpConfig.password.trim() === '') {
//       newErrors.password = 'Password is required';
//       isValid = false;
//     }

//     // Validate Encryption Type
//     if (!smtpConfig.encryptionType || smtpConfig.encryptionType === '') {
//       newErrors.encryptionType = 'Encryption Type is required';
//       isValid = false;
//     }

//     // Validate From Email
//     if (!smtpConfig.fromEmail || smtpConfig.fromEmail.trim() === '') {
//       newErrors.fromEmail = 'From Email is required';
//       isValid = false;
//     } else if (!validateEmail(smtpConfig.fromEmail)) {
//       newErrors.fromEmail = 'Invalid email format';
//       isValid = false;
//     }

//     //Validate To Emails (accepts multiple)
//     if (!alertConfig.toEmails || alertConfig.toEmails.trim() === '') {
//       newErrors.toEmails = 'To Email is required';
//       isValid = false;
//     } else {
//       // Split by comma and validate each email
//       const toEmailArray = alertConfig.toEmails.split(',').map(email => email.trim());
//       const invalidEmails = toEmailArray.filter(email => email && !validateEmail(email));
//       if (invalidEmails.length > 0) {
//         newErrors.toEmails = 'One or more email addresses are invalid';
//         isValid = false;
//       }
//     }

//     // Validate CC Emails (optional, but if provided must be valid)
//     if (alertConfig.ccEmails && alertConfig.ccEmails.trim() !== '') {
//       const ccEmailArray = alertConfig.ccEmails.split(',').map(email => email.trim());
//       const invalidEmails = ccEmailArray.filter(email => email && !validateEmail(email));
//       if (invalidEmails.length > 0) {
//         newErrors.ccEmails = 'One or more email addresses are invalid';
//         isValid = false;
//       }
//     }

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
//       // Handle both array and string formats for email fields
//       let toEmailsArray = [];
//       let ccEmailsArray = [];

//       if (Array.isArray(alertConfig.toEmails)) {
//         toEmailsArray = alertConfig.toEmails.filter(email => email && email.trim().length > 0);
//       } else if (typeof alertConfig.toEmails === 'string') {
//         toEmailsArray = alertConfig.toEmails
//           .split(',')
//           .map(email => email.trim())
//           .filter(email => email.length > 0);
//       }

//       if (Array.isArray(alertConfig.ccEmails)) {
//         ccEmailsArray = alertConfig.ccEmails.filter(email => email && email.trim().length > 0);
//       } else if (typeof alertConfig.ccEmails === 'string') {
//         ccEmailsArray = alertConfig.ccEmails
//           .split(',')
//           .map(email => email.trim())
//           .filter(email => email.length > 0);
//       }

//       //=Build payload
//       const payload = {
//         "smtp.host": smtpConfig.smtpHost,
//         "smtp.port": parseInt(smtpConfig.smtpPort, 10),
//         "smtp.username": smtpConfig.username,
//         "smtp.password": smtpConfig.password,
//         "smtp.encryption_type": smtpConfig.encryptionType.toUpperCase(),
//         "smtp.from_email": smtpConfig.fromEmail,
//         "alert.to_emails": toEmailsArray,
//         "alert.cc_emails": ccEmailsArray
//       };

//       console.log("Saving payload:", payload);

//       const response = await saveSmtpConfig(payload).unwrap();

//       console.log('Configuration saved:', response);
//       toast.success(response?.message);
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
//             // Convert "smtp.host" to "smtpHost" and "alert.to_emails" to "toEmails"
//             const fieldName = err.key.replace('smtp.', '').replace('alert.', '')
//               .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
//               .replace('from_email', 'fromEmail')
//               .replace('encryption_type', 'encryptionType')
//               .replace('to_emails', 'toEmails')
//               .replace('cc_emails', 'ccEmails');
//             backendErrors[fieldName] = err.error;
//           }
//         });
//         setErrors(prev => ({ ...prev, ...backendErrors }));
//       } else {
//         toast.error(error?.data?.message);
//       }
//     }
//   };

//   // Test Email function
//  const handleSendTestEmail = async ({ type, email }) => {
//   let payload = { type };

//   switch (type) {
//     case "specific_email":
//       const emailList = email
//         .split(",")
//         .map(e => e.trim())
//         .filter(Boolean);

//       if (emailList.length === 0) {
//         toast.error("Please enter valid email(s)");
//         return;
//       }

//       payload.test_email = emailList;
//       break;

//     case "alert_config":
//       if (!alertConfig.toEmails?.trim()) {
//         toast.error(
//           'Please configure the "To Email" in Alert Configuration before testing'
//         );
//         return;
//       }

//       // Convert alert config string to array as well
//       payload.test_email = alertConfig.toEmails
//         .split(",")
//         .map(e => e.trim())
//         .filter(Boolean);

//       break;

//     case "logged_user":
//       if (user?.email) {
//         payload.test_email = [user.email];
//         console.log("👤 Type: logged_user, email:", user.email);
//       } else {
//         console.warn("⚠️ User email missing — backend will infer");
//       }
//       break;

//     default:
//       toast.error("Invalid email test type");
//       return;
//   }

//   console.log("📤 payload for test API:", JSON.stringify(payload, null, 2));

//   try {
//     const response = await testSmtpConfig(payload).unwrap();
//     toast.success(response?.message || "Test email sent successfully");
//   } catch (error) {
//     toast.error(error?.data?.message || "Failed to send test email");
//   }
// };


//   const inputClasses = (hasError) => `w-full px-3 py-2 rounded-lg border ${hasError
//     ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
//     : isDarkMode
//       ? 'border-gray-600 focus:border-blue-500'
//       : 'border-gray-300 focus:border-blue-500'
//     } ${isDarkMode
//       ? 'bg-gray-700 text-white placeholder-gray-400'
//       : 'bg-white text-gray-900 placeholder-gray-400'
//     } focus:outline-none focus:ring-2 ${!hasUpdatePermission ? 'opacity-60 cursor-not-allowed' : ''
//     }`;

//   const labelClasses = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
//     }`;

//   const errorClasses = `text-xs mt-1 text-red-500`;

//   const encryptionOptions = [
//     { value: '', label: 'Select encryption' },
//     { value: 'tls', label: 'TLS' },
//     { value: 'ssl', label: 'SSL' },
//     { value: 'none', label: 'None' }
//   ];

//   const selectedEncryption = encryptionOptions.find(
//     opt => opt.value === smtpConfig.encryptionType
//   ) || encryptionOptions[0];

//   // Show loading state while fetching config
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

//   // Show error state if fetch fails
//   if (isError) {
//     return (
//       <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
//         <p className="font-medium">Failed to load configuration</p>
//         <p className="text-sm mt-1">Please try refreshing the page</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="space-y-8">
//         {/* SMTP Configuration Section */}
//         <div className="space-y-6">
//           <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
//             SMTP CONFIGURATION
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className={labelClasses}>SMTP Host</label>
//               <input
//                 type="text"
//                 value={smtpConfig.smtpHost}
//                 onChange={(e) => handleSmtpChange('smtpHost', e.target.value)}
//                 className={inputClasses(errors.smtpHost)}
//                 placeholder="smtp.example.com"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.smtpHost && <p className={errorClasses}>{errors.smtpHost}</p>}
//             </div>

//             <div>
//               <label className={labelClasses}>SMTP Port</label>
//               <input
//                 type="number"
//                 value={smtpConfig.smtpPort}
//                 onChange={(e) => handleSmtpChange('smtpPort', e.target.value)}
//                 className={inputClasses(errors.smtpPort)}
//                 placeholder="587"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.smtpPort && <p className={errorClasses}>{errors.smtpPort}</p>}
//             </div>

//             <div>
//               <label className={labelClasses}>Username</label>
//               <input
//                 type="text"
//                 value={smtpConfig.username}
//                 onChange={(e) => handleSmtpChange('username', e.target.value)}
//                 className={inputClasses(errors.username)}
//                 placeholder="your-email@example.com"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.username && <p className={errorClasses}>{errors.username}</p>}
//             </div>

//             <div>
//               <label className={labelClasses}>Password</label>

//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={smtpConfig.password}
//                   onChange={(e) => handleSmtpChange('password', e.target.value)}
//                   className={`${inputClasses(errors.password)} pr-10`}
//                   placeholder="••••••••"
//                   disabled={!hasUpdatePermission}
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   disabled={!hasUpdatePermission}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5" />
//                   ) : (
//                     <Eye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>

//               {errors.password && <p className={errorClasses}>{errors.password}</p>}
//             </div>

//             {/* Modern Custom Dropdown for Encryption Type */}
//             <div>
//               <label className={labelClasses}>Encryption Type</label>
//               <div className="relative" ref={encryptionDropdownRef}>
//                 <button
//                   type="button"
//                   onClick={() => hasUpdatePermission && setIsEncryptionDropdownOpen(!isEncryptionDropdownOpen)}
//                   disabled={!hasUpdatePermission}
//                   className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-all duration-200
//                     ${errors.encryptionType
//                       ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
//                       : isDarkMode
//                         ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
//                         : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
//                     }
//                     ${isEncryptionDropdownOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
//                     ${!smtpConfig.encryptionType ? (isDarkMode ? 'text-gray-400' : 'text-gray-500') : ''}
//                     ${!hasUpdatePermission ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
//                   `}
//                 >
//                   <span className="text-sm">{selectedEncryption.label}</span>
//                   <ChevronDown
//                     className={`w-4 h-4 ml-2 transition-transform duration-200 ${isEncryptionDropdownOpen ? 'rotate-180' : 'rotate-0'
//                       }`}
//                   />
//                 </button>

//                 {/* Dropdown Menu */}
//                 {hasUpdatePermission && (
//                   <div
//                     className={`absolute left-0 right-0 top-full mt-1 rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
//                       ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
//                       ${isEncryptionDropdownOpen
//                         ? 'opacity-100 scale-100 translate-y-0'
//                         : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
//                       }
//                     `}
//                   >
//                     <div className="py-1 max-h-48 overflow-y-auto">
//                       {encryptionOptions.map((option) => (
//                         <button
//                           key={option.value}
//                           type="button"
//                           onClick={() => handleEncryptionSelect(option.value)}
//                           className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
//                             ${smtpConfig.encryptionType === option.value
//                               ? 'bg-[#6366f1] text-white'
//                               : isDarkMode
//                                 ? 'text-gray-200 hover:bg-gray-600'
//                                 : 'text-gray-700 hover:bg-gray-100'
//                             }`}
//                         >
//                           {option.label}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//               {errors.encryptionType && <p className={errorClasses}>{errors.encryptionType}</p>}
//             </div>

//             <div>
//               <label className={labelClasses}>From Email</label>
//               <input
//                 type="email"
//                 value={smtpConfig.fromEmail}
//                 onChange={(e) => handleSmtpChange('fromEmail', e.target.value)}
//                 className={inputClasses(errors.fromEmail)}
//                 placeholder="noreply@example.com"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.fromEmail && <p className={errorClasses}>{errors.fromEmail}</p>}
//             </div>
//           </div>
//         </div>

//         {/* Divider */}
//         <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

//         {/* Alert Configuration Section */}
//         <div className="space-y-6">
//           <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
//             ALERT CONFIGURATION
//           </h2>

//           <div className="grid grid-cols-1 gap-6">
//             <div>
//               <label className={labelClasses}>To Emails</label>
//               <input
//                 type="text"
//                 value={alertConfig.toEmails}
//                 onChange={(e) => handleAlertChange('toEmails', e.target.value)}
//                 className={inputClasses(errors.toEmails)}
//                 placeholder="email1@example.com, email2@example.com"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.toEmails ? (
//                 <p className={errorClasses}>{errors.toEmails}</p>
//               ) : (
//                 <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                   Primary recipient email address(es). Separate multiple emails with commas
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className={labelClasses}>CC Emails</label>
//               <input
//                 type="text"
//                 value={alertConfig.ccEmails}
//                 onChange={(e) => handleAlertChange('ccEmails', e.target.value)}
//                 className={inputClasses(errors.ccEmails)}
//                 placeholder="email1@example.com, email2@example.com"
//                 disabled={!hasUpdatePermission}
//               />
//               {errors.ccEmails ? (
//                 <p className={errorClasses}>{errors.ccEmails}</p>
//               ) : (
//                 <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                   Separate multiple emails with commas
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Save and Test Buttons */}
//         <RenderIfAllowed module="global_configuration" action="update">
//           <div className="flex justify-end gap-4 pt-4">
//             {/* Test Button*/}
//             <button
//               onClick={() => setShowTestModal(true)}
//               disabled={isTesting}
//               className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${isDarkMode
//                 ? 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//                 : 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//                 } ${isTesting ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {isTesting ? 'Testing...' : 'Test Configuration'}
//             </button>

//             {/* Save Button */}
//             <button
//               onClick={handleSaveConfiguration}
//               disabled={isSaving}
//               className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors ${isDarkMode
//                 ? 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//                 : 'bg-[#6366F1] hover:bg-[#6366F1]/80 text-white'
//                 } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {isSaving ? 'Saving...' : 'Save Configuration'}
//             </button>
//           </div>
//         </RenderIfAllowed>
//       </div>

//       {/* TestConfigModal */}
//       <TestConfigModal
//         show={showTestModal}
//         onHide={() => setShowTestModal(false)}
//         onSend={handleSendTestEmail}
//         isDarkMode={isDarkMode}
//       />
//     </>
//   );
// };

// export default SMTPConfiguration;
