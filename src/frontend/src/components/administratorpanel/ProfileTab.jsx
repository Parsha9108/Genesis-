// // src/components/admin/ProfileTab.js
// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { CheckIcon, ShieldCheckIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
// import { ArrowPathIcon } from '@heroicons/react/24/solid';
// import { useUpdateUserMutation } from '../../redux/userApiSlice'; 

// const ProfileTab = ({ user, isDarkMode = false }) => {
//   const [formData, setFormData] = useState({
//     username: user?.username || '',
//     email: user?.email || '',
//   });
  
//   // ✅ Track original values to detect changes
//   const [originalData, setOriginalData] = useState({
//     username: user?.username || '',
//     email: user?.email || '',
//   });

//   // ✅ Use the RTK Query mutation hook
//   const [updateProfile, { isLoading: isUpdating }] = useUpdateUserMutation();

//   // ✅ Check if user is admin
//   const isAdmin = user?.role?.toLowerCase() === 'admin';

//   // ✅ Update original data when user prop changes
//   useEffect(() => {
//     const newOriginalData = {
//       username: user?.username || '',
//       email: user?.email || '',
//     };
//     setOriginalData(newOriginalData);
//     setFormData(newOriginalData);
//   }, [user]);

//   // ✅ Check if form data has changed from original
//   const hasChanges = () => {
//     return formData.username !== originalData.username || 
//            formData.email !== originalData.email;
//   };

//   // ✅ Check if form is valid (not empty fields)
//   const isFormValid = () => {
//     return formData.username.trim() !== '' && 
//            formData.email.trim() !== '' &&
//            /\S+@\S+\.\S+/.test(formData.email); // Basic email validation
//   };

//   // ✅ Determine if update button should be enabled
//   const isUpdateButtonEnabled = () => {
//     return isAdmin && hasChanges() && isFormValid() && !isUpdating;
//   };

//   const handleChange = (e) => {
//     // Only allow changes for admin users
//     if (!isAdmin) return;
    
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Prevent non-admin users from submitting or if no changes
//     if (!isAdmin || !hasChanges() || !isFormValid()) return;

//     try {
     
//       // ✅ Prepare data - only send changed fields
//       const updateData = {};
//       updateData.id = user.id; // Always include user ID
//       if (formData.username !== originalData.username) {
//         updateData.username = formData.username;
//       }
//       if (formData.email !== originalData.email) {
//         updateData.email = formData.email;
//       }

//       // ✅ Call the API using RTK Query mutation
//       const result = await updateProfile(updateData).unwrap();
      
//       // ✅ Update original data to reflect successful save
//       setOriginalData({
//         username: formData.username,
//         email: formData.email,
//       });
      
//       toast.success('Profile updated successfully!');
//       console.log('Profile updated:', result);
      
//     } catch (error) {
//       console.error('Profile update error:', error);
      
//       // ✅ Handle different error structures from backend
//       if (error?.data) {
//         if (error.data.username && Array.isArray(error.data.username)) {
//           toast.error(`Username: ${error.data.username[0]}`);
//         } else if (error.data.email && Array.isArray(error.data.email)) {
//           toast.error(`Email: ${error.data.email[0]}`);
//         } else if (error.data.error) {
//           toast.error(error.data.error);
//         } else if (error.data.detail) {
//           toast.error(error.data.detail);
//         } else {
//           // Handle multiple field errors
//           const errorMessages = [];
//           Object.keys(error.data).forEach(field => {
//             if (Array.isArray(error.data[field])) {
//               errorMessages.push(`${field}: ${error.data[field][0]}`);
//             }
//           });
          
//           if (errorMessages.length > 0) {
//             toast.error(errorMessages.join(', '));
//           } else {
//             toast.error('Error updating profile');
//           }
//         }
//       } else {
//         toast.error(error?.message || 'Network error occurred');
//       }
//     }
//   };

//   // ✅ Reset form to original values
//   const handleReset = () => {
//     setFormData(originalData);
//   };

//   // ✅ Get role icon
//   const getRoleIcon = () => {
//     switch (user?.role?.toLowerCase()) {
//       case 'admin':
//         return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
//       case 'manager':
//         return <UserGroupIcon className="w-5 h-5 text-yellow-500" />;
//       default:
//         return <UserIcon className="w-5 h-5 text-blue-500" />;
//     }
//   };

//   // ✅ Get input styling based on user role
//   const getInputStyling = (fieldName) => {
//     if (!isAdmin) {
//       // Non-admin users get grayed out, read-only fields
//       return isDarkMode 
//         ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed' 
//         : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
//     }
    
//     // ✅ Highlight fields that have been changed
//     const isChanged = formData[fieldName] !== originalData[fieldName];
    
//     if (isChanged) {
//       return isDarkMode 
//         ? 'bg-gray-700 border-blue-500 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500' 
//         : 'bg-white border-blue-500 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500';
//     }
    
//     // Admin users get normal editable fields
//     return isDarkMode 
//       ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
//       : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
//   };

//   return (
//     <div className="space-y-4">
//       <div className="mb-3">
//         <h3 
//           className="text-base font-medium flex items-center"
//           style={{ color: isDarkMode ? '#FFF' : '#111827' }}
//         >
//           {getRoleIcon()}
//           <span className="ml-2">Profile Information</span>
//           {isUpdating && (
//             <span 
//               className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full"
//               style={{
//                 backgroundColor: isDarkMode ? '#1E40AF' : '#DBEAFE',
//                 color: isDarkMode ? '#93C5FD' : '#1E40AF'
//               }}
//             >
//               Updating...
//             </span>
//           )}
//         </h3>
//         <p 
//           className="text-sm mt-1"
//           style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
//         >
//           {isAdmin 
//             ? 'Update your account information and preferences.' 
//             : 'Your account details and information.'}
//         </p>
//       </div>

//       <div 
//         className="p-4 rounded-lg border"
//         style={{
//           backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
//           borderColor: isDarkMode ? '#374151' : '#E5E7EB'
//         }}
//       >
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label 
//                 htmlFor="username" 
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
//               >
//                 Username
//                 {isAdmin && formData.username !== originalData.username && (
//                   <span className="text-blue-500 ml-1">*</span>
//                 )}
//               </label>
//               <input
//                 type="text"
//                 id="username"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//                 readOnly={!isAdmin}
//                 disabled={isUpdating}
//                 className={`w-full px-3 py-2 border rounded-lg transition-colors ${getInputStyling('username')} ${isUpdating ? 'opacity-50' : ''}`}
//                 required={isAdmin}
//               />
//             </div>
            
//             <div>
//               <label 
//                 htmlFor="email" 
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
//               >
//                 Email Address
//                 {isAdmin && formData.email !== originalData.email && (
//                   <span className="text-blue-500 ml-1">*</span>
//                 )}
//               </label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 readOnly={!isAdmin}
//                 disabled={isUpdating}
//                 className={`w-full px-3 py-2 border rounded-lg transition-colors ${getInputStyling('email')} ${isUpdating ? 'opacity-50' : ''}`}
//                 required={isAdmin}
//               />
//             </div>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label 
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
//               >
//                 Role
//               </label>
//               <input 
//                 type="text" 
//                 className={`w-full px-3 py-2 border rounded-lg cursor-not-allowed ${
//                   isDarkMode 
//                     ? 'bg-gray-600 border-gray-500 text-gray-300' 
//                     : 'bg-gray-100 border-gray-300 text-gray-500'
//                 }`}
//                 value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} 
//                 readOnly 
//               />
//               <p 
//                 className="text-xs mt-0.5"
//                 style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
//               >
//                 Your role cannot be changed
//               </p>
//             </div>
            
//             <div>
//               <label 
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
//               >
//                 Member Since
//               </label>
//               <input 
//                 type="text" 
//                 className={`w-full px-3 py-2 border rounded-lg cursor-not-allowed ${
//                   isDarkMode 
//                     ? 'bg-gray-600 border-gray-500 text-gray-300' 
//                     : 'bg-gray-100 border-gray-300 text-gray-500'
//                 }`}
//                 value={new Date(user?.date_joined).toLocaleDateString('en-US', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric'
//                 })} 
//                 readOnly 
//               />
//               <p 
//                 className="text-xs mt-0.5"
//                 style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
//               >
//                 Account creation date
//               </p>
//             </div>
//           </div>

//           {/* ✅ Update/Cancel Buttons - Only show for Admin */}
//           {isAdmin && (
//             <div className="flex justify-end space-x-3 pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
//               {/* ✅ Cancel/Reset Button - Only show when there are changes */}
//               {hasChanges() && !isUpdating && (
//                 <button 
//                   type="button"
//                   onClick={handleReset}
//                   className={`inline-flex items-center px-5 py-2 font-medium rounded-lg transition-colors ${
//                     isDarkMode 
//                       ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
//                       : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
//                   }`}
//                 >
//                   <ArrowPathIcon className="w-4 h-4 mr-2" />
//                   Reset
//                 </button>
//               )}
              
//               {/* ✅ Update Button - Smart enabling/disabling */}
//               <button 
//                 type="submit" 
//                 disabled={!isUpdateButtonEnabled()}
//                 className={`inline-flex items-center px-5 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
//                   isUpdateButtonEnabled()
//                     ? (isDarkMode 
//                         ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800'
//                         : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700')
//                     : 'bg-gray-400 text-gray-600 cursor-not-allowed'
//                 }`}
//                 title={
//                   !hasChanges() ? 'Make changes to enable update' :
//                   !isFormValid() ? 'Please fill in all required fields' :
//                   isUpdating ? 'Updating...' : 'Update Profile'
//                 }
//               >
//                 {isUpdating ? (
//                   <>
//                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 814 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Updating...
//                   </>
//                 ) : (
//                   <>
//                     <CheckIcon className="w-4 h-4 mr-2" />
//                     Update Profile
//                   </>
//                 )}
//               </button>
//             </div>
//           )}

//           {/* ✅ Info message for non-admin users */}
//           {!isAdmin && (
//             <div 
//               className="mt-4 p-3 rounded-lg border"
//               style={{
//                 backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
//                 borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
//               }}
//             >
//               <p 
//                 className="text-xs text-center"
//                 style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
//               >
//                 <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
//                 Profile information is managed by your administrator
//               </p>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ProfileTab;


// src/components/admin/ProfileTab.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckIcon, ShieldCheckIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { useUpdateUserMutation } from '../../redux/userApiSlice'; 

const ProfileTab = ({ user, isDarkMode = false }) => {
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  
  // ✅ Track original values to detect changes
  const [originalData, setOriginalData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  // ✅ Use the RTK Query mutation hook
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserMutation();

  // ✅ Check if user is admin
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // ✅ Update original data when user prop changes
  useEffect(() => {
    const newOriginalData = {
      username: user?.username || '',
      email: user?.email || '',
    };
    setOriginalData(newOriginalData);
    setFormData(newOriginalData);
  }, [user]);

  // ✅ Check if form data has changed from original
  const hasChanges = () => {
    return formData.username !== originalData.username || 
           formData.email !== originalData.email;
  };

  // ✅ Check if form is valid (not empty fields)
  const isFormValid = () => {
    return formData.username.trim() !== '' && 
           formData.email.trim() !== '' &&
           /\S+@\S+\.\S+/.test(formData.email); // Basic email validation
  };

  // ✅ Determine if update button should be enabled
  const isUpdateButtonEnabled = () => {
    return isAdmin && hasChanges() && isFormValid() && !isUpdating;
  };

  const handleChange = (e) => {
    // Only allow changes for admin users
    if (!isAdmin) return;
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent non-admin users from submitting or if no changes
    if (!isAdmin || !hasChanges() || !isFormValid()) return;

    try {
     
      // ✅ Prepare data - only send changed fields
      const updateData = {};
      updateData.id = user.id; // Always include user ID
      if (formData.username !== originalData.username) {
        updateData.username = formData.username;
      }
      if (formData.email !== originalData.email) {
        updateData.email = formData.email;
      }

      // ✅ Call the API using RTK Query mutation
      const result = await updateProfile(updateData).unwrap();
      
      // ✅ Update original data to reflect successful save
      setOriginalData({
        username: formData.username,
        email: formData.email,
      });
      
      toast.success('Profile updated successfully!');
      console.log('Profile updated:', result);
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      // ✅ Handle different error structures from backend
      if (error?.data) {
        if (error.data.username && Array.isArray(error.data.username)) {
          toast.error(`Username: ${error.data.username[0]}`);
        } else if (error.data.email && Array.isArray(error.data.email)) {
          toast.error(`Email: ${error.data.email[0]}`);
        } else if (error.data.error) {
          toast.error(error.data.error);
        } else if (error.data.detail) {
          toast.error(error.data.detail);
        } else {
          // Handle multiple field errors
          const errorMessages = [];
          Object.keys(error.data).forEach(field => {
            if (Array.isArray(error.data[field])) {
              errorMessages.push(`${field}: ${error.data[field][0]}`);
            }
          });
          
          if (errorMessages.length > 0) {
            toast.error(errorMessages.join(', '));
          } else {
            toast.error('Error updating profile');
          }
        }
      } else {
        toast.error(error?.message || 'Network error occurred');
      }
    }
  };

  // ✅ Reset form to original values
  const handleReset = () => {
    setFormData(originalData);
  };

  // ✅ Get role icon
  const getRoleIcon = () => {
    switch (user?.role?.toLowerCase()) {
      case 'admin':
        return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
      case 'manager':
        return <UserGroupIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  // ✅ Get input styling based on user role
  const getInputStyling = (fieldName) => {
    if (!isAdmin) {
      // Non-admin users get grayed out, read-only fields
      return isDarkMode 
        ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed' 
        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    // ✅ Highlight fields that have been changed
    const isChanged = formData[fieldName] !== originalData[fieldName];
    
    if (isChanged) {
      return isDarkMode 
        ? 'bg-gray-700 border-blue-500 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500' 
        : 'bg-white border-blue-500 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500';
    }
    
    // Admin users get normal editable fields
    return isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  };

  return (
    <div className="space-y-3"> {/* ✅ Reduced from space-y-4 to space-y-3 */}
      <div className="mb-2"> {/* ✅ Reduced from mb-3 to mb-2 */}
        <h3 
          className="text-base font-medium flex items-center"
          style={{ color: isDarkMode ? '#FFF' : '#111827' }}
        >
          {getRoleIcon()}
          <span className="ml-2">Profile Information</span>
        </h3>
        <p 
          className="text-sm mt-1"
          style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
        >
          {isAdmin 
            ? 'Update your account information and preferences.' 
            : 'Your account details and information.'}
        </p>
      </div>

      <div 
        className="p-3 rounded-lg border" // ✅ Reduced padding from p-4 to p-3
        style={{
          backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
          borderColor: isDarkMode ? '#374151' : '#E5E7EB'
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-3"> {/* ✅ Reduced from space-y-4 to space-y-3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {/* ✅ Reduced gap from gap-4 to gap-3 */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium mb-1"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Username
                {isAdmin && formData.username !== originalData.username && (
                  <span className="text-blue-500 ml-1">*</span>
                )}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                readOnly={!isAdmin}
                disabled={isUpdating}
                className={`w-full px-3 py-1.5 border rounded-lg transition-colors ${getInputStyling('username')} ${isUpdating ? 'opacity-50' : ''}`} // ✅ Reduced padding from py-2 to py-1.5
                required={isAdmin}
              />
            </div>
            
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-1"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Email Address
                {isAdmin && formData.email !== originalData.email && (
                  <span className="text-blue-500 ml-1">*</span>
                )}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={!isAdmin}
                disabled={isUpdating}
                className={`w-full px-3 py-1.5 border rounded-lg transition-colors ${getInputStyling('email')} ${isUpdating ? 'opacity-50' : ''}`} // ✅ Reduced padding from py-2 to py-1.5
                required={isAdmin}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {/* ✅ Reduced gap from gap-4 to gap-3 */}
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Role
              </label>
              <input 
                type="text" 
                className={`w-full px-3 py-1.5 border rounded-lg cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`} // ✅ Reduced padding from py-2 to py-1.5
                value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} 
                readOnly 
              />
              <p 
                className="text-xs mt-0.5"
                style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
              >
                Your role cannot be changed
              </p>
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Member Since
              </label>
              <input 
                type="text" 
                className={`w-full px-3 py-1.5 border rounded-lg cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`} // ✅ Reduced padding from py-2 to py-1.5
                value={new Date(user?.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} 
                readOnly 
              />
              <p 
                className="text-xs mt-0.5"
                style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
              >
                Account creation date
              </p>
            </div>
          </div>

          {/* ✅ Update/Cancel Buttons - Only show for Admin */}
          {isAdmin && (
            <div className="flex justify-end space-x-3 pt-2 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}> {/* ✅ Reduced padding from pt-3 to pt-2 */}
              {/* ✅ Cancel/Reset Button - Only show when there are changes */}
              {hasChanges() && !isUpdating && (
                <button 
                  type="button"
                  onClick={handleReset}
                  className={`inline-flex items-center px-4 py-1.5 font-medium rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`} // ✅ Reduced padding from px-5 py-2 to px-4 py-1.5
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Reset
                </button>
              )}
              
              {/* ✅ Update Button - Smart enabling/disabling */}
              <button 
                type="submit" 
                disabled={!isUpdateButtonEnabled()}
                className={`inline-flex items-center px-4 py-1.5 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                  isUpdateButtonEnabled()
                    ? (isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700')
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`} // ✅ Reduced padding from px-5 py-2 to px-4 py-1.5
                title={
                  !hasChanges() ? 'Make changes to enable update' :
                  !isFormValid() ? 'Please fill in all required fields' :
                  isUpdating ? 'Updating...' : 'Update Profile'
                }
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 814 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          )}

          {/* ✅ Info message for non-admin users */}
          {!isAdmin && (
            <div 
              className="mt-3 p-2.5 rounded-lg border" // ✅ Reduced margins and padding: mt-4 -> mt-3, p-3 -> p-2.5
              style={{
                backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
              }}
            >
              <p 
                className="text-xs text-center"
                style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
              >
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                Profile information is managed by your administrator
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
