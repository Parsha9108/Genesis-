// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ProfileTab from '../administratorpanel/ProfileTab';
// import SessionsTab from '../administratorpanel/SessionTab';
// import UserCreationModal from '../administratorpanel/UserCreationModel';
// import UserListTab from '../administratorpanel/UserListTab';
// import { hasPermission } from "../Utilities/permissionUtilities";

// import {
//   CogIcon,
//   UserIcon,
//   ClockIcon,
//   ChevronDownIcon,
//   UserPlusIcon,
//   UsersIcon,
//   ShieldCheckIcon,
//   UserGroupIcon,
//   ComputerDesktopIcon
// } from '@heroicons/react/24/outline';
// import { BookKey } from 'lucide-react';
// import { useAuth } from '../../Contexts/AuthContext';
// import { useGetUserPermissionsQuery } from '../../redux/permissionApiSlice';
// import PermissionErrorModal from '../permissions/PermissionErrorModal';

// const AdminPanel = ({ isDarkMode = true }) => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [showUserModal, setShowUserModal] = useState(false);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
//   const [showPermissionErrorModal, setShowPermissionErrorModal] = useState(false);
//   const [showUserCreationErroMOdal, setShowUserCreationErrorModal] = useState(false);
//   const { user } = useAuth();
//   const userId = user?.id;
//   const { data: permissionsData } = useGetUserPermissionsQuery(userId);
//   const navigate = useNavigate();

//   console.log('User permissions data in AdminPanel:', permissionsData);
//   // ✅ Handle navigation to permissions page
//   const handlePermissionsClick = () => {
//     setShowSettingsDropdown(false);
//     navigate('/profile/permissions');
//   };

//   // ✅ Get panel title based on user role
//   const getPanelTitle = () => {
//     switch (user?.role?.toLowerCase()) {
//       case 'admin':
//         return 'Administrator Panel';
//       case 'manager':
//         return 'Manager Panel';
//       case 'user':
//       default:
//         return 'User Profile';
//     }
//   };

//   // ✅ Get panel icon based on user role
//   const getPanelIcon = () => {
//     switch (user?.role?.toLowerCase()) {
//       case 'admin':
//         return <ShieldCheckIcon className="w-6 h-6" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }} />;
//       case 'manager':
//         return <UserGroupIcon className="w-6 h-6" style={{ color: isDarkMode ? '#F59E0B' : '#D97706' }} />;
//       case 'user':
//       default:
//         return <UserIcon className="w-6 h-6" style={{ color: isDarkMode ? '#3B82F6' : '#2563EB' }} />;
//     }
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'profile':
//         return <ProfileTab user={user} isDarkMode={isDarkMode} />;
//       case 'sessions':
//         return <SessionsTab isDarkMode={isDarkMode} />;
//       case 'userlist':
//         return <UserListTab user={user} isDarkMode={isDarkMode} />;
//       default:
//         return <ProfileTab user={user} isDarkMode={isDarkMode} />;
//     }
//   };

//   return (
//     <div 
//       className="w-full mx-auto"
//       style={{ 
//         maxWidth: '993px',
//         marginTop: '-8px' // ✅ Move the entire container up to align with sidebar
//       }}
//     >
//       {/* ✅ Content Container */}
//       <div
//         className="rounded-lg shadow-md relative"
//         style={{
//           backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
//           border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
//         }}
//       >
//         {/* ✅ Title Section */}
//         <div
//           className="p-4 sm:p-6 flex justify-between items-center border-b"
//           style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
//         >
//           <div className="flex items-center gap-4">
//             {getPanelIcon()}
//             <h1
//               className="text-xl sm:text-2xl font-bold"
//               style={{ color: isDarkMode ? '#FFF' : '#111827' }}
//             >
//               {getPanelTitle()}
//             </h1>
//           </div>
//         </div>

//         {/* ✅ Navigation Tabs - Show for All Users */}
//         <div
//           className="px-4 sm:px-6 border-b"
//           style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
//         >
//           <nav className="flex space-x-8 relative" aria-label="Tabs">
//             {/* ✅ My Profile - Always visible */}
//             <button
//               className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'profile'
//                 ? 'border-blue-500 text-blue-600'
//                 : `border-transparent ${isDarkMode
//                   ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
//                   : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`
//                 }`}
//               onClick={() => setActiveTab('profile')}
//             >
//               <UserIcon className="w-4 h-4 inline mr-2" />
//               My Profile
//             </button>

//             {/* ✅ Settings Dropdown - Always visible */}
//             {hasPermission(permissionsData, 'view_settings') && (
//               <div className="relative">
//                 <button
//                   className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${showSettingsDropdown
//                     ? 'border-blue-500 text-blue-600'
//                     : `border-transparent ${isDarkMode
//                       ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
//                       : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                     }`
//                     }`}
//                   onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
//                 >
//                   <CogIcon className="w-4 h-4 mr-2" />
//                   Settings
//                 </button>

//                 {showSettingsDropdown && (
//                   <div
//                     className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg py-2 z-[100]"
//                     style={{
//                       backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
//                       border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB'
//                     }}
//                   >
//                     {/* ✅ Create User - Always visible */}
//                     <button
//                       className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
//                         ? 'text-gray-300 hover:bg-gray-600'
//                         : 'text-gray-700 hover:bg-gray-50'
//                         }`}
//                       onClick={() => {
//                         if (hasPermission(permissionsData, 'create_user')) {
//                           setShowUserModal(true);
//                           setShowSettingsDropdown(false);
//                         }
//                         else {
//                           setShowUserCreationErrorModal(true);
//                           setShowSettingsDropdown(false);
//                         }
//                       }}
//                     >
//                       <UserPlusIcon className="w-4 h-4 mr-3" />
//                       Create User
//                     </button>

//                     {/* ✅ Manage Users - Always visible */}
//                     <button
//                       className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
//                         ? 'text-gray-300 hover:bg-gray-600'
//                         : 'text-gray-700 hover:bg-gray-50'
//                         }`}
//                       onClick={() => {
//                         setActiveTab('userlist');
//                         setShowSettingsDropdown(false);
//                       }}
//                     >
//                       <UsersIcon className="w-4 h-4 mr-3" />
//                       Manage Users
//                     </button>

//                     {/* ✅ Set Permissions - Always visible */}
//                     <button
//                       className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
//                         ? 'text-gray-300 hover:bg-gray-600'
//                         : 'text-gray-700 hover:bg-gray-50'
//                         }`}
//                       onClick={() => {
//                         // Check if user has permission
//                         if (hasPermission(permissionsData, 'manage_permissions')) {
//                           handlePermissionsClick();
//                         } else {
//                           // Show error modal if no permission
//                           setShowPermissionErrorModal(true);
//                           setShowSettingsDropdown(false); // Close dropdown
//                         }
//                       }}
//                     >
//                       <BookKey className="w-4 h-4 mr-3" />
//                       Set Permissions
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             <PermissionErrorModal
//               show={showUserCreationErroMOdal}
//               onClose={() => setShowUserCreationErrorModal(false)}
//               isDarkMode={isDarkMode}
//               permissionName="create_user"
//               actionDescription="Create User"
//               title="User Creation Access Denied"
//             />
//             <PermissionErrorModal
//               show={showPermissionErrorModal}
//               onClose={() => setShowPermissionErrorModal(false)}
//               isDarkMode={isDarkMode}
//               permissionName="set_user_permissions"
//               actionDescription="manage user permissions"
//               title="Permission Management Access Denied"
//             />

//             {/* ✅ Sessions - Always visible */}
//             {hasPermission(permissionsData, 'view_sessions') && (
//               <button
//                 className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'sessions'
//                   ? 'border-blue-500 text-blue-600'
//                   : `border-transparent ${isDarkMode
//                     ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
//                     : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`
//                   }`}
//                 onClick={() => setActiveTab('sessions')}
//               >
//                 <ClockIcon className="w-4 h-4 inline mr-2" />
//                 Sessions
//               </button>
//             )}
//           </nav>
//         </div>

//         {/* ✅ Tab Content */}
//         <div className="p-6">{renderTabContent()}</div>
//       </div>

//       {/* ✅ User Creation Modal - Always available */}
//       <UserCreationModal
//         show={showUserModal}
//         onHide={() => setShowUserModal(false)}
//         onUserCreated={() => {
//           setShowUserModal(false);
//         }}
//         isDarkMode={isDarkMode}
//         userId={userId}
//       />

//       {/* Click outside to close dropdowns */}
//       {showSettingsDropdown && (
//         <div
//           className="fixed inset-0 z-40"
//           onClick={() => {
//             setShowSettingsDropdown(false);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminPanel;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileTab from '../administratorpanel/ProfileTab';
import SessionsTab from '../administratorpanel/SessionTab';
import UserCreationModal from '../administratorpanel/UserCreationModel';
import UserListTab from '../administratorpanel/UserListTab';
import { hasPermission } from "../Utilities/permissionUtilities";
import { useGetUsersQuery } from '../../redux/userApiSlice';
import {
  CogIcon,
  UserIcon,
  ClockIcon,
  ChevronDownIcon,
  UserPlusIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { BookKey } from 'lucide-react';
import { useAuth } from '../../Contexts/AuthContext';
import { useGetUserPermissionsQuery } from '../../redux/permissionApiSlice';
import PermissionErrorModal from '../permissions/PermissionErrorModal';

const AdminPanel = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showPermissionErrorModal, setShowPermissionErrorModal] = useState(false);
  const [showUserCreationErroMOdal, setShowUserCreationErrorModal] = useState(false);
  const { user } = useAuth();
  console.log('Authenticated user in AdminPanel:', user);
  const userId = user?.id;
  console.log('Authenticated user ID in AdminPanel:', userId);
  const { data: permissionsData } = useGetUserPermissionsQuery(userId);
  const navigate = useNavigate();
  const { data: users} = useGetUsersQuery();
  console.log('User permissions data in AdminPanel:', permissionsData);
  
  // ✅ Handle navigation to permissions page
  const handlePermissionsClick = () => {
    setShowSettingsDropdown(false);
    navigate('/profile/permissions');
  };

  // ✅ Get panel title based on user role
  const getPanelTitle = () => {
    switch (user?.role?.toLowerCase()) {
      case 'admin':
        return 'Administrator Panel';
      case 'manager':
        return 'Manager Panel';
      case 'user':
      default:
        return 'User Profile';
    }
  };

  // ✅ Get panel icon based on user role
  const getPanelIcon = () => {
    switch (user?.role?.toLowerCase()) {
      case 'admin':
        return <ShieldCheckIcon className="w-6 h-6" style={{ color: isDarkMode ? '#EF4444' : '#DC2626' }} />;
      case 'manager':
        return <UserGroupIcon className="w-6 h-6" style={{ color: isDarkMode ? '#F59E0B' : '#D97706' }} />;
      case 'user':
      default:
        return <UserIcon className="w-6 h-6" style={{ color: isDarkMode ? '#3B82F6' : '#2563EB' }} />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab user={user} isDarkMode={isDarkMode} />;
      case 'sessions':
        return <SessionsTab isDarkMode={isDarkMode} users={users}/>;
      case 'userlist':
        return <UserListTab user={user} isDarkMode={isDarkMode} />;
      default:
        return <ProfileTab user={user} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <>
      {/* ✅ Main Content Container */}
      <div 
        className="w-full mx-auto"
        style={{ 
          maxWidth: '993px',
          marginTop: '-8px'
        }}
      >
        {/* ✅ Content Container */}
        <div
          className="rounded-lg shadow-md relative"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
          }}
        >
          {/* ✅ Title Section */}
          <div
            className="p-4 sm:p-6 flex justify-between items-center border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <div className="flex items-center gap-4">
              {getPanelIcon()}
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: isDarkMode ? '#FFF' : '#111827' }}
              >
                {getPanelTitle()}
              </h1>
            </div>
          </div>

          {/* ✅ Navigation Tabs - Show for All Users */}
          <div
            className="px-4 sm:px-6 border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <nav className="flex space-x-8 relative" aria-label="Tabs">
              {/* ✅ My Profile - Always visible */}
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                  }`}
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon className="w-4 h-4 inline mr-2" />
                My Profile
              </button>

              {/* ✅ Settings Dropdown - Always visible */}
              {hasPermission(permissionsData, 'view_settings') && (
                <div className="relative">
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${showSettingsDropdown
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${isDarkMode
                        ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                      }`}
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Settings
                  </button>

                  {showSettingsDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg py-2"
                      style={{
                        backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                        border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
                        zIndex: 1000 // ✅ Fixed: Lower z-index than modals
                      }}
                    >
                      {/* ✅ Create User - Always visible */}
                      <button
                        className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
                          ? 'text-gray-300 hover:bg-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        onClick={() => {
                          if (hasPermission(permissionsData, 'create_user')) {
                            setShowUserModal(true);
                            setShowSettingsDropdown(false);
                          }
                          else {
                            setShowUserCreationErrorModal(true);
                            setShowSettingsDropdown(false);
                          }
                        }}
                      >
                        <UserPlusIcon className="w-4 h-4 mr-3" />
                        Create User
                      </button>

                      {/* ✅ Manage Users - Always visible */}
                      <button
                        className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
                          ? 'text-gray-300 hover:bg-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        onClick={() => {
                          setActiveTab('userlist');
                          setShowSettingsDropdown(false);
                        }}
                      >
                        <UsersIcon className="w-4 h-4 mr-3" />
                        Manage Users
                      </button>

                      {/* ✅ Set Permissions - Always visible */}
                      <button
                        className={`flex items-center px-4 py-3 w-full text-left text-sm transition-colors ${isDarkMode
                          ? 'text-gray-300 hover:bg-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        onClick={() => {
                          // Check if user has permission
                          if (hasPermission(permissionsData, 'manage_permissions')) {
                            handlePermissionsClick();
                          } else {
                            // Show error modal if no permission
                            setShowPermissionErrorModal(true);
                            setShowSettingsDropdown(false); // Close dropdown
                          }
                        }}
                      >
                        <BookKey className="w-4 h-4 mr-3" />
                        Set Permissions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ Sessions - Always visible */}
              {hasPermission(permissionsData, 'view_sessions') && (
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : `border-transparent ${isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:border-gray-500'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                    }`}
                  onClick={() => setActiveTab('sessions')}
                >
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                  Sessions
                </button>
              )}
            </nav>
          </div>

          {/* ✅ Tab Content */}
          <div className="p-6">{renderTabContent()}</div>
        </div>

        {/* Click outside to close dropdowns */}
        {showSettingsDropdown && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 999 }} // ✅ Fixed: Lower than dropdown
            onClick={() => {
              setShowSettingsDropdown(false);
            }}
          />
        )}
      </div>

      {/* ✅ MOVED MODALS OUTSIDE - This fixes z-index stacking context issues */}
      <UserCreationModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        onUserCreated={() => {
          setShowUserModal(false);
        }}
        isDarkMode={isDarkMode}
        userId={userId}
      />

      <PermissionErrorModal
        show={showUserCreationErroMOdal}
        onClose={() => setShowUserCreationErrorModal(false)}
        isDarkMode={isDarkMode}
        permissionName="create_user"
        actionDescription="Create User"
        title="User Creation Access Denied"
      />

      <PermissionErrorModal
        show={showPermissionErrorModal}
        onClose={() => setShowPermissionErrorModal(false)}
        isDarkMode={isDarkMode}
        permissionName="set_user_permissions"
        actionDescription="manage user permissions"
        title="Permission Management Access Denied"
      />
    </>
  );
};

export default AdminPanel;
