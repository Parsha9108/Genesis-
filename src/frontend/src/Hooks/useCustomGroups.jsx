import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  useGetUserGroupsQuery,
  useSaveUserGroupsMutation,
  useDeleteUserGroupMutation,
} from '../redux/groupsApiSlice';

import { useAuth } from '../Contexts/AuthContext';

export const useCustomGroups = () => {
  const { user } = useAuth();

  // Local state management (replacing Redux state)
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [importedDevices, setImportedDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [expandedUserGroups, setExpandedUserGroups] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [localError, setLocalError] = useState(null);
  const [userCreatedGroups, setUserCreatedGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // API Queries - use groups API slice
  const {
    data: groupConfigData,
    error: groupConfigError,
    isLoading: groupConfigLoading,
    refetch: refetchGroups
  } = useGetUserGroupsQuery(undefined, {
    skip: hasLocalChanges,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // RTK Query mutations - use groups API slice
  const [saveUserGroups, { isLoading: isSaving }] = useSaveUserGroupsMutation();
  const [deleteUserGroup, { isLoading: isDeleting }] = useDeleteUserGroupMutation();

  // ✅ FIXED: Device parser function to handle new API structure
  const parseDeviceData = useCallback((deviceData) => {
    // Handle both old and new API response formats
    const agent = deviceData.agent || {};
    
    return {
      id: agent.uuid || deviceData.uuid || uuidv4(),
      uuid: agent.uuid || deviceData.uuid || uuidv4(),
      device_name: agent.hostname || deviceData.hostname || deviceData.device_name || 'Unknown Device',
      hostname: agent.hostname || deviceData.hostname,
      // ✅ FIXED: Use ip_address from agent, not the complex nic structure
      ip: agent.ip_address || deviceData.ip_address || deviceData.ip || 'N/A',
      os: agent.os || deviceData.os || 'Unknown',
      os_version: agent.os_version || deviceData.os_version || '',
      // ✅ FIXED: Use dev_phy_vm from agent
      device_type: agent.dev_phy_vm || deviceData.dev_phy_vm || deviceData.device_type || 'Device',
      // ✅ FIXED: Use status from agent
      isActive: agent.status || deviceData.status || 'Unknown',
      addedAt: deviceData.added_at || new Date().toISOString(),
      is_imported: deviceData.is_imported || false,
      priority: deviceData.priority || 'P4'
    };
  }, []);

  // Enhanced process groups from API with better error handling
  useEffect(() => {
    if (groupConfigData && !groupConfigError && !hasLocalChanges) {
      try {
        const groupsArray = groupConfigData.groups || groupConfigData.data?.groups || [];

        if (groupsArray && Array.isArray(groupsArray)) {
          const transformedGroups = groupsArray.map(apiGroup => {
            const groupDevices = [];

            if (apiGroup.devices && Array.isArray(apiGroup.devices)) {
              apiGroup.devices.forEach(deviceData => {
                // ✅ FIXED: Use the new device parser
                const device = parseDeviceData(deviceData);
                groupDevices.push(device);
              });
            }

            return {
              id: apiGroup.group_id || uuidv4(),
              name: apiGroup.group_name || 'Unnamed Group',
              description: apiGroup.group_description || '',
              createdAt: apiGroup.created_at || new Date().toISOString(),
              type: 'custom',
              devices: groupDevices,
              deviceCount: groupDevices.length,
            };
          });

          setUserCreatedGroups(transformedGroups);
          setLocalError(null);
          console.log(`✅ Successfully loaded ${transformedGroups.length} groups from groupsApiSlice`);
          
          // ✅ DEBUG: Log the transformed devices to verify the structure
          transformedGroups.forEach(group => {
            console.log(`📱 Group "${group.name}" devices:`, group.devices);
          });
          
        } else {
          setUserCreatedGroups([]);
          console.log('📝 No groups found in API response');
        }
      } catch (error) {
        console.error('Error processing group configuration:', error);
        setLocalError('Failed to load group configuration');
      }
    } else if (groupConfigError && !groupConfigLoading) {
      console.error('❌ Groups API Error:', groupConfigError);
      
      // Enhanced error handling based on error type
      let errorMessage = 'Failed to load groups from server';
      
      if (groupConfigError.status === 'PARSING_ERROR') {
        errorMessage = 'Server configuration error: The groups API is not responding correctly. Please check if your Django backend is running and the URL patterns are configured.';
        console.error('🚨 API returned HTML instead of JSON - check Django URL patterns and view implementation');
      } else if (groupConfigError.originalStatus === 404) {
        errorMessage = 'Groups API endpoint not found. Please verify your Django URL configuration for "get_groups/".';
        console.error('🚨 404 Error - URL pattern missing or incorrect');
      } else if (groupConfigError.originalStatus === 500) {
        errorMessage = 'Server error occurred while loading groups. Please check the Django logs.';
        console.error('🚨 500 Error - Server-side error in Django view');
      } else if (groupConfigError.message) {
        errorMessage = groupConfigError.message;
      }
      
      setLocalError(errorMessage);
    }
  }, [groupConfigData, groupConfigError, groupConfigLoading, hasLocalChanges, parseDeviceData]);

  // ✅ DEBUG: Add temporary debug logging for API response
  useEffect(() => {
    if (groupConfigData && groupConfigData.groups) {
      console.log('🔍 RAW API Response Structure:');
      console.log('Full response:', groupConfigData);
      
      if (groupConfigData.groups[0]?.devices[0]) {
        console.log('🔍 First device structure:', groupConfigData.groups[0].devices[0]);
        console.log('🔍 Agent data:', groupConfigData.groups[0].devices[0].agent);
      }
    }
  }, [groupConfigData]);

  // Get current user info
  const getCurrentUser = useCallback(() => {
    if (user) {
      return {
        id: user.id || user.userId || uuidv4(),
        username: user.username || user.name || 'Unknown User',
        email: user.email || 'unknown@email.com',
      };
    }
    return {
      id: uuidv4(),
      username: 'Unknown User',
      email: 'unknown@email.com',
    };
  }, [user]);

  // Check if device is assigned to any group
  const deviceExists = useCallback((userGroups, deviceId, excludeGroupId = null) => {
    if (userGroups && Array.isArray(userGroups)) {
      for (const group of userGroups) {
        if (excludeGroupId && group.id === excludeGroupId) {
          continue;
        }
        if (group.devices?.some(device => device.id === deviceId)) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Combined available devices including imported devices
  const combinedAvailableDevices = useMemo(() => {
    return [...(importedDevices || [])];
  }, [importedDevices]);

  // Available devices for assignment (only imported devices now)
  const availableDevices = useMemo(() => {
    if (!combinedAvailableDevices?.length) return [];

    return combinedAvailableDevices.filter(device => {
      const isAssigned = deviceExists(userCreatedGroups, device.id);
      const matchesSearch = !searchTerm ||
        (device.device_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.ip || '').includes(searchTerm) ||
        (device.os || '').toLowerCase().includes(searchTerm.toLowerCase());

      return !isAssigned && matchesSearch;
    });
  }, [combinedAvailableDevices, userCreatedGroups, searchTerm, deviceExists]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalGroups = userCreatedGroups.length;
    const totalDevices = userCreatedGroups.reduce((total, group) => total + (group.deviceCount || 0), 0);
    return {
      totalGroups,
      totalDevices,
      averageDevicesPerGroup: totalGroups > 0 ? Math.round(totalDevices / totalGroups) : 0,
      dataVersion: 1 // Static since we're not tracking versions anymore
    };
  }, [userCreatedGroups]);

  const totalAssignedDevices = statistics.totalDevices;

  // Handle CSV device import
  const handleImportDevices = useCallback((devices) => {
    const processedDevices = devices.map((device, index) => ({
      ...device,
      id: device.id || `imported-${Date.now()}-${index}`,
      device_name: device.device_name || device.name || device.hostname || `Imported Device ${index + 1}`,
      ip: device.ip || device.address || 'N/A',
      os: device.os || device.operating_system || 'Unknown',
      device_type: device.device_type || device.type || 'Imported',
      isActive: device.isActive || device.status || 'Unknown',
      is_imported: true,
      source: 'csv_import'
    }));

    setImportedDevices(prev => {
      const combined = [...prev, ...processedDevices];
      const unique = combined.filter((device, index, array) =>
        array.findIndex(d => d.device_name === device.device_name && d.ip === device.ip) === index
      );
      return unique;
    });

    return { success: true, imported: processedDevices.length };
  }, []);

  // Create new group with save API call using groups API slice
  const createNewGroup = useCallback(async (groupData) => {
    try {
      setHasLocalChanges(true);
      setIsLoadingGroups(true);

      const groupId = uuidv4();
      const newGroup = {
        id: groupId,
        name: groupData.name,
        description: groupData.description,
        createdAt: new Date().toISOString(),
        devices: [],
        deviceCount: 0,
        type: 'custom',
      };

      // Prepare payload for save_user_groups API
      const currentUser = getCurrentUser();
      const payload = {
        user: currentUser,
        groups: [{
          group_id: newGroup.id,
          group_name: newGroup.name,
          group_description: newGroup.description,
          created_at: newGroup.createdAt,
          devices: [],
          device_count: 0
        }],
        timestamp: new Date().toISOString(),
        total_groups: 1,
        total_devices: 0
      };

      // Save to backend using groups/configuration/ endpoint via groups API slice
      await saveUserGroups(payload).unwrap();
      console.log('✅ Group saved to backend successfully via groupsApiSlice');
      
      // Update local state
      setUserCreatedGroups(prev => [...prev, newGroup]);
      setHasLocalChanges(false);
      setLocalError(null);
      
      return { success: true, data: newGroup };
    } catch (error) {
      console.error('❌ Failed to create/save group via groupsApiSlice:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create group';
      setLocalError(errorMessage);
      throw error;
    } finally {
      setIsLoadingGroups(false);
    }
  }, [getCurrentUser, saveUserGroups]);

  // Delete group using delete_group endpoint via groups API slice
  const deleteGroup = useCallback(async (groupId) => {
    try {
      setIsLoadingGroups(true);
      
      // Delete from backend first using delete_group/<group_id>/ endpoint via groups API slice
      await deleteUserGroup(groupId).unwrap();
      console.log('✅ Group deleted from backend successfully via groupsApiSlice');
      
      // Then remove from local state
      setUserCreatedGroups(prev => prev.filter(group => group.id !== groupId));
      setHasLocalChanges(true);
      setLocalError(null);

      return { success: true, message: 'Group deleted successfully via groupsApiSlice' };
    } catch (error) {
      console.error('❌ Failed to delete group via groupsApiSlice:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete group';
      setLocalError(errorMessage);
      throw error;
    } finally {
      setIsLoadingGroups(false);
    }
  }, [deleteUserGroup]);

  // Add devices to group
  const addDevicesToGroup = useCallback(async ({ groupId, devices }) => {
    try {
      setHasLocalChanges(true);

      // Update local state
      setUserCreatedGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              devices: [...(group.devices || []), ...devices], 
              deviceCount: (group.devices || []).length + devices.length 
            }
          : group
      ));
      
      setSelectedDevices([]);
      setLocalError(null);

      console.log(`✅ Added ${devices.length} devices to group ${groupId} locally`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to add devices to group:', error);
      setLocalError(error?.message || 'Failed to add devices to group');
      throw error;
    }
  }, []);

  // Remove device from group
  const removeDeviceFromGroup = useCallback(async (groupId, deviceId) => {
    try {
      setHasLocalChanges(true);

      // Update local state
      setUserCreatedGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              devices: (group.devices || []).filter(device => device.id !== deviceId),
              deviceCount: Math.max(0, (group.deviceCount || 0) - 1)
            }
          : group
      ));
      
      setLocalError(null);

      console.log(`✅ Removed device ${deviceId} from group ${groupId} locally`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to remove device from group:', error);
      setLocalError(error?.message || 'Failed to remove device from group');
      throw error;
    }
  }, []);

  // Update group details
  const updateGroup = useCallback(async (groupId, groupData) => {
    try {
      setHasLocalChanges(true);

      // Update local state
      setUserCreatedGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              name: groupData.name || group.name,
              description: groupData.description || group.description
            }
          : group
      ));
      
      setLocalError(null);

      console.log(`✅ Updated group ${groupId} locally`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update group:', error);
      setLocalError(error?.message || 'Failed to update group');
      throw error;
    }
  }, []);

  // Save configuration using groups API slice
  const saveConfiguration = useCallback(async () => {
    try {
      if (!userCreatedGroups || userCreatedGroups.length === 0) {
        return { success: true, message: 'No groups to save', totalGroups: 0, totalDevices: 0 };
      }

      setIsLoadingGroups(true);

      const currentUser = getCurrentUser();
      const allGroupData = userCreatedGroups.map(group => ({
        group_id: group.id,
        group_name: group.name,
        group_description: group.description || '',
        created_at: group.createdAt,
        devices: (group.devices || []).map(device => ({
          uuid: device.uuid || device.id || uuidv4(),
          device_name: device.device_name,
          ip: device.ip,
          priority: device.priority || 'P4',
          is_imported: device.is_imported || false,
          original_source: device.is_imported ? 'csv_import' : 'device_api'
        })),
        device_count: (group.devices || []).length
      }));

      const payload = {
        user: currentUser,
        groups: allGroupData,
        timestamp: new Date().toISOString(),
        total_groups: allGroupData.length,
        total_devices: allGroupData.reduce((total, group) => total + group.device_count, 0)
      };

      // Use groups API slice for saving
      const result = await saveUserGroups(payload).unwrap();
      
      setHasLocalChanges(false);
      setLocalError(null);

      console.log('✅ Configuration saved successfully via groupsApiSlice');
      return {
        success: true,
        message: result?.message || 'Configuration saved successfully via groupsApiSlice',
        data: result,
        savedGroups: userCreatedGroups.length,
        savedDevices: payload.total_devices
      };
    } catch (error) {
      console.error('❌ Failed to save configuration via groupsApiSlice:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to save configuration';
      setLocalError(errorMessage);
      throw error;
    } finally {
      setIsLoadingGroups(false);
    }
  }, [userCreatedGroups, getCurrentUser, saveUserGroups]);

  // Device Selection Functions
  const toggleDeviceSelection = useCallback((deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  }, []);

  const selectAllDevicesAction = useCallback(() => {
    const allDeviceIds = availableDevices.map(device => device.id);
    setSelectedDevices(allDeviceIds);
  }, [availableDevices]);

  const clearDeviceSelection = useCallback(() => {
    setSelectedDevices([]);
  }, []);

  // UI Functions
  const toggleGroupExpansion = useCallback((groupId) => {
    setExpandedUserGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const setSearchTermAction = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Manual refresh function
  const refreshGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      await refetchGroups();
      setLocalError(null);
      console.log('🔄 Groups refreshed manually');
    } catch (error) {
      console.error('❌ Failed to refresh groups:', error);
      setLocalError('Failed to refresh groups');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [refetchGroups]);

  return {
    // State
    userCreatedGroups,
    availableDevices,
    selectedDevices,
    expandedUserGroups,
    searchTerm,
    isLoading: groupConfigLoading || isSaving || isDeleting || isLoadingGroups,
    isLoadingGroups: groupConfigLoading || isLoadingGroups,
    isSaving,
    isDeleting,
    error: localError || groupConfigError,
    groupError: groupConfigError,
    statistics,
    isCreatingGroup,
    editingGroupId,
    groupForm,
    importedDevices,
    combinedAvailableDevices,
    hasLocalChanges,
    totalAssignedDevices,
    assignedDeviceIds: userCreatedGroups.flatMap(group => 
      (group.devices || []).map(device => device.id)
    ),

    // Group Management
    createNewGroup,
    deleteGroup,
    updateGroup,
    saveConfiguration,

    // Device Management
    addDevicesToGroup,
    removeDeviceFromGroup,
    handleImportDevices,

    // Device Selection
    toggleDeviceSelection,
    selectAllDevices: selectAllDevicesAction,
    clearDeviceSelection,

    // UI State
    toggleGroupExpansion,
    setSearchTerm: setSearchTermAction,

    // Form Management
    setIsCreatingGroup,
    setEditingGroupId,
    updateGroupForm: (formData) => setGroupForm(prev => ({ ...prev, ...formData })),
    resetGroupForm: () => setGroupForm({ name: '', description: '' }),

    // Utilities
    refetchGroups,
    refreshGroups,
    clearError: () => setLocalError(null),
  };
};

export default useCustomGroups;
