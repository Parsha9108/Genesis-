
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Users, Shield, ArrowRight, UserRoundPen, DoorClosedLocked} from 'lucide-react';
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import { useGetUserPermissionsQuery } from '../../redux/permissionApiSlice';
import { useAuth } from '../../Contexts/AuthContext';

import { hasPermission } from "../Utilities/permissionUtilities";
import PermissionErrorModal from '../permissions/PermissionErrorModal';
const Settings = ({ isDarkMode }) => {

  useDocumentTitle('Settings');
  const { user } = useAuth();
  const userId = user?.id;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const navigate = useNavigate();
  const { data: permissionsData } = useGetUserPermissionsQuery(user?.id);
  console.log("permission", permissionsData)
  const [errorModal, setErrorModal] = useState({
    show: false,
    permissionName: '',
    actionDescription: '',
    title: ''
  });

  const settingsOptions = [
    {
      id: 'user-profile',
      title: 'User Profile',
      description: 'Create and manage device groups for better organization',
      icon: UserRoundPen,
      // requiredPermission: 'access_custom_group_feature',
      path: '/profile',
      color: 'green',
      features: [
        'Create custom device groups',
        'Assign devices to groups',
      ]
    },
    {
      id: 'rbac',
      title: 'Roles',
      description: 'User management and system configuration settings',
      icon: DoorClosedLocked,
      path: '/profile',
      color: 'blue',
      features: [
        'User account management',
        'Manage user permissions',
      ]
    },
    {
      id: 'users_management',
      title: 'Users',
      description: 'User management and system configuration settings',
      icon: Users,
      path: '/profile',
      color: 'blue',
      features: [
        'User account management',
        'Manage user permissions',
      ]
    }
  ];

  const handleOptionClick = (option) => {
    if (option.requiredPermission && !hasPermission(option.requiredPermission)) {
      setErrorModal({
        show: true,
        permissionName: option.requiredPermission,
        actionDescription: `access ${option.title.toLowerCase()}`,
        title: `${option.title} Access Denied`
      });
      return;
    }
    navigate(option.path);
  };

  

  // Filter options:
  const visibleOptions = settingsOptions.filter(option => {
    // Only admins see “Admin Panel”
    if (option.id === 'admin-panel' && !isAdmin) {
      return false;
    }
    return true;
  });
  const getColorClasses = (color) => {
    const colorMap = {
      green: {
        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
        border: 'border-green-500',
        icon: isDarkMode ? 'bg-green-900' : 'bg-green-100',
        iconText: isDarkMode ? 'text-green-400' : 'text-green-600',
        hover: isDarkMode ? 'hover:bg-green-900/50' : 'hover:bg-green-100'
      },
      blue: {
        bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
        border: 'border-blue-500',
        icon: isDarkMode ? 'bg-blue-900' : 'bg-blue-100',
        iconText: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        hover: isDarkMode ? 'hover:bg-blue-900/50' : 'hover:bg-blue-100'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <>
      <div className="space-y-6 px-2 sm:px-0">
        {/* Header Section */}
        <div className={`rounded-lg shadow-md p-6 border ${isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#6366f1] rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure your system preferences and manage access controls
              </p>
            </div>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {visibleOptions.map((option) => {
            const IconComponent = option.icon;
            const colors = getColorClasses(option.color);

            return (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`rounded-lg shadow-md border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(option);
                  }
                }}
              >
                {/* Card Header */}
                <div className={`p-6 border-l-4 ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                        <IconComponent className={`w-6 h-6 ${colors.iconText}`} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {option.title}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 pt-4">
                  <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Key Features:
                  </h4>
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${colors.iconText.replace('text-', 'bg-')}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer */}
                <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${colors.iconText}`}>
                      Click to access {option.title.toLowerCase()}
                    </span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.iconText}`}>
                      Configure
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Error Modal */}
      <PermissionErrorModal
        show={errorModal.show}
        onClose={() => setErrorModal(prev => ({ ...prev, show: false }))}
        isDarkMode={isDarkMode}
        permissionName={errorModal.permissionName}
        actionDescription={errorModal.actionDescription}
        title={errorModal.title}
      />
    </>
  );
};

export default Settings;
