import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Users, ArrowRight, UserRoundPen, DoorClosedLocked, RefreshCw, ServerCog, FileText} from 'lucide-react';

// import Globalgear from '../../assets/globe-gear.svg?react';
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import { useGetUserPermissionsQuery } from '../../redux/permissionApiSlice';
import { useAuth } from '../../Contexts/AuthContext';
import { toast } from 'react-toastify';
import backendApi from '../../api/backendAxiosInstance';
import { useDispatch } from 'react-redux';
import { setPermissions } from '../../redux/userModulePermission';

import { hasPermission } from "../Utilities/permissionUtilities";
import PermissionErrorModal from '../permissions/PermissionErrorModal';
import RenderIfAllowed from '../Utilities/RenderIfAllowed';

const Settings = ({ isDarkMode }) => {

  useDocumentTitle('Settings');
  const { user } = useAuth();
  const dispatch = useDispatch();
  const userId = user?.id;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const navigate = useNavigate();
  const { data: permissionsData } = useGetUserPermissionsQuery(user?.id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log("permission", permissionsData)
  const [errorModal, setErrorModal] = useState({
    show: false,
    permissionName: '',
    actionDescription: '',
    title: ''
  });

  //Handle refresh - calls the modules/permissions/all API
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const permResponse = await backendApi.get(
        "/modules/permissions/all",
        {
          withCredentials: true,
        }
      );
      console.log("Permissions refreshed:", permResponse.data);

      // Dispatch permissions to Redux
      if (permResponse.data.permissions) {
        dispatch(setPermissions(permResponse.data.permissions));
      } else {
        dispatch(setPermissions(permResponse.data));
      }

      toast.success('Permissions refreshed successfully');
      console.log("Permissions updated in Redux store");
    } catch (error) {
      console.error("Failed to refresh permissions:", error);
      toast.error('Failed to refresh permissions');
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const SettingOptionCard = (props) => {
    const IconComponent = props.option.icon;

    return (
      <div
        key={props.option.id}
        onClick={() => handleOptionClick(props.option)}
        className={`rounded-lg shadow-md border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOptionClick(props.option);
          }
        }}
      >
        {/* Card Header */}
        <div className={`p-6 border-l-4 ${props.colors.border} ${props.colors.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${props.colors.icon}`}>
                <IconComponent className={`w-6 h-6 ${props.colors.iconText}`} />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {props.option.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {props.option.description}
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
            {props.option.features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${props.colors.iconText.replace('text-', 'bg-')}`} />
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
            <span className={`text-sm font-medium ${props.colors.iconText}`}>
              Click to access {props.option.title.toLowerCase()}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${props.colors.bg} ${props.colors.iconText}`}>
              Configure
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 px-2 sm:px-0">
        {/* Header Section with Refresh Button */}
        <div className={`rounded-lg shadow-md p-6 border ${isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            {/* Left side - Icon and Title */}
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

            {/* Right side - Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh Permissions"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingOptionCard
            option={{
              id: 'user-profile',
              title: 'User Profile',
              description: 'Create and manage device groups for better organization',
              icon: UserRoundPen,
              // requiredPermission: 'access_custom_group_feature',
              path: '/profile',
              color: 'blue',
              features: [
                'User information',
                'Edit user profile',
              ]
            }}
            colors={getColorClasses('blue')}

          />

          <RenderIfAllowed module="rbac" action="read" >
            <SettingOptionCard
              option={{
                id: 'rbac',
                title: 'Roles',
                description: 'User management and system configuration settings',
                icon: DoorClosedLocked,
                path: '/role-management',
                color: 'blue',
                features: [
                  'User account management',
                  'Manage user permissions',
                ]
              }}
              colors={getColorClasses('blue')}
            />
          </RenderIfAllowed>

            <RenderIfAllowed module="users_management" action="read">
              <SettingOptionCard
                option={{
                  id: 'users_management',
                  title: 'Users',
                  description: 'User management and system configuration settings',
                  icon: Users,
                  path: '/userlist',
                  color: 'blue',
                  features: [
                    'User creation',
                    'User account management',
                  ]
                }}
                colors={getColorClasses('blue')}
              />
            </RenderIfAllowed>

            <RenderIfAllowed module="global_configuration" action="read">
              <SettingOptionCard
                option={{
                  id: 'global_config',
                  title: 'Global Configuration',
                  description: 'Manage system-wide settings including SMTP and Alert configurations.',
                  icon: ServerCog,
                  path: '/global-configuration',
                  color: 'blue',
                  features: [
                    'SMTP Configuration',
                    'Alert Configuration'
                  ]
                }}
                colors={getColorClasses('blue')}
              />
          </RenderIfAllowed>

            {/* <RenderIfAllowed module="audit_logs" action="read"> */}
              <SettingOptionCard
                option={{
                  id: "Audit_Logs",
                  title: "Audit Logs",
                  description: "View detailed records of system actions, user activity, and configuration changes.",
                  icon: FileText,
                  path: "/audit-logs",
                  color: "blue",
                  features: [
                    "User Activity Logs",
                    "Configuration Change History",
                    "System Events Tracking"
                  ]
                }}
                colors={getColorClasses("blue")}
              />
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
