import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, ChevronDown, ChevronRight, X, AlertTriangle } from 'lucide-react';
import Windows from '../../assets/Windows_logo.svg'
import Ubuntu from '../../assets/Ubuntu_logo.svg';
import Loading from '../User/Loading';
import '../index.css';
import ConfirmationModal from './ConfirmationModal';
import DeviceListModal from './DeviceListModal';
import useCustomGroups from '../../Hooks/useCustomGroups';
import { useAuth } from '../../Contexts/AuthContext';
import { useSaveUserGroupsMutation } from '../../redux/groupsApiSlice';

const osLogos = { Windows, Ubuntu };

const GroupCreator = ({ isDarkMode = true, onEditGroup }) => {
  // Get user from auth context
  const { user } = useAuth();
  
  // Direct mutation from groupsApiSlice for device removal
  const [saveUserGroupsTrigger] = useSaveUserGroupsMutation();
  
  // Local state for group creation
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // Enhanced state for edit mode and error handling
  const [localError, setLocalError] = useState(null);
  const [editModeGroups, setEditModeGroups] = useState(new Set());
  
  // Device modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  
  // Persistent state for imported devices (not cleared on modal close)
  const [importedDevices, setImportedDevices] = useState([]);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Redux-powered state and actions using updated hook
  const {
    userCreatedGroups,
    availableDevices,
    processedDevices,
    isLoading,
    isLoadingGroups,
    isDeleting,
    error,
    groupError,
    statistics,
    createNewGroup,
    deleteGroup,
    totalAssignedDevices,
    removeDeviceFromGroup,
    updateGroup,
    addDevicesToGroup,
    saveConfiguration,
    refetch,
  } = useCustomGroups();
  
  // Enhanced error handler
  const handleError = useCallback((error, context = 'general') => {
    console.error(`GroupCreator Error (${context}):`, error);
    setLocalError({
      message: error.message || 'An unexpected error occurred',
      context,
      timestamp: new Date().toISOString()
    });
  }, []);
  
  // Clear local errors when global state changes
  useEffect(() => {
    if (!error && !groupError) {
      setLocalError(null);
    }
  }, [error, groupError]);
  
  // Toggle edit mode for a group
  const toggleGroupEditMode = useCallback((groupId) => {
    setEditModeGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);
  
  // Device toggle handler for modal
  const handleDeviceToggle = useCallback((deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  }, []);
  
  // FIXED: Refresh handler after device assignment
  const handleRefreshAfterAssignment = useCallback(async () => {
    try {
      console.log('Refreshing after device assignment...');
      // Refetch user groups data
      if (typeof refetch === 'function') {
        await refetch();
      }
      // Clear any local state...
      setSelectedDevices([]);
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Error during refresh:', error);
    }
  }, [refetch]);
  
  // Open device modal for a specific group
  const handleAddDevicesToGroup = useCallback((group) => {
    setSelectedGroup(group);
    setShowDeviceModal(true);
    setSelectedDevices([]);
  }, []);
  
  // FIXED: Close device modal
  const handleCloseDeviceModal = useCallback(() => {
    setShowDeviceModal(false);
    setSelectedGroup(null);
    setSelectedDevices([]);
  }, []);
  
  // Get devices for a group (simplified - no priorities)
  const getDevicesForGroup = useCallback((groupId) => {
    try {
      const group = userCreatedGroups?.find(g => g.id === groupId);
      if (!group) return [];
      
      // Return all devices in the group regardless of priority
      if (group.devices) {
        return group.devices;
      }
      
      // If using priorityDevices structure, combine all priority levels
      if (group.priorityDevices) {
        const allDevices = [];
        Object.values(group.priorityDevices).forEach(priorityDevices => {
          if (Array.isArray(priorityDevices)) {
            allDevices.push(...priorityDevices);
          }
        });
        return allDevices;
      }
      
      return [];
    } catch (err) {
      handleError(err, 'getDevicesForGroup');
      return [];
    }
  }, [userCreatedGroups, handleError]);
  
  // Get total device count for a group
  const getTotalDevicesInGroup = useCallback((groupId) => {
    try {
      return getDevicesForGroup(groupId).length;
    } catch (err) {
      handleError(err, 'getTotalDevicesInGroup');
      return 0;
    }
  }, [getDevicesForGroup, handleError]);
  
  // UPDATED: Handle device removal from group using direct RTK Query mutation
  // FIXED: Handle device removal from group using the working payload structure
const handleRemoveDeviceFromGroup = useCallback(async (groupId, deviceId, deviceName) => {
  try {
    if (!user) {
      setLocalError({
        message: 'User authentication required to remove devices',
        context: 'auth',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // FIXED: Set up confirmation modal FIRST
    setConfirmMessage(`Are you sure you want to remove "${deviceName}" from this group? This action cannot be undone.`);
    
    setConfirmAction(() => async () => {
      try {
        console.log('Removing device', deviceId, 'from group', groupId);
        
        const group = userCreatedGroups?.find(g => g.id === groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        const updatedDevices = group.devices
          .filter(device => (device.uuid || device.id) !== deviceId);

        // FIXED: Use the SAME payload structure as your working old code
        const payload = {
          user: {
            id: user.id || user.userId,
            username: user.username || user.name,
            email: user.email
          },
          groups: [{
            group_id: groupId,
            group_name: group.name,
            group_description: group.description || '',
            devices: updatedDevices,          // ← FIXED: devices nested under groups array
            device_count: updatedDevices.length
          }],
          operation: 'remove_device',
          timestamp: new Date().toISOString(),
          total_groups: 1,
          total_devices: updatedDevices.length
        };

        console.log('Remove device payload (using working structure):', payload);

        // Use direct RTK Query mutation
        const result = await saveUserGroupsTrigger(payload);
        
        if (result.error) {
          console.error('API Error:', result.error);
          throw result.error;
        }

        console.log('Device removed successfully:', result.data);
        
        // Clean up modal state
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
        
      } catch (error) {
        console.error('Failed to remove device from group:', error);
        
        let errorMessage = 'Failed to remove device from group';
        
        if (error?.status) {
          switch (error.status) {
            case 401:
              errorMessage = 'Authentication expired. Please log in again.';
              break;
            case 403:
              errorMessage = 'Permission denied. Check your user permissions.';
              break;
            case 404:
              errorMessage = 'Group or device not found.';
              break;
            case 500:
              errorMessage = 'Server error occurred. Please check server logs.';
              break;
            default:
              errorMessage = `HTTP ${error.status} - ${error.data?.message || error.data?.error || 'Unknown server error'}`;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setLocalError({
          message: errorMessage,
          context: 'removeDevice',
          timestamp: new Date().toISOString()
        });
        
        // Clean up modal state
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
      }
    });

    // FIXED: Show modal AFTER setting up everything
    setShowConfirmModal(true);
    
  } catch (err) {
    console.error('Error in handleRemoveDeviceFromGroup:', err);
    handleError(err, 'handleRemoveDeviceFromGroup');
  }
}, [userCreatedGroups, user, saveUserGroupsTrigger, handleError]);

  // Handle delete group with confirmation
const handleDeleteGroup = useCallback(async (group) => {
  try {
    if (!user) {
      setLocalError({
        message: 'User authentication required to delete groups',
        context: 'auth',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const groupName = group?.name || 'this group';
    
    // FIXED: Set up the confirmation modal SYNCHRONOUSLY first
    setConfirmMessage(`Are you sure you want to delete "${groupName}"? This will permanently remove the group and all its device assignments. This action cannot be undone.`);
    
    setConfirmAction(() => async () => {
      try {
        console.log('Deleting group:', group);
        await deleteGroup(group?.id);
        console.log('Group deleted successfully');
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
      } catch (error) {
        console.error('Failed to delete group:', error);
        handleError(error, 'deleteGroup');
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
      }
    });

    // FIXED: Show the modal AFTER setting up the message and action
    setShowConfirmModal(true);
    
  } catch (err) {
    console.error('Error in handleDeleteGroup:', err);
    handleError(err, 'handleDeleteGroup');
  }
}, [user, deleteGroup, handleError]);
  
  // Cancel confirmation
  const handleCancelConfirmation = useCallback(() => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  }, []);
  
  // Confirm action
  const handleConfirmAction = useCallback(() => {
    if (confirmAction) {
      confirmAction();
    }
  }, [confirmAction]);
  
  // Handle edit group - toggles edit mode
  const handleEditGroup = useCallback((group) => {
    try {
      console.log('Toggling edit mode for group:', group);
      toggleGroupEditMode(group.id);
    } catch (err) {
      handleError(err, 'handleEditGroup');
    }
  }, [toggleGroupEditMode, handleError]);
  
  // UPDATED: Group creation without success message
  const handleCreateGroup = useCallback(async () => {
    try {
      if (!user) {
        handleError(new Error('User authentication required to create groups'), 'auth');
        return;
      }
      
      // Validation
      if (!newGroupName.trim()) {
        handleError(new Error('Group name is required'), 'validation');
        return;
      }
      
      if (newGroupName.trim().length < 2) {
        handleError(new Error('Group name must be at least 2 characters long'), 'validation');
        return;
      }
      
      // Check for duplicate names
      const isDuplicate = userCreatedGroups?.some(group => 
        group.name.toLowerCase() === newGroupName.trim().toLowerCase()
      );
      if (isDuplicate) {
        handleError(new Error('A group with this name already exists'), 'validation');
        return;
      }
      
      setLocalError(null);
      console.log('Creating and saving new group:', newGroupName.trim());
      
      // Create the group with user information
      const newGroup = await createNewGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        createdAt: new Date().toISOString(),
        devices: []
      }, {
        id: user.id || user.userId,
        username: user.username || user.name,
        email: user.email
      });
      
      if (newGroup?.success && newGroup?.data?.id) {
        // Expand the new group
        setExpandedGroups(prev => new Set([...prev, newGroup.data.id]));
        
        // Reset form
        setNewGroupName('');
        setNewGroupDescription('');
        setIsCreatingGroup(false);
        
        console.log('Group created successfully');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      handleError(error, 'createGroup');
    }
  }, [newGroupName, newGroupDescription, userCreatedGroups, user, createNewGroup, handleError]);
  
  // Enhanced toggle with smooth scrolling (removed smooth scroll since we're using constrained layout)
  const toggleGroupExpansion = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
        // Also exit edit mode when collapsing
        setEditModeGroups(prevEdit => {
          const newEditSet = new Set(prevEdit);
          newEditSet.delete(groupId);
          return newEditSet;
        });
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);
  
  // Enhanced device rendering with imported device indicators
  const renderDevice = useCallback((device, groupId, isEditMode) => {
    try {
      const deviceName = device.devicename || device.hostname || device.name || 'Unknown Device';
      const deviceOs = device.os || 'Unknown';
      const deviceIp = device.ip || 'No IP';
      const deviceStatus = device.isActive || device.status || DEVICESTATUS.INACTIVE;
      const deviceType = device.device_type || device.type || 'Unknown Type';
      const osVersion = device.osversion;
      const lastSeen = device.lastseen;
      const isImported = device.id?.toString().includes('imported-');
      const osIcon = osLogos[deviceOs];
      
      return (
        <div
          key={device.id || device.uuid || Math.random()}
          className={`p-3 rounded border flex items-center gap-3 transition-all duration-300 ease-in-out ${
            isEditMode ? 'ring-1 ring-red-200 dark:ring-red-800' : ''
          } ${
            isImported ? 'border-l-4 border-l-blue-500' : ''
          } ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 hover:shadow-md'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          {/* OS Icon */}
          {osIcon && (
            <img src={osIcon} alt={`${deviceOs} logo`} className="w-5 h-5 flex-shrink-0" />
          )}
          
          {/* Device Info */}
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate flex items-center gap-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
              {deviceName}
              {isImported && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">CSV</span>
              )}
            </div>
            <div className="text-sm truncate" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              {deviceOs} {osVersion && `${osVersion}`} • {deviceIp} • {deviceType}
            </div>
            {lastSeen && (
              <div className="text-xs truncate" style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }}>
                Last seen: {lastSeen ? new Date(lastSeen).toLocaleDateString() : 'Never'}
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            deviceStatus === 'Active' || deviceStatus === DEVICESTATUS.ACTIVE
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {deviceStatus}
          </div>
          
          {/* Remove button only shown in edit mode */}
          {isEditMode && !isDeleting && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveDeviceFromGroup(groupId, device.id || device.uuid, deviceName);
              }}
              className={`p-1.5 rounded transition-all duration-200 ml-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                isDarkMode
                  ? 'text-red-400 hover:bg-red-900/40 hover:text-red-300'
                  : 'text-red-500 hover:bg-red-100 hover:text-red-600 hover:shadow-md'
              }`}
              title={`Remove ${deviceName} from group`}
              aria-label={`Remove ${deviceName} from group`}
            >
              <X className="w-4 h-4 stroke-width-2" />
            </button>
          )}
        </div>
      );
    } catch (err) {
      handleError(err, 'renderDevice');
      return (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          Error rendering device
        </div>
      );
    }
  }, [isDarkMode, isDeleting, handleRemoveDeviceFromGroup, handleError]);
  
  // Enhanced error display (removed success message support)
  const renderError = (error) => {
    return (
      <div className="mb-4 p-4 border rounded-lg transition-all duration-300 ease-in-out bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-1 text-red-800 dark:text-red-200">
              Error in {error.context || 'GroupCreator'}
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error.message}
            </p>
            <button
              onClick={() => setLocalError(null)}
              className="mt-2 text-xs underline focus:outline-none focus:no-underline transition-colors text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Early return if user is not available
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to manage device groups
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingGroups && (!userCreatedGroups || userCreatedGroups.length === 0)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12">
          <Loading />
          <p className="text-sm mt-4" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
            Loading your groups...
          </p>
        </div>
      </div>
    );
  }

  // Error handling
  if (groupError && !userCreatedGroups?.length && groupError?.status !== 404) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to Load Groups</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {groupError?.message || 'Unable to fetch group configuration'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading for general operations
  if (isLoading && !isLoadingGroups) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  const hasUserGroups = Array.isArray(userCreatedGroups) && userCreatedGroups.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Confirmation modal */}
      <ConfirmationModal
        show={showConfirmModal}
        title={confirmMessage.includes('delete') && confirmMessage.includes('group') ? 'Delete Group' : 'Remove Device'}
        message={confirmMessage}
        confirmText={confirmMessage.includes('delete') && confirmMessage.includes('group') ? 'Yes, Delete Group' : 'Yes, Remove'}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirmation}
        isDarkMode={isDarkMode}
      />

      {/* FIXED: Device Modal with proper callback functions */}
      <DeviceListModal
        show={showDeviceModal}
        onClose={handleCloseDeviceModal}
        groupName={selectedGroup?.name}
        groupId={selectedGroup?.id}
        selectedDevices={selectedDevices}
        onDeviceToggle={handleDeviceToggle}
        onAssignDevices={handleRefreshAfterAssignment}
        existingGroupDevices={getDevicesForGroup(selectedGroup?.id)}
        isDarkMode={isDarkMode}
      />

      {/* Error/Success Display */}
      {localError && renderError(localError)}

      {/* Header - Fixed Height */}
      <div className="flex-shrink-0 px-2 sm:px-0 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
              Group Management
            </h1>
            <p className="text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              Create and manage your custom device groups
              {totalAssignedDevices > 0 && ` • ${totalAssignedDevices} devices assigned`}
            </p>
            
            {/* Status indicators */}
            {isLoadingGroups && (
              <div className="mt-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">Refreshing groups...</p>
              </div>
            )}
            {isDeleting && (
              <div className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">Deleting group...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-h-0 px-2 sm:px-0 pb-4">
        <div 
          className="h-full rounded-lg shadow-md flex flex-col"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
          }}
        >
          {/* Header - Fixed */}
          <div 
            className="flex-shrink-0 p-4 border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                  Device Groups
                </h2>
                <p className="text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                  Create and manage simple device groups
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {/* Create Group Button */}
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  disabled={isDeleting}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    isDeleting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                      : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Group
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4">
              {/* Group Creation Form */}
              {isCreatingGroup && (
                <div className="mb-6 space-y-4 p-4 border rounded-lg" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="group-name" className="block text-sm font-medium mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                        Group Name
                      </label>
                      <input
                        id="group-name"
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        disabled={isDeleting}
                        maxLength={50}
                        className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          isDeleting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                            ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                            : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400'
                        }`}
                      />
                      <div className="mt-1 text-xs" style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }}>
                        {newGroupName.length}/50 characters
                      </div>
                    </div>
                    <div>
                      <label htmlFor="group-description" className="block text-sm font-medium mb-2" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                        Description
                      </label>
                      <textarea
                        id="group-description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="Enter group description..."
                        rows={2}
                        maxLength={200}
                        disabled={isDeleting}
                        className={`w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          isDeleting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                            ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                            : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400'
                        }`}
                      />
                      <div className="mt-1 text-xs" style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }}>
                        {newGroupDescription.length}/200 characters
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setNewGroupName('');
                        setNewGroupDescription('');
                        setLocalError(null);
                      }}
                      disabled={isDeleting}
                      className={`px-3 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                        isDeleting
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isDarkMode
                          ? 'text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500'
                          : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim() || isDeleting || newGroupName.trim().length < 2}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        !newGroupName.trim() || isDeleting || newGroupName.trim().length < 2
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                      }`}
                    >
                      Add Group
                    </button>
                  </div>
                </div>
              )}

              {/* Groups Display */}
              {hasUserGroups ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                      Created Groups ({userCreatedGroups.length})
                    </h3>
                    {(isLoadingGroups || isDeleting) && (
                      <div className="text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                        {isDeleting ? 'Deleting...' : 'Syncing...'}
                      </div>
                    )}
                  </div>
                  
                  {userCreatedGroups.map((group) => {
                    const isGroupExpanded = expandedGroups.has(group?.id);
                    const isGroupInEditMode = editModeGroups.has(group?.id);
                    const groupDevices = getDevicesForGroup(group?.id);
                    const totalDevicesInGroup = groupDevices.length;
                    
                    return (
                      <div
                        key={group?.id || Math.random()}
                        data-group-id={group?.id}
                        className={`rounded-lg border transition-all duration-300 ease-in-out ${
                          isDeleting ? 'opacity-60' : ''
                        } ${
                          isGroupInEditMode 
                            ? 'ring-2 ring-blue-400 dark:ring-blue-600 ring-opacity-50' 
                            : ''
                        }`}
                        style={{
                          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                          borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                        }}
                      >
                        {/* Group Header */}
                        <div
                          className={`p-4 cursor-pointer transition-all duration-300 ease-in-out ${
                            isDeleting ? 'pointer-events-none' : ''
                          } ${
                            isDarkMode 
                              ? 'hover:bg-gray-800 hover:shadow-md' 
                              : 'hover:bg-gray-50 hover:shadow-sm'
                          }`}
                          onClick={() => !isDeleting && toggleGroupExpansion(group?.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              !isDeleting && toggleGroupExpansion(group?.id);
                            }
                          }}
                          aria-expanded={isGroupExpanded}
                          aria-label={`${isGroupExpanded ? 'Collapse' : 'Expand'} group ${group?.name}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Chevron Icon */}
                              <div className={`transition-transform duration-300 ease-in-out ${isGroupExpanded ? 'rotate-0' : ''}`}>
                                {isGroupExpanded ? (
                                  <ChevronDown className="w-5 h-5" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }} />
                                ) : (
                                  <ChevronRight className="w-5 h-5" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }} />
                                )}
                              </div>
                              
                              {/* Group Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                                  {group?.name || 'Unnamed Group'}
                                  {isGroupInEditMode && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                      Edit Mode
                                    </span>
                                  )}
                                </h4>
                                {group?.description && (
                                  <p className="text-sm mt-1 truncate" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                                    {group.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {/* Device Count */}
                              <div className="text-right">
                                <div className="text-sm font-medium" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
                                  {totalDevicesInGroup} devices
                                </div>
                                <div className="text-xs" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                                  Created {group?.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* Add Devices Button */}
                                <button
                                  onClick={() => handleAddDevicesToGroup(group)}
                                  disabled={isDeleting}
                                  className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                    isDeleting
                                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                                      : isDarkMode
                                      ? 'text-green-400 hover:bg-green-900/30 hover:text-green-300 hover:shadow-md'
                                      : 'text-green-500 hover:bg-green-100 hover:text-green-600 hover:shadow-sm'
                                  }`}
                                  title="Add devices to group"
                                  aria-label={`Add devices to group ${group?.name || 'Unnamed'}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                
                                {/* Edit Button */}
                                <button
                                  onClick={() => handleEditGroup(group)}
                                  disabled={isDeleting}
                                  className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    isDeleting
                                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                                      : isGroupInEditMode
                                      ? isDarkMode
                                        ? 'text-blue-300 bg-blue-900/30 hover:bg-blue-800/40 hover:text-blue-200'
                                        : 'text-blue-600 bg-blue-100 hover:bg-blue-200 hover:text-blue-700'
                                      : isDarkMode
                                      ? 'text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 hover:shadow-md'
                                      : 'text-blue-500 hover:bg-blue-100 hover:text-blue-600 hover:shadow-sm'
                                  }`}
                                  title={isGroupInEditMode ? 'Exit edit mode' : 'Edit group devices'}
                                  aria-label={`${isGroupInEditMode ? 'Exit edit mode for' : 'Edit'} group ${group?.name || 'Unnamed'}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                
                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteGroup(group)}
                                  disabled={isDeleting}
                                  className={`p-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                    isDeleting
                                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                                      : isDarkMode
                                      ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:shadow-md'
                                      : 'text-red-500 hover:bg-red-100 hover:text-red-600 hover:shadow-sm'
                                  }`}
                                  title="Delete group"
                                  aria-label={`Delete group ${group?.name || 'Unnamed'}`}
                                >
                                  <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Group Content - Constrained Height with Internal Scroll */}
                        {isGroupExpanded && (
                          <div className="border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                            <div className="p-4 max-h-48 overflow-y-auto custom-scroll">
                              <div className="space-y-2">
                                {groupDevices.length === 0 ? (
                                  <div className="text-center py-4">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                                      No devices in this group
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }}>
                                      Use "Add Devices" button above to assign devices or import from CSV
                                    </p>
                                  </div>
                                ) : (
                                  groupDevices.map(device => renderDevice(device, group?.id, isGroupInEditMode))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                !isCreatingGroup && (
                  <button
                    onClick={() => setIsCreatingGroup(true)}
                    disabled={isDeleting}
                    className={`w-full p-8 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      isDeleting
                        ? 'border-gray-400 opacity-50 cursor-not-allowed'
                        : isDarkMode
                        ? 'border-gray-600 hover:bg-gray-800 hover:border-gray-500 hover:shadow-md'
                        : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                      Create your first device group
                    </p>
                    <p className="text-sm mt-2" style={{ color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }}>
                      Simple device organization
                    </p>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCreator;


