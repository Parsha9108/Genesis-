// import { useState, useMemo, useCallback, useEffect } from "react";
// import { AlertCircle, RefreshCw, TrashIcon, Search } from 'lucide-react';
// import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import SearchBar from "../SearchBar";
// import ActionButtons from "../ActionButtons";
// import ActionDropdown from "./ActionDropdown";
// import DataTable from "../DataTable";
// import BulkActionModal from "../administratorpanel/BulkActionModal";
// import { toast } from "react-toastify";
// import { 
//   useGetDevicesQuery,
//   useDeleteDeviceMutation,
// } from "../../redux/devicesApiSlice";

// // Import OS logos
// import Windows from "../../assets/Windows_logo.svg";
// import Ubuntu from "../../assets/Ubuntu_logo.svg";

// const DevicesList = ({ isDarkMode = true }) => {
//   useDocumentTitle('Devices');
//   const navigate = useNavigate();

//   /* -------------------- URL PARAMS -------------------- */
//   const [searchParams, setSearchParams] = useSearchParams();

//   /* -------------------- STATE -------------------- */
//   const [currentPage, setCurrentPage] = useState(
//     Number(searchParams.get("page")) || 1
//   );
//   const [itemsPerPage, setItemsPerPage] = useState(
//     Number(searchParams.get("page_size")) || 10
//   );
//   const [sortStack, setSortStack] = useState([]);
  
//   const [searchTerm, setSearchTerm] = useState(
//     searchParams.get("search") || ""
//   );
  
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
//   const [selectedRows, setSelectedRows] = useState(new Set());
//   const [showBulkModal, setShowBulkModal] = useState(false);
//   const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
//   const [deviceToDelete, setDeviceToDelete] = useState(null);

//   /* -------------------- EFFECTS -------------------- */
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   useEffect(() => {
//     const params = new URLSearchParams();
//     params.set("page", currentPage);
//     params.set("page_size", itemsPerPage);
//     if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
//     setSearchParams(params, { replace: true });
//   }, [currentPage, itemsPerPage, debouncedSearchTerm, setSearchParams]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedSearchTerm]);

//   /* -------------------- RTK QUERY -------------------- */
//   const { 
//     data, 
//     isLoading, 
//     isFetching, 
//     error,
//     refetch 
//   } = useGetDevicesQuery({
//     page: currentPage,
//     page_size: itemsPerPage,
//     search: debouncedSearchTerm,
//   });

//   const [deleteDevice] = useDeleteDeviceMutation();

//   /* -------------------- DATA EXTRACTION -------------------- */
//   const devices = useMemo(() => {
    
//     if (!data) return [];
    
//     if (Array.isArray(data.results)) {
//       return data.results;
//     }
    
//     if (data.results && Array.isArray(data.results.devices)) {
//       return data.results.devices;
//     }
//     if (Array.isArray(data.devices)) return data.devices;
//     if (Array.isArray(data)) return data;
    
//     console.warn('Unexpected API response structure:', data);
//     return [];
//   }, [data]);

//   const totalCount = useMemo(() => {
//     return data?.count || 0;
//   }, [data]);

//  /* -------------------- TABLE CONFIG -------------------- */
// const tableConfig = useMemo(() => ({
//   columns: [
//     { key: 'select', width: 'w-[8%]', sortable: false, header: '', align: 'text-center' },
//     { key: 'sl', width: 'w-[7%]', sortable: false, header: 'SL NO', align: 'text-center' },
//     { 
//       key: 'os', 
//       width: 'w-[15%]', 
//       sortable: true, 
//       header: 'OPERATING SYSTEM', 
//       align: 'text-center', 
//       sortField: 'os',
     
//     },
//     { key: 'device_name', width: 'w-[18%]', sortable: true, header: 'DEVICE NAME', align: 'text-center', sortField: 'device_name' },
//     { key: 'device_type', width: 'w-[12%]', sortable: true, header: 'DEVICE TYPE', align: 'text-center', sortField: 'device_type' },
//     { key: 'ip', width: 'w-[12%]', sortable: true, header: 'IP ADDRESS', align: 'text-center', sortField: 'ip' },
//     { key: 'uptime', width: 'w-[12%]', sortable: true, header: 'UPTIME', align: 'text-center', sortField: 'uptime' },
//     { key: 'status', width: 'w-[10%]', sortable: true, header: 'STATUS', align: 'text-center', sortField: 'status' },
//     { key: 'action', width: 'w-[6%]', sortable: false, header: 'ACTION', align: 'text-center' },
//   ],
// }), [isDarkMode]);

//   /* -------------------- COMPARISON FUNCTION FOR SORTING -------------------- */
//   const compareValues = useCallback((a, b, field, direction) => {
//     let valA, valB;
    
//     try {
//       switch (field) {
//         case 'os':
//           valA = (a.os || '').toLowerCase();
//           valB = (b.os || '').toLowerCase();
//           return direction === 'asc' 
//             ? valA.localeCompare(valB) 
//             : valB.localeCompare(valA);
            
//         case 'device_name':
//           valA = (a.device_name || '').toLowerCase();
//           valB = (b.device_name || '').toLowerCase();
//           return direction === 'asc' 
//             ? valA.localeCompare(valB) 
//             : valB.localeCompare(valA);
            
//         case 'device_type':
//           valA = (a.device_type || '').toLowerCase();
//           valB = (b.device_type || '').toLowerCase();
//           return direction === 'asc' 
//             ? valA.localeCompare(valB) 
//             : valB.localeCompare(valA);
            
//         case 'ip':
//           // Sort IP addresses numerically
//           valA = a.ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
//           valB = b.ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
//           return direction === 'asc' ? valA - valB : valB - valA;
          
//         case 'uptime':
//           valA = (a.uptime || '').toLowerCase();
//           valB = (b.uptime || '').toLowerCase();
//           return direction === 'asc' 
//             ? valA.localeCompare(valB) 
//             : valB.localeCompare(valA);
            
//         case 'status':
//           valA = a.isActive.toLowerCase() === 'active' ? 1 : 0;
//           valB = b.isActive.toLowerCase() === 'active' ? 1 : 0;
//           return direction === 'asc' ? valA - valB : valB - valA;
          
//         default:
//           return 0;
//       }
//     } catch (error) {
//       console.error('Error comparing values:', error);
//       return 0;
//     }
//   }, []);

//   /* -------------------- HANDLERS -------------------- */
//   const handlePageChange = useCallback((page) => {
//     const totalPages = Math.ceil(totalCount / itemsPerPage);
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   }, [totalCount, itemsPerPage]);

//   const handleItemsPerPageChange = useCallback((count) => {
//     setItemsPerPage(count);
//     setCurrentPage(1);
//   }, []);

//   const handleManualRefresh = useCallback(async () => {
//     try {
//       setSearchTerm("");
//       setDebouncedSearchTerm("");
//       setSortStack([]);
//       setCurrentPage(1);
//       await refetch();
//       toast.success('Devices data refreshed');
//     } catch (error) {
//       console.error('Error refreshing data:', error);
//       toast.error('Failed to refresh data');
//     }
//   }, [refetch]);

//   const handleDeleteDevice = useCallback((e, device) => {
//     e.stopPropagation();
//     setDeviceToDelete(device);
//     setShowSingleDeleteModal(true);
//   }, []);

//   const handleBulkDelete = useCallback(() => {
//     if (selectedRows.size === 0) return;
//     setShowBulkModal(true);
//   }, [selectedRows.size]);

//   const handleBulkSuccess = useCallback(() => {
//     setSelectedRows(new Set());
//     setShowBulkModal(false);
//     setCurrentPage(1);
//   }, []);

//   const actionMenuItems = useMemo(() => [
//     { label: "Delete Selected", onClick: handleBulkDelete, variant: "danger", disabled: false }
//   ], [handleBulkDelete]);

//   const handleCheckboxChange = useCallback((e, deviceId) => {
//     e.stopPropagation();
//     setSelectedRows(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(deviceId)) newSet.delete(deviceId);
//       else newSet.add(deviceId);
//       return newSet;
//     });
//   }, []);

//   const clearSearch = useCallback(() => {
//     setSearchTerm('');
//     setDebouncedSearchTerm('');
//     setCurrentPage(1);
//   }, []);

//   const toggleSort = useCallback((field) => {
//     setSortStack(prev => {
//       const existing = prev.find(s => s.field === field);
//       if (existing) {
//         return existing.direction === 'asc'
//           ? prev.map(s => s.field === field ? { ...s, direction: 'desc' } : s)
//           : prev.filter(s => s.field !== field);
//       }
//       return [...prev, { field, direction: 'asc' }];
//     });
//   }, []);

//   const handleRowClick = useCallback((id) => {
//     if (id) {
//       navigate(`/devices/${id}`);
//     }
//   }, [navigate]);

//   /* -------------------- DATA PROCESSING WITH SORTING -------------------- */
//   const processedRows = useMemo(() => {
//     if (!Array.isArray(devices)) {
//       console.error('Devices is not an array:', devices);
//       return [];
//     }

//     const startIndex = (currentPage - 1) * itemsPerPage;
    
//     // Map devices to row format
//     const mappedRows = devices.map((device, index) => ({
//       sl: startIndex + index + 1,
//       id: device.uuid,
//       os: device.os || '---', 
//       os_version: device.os_version || '', 
//       device_name: device.hostname || '---', 
//       device_type: device.device?.dev_phy_vm || '---',
//       ip: device.device?.ip_address || '---',
//       uptime: device.last_uptime_duration || '---',
//       isActive: device.status || 'Unknown',
//     }));

//     // Apply sorting if sortStack has entries
//     if (sortStack.length === 0) {
//       return mappedRows;
//     }

//     return [...mappedRows].sort((a, b) => {
//       for (const { field, direction } of sortStack) {
//         const result = compareValues(a, b, field, direction);
//         if (result !== 0) return result;
//       }
//       return 0;
//     });
//   }, [devices, currentPage, itemsPerPage, sortStack, compareValues]);

//   const totalPages = Math.ceil(totalCount / itemsPerPage);

//   const handleSelectAll = useCallback((e) => {
//     if (e.target.checked) setSelectedRows(new Set(processedRows.map(row => row.id)));
//     else setSelectedRows(new Set());
//   }, [processedRows]);

//   const allSelected = processedRows.length > 0 && selectedRows.size === processedRows.length;
//   const someSelected = selectedRows.size > 0 && selectedRows.size < processedRows.length;

//   const hasActiveFilters = useMemo(
//     () => Boolean(debouncedSearchTerm),
//     [debouncedSearchTerm]
//   );

//   /* -------------------- DELETE CONFIGS -------------------- */
//   const deleteDevicesConfig = useMemo(() => ({
//     title: 'Delete Devices',
//     message: `Are you sure you want to delete ${selectedRows.size} device(s)? This action cannot be undone.`,
//     icon: TrashIcon,
//     iconColor: isDarkMode ? '#F87171' : '#EF4444',
//     itemLabel: 'Selected Devices',
//     itemUnit: 'Device(s)',
//     dropdownLabel: 'Confirm Deletion',
//     dropdownPlaceholder: 'Select an option',
//     showDropdown: true,
//     requireSelection: true,
//     cancelValue: 'false',
//     options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
//     buttonText: 'Delete Devices',
//     buttonColor: 'red',
//     processingText: 'Deleting...',
//     onAction: async (deviceIds, selectedValue) => {
//       if (selectedValue !== 'true') return;
      
//       try {
//         await deleteDevice({ uuid: deviceIds }).unwrap();
//         toast.success(`Successfully deleted ${deviceIds.length} device(s)`);
//       } catch (error) {
//         console.error('Bulk delete failed:', error);
//         toast.error(error?.data?.message || error?.message || 'Failed to delete devices');
//         throw error;
//       }
//     },
//   }), [selectedRows.size, isDarkMode, deleteDevice]);

//   const singleDeleteConfig = useMemo(() => {
//     if (!deviceToDelete) return null;
//     return {
//       title: 'Delete Device',
//       message: `Are you sure you want to delete "${deviceToDelete.device_name || 'this device'}"? This action cannot be undone.`,
//       icon: TrashIcon,
//       iconColor: isDarkMode ? '#F87171' : '#EF4444',
//       itemLabel: 'Device',
//       itemUnit: 'Device',
//       dropdownLabel: 'Confirm Deletion',
//       dropdownPlaceholder: 'Select an option',
//       showDropdown: true,
//       requireSelection: true,
//       cancelValue: 'false',
//       options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
//       buttonText: 'Delete Device',
//       buttonColor: 'red',
//       processingText: 'Deleting...',
//       onAction: async (deviceIds, selectedValue) => {
//         if (selectedValue !== 'true') return;
        
//         try {
//           await deleteDevice({ uuid: deviceIds[0] }).unwrap();
//           toast.success(`Successfully deleted ${deviceToDelete.device_name || 'device'}`);
//         } catch (error) {
//           console.error('Delete failed:', error);
//           toast.error(error?.data?.message || error?.message || 'Failed to delete device');
//           throw error;
//         }
//       },
//     };
//   }, [deviceToDelete, isDarkMode, deleteDevice]);

//   const handleSingleDeleteSuccess = useCallback(() => {
//     setShowSingleDeleteModal(false);
//     setDeviceToDelete(null);
//     setCurrentPage(1);
//   }, []);

//   const errorMessage = error?.message || error?.error || 'Failed to load devices';

//   /* -------------------- RENDER -------------------- */
//   return (
//     <>
//       <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
//         <div className="rounded-lg shadow-md overflow-hidden"
//           style={{
//             backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
//             border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
//           }}>
          
//           <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b"
//             style={{
//               borderColor: isDarkMode ? '#374151' : '#E5E7EB',
//               backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
//             }}>
            
//             <div className="flex items-center gap-3">
//               <span className="text-base sm:text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
//                 Devices
//               </span>

//               <ActionButtons
//                 onRefresh={handleManualRefresh}
//                 isRefreshing={isFetching}
//                 isDarkMode={isDarkMode}
//                 refreshButtonTitle="Refresh Devices Data"
//                 refreshIcon={RefreshCw}
//               />

//               {selectedRows.size > 0 && (
//                 <span className="px-2 py-0.5 rounded-full text-sm font-normal"
//                   style={{
//                     color: isDarkMode ? '#9CA3AF' : '#6B7280',
//                     backgroundColor: isDarkMode ? 'rgba(55,65,81,0.5)' : '#F3F4F6',
//                   }}>
//                   ({selectedRows.size} selected)
//                 </span>
//               )}
//             </div>

//             <div className="flex items-center gap-3">
//               <ActionDropdown
//                 selectedCount={selectedRows.size}
//                 menuItems={actionMenuItems}
//                 isDarkMode={isDarkMode}
//                 buttonLabel="Action"
//                 disabled={selectedRows.size === 0}
//                 disabledTooltip="Select devices to perform actions"
//               />
//               <SearchBar
//                 searchTerm={searchTerm}
//                 onSearchChange={setSearchTerm}
//                 searchPlaceholder="Search devices..."
//                 isDarkMode={isDarkMode}
//                 className="border-0 p-0"
//               />
//             </div>
//           </div>

//           {isLoading ? (
//             <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
//               <p className="text-sm">Loading devices...</p>
//             </div>
//           ) : error ? (
//             <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
//               <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
//               <h3 className="text-lg font-semibold mb-2 text-red-600">
//                 {errorMessage}
//               </h3>
//               <button onClick={refetch}
//                 className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
//                 Retry
//               </button>
//             </div>
//           ) : processedRows.length === 0 ? (
//             <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
//               <Search className="w-16 h-16 mx-auto mb-6 opacity-30" />
//               <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
//                 No Devices Found
//               </h3>
//               <p className="text-sm mb-4 max-w-md mx-auto">
//                 {hasActiveFilters ? 'No devices match your search criteria.' : 'No devices have been registered yet.'}
//               </p>
//               {hasActiveFilters && (
//                 <button onClick={clearSearch}
//                   className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
//                   Clear Search
//                 </button>
//               )}
//             </div>
//           ) : (
//             <DataTable
//               rows={processedRows}
//               tableConfig={tableConfig}
//               sortStack={sortStack}
//               selectedRows={selectedRows}
//               isDarkMode={isDarkMode}
//               onSort={toggleSort}
//               onCheckboxChange={handleCheckboxChange}
//               onSelectAll={handleSelectAll}
//               onRowClick={handleRowClick}
//               onDeleteDevice={handleDeleteDevice}
//               allSelected={allSelected}
//               someSelected={someSelected}
//               currentPage={currentPage}
//               totalPages={totalPages}
//               itemsPerPage={itemsPerPage}
//               itemsPerPageOptions={[10, 25, 50, 100]}
//               onPageChange={handlePageChange}
//               onItemsPerPageChange={handleItemsPerPageChange}
//               totalCount={totalCount}
//               tableTitle="All Devices"
//             />
//           )}
//         </div>
//       </div>

//       <BulkActionModal
//         show={showBulkModal}
//         onHide={() => setShowBulkModal(false)}
//         selectedItems={Array.from(selectedRows)}
//         isDarkMode={isDarkMode}
//         config={deleteDevicesConfig}
//         onSuccess={handleBulkSuccess}
//       />

//       {deviceToDelete && (
//         <BulkActionModal
//           show={showSingleDeleteModal}
//           onHide={() => {
//             setShowSingleDeleteModal(false);
//             setDeviceToDelete(null);
//           }}
//           selectedItems={[deviceToDelete.id]}
//           isDarkMode={isDarkMode}
//           config={singleDeleteConfig}
//           onSuccess={handleSingleDeleteSuccess}
//         />
//       )}
//     </>
//   );
// };

// export default DevicesList;


import { useState, useMemo, useCallback, useEffect } from "react";
import { AlertCircle, RefreshCw, TrashIcon, Search } from 'lucide-react';
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from "../SearchBar";
import ActionButtons from "../ActionButtons";
import ActionDropdown from "./ActionDropdown";
import DataTable from "../DataTable";
import BulkActionModal from "../administratorpanel/BulkActionModal";
import { toast } from "react-toastify";
import { 
  useGetDevicesQuery,
  useDeleteDeviceMutation,
} from "../../redux/devicesApiSlice";

// Import OS logos
import Windows from "../../assets/Windows_logo.svg";
import Ubuntu from "../../assets/Ubuntu_logo.svg";

const DevicesList = ({ isDarkMode = true }) => {
  useDocumentTitle('Devices');
  const navigate = useNavigate();

  /* -------------------- URL PARAMS -------------------- */
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Extract status filter from URL
  const statusFilter = searchParams.get("status") || "all";

  /* -------------------- STATE -------------------- */
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    Number(searchParams.get("page_size")) || 10
  );
  const [sortStack, setSortStack] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("page_size", itemsPerPage);
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (statusFilter !== "all") params.set("status", statusFilter); // ✅ Preserve status filter
    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // ✅ Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  /* -------------------- RTK QUERY -------------------- */
  const { 
    data, 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useGetDevicesQuery({
    page: currentPage,
    page_size: itemsPerPage,
    search: debouncedSearchTerm,
  });

  const [deleteDevice] = useDeleteDeviceMutation();

  /* -------------------- DATA EXTRACTION -------------------- */
  const devices = useMemo(() => {
    if (!data) return [];
    
    if (Array.isArray(data.results)) {
      return data.results;
    }
    
    if (data.results && Array.isArray(data.results.devices)) {
      return data.results.devices;
    }
    if (Array.isArray(data.devices)) return data.devices;
    if (Array.isArray(data)) return data;
    
    console.warn('Unexpected API response structure:', data);
    return [];
  }, [data]);

  // ✅ Filter devices based on status from URL
  const filteredDevices = useMemo(() => {
    if (statusFilter === "all") return devices;
    
    return devices.filter(device => {
      const deviceStatus = (device.status || '').toLowerCase();
      return deviceStatus === statusFilter.toLowerCase();
    });
  }, [devices, statusFilter]);

  const totalCount = useMemo(() => {
    return filteredDevices.length;
  }, [filteredDevices]);

  /* -------------------- TABLE CONFIG -------------------- */
  const tableConfig = useMemo(() => ({
    columns: [
      { key: 'select', width: 'w-[8%]', sortable: false, header: '', align: 'text-center' },
      { key: 'sl', width: 'w-[7%]', sortable: false, header: 'SL NO', align: 'text-center' },
      { 
        key: 'os', 
        width: 'w-[15%]', 
        sortable: true, 
        header: 'OPERATING SYSTEM', 
        align: 'text-center', 
        sortField: 'os',
      },
      { key: 'device_name', width: 'w-[18%]', sortable: true, header: 'DEVICE NAME', align: 'text-center', sortField: 'device_name' },
      { key: 'device_type', width: 'w-[12%]', sortable: true, header: 'DEVICE TYPE', align: 'text-center', sortField: 'device_type' },
      { key: 'ip', width: 'w-[12%]', sortable: true, header: 'IP ADDRESS', align: 'text-center', sortField: 'ip' },
      { key: 'uptime', width: 'w-[12%]', sortable: true, header: 'UPTIME', align: 'text-center', sortField: 'uptime' },
      { key: 'status', width: 'w-[10%]', sortable: true, header: 'STATUS', align: 'text-center', sortField: 'status' },
      { key: 'action', width: 'w-[6%]', sortable: false, header: 'ACTION', align: 'text-center' },
    ],
  }), [isDarkMode]);

  /* -------------------- COMPARISON FUNCTION FOR SORTING -------------------- */
  const compareValues = useCallback((a, b, field, direction) => {
    let valA, valB;
    
    try {
      switch (field) {
        case 'os':
          valA = (a.os || '').toLowerCase();
          valB = (b.os || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
            
        case 'device_name':
          valA = (a.device_name || '').toLowerCase();
          valB = (b.device_name || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
            
        case 'device_type':
          valA = (a.device_type || '').toLowerCase();
          valB = (b.device_type || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
            
        case 'ip':
          valA = a.ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
          valB = b.ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
          return direction === 'asc' ? valA - valB : valB - valA;
          
        case 'uptime':
          valA = (a.uptime || '').toLowerCase();
          valB = (b.uptime || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
            
        case 'status':
          valA = a.isActive.toLowerCase() === 'active' ? 1 : 0;
          valB = b.isActive.toLowerCase() === 'active' ? 1 : 0;
          return direction === 'asc' ? valA - valB : valB - valA;
          
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error comparing values:', error);
      return 0;
    }
  }, []);

  /* -------------------- HANDLERS -------------------- */
  const handlePageChange = useCallback((page) => {
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalCount, itemsPerPage]);

  const handleItemsPerPageChange = useCallback((count) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    try {
      setSearchTerm("");
      setDebouncedSearchTerm("");
      setSortStack([]);
      setCurrentPage(1);
      await refetch();
      toast.success('Devices data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  }, [refetch]);

  const handleDeleteDevice = useCallback((e, device) => {
    e.stopPropagation();
    setDeviceToDelete(device);
    setShowSingleDeleteModal(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size === 0) return;
    setShowBulkModal(true);
  }, [selectedRows.size]);

  const handleBulkSuccess = useCallback(() => {
    setSelectedRows(new Set());
    setShowBulkModal(false);
    setCurrentPage(1);
  }, []);

  const actionMenuItems = useMemo(() => [
    { label: "Delete Selected", onClick: handleBulkDelete, variant: "danger", disabled: false }
  ], [handleBulkDelete]);

  const handleCheckboxChange = useCallback((e, deviceId) => {
    e.stopPropagation();
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) newSet.delete(deviceId);
      else newSet.add(deviceId);
      return newSet;
    });
  }, []);

  // ✅ Clear all filters including status
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
    navigate('/devices'); // Remove all query params
  }, [navigate]);

  const toggleSort = useCallback((field) => {
    setSortStack(prev => {
      const existing = prev.find(s => s.field === field);
      if (existing) {
        return existing.direction === 'asc'
          ? prev.map(s => s.field === field ? { ...s, direction: 'desc' } : s)
          : prev.filter(s => s.field !== field);
      }
      return [...prev, { field, direction: 'asc' }];
    });
  }, []);

  const handleRowClick = useCallback((id) => {
    if (id) {
      navigate(`/devices/${id}`);
    }
  }, [navigate]);

  /* -------------------- DATA PROCESSING WITH SORTING -------------------- */
  const processedRows = useMemo(() => {
    if (!Array.isArray(filteredDevices)) {
      console.error('Filtered devices is not an array:', filteredDevices);
      return [];
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    
    // ✅ Use filteredDevices instead of devices
    const mappedRows = filteredDevices
      .slice(startIndex, startIndex + itemsPerPage)
      .map((device, index) => ({
        sl: startIndex + index + 1,
        id: device.uuid,
        os: device.os || '---', 
        os_version: device.os_version || '', 
        device_name: device.hostname || '---', 
        device_type: device.device?.dev_phy_vm || '---',
        ip: device.device?.ip_address || '---',
        uptime: device.last_uptime_duration || '---',
        isActive: device.status || 'Unknown',
      }));

    if (sortStack.length === 0) {
      return mappedRows;
    }

    return [...mappedRows].sort((a, b) => {
      for (const { field, direction } of sortStack) {
        const result = compareValues(a, b, field, direction);
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [filteredDevices, currentPage, itemsPerPage, sortStack, compareValues]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) setSelectedRows(new Set(processedRows.map(row => row.id)));
    else setSelectedRows(new Set());
  }, [processedRows]);

  const allSelected = processedRows.length > 0 && selectedRows.size === processedRows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < processedRows.length;

  const hasActiveFilters = useMemo(
    () => Boolean(debouncedSearchTerm) || statusFilter !== "all",
    [debouncedSearchTerm, statusFilter]
  );

  /* -------------------- DELETE CONFIGS -------------------- */
  const deleteDevicesConfig = useMemo(() => ({
    title: 'Delete Devices',
    message: `Are you sure you want to delete ${selectedRows.size} device(s)? This action cannot be undone.`,
    icon: TrashIcon,
    iconColor: isDarkMode ? '#F87171' : '#EF4444',
    itemLabel: 'Selected Devices',
    itemUnit: 'Device(s)',
    dropdownLabel: 'Confirm Deletion',
    dropdownPlaceholder: 'Select an option',
    showDropdown: true,
    requireSelection: true,
    cancelValue: 'false',
    options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
    buttonText: 'Delete Devices',
    buttonColor: 'red',
    processingText: 'Deleting...',
    onAction: async (deviceIds, selectedValue) => {
      if (selectedValue !== 'true') return;
      
      try {
        await deleteDevice({ uuid: deviceIds }).unwrap();
        toast.success(`Successfully deleted ${deviceIds.length} device(s)`);
      } catch (error) {
        console.error('Bulk delete failed:', error);
        toast.error(error?.data?.message || error?.message || 'Failed to delete devices');
        throw error;
      }
    },
  }), [selectedRows.size, isDarkMode, deleteDevice]);

  const singleDeleteConfig = useMemo(() => {
    if (!deviceToDelete) return null;
    return {
      title: 'Delete Device',
      message: `Are you sure you want to delete "${deviceToDelete.device_name || 'this device'}"? This action cannot be undone.`,
      icon: TrashIcon,
      iconColor: isDarkMode ? '#F87171' : '#EF4444',
      itemLabel: 'Device',
      itemUnit: 'Device',
      dropdownLabel: 'Confirm Deletion',
      dropdownPlaceholder: 'Select an option',
      showDropdown: true,
      requireSelection: true,
      cancelValue: 'false',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
      buttonText: 'Delete Device',
      buttonColor: 'red',
      processingText: 'Deleting...',
      onAction: async (deviceIds, selectedValue) => {
        if (selectedValue !== 'true') return;
        
        try {
          await deleteDevice({ uuid: deviceIds[0] }).unwrap();
          toast.success(`Successfully deleted ${deviceToDelete.device_name || 'device'}`);
        } catch (error) {
          console.error('Delete failed:', error);
          toast.error(error?.data?.message || error?.message || 'Failed to delete device');
          throw error;
        }
      },
    };
  }, [deviceToDelete, isDarkMode, deleteDevice]);

  const handleSingleDeleteSuccess = useCallback(() => {
    setShowSingleDeleteModal(false);
    setDeviceToDelete(null);
    setCurrentPage(1);
  }, []);

  const errorMessage = error?.message || error?.error || 'Failed to load devices';

  // ✅ Dynamic title based on status filter
  const getPageTitle = () => {
    switch (statusFilter) {
      case 'active': return 'Active Devices';
      case 'inactive': return 'Inactive Devices';
      default: return 'All Devices';
    }
  };

  /* -------------------- RENDER -------------------- */
  return (
    <>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="rounded-lg shadow-md overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
          }}>
          
          <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b"
            style={{
              borderColor: isDarkMode ? '#374151' : '#E5E7EB',
              backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            }}>
            
            <div className="flex items-center gap-3">
              {/* ✅ Dynamic title showing current filter */}
              <span className="text-base sm:text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
                {getPageTitle()}
              </span>

              <ActionButtons
                onRefresh={handleManualRefresh}
                isRefreshing={isFetching}
                isDarkMode={isDarkMode}
                refreshButtonTitle="Refresh Devices Data"
                refreshIcon={RefreshCw}
              />

              {selectedRows.size > 0 && (
                <span className="px-2 py-0.5 rounded-full text-sm font-normal"
                  style={{
                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    backgroundColor: isDarkMode ? 'rgba(55,65,81,0.5)' : '#F3F4F6',
                  }}>
                  ({selectedRows.size} selected)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <ActionDropdown
                selectedCount={selectedRows.size}
                menuItems={actionMenuItems}
                isDarkMode={isDarkMode}
                buttonLabel="Action"
                disabled={selectedRows.size === 0}
                disabledTooltip="Select devices to perform actions"
              />
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search devices..."
                isDarkMode={isDarkMode}
                className="border-0 p-0"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-sm">Loading devices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                {errorMessage}
              </h3>
              <button onClick={refetch}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Retry
              </button>
            </div>
          ) : processedRows.length === 0 ? (
            <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              <Search className="w-16 h-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#FFF' : '#374151' }}>
                No Devices Found
              </h3>
              <p className="text-sm mb-4 max-w-md mx-auto">
                {hasActiveFilters ? `No ${statusFilter !== 'all' ? statusFilter : ''} devices match your search criteria.` : 'No devices have been registered yet.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearSearch}
                  className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <DataTable
              rows={processedRows}
              tableConfig={tableConfig}
              sortStack={sortStack}
              selectedRows={selectedRows}
              isDarkMode={isDarkMode}
              onSort={toggleSort}
              onCheckboxChange={handleCheckboxChange}
              onSelectAll={handleSelectAll}
              onRowClick={handleRowClick}
              onDeleteDevice={handleDeleteDevice}
              allSelected={allSelected}
              someSelected={someSelected}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalCount={totalCount}
              tableTitle={getPageTitle()}
            />
          )}
        </div>
      </div>

      <BulkActionModal
        show={showBulkModal}
        onHide={() => setShowBulkModal(false)}
        selectedItems={Array.from(selectedRows)}
        isDarkMode={isDarkMode}
        config={deleteDevicesConfig}
        onSuccess={handleBulkSuccess}
      />

      {deviceToDelete && (
        <BulkActionModal
          show={showSingleDeleteModal}
          onHide={() => {
            setShowSingleDeleteModal(false);
            setDeviceToDelete(null);
          }}
          selectedItems={[deviceToDelete.id]}
          isDarkMode={isDarkMode}
          config={singleDeleteConfig}
          onSuccess={handleSingleDeleteSuccess}
        />
      )}
    </>
  );
};

export default DevicesList;
