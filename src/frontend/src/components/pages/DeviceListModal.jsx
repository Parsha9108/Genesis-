import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Plus, AlertCircle, CheckCircle, Loader2, FileText } from 'lucide-react';

// Import from separate API slices
import { 
  useImportDevicesFromCSVMutation,
  useGetAvailableDevicesdataQuery,
} from '../../redux/apiSlice';

import { 
  useSaveUserGroupsMutation
} from '../../redux/groupsApiSlice';

import { useAuth } from '../../Contexts/AuthContext';

const DeviceListModal = ({
  show,
  onClose,
  groupName,
  groupId,
  selectedDevices = [],
  onDeviceToggle,
  onAssignDevices,
  existingGroupDevices = [],
  isDarkMode = true
}) => {
  // ALL HOOKS FIRST - ALWAYS CALLED IN SAME ORDER
  const fileInputRef = useRef(null);
  const [importedDevices, setImportedDevices] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Auth context
  const { user } = useAuth();
  
  // API hooks - separated by API slice
  const [importDevicesFromCSV] = useImportDevicesFromCSVMutation();
  const [saveUserGroupsTrigger, { isLoading: isSavingGroups }] = useSaveUserGroupsMutation();
  
  // Updated RTK Query configuration
  const {
    data: devicesData,
    error: devicesError,
    isLoading: isLoadingDevices,
    refetch: refetchDevices
  } = useGetAvailableDevicesdataQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  console.log("Available devices", devicesData);

  // Transform devices data
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (devicesData && !devicesError) {
      try {
        const transformedDevices = devicesData?.map((device) => ({
          id: device?.uuid || device?.deviceId || `device-${Date.now()}-${Math.random()}`,
          uuid: device?.uuid || device?.deviceId,
          device_name: device?.hostname || 'Unknown Device',
          ip: device?.device?.nic?.flatMap(nic =>
            nic.port?.flatMap(port =>
              port.ip?.filter(ip =>
                typeof ip.gateway === 'string' &&
                /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.gateway)
              )
            ) || []
          ).flat()?.[0]?.address || '0.0.0.0',
          os: device?.os || 'Unknown',
          device_type: device?.device?.dev_phy_vm || 'Virtual Machine',
          isActive: device?.status || 'Unknown',
        })) || [];

        setDevices(transformedDevices);
        console.log('📱 Devices fetched from devicedata/ API:', transformedDevices.length);
      } catch (transformError) {
        console.error('Error transforming device data:', transformError);
        setError({ message: 'Failed to process device data from devicedata API' });
      }
    } else if (devicesError && !isLoadingDevices) {
      console.error('Device data loading error:', devicesError);
      setError({ 
        message: devicesError?.data?.message || devicesError?.message || 'Failed to load devices from devicedata API' 
      });
    }
  }, [devicesData, devicesError, isLoadingDevices]);

  // Device list logging
  useEffect(() => {
    if (show) {
      console.log('📱 Device list updated:', {
        apiDevices: devices.length,
        importedDevices: importedDevices.length,
        totalDevices: devices.length + importedDevices.length,
        selectedDevices: selectedDevices.length,
        existingGroupDevices: existingGroupDevices.length
      });
    }
  }, [show, devices.length, importedDevices.length, selectedDevices.length, existingGroupDevices.length]);

  // Reset states when modal closes (without clearing devices)
  useEffect(() => {
    if (!show) {
      setShowResults(false);
      setImportStats(null);
      setImportedDevices([]);
      setIsLoading(false);
      setError(null);
      setIsAssigning(false);
    }
  }, [show]);

  // Refetch devices when modal opens
  useEffect(() => {
    if (show) {
      console.log('📱 Modal opened, fetching devices from devicedata/ API...');
      refetchDevices();
    }
  }, [show, refetchDevices]);

  // Early return after all hooks
  if (!show) return null;

  // Filter imported devices and auto-select existing ones
  const filterAndAutoSelectDevices = (importedDevices) => {
    const newDevices = [];
    const existingDevices = [];
    const autoSelectedIds = [];
    const autoSelectionDetails = [];

    importedDevices.forEach(importedDevice => {
      // Check if this imported device matches an existing device in the API devices list
      const matchingApiDevice = devices.find(apiDevice => 
        // Match by hostname/device_name
        (importedDevice.device_name && apiDevice.device_name && 
         importedDevice.device_name.toLowerCase() === apiDevice.device_name.toLowerCase()) ||
        // Match by IP address
        (importedDevice.ip && apiDevice.ip && 
         importedDevice.ip === apiDevice.ip && 
         importedDevice.ip !== '0.0.0.0') ||
        // Match by UUID if available
        (importedDevice.uuid && apiDevice.uuid && 
         importedDevice.uuid === apiDevice.uuid)
      );

      if (matchingApiDevice) {
        // Device already exists - don't add to imported list, but auto-select it
        existingDevices.push(importedDevice);
        
        // Auto-select the existing device if not already selected
        if (!selectedDevices.includes(matchingApiDevice.id)) {
          autoSelectedIds.push(matchingApiDevice.id);
          autoSelectionDetails.push({
            csvDevice: importedDevice.device_name,
            csvIp: importedDevice.ip,
            apiDevice: matchingApiDevice.device_name,
            apiIp: matchingApiDevice.ip,
            matchReason: importedDevice.device_name === matchingApiDevice.device_name ? 'hostname' : 'ip_address'
          });
          
          // Auto-select the device
          onDeviceToggle(matchingApiDevice.id);
        }
      } else {
        // Device is truly new - add to imported list
        newDevices.push(importedDevice);
      }
    });

    console.log(`🔄 Filtered ${importedDevices.length} CSV devices:`, {
      newDevices: newDevices.length,
      existingDevices: existingDevices.length,
      autoSelected: autoSelectedIds.length,
      details: autoSelectionDetails
    });

    return { newDevices, existingDevices, autoSelectedIds, autoSelectionDetails };
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setImportStats(null);

    try {
      // File validation
      if (!file.name.endsWith(".csv")) {
        setError({ message: "Please select a CSV file" });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError({ message: "File size too large. Maximum 5MB allowed." });
        return;
      }

      console.log("📤 Uploading CSV...");

      // Use CSV import from main apiSlice
      const result = await importDevicesFromCSV({ csvFile: file, groupName }).unwrap();
      console.log("✅ CSV upload response:", result);

      if (result.success) {
        // Process imported devices and filter out duplicates
        const processedDevices = (result.devices ?? []).map(device => ({
          ...device,
          id: device.uuid || `imported-${device.row_number}-${Date.now()}`,
          uuid: device.uuid,
          device_name: device.hostname,
          ip: device.ip_address,
          os: device.os,
          device_type: 'Imported Device',
          isActive: device.status,
          is_imported: true,
          import_status: device.import_status || 'new'
        }));

        // Filter out devices that already exist in the API devices list
        const { newDevices, existingDevices, autoSelectedIds, autoSelectionDetails } = filterAndAutoSelectDevices(processedDevices);
        
        // Only add truly new devices to imported list
        setImportedDevices(newDevices);
        
        // Set import stats from backend response
        const stats = {
          total: result.stats.total || 0,
          success: result.stats.success || 0,
          existing: result.stats.existing || 0,
          new: result.stats.new || 0,
          invalid: result.stats.invalid || 0,
          conflicts: result.stats.conflicts || 0,
          csv_duplicates: result.stats.csv_duplicates || 0,
          valid: result.stats.valid || 0,
          auto_selected: autoSelectedIds.length,
          filtered_out: existingDevices.length,
          auto_selection_details: autoSelectionDetails
        };
        
        setImportStats(stats);
        setShowResults(true);
        setError(null);

        // Show auto-selection message
        if (autoSelectedIds.length > 0) {
          setError({
            message: `Auto-selected ${autoSelectedIds.length} existing devices. ${newDevices.length} new devices added to the list.`,
            context: 'success'
          });

          setTimeout(() => setError(null), 5000);
        }

      } else {
        setError({ message: result.message || "Import failed" });
      }
    } catch (err) {
      console.error("❌ CSV import error:", err);

      const status = err.status || err.originalStatus;
      let errorMsg = "Import failed: ";

      if (status === 401) {
        errorMsg += "Authentication expired. Please log in again.";
      } else if (status === 403) {
        errorMsg += "Permission denied. Check your user permissions.";
      } else if (status === 400) {
        errorMsg += "Invalid CSV file or format";
      } else if (status === 413) {
        errorMsg += "File too large";
      } else if (status === 500) {
        errorMsg += "Server error occurred";
      } else {
        errorMsg += err.data?.error || err.message;
      }

      setError({ message: errorMsg, status });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  // Handle adding devices to group with proper callback validation
  const handleAddDevicesToGroup = async () => {
    if (selectedDevices.length === 0) {
      setError({ message: "Please select at least one device to add" });
      return;
    }

    if (!groupId) {
      setError({ message: "Group ID is missing" });
      return;
    }

    if (!user) {
      setError({ message: "User authentication required" });
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      // Debug callback functions
      console.log('Checking callback functions:', {
        onAssignDevices: typeof onAssignDevices,
        refetchDevices: typeof refetchDevices,
        onClose: typeof onClose,
        saveUserGroupsTrigger: typeof saveUserGroupsTrigger
      });

      if (typeof saveUserGroupsTrigger !== 'function') {
        throw new Error('saveUserGroups mutation is not available. Check your API slice configuration.');
      }

      // Get selected device details from both API devices and imported devices
      const allDevices = [...devices, ...importedDevices];
      const selectedDeviceDetails = allDevices.filter(device => 
        selectedDevices.includes(device.id)
      );

      console.log('🔄 Adding devices to group:', {
        groupId,
        groupName,
        selectedDeviceCount: selectedDeviceDetails.length,
        existingDevicesCount: existingGroupDevices.length,
        selectedDevices: selectedDeviceDetails,
        user: {
          id: user.id || user.userId,
          username: user.username || user.name,
          email: user.email
        }
      });

      // Get existing devices from props to prevent overriding
      const existingDeviceIds = existingGroupDevices.map(d => d.uuid || d.id);
      
      // Filter out devices that are already in the group
      const newDevices = selectedDeviceDetails.filter(device => 
        !existingDeviceIds.includes(device.uuid || device.id)
      );

      if (newDevices.length === 0) {
        setError({ message: "All selected devices are already in this group" });
        return;
      }

      // Combine existing devices with new ones
      const allGroupDevices = [
        ...existingGroupDevices,
        ...newDevices.map(device => ({
          uuid: device.uuid || device.id,
          device_name: device.device_name,
          ip: device.ip,
          os: device.os,
          device_type: device.device_type,
          priority: 'P4',
          is_imported: device.is_imported || false,
          original_source: device.is_imported ? 'csv_import' : 'devicedata_api'
        }))
      ];

      // Prepare payload for groups/configuration/ endpoint
      const payload = {
        user: {
          id: user.id || user.userId,
          username: user.username || user.name,
          email: user.email
        },
        groups: [{
          group_id: groupId,
          group_name: groupName,
          group_description: '',
          devices: allGroupDevices,
          device_count: allGroupDevices.length
        }],
        operation: 'add_devices',
        timestamp: new Date().toISOString(),
        total_groups: 1,
        total_devices: allGroupDevices.length
      };

      console.log('📤 API payload for groups/configuration/:', payload);

      // Use the trigger function and handle response properly
      const result = await saveUserGroupsTrigger(payload);
      
      // Check for errors in the response
      if (result.error) {
        console.error('❌ API Error:', result.error);
        throw result.error;
      }
      
      console.log('✅ Devices added successfully:', result.data);

      // Safely call callback functions with validation
      try {
        // Refetch device list if the function exists and is callable
        if (typeof refetchDevices === 'function') {
          console.log('Calling refetchDevices...');
          await refetchDevices();
        } else {
          console.warn('refetchDevices is not a function:', typeof refetchDevices);
        }
      } catch (refetchError) {
        console.error('Error refetching devices:', refetchError);
        // Don't throw - this is not critical
      }

      // Show success message
      setError({
        message: `Successfully added ${newDevices.length} devices to "${groupName}"!`,
        context: 'success'
      });

      // Use setTimeout to safely call callbacks after state updates
      setTimeout(async () => {
        try {
          // Clear error message
          setError(null);
          
          // Call parent callback if provided and is a function
          if (typeof onAssignDevices === 'function') {
            console.log('Calling onAssignDevices callback...');
            await onAssignDevices();
          } else if (onAssignDevices !== undefined) {
            console.warn('onAssignDevices is not a function:', typeof onAssignDevices);
          }
          
          // Close modal if onClose is a function
          if (typeof onClose === 'function') {
            console.log('Calling onClose callback...');
            onClose();
          } else {
            console.warn('onClose is not a function:', typeof onClose);
          }
        } catch (callbackError) {
          console.error('Error in success callbacks:', callbackError);
          // Still close the modal even if callbacks fail
          if (typeof onClose === 'function') {
            onClose();
          }
        }
      }, 2000);

    } catch (err) {
      console.error("❌ Failed to add devices to group:", err);

      let errorMsg = "Failed to add devices to group: ";

      // Handle different error types
      if (err?.data) {
        // RTK Query error format
        const status = err.status;
        switch (status) {
          case 401:
            errorMsg += "Authentication expired. Please log in again.";
            break;
          case 403:
            errorMsg += "Permission denied. Check your user permissions.";
            break;
          case 404:
            errorMsg += "Groups configuration endpoint not found.";
            break;
          case 400:
            errorMsg += "Invalid data provided.";
            break;
          case 500:
            errorMsg += "Server error occurred.";
            break;
          default:
            errorMsg += `HTTP ${status} - ${err.data?.message || err.data?.error || 'Unknown server error'}`;
        }
      } else if (err?.status) {
        // Alternative error format
        errorMsg += `HTTP ${err.status} - ${err.message || 'Network error'}`;
      } else {
        // Generic error
        errorMsg += err.message || "Unknown error occurred.";
      }

      setError({ 
        message: errorMsg, 
        status: err?.status || err?.data?.status 
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Combined device list (API devices + only NEW imported devices)
  const allDevices = [...devices, ...importedDevices];

  // Filter out devices that are already in existingGroupDevices to avoid showing them twice
  const filteredDevices = allDevices.filter(device => {
    const isAlreadyInGroup = existingGroupDevices.some(existing => 
      (existing.uuid || existing.id) === (device.uuid || device.id) ||
      (existing.device_name === device.device_name && existing.ip === device.ip) ||
      (device.ip !== '0.0.0.0' && existing.ip === device.ip)
    );
    return !isAlreadyInGroup;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[80vh] rounded-lg shadow-xl overflow-hidden ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Add Devices to "{groupName}"</h3>
              <p className="text-sm text-gray-400">
                {isLoadingDevices ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading devices...
                  </span>
                ) : (
                  <>
                    {filteredDevices.length} devices available for assignment
                   
                    {importedDevices.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {importedDevices.length} new from CSV
                      </span>
                    )}
                   
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Import CSV Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isAssigning}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  isLoading || isAssigning
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-[#6366f1] hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Processing...' : 'Import CSV'}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />

              {/* Add Selected Devices Button */}
              <button
                onClick={handleAddDevicesToGroup}
                disabled={selectedDevices.length === 0 || isAssigning || isLoadingDevices || isSavingGroups}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  selectedDevices.length === 0 || isAssigning || isLoadingDevices || isSavingGroups
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white transition-colors`}
              >
                {(isAssigning || isSavingGroups) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {(isAssigning || isSavingGroups)
                  ? 'Adding to Group...' 
                  : `Add ${selectedDevices.length > 0 ? `${selectedDevices.length} ` : ''}Devices`
                }
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isAssigning || isSavingGroups}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading Indicators */}
          {isLoadingDevices && (
            <div className="mb-4 p-4 rounded-lg bg-blue-900/20 border border-blue-600">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Fetching Devices</p>
                  <p className="text-xs text-gray-400">Loading from devicedata/ endpoint...</p>
                </div>
              </div>
            </div>
          )}

          {/* CSV Processing Indicator */}
          {isLoading && (
            <div className="mb-4 p-4 rounded-lg bg-blue-900/20 border border-blue-600">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Processing CSV File</p>
                  <p className="text-xs text-gray-400">Importing device data...</p>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Indicator */}
          {(isAssigning || isSavingGroups) && (
            <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-600">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-green-400">Adding Devices to Group</p>
                  <p className="text-xs text-gray-400">Saving device assignments...</p>
                </div>
              </div>
            </div>
          )}

          {/* Import Results */}
          {showResults && importStats && (
            <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-600">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-green-400">CSV Import Complete</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {importStats.total} devices processed from CSV file
                  </p>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-green-400 hover:text-green-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simplified Statistics Grid - Removed filtered_out and auto_selected boxes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-2 rounded bg-gray-700/50">
                  <div className="text-lg font-bold text-white">{importStats.total}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>

                <div className="text-center p-2 rounded bg-green-600/20 border border-green-600/30">
                  <div className="text-lg font-bold text-green-400">{importStats.success}</div>
                  <div className="text-xs text-green-400">Valid</div>
                </div>

                <div className="text-center p-2 rounded bg-blue-600/20 border border-blue-600/30">
                  <div className="text-lg font-bold text-blue-400">{importStats.new}</div>
                  <div className="text-xs text-blue-400">New Added</div>
                </div>

                <div className="text-center p-2 rounded bg-orange-600/20 border border-orange-600/30">
                  <div className="text-lg font-bold text-orange-400">{importStats.existing}</div>
                  <div className="text-xs text-orange-400">Found Existing</div>
                </div>

                {importStats.invalid > 0 && (
                  <div className="text-center p-2 rounded bg-red-600/20 border border-red-600/30">
                    <div className="text-lg font-bold text-red-400">{importStats.invalid}</div>
                    <div className="text-xs text-red-400">Invalid</div>
                  </div>
                )}
              </div>

              {/* Detailed stats from backend */}
              {(importStats.conflicts > 0 || importStats.csv_duplicates > 0) && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {importStats.conflicts > 0 && (
                    <div className="text-center p-2 rounded bg-yellow-600/20 border border-yellow-600/30">
                      <div className="text-sm font-bold text-yellow-400">{importStats.conflicts}</div>
                      <div className="text-xs text-yellow-400">Conflicts</div>
                    </div>
                  )}
                  {importStats.csv_duplicates > 0 && (
                    <div className="text-center p-2 rounded bg-red-600/20 border border-red-600/30">
                      <div className="text-sm font-bold text-red-400">{importStats.csv_duplicates}</div>
                      <div className="text-xs text-red-400">CSV Duplicates</div>
                    </div>
                  )}
                </div>
              )}

              {/* Simplified success message - Removed filtered out text */}
              <div className="mt-3 text-xs text-green-400">
                Successfully processed {importStats.success} devices!
                {importStats.existing > 0 && (
                  <span className="text-purple-400">
                    {" "}• {importStats.existing} existing devices found and auto-selected.
                  </span>
                )}
                {importStats.new > 0 && (
                  <span className="text-blue-400">
                    {" "}• {importStats.new} new devices added to the list.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${
              error.context === 'success' 
                ? 'bg-green-900/20 border border-green-600'
                : error.context === 'info'
                ? 'bg-blue-900/20 border border-blue-600'
                : 'bg-red-900/20 border border-red-600'
            }`}>
              <div className="flex items-start gap-3">
                {error.context === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : error.context === 'info' ? (
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-medium mb-1 ${
                    error.context === 'success' ? 'text-green-400' : 
                    error.context === 'info' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {error.context === 'success' ? 'Success' : 
                     error.context === 'info' ? 'Auto-Selection' : 'Error'}
                  </div>
                  <div className={`text-xs ${
                    error.context === 'success' ? 'text-green-300' : 
                    error.context === 'info' ? 'text-blue-300' : 'text-red-300'
                  }`}>
                    {error.message || 'An unknown error occurred'}
                  </div>
                  {error.status && (
                    <div className="text-xs text-gray-400 mt-2">
                      Error Code: {error.status}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className={`p-1 ${
                    error.context === 'success' 
                      ? 'text-green-400 hover:text-green-300'
                      : error.context === 'info'
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-red-400 hover:text-red-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Device List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoadingDevices ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400 mb-2">Loading devices...</p>
              <p className="text-xs text-gray-500">
                Fetching latest device information.
              </p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No devices available</p>
              <p className="text-xs text-gray-500">
                {devicesError 
                  ? 'Failed to load devices from API'
                  : 'No devices found. Import devices using CSV or check API connection.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDevices.map(device => {
                const isImported = device.is_imported || importedDevices.some(imp => imp.id === device.id);
                
                // Check if this device was auto-selected from CSV import (for border color only)
                const wasAutoSelected = selectedDevices.includes(device.id) && 
                  importStats?.auto_selection_details?.some(detail => 
                    detail.apiDevice === device.device_name || detail.apiIp === device.ip
                  );

                return (
                  <div
                    key={device.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isImported ? 'border-l-4 border-l-blue-500' : ''
                    } ${
                      wasAutoSelected ? 'border-l-4 border-l-purple-500' : ''
                    } ${
                      selectedDevices.includes(device.id)
                        ? 'bg-blue-900/30 border-blue-600'
                        : isDarkMode
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                    onClick={() => onDeviceToggle(device.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => onDeviceToggle(device.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {device.device_name}
                          {isImported && (
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              New from CSV
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {device.ip} • {device.os} • {device.device_type}
                        </div>
                      </div>

                      <div className={`px-2 py-1 rounded text-xs ${
                        device.isActive === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {device.isActive}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceListModal;
