import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckIcon, ShieldCheckIcon, UserGroupIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { useUpdateUserMutation } from '../../redux/userApiSlice'; 
import RenderIfAllowed from '../Utilities/RenderIfAllowed';
import { useSelector } from 'react-redux';

const ProfileTab = ({ user, isDarkMode = false }) => {
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [originalData, setOriginalData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserMutation();

  // Permission check 
  const userPermissions = useSelector((state) => state.userModPerm?.users_management);
  const hasUpdatePermission = userPermissions?.update || false;

  useEffect(() => {
    const newOriginalData = {
      username: user?.username || '',
      email: user?.email || '',
    };
    setOriginalData(newOriginalData);
    setFormData({
      ...newOriginalData,
      newPassword: '',
      confirmPassword: '',
    });
  }, [user]);

  const hasChanges = () => {
    return formData.username !== originalData.username || 
           formData.email !== originalData.email ||
           formData.newPassword !== '';
  };

  const isFormValid = () => {
    const basicValid = formData.username.trim() !== '' && 
                       formData.email.trim() !== '' &&
                       /\S+@\S+\.\S+/.test(formData.email);
    
    // If attempting to change password, validate password fields
    if (formData.newPassword !== '') {
      return basicValid && 
             formData.newPassword.length >= 8 &&
             formData.newPassword === formData.confirmPassword;
    }
    
    return basicValid;
  };

  const isUpdateButtonEnabled = () => {
    return hasUpdatePermission && hasChanges() && isFormValid() && !isUpdating;
  };

  const handleChange = (e) => {
    if (!hasUpdatePermission) return; // Prevent changes if no permission
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!hasUpdatePermission || !hasChanges() || !isFormValid()) return;

  try {
    const updateData = { id: user.id };

    if (formData.username !== originalData.username) {
      updateData.username = formData.username;
    }
    if (formData.email !== originalData.email) {
      updateData.email = formData.email;
    }
    if (formData.newPassword !== "") {
      updateData.password = formData.newPassword;
    }

    const result = await updateProfile(updateData).unwrap();
    console.log("Backend profile update response:", result);

    // Extract backend update record
    const updatedRecord = result?.results?.[0] ?? {};

    const updatedUsername = updatedRecord.username ?? formData.username;
    const updatedEmail = updatedRecord.email ?? formData.email;

    const backendMessage =
      updatedRecord.message ??
      `Profile updated successfully!`;

    // Update local state with backend values
    setOriginalData({
      username: updatedUsername,
      email: updatedEmail,
    });

    // Reset password fields and visibility
    setFormData({
      ...formData,
      newPassword: "",
      confirmPassword: "",
    });
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    toast.success(backendMessage);
  } catch (error) {
    console.error("Profile update error:", error);

    if (error?.data) {
      if (error.data.username && Array.isArray(error.data.username)) {
        toast.error(`Username: ${error.data.username[0]}`);
      } else if (error.data.email && Array.isArray(error.data.email)) {
        toast.error(`Email: ${error.data.email[0]}`);
      } else if (error.data.password && Array.isArray(error.data.password)) {
        toast.error(`Password: ${error.data.password[0]}`);
      } else if (error.data.error) {
        toast.error(error.data.error);
      } else if (error.data.detail) {
        toast.error(error.data.detail);
      } else {
        const msgs = [];
        Object.keys(error.data).forEach((field) => {
          if (Array.isArray(error.data[field])) {
            msgs.push(`${field}: ${error.data[field][0]}`);
          }
        });

        toast.error(msgs.length ? msgs.join(", ") : "Error updating profile");
      }
    } else {
      toast.error(error?.message || "Network error occurred");
    }
  }
};


  const handleReset = () => {
    if (!hasUpdatePermission) return;
    
    setFormData({
      ...originalData,
      newPassword: '',
      confirmPassword: '',
    });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const getRoleIcon = () => {
    switch (user?.role?.toLowerCase()) { 
      case 'admin':
      case 'administrator':
        return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
      case 'manager':
        return <UserGroupIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInputStyling = (fieldName) => {
    const isChanged = formData[fieldName] !== originalData[fieldName];
    
    if (isChanged) {
      return isDarkMode 
        ? 'bg-gray-700 border-blue-500 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500' 
        : 'bg-white border-blue-500 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-blue-500';
    }
    
    return isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  };

  const getPasswordInputStyling = () => {
    return isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  };

  const passwordsMatch = formData.newPassword !== '' && 
                         formData.confirmPassword !== '' && 
                         formData.newPassword === formData.confirmPassword;

  const passwordsDontMatch = formData.newPassword !== '' && 
                              formData.confirmPassword !== '' && 
                              formData.newPassword !== formData.confirmPassword;

  return (
    <div className="w-full space-y-3 px-2 sm:px-0">
      <div className="mb-2">
        <h3 
          className="text-base sm:text-lg font-medium flex items-center" 
          style={{ color: isDarkMode ? '#FFF' : '#111827' }}
        >
          {getRoleIcon()}
          <span className="ml-2">Profile Information</span>
        </h3>
        <p 
          className="text-xs sm:text-sm mt-1" 
          style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
        >
          {hasUpdatePermission 
            ? 'Update your account information and preferences.' 
            : 'View your account information.'}
        </p>
      </div>

      <div 
        className="p-2 sm:p-3 rounded-lg border"
        style={{
          backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
          borderColor: isDarkMode ? '#374151' : '#E5E7EB'
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username and Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label 
                htmlFor="username" 
                className="block text-xs sm:text-sm font-medium mb-1" 
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Username
                {hasUpdatePermission && formData.username !== originalData.username && (
                  <span className="text-blue-500 ml-1">*</span>
                )}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!hasUpdatePermission || isUpdating}
                className={`w-full px-2 sm:px-3 py-1.5 border rounded-lg text-sm sm:text-base transition-colors ${getInputStyling('username')} ${(!hasUpdatePermission || isUpdating) ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs sm:text-sm font-medium mb-1" 
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Email Address
                {hasUpdatePermission && formData.email !== originalData.email && (
                  <span className="text-blue-500 ml-1">*</span>
                )}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!hasUpdatePermission || isUpdating}
                className={`w-full px-2 sm:px-3 py-1.5 border rounded-lg text-sm sm:text-base transition-colors ${getInputStyling('email')} ${(!hasUpdatePermission || isUpdating) ? 'opacity-60 cursor-not-allowed' : ''}`}
                required
              />
            </div>
          </div>

          {/* Password Change Section */}
          <div className="pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
            <h4 
              className="text-sm sm:text-base font-medium mb-2" 
              style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
            >
              Change Password
            </h4>
            <p 
              className="text-xs mb-3" 
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              {hasUpdatePermission 
                ? 'Leave blank to keep your current password' 
                : 'Contact administrator to change your password'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* New Password */}
              <div>
                <label 
                  htmlFor="newPassword" 
                  className="block text-xs sm:text-sm font-medium mb-1" 
                  style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                >
                  New Password
                  {hasUpdatePermission && formData.newPassword !== '' && (
                    <span className="text-blue-500 ml-1">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={!hasUpdatePermission || isUpdating}
                    className={`w-full px-2 sm:px-3 py-1.5 pr-10 border rounded-lg text-sm sm:text-base transition-colors ${getPasswordInputStyling()} ${(!hasUpdatePermission || isUpdating) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="Enter new password"
                    minLength={8}
                  />
                  {hasUpdatePermission && (
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      tabIndex={-1}
                      disabled={isUpdating}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon
                          className="w-5 h-5"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                        />
                      ) : (
                        <EyeIcon
                          className="w-5 h-5"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                        />
                      )}
                    </button>
                  )}
                </div>
                {hasUpdatePermission && formData.newPassword !== '' && formData.newPassword.length < 8 && (
                  <p className="text-xs mt-1 text-red-500">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-xs sm:text-sm font-medium mb-1" 
                  style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                >
                  Confirm New Password
                  {hasUpdatePermission && formData.confirmPassword !== '' && (
                    <span className="text-blue-500 ml-1">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={!hasUpdatePermission || isUpdating}
                    className={`w-full px-2 sm:px-3 py-1.5 pr-10 border rounded-lg text-sm sm:text-base transition-colors ${getPasswordInputStyling()} ${(!hasUpdatePermission || isUpdating) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="Confirm new password"
                    minLength={8}
                  />
                  {hasUpdatePermission && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      tabIndex={-1}
                      disabled={isUpdating}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon
                          className="w-5 h-5"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                        />
                      ) : (
                        <EyeIcon
                          className="w-5 h-5"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                        />
                      )}
                    </button>
                  )}
                </div>
                {/* Password Match Indicator */}
                {hasUpdatePermission && passwordsMatch && (
                  <p className="text-xs mt-1" style={{ color: "#10B981" }}>
                    ✓ Passwords match
                  </p>
                )}
                {hasUpdatePermission && passwordsDontMatch && (
                  <p className="text-xs mt-1 text-red-500">
                    ✗ Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Role and Member Since Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1" 
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Role
              </label>
              <input 
                type="text" 
                className={`w-full px-2 sm:px-3 py-1.5 border rounded-lg text-sm sm:text-base cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
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
                className="block text-xs sm:text-sm font-medium mb-1" 
                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
              >
                Member Since
              </label>
              <input 
                type="text" 
                className={`w-full px-2 sm:px-3 py-1.5 border rounded-lg text-sm sm:text-base cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
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

          {/* Update/Cancel Buttons - Wrapped in RenderIfAllowed */}
          <RenderIfAllowed module="users_management" action="update">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
              {/* Reset Button */}
              {hasChanges() && !isUpdating && (
                <button 
                  type="button"
                  onClick={handleReset}
                  className={`w-full sm:w-auto inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 sm:py-1.5 font-medium rounded-lg text-sm sm:text-base transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Reset
                </button>
              )}
              
              {/* Update Button */}
              <button 
                type="submit" 
                disabled={!isUpdateButtonEnabled()}
                className={`w-full sm:w-auto inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 sm:py-1.5 font-medium rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                  isUpdateButtonEnabled()
                    ? (isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700')
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                title={
                  !hasUpdatePermission ? 'You do not have permission to update profile' :
                  !hasChanges() ? 'Make changes to enable update' :
                  !isFormValid() ? 'Please fill in all required fields correctly' :
                  isUpdating ? 'Updating...' : 'Update Profile'
                }
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          </RenderIfAllowed>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
