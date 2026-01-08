import { useState, useMemo, useCallback, useEffect } from "react";
import { AlertCircle, RefreshCw, TrashIcon, Search, Plus, Upload } from 'lucide-react';
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../SearchBar";
import ActionButtons from "../ActionButtons";
import ActionDropdown from "./ActionDropdown";
import DataTable from "../DataTable";
import IPModal from "./IPModal";
import BulkUploadIPModal from "./BulkUploadIPModal";
import BulkActionModal from "../administratorpanel/BulkActionModal";
import { toast } from "react-toastify";

// Import RTK hooks
import {
  useGetIPAddressesQuery,
  useCreateIPAddressMutation,
  useUpdateIPsMutation,
  useDeleteIPsMutation,
  useBulkUploadIPsMutation,
} from "../../redux/ipMonitoringApi";

const IPMonitoring = ({ isDarkMode = true }) => {
  useDocumentTitle('IP Monitoring');

  /* -------------------- URL PARAMS -------------------- */
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [ipToDelete, setIpToDelete] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [ipToEdit, setIpToEdit] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  /* -------------------- EFFECTS -------------------- */
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("page_size", itemsPerPage);
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    
    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, debouncedSearchTerm, setSearchParams]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  /* -------------------- RTK QUERY -------------------- */
  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
    };
    
    // Only include search if it has a value
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }
    
    return params;
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  const {
    data: ipData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetIPAddressesQuery(queryParams);

  const [createIP] = useCreateIPAddressMutation();
  const [updateIPs] = useUpdateIPsMutation();
  const [deleteIPs] = useDeleteIPsMutation();
  const [bulkUploadIPs] = useBulkUploadIPsMutation();

  /* -------------------- DATA EXTRACTION -------------------- */
  const ips = useMemo(() => {
    if (!ipData?.data) return [];
    return ipData.data;
  }, [ipData]);

  const totalCount = useMemo(() => {
    return ipData?.count || 0;
  }, [ipData]);

  /* -------------------- TABLE CONFIG -------------------- */
  const tableConfig = useMemo(() => ({
    columns: [
      { key: 'select', width: 'w-[8%]', sortable: false, header: '', align: 'text-center' },
      { key: 'name', width: 'w-[20%]', sortable: true, header: 'NAME', align: 'text-center', sortField: 'name' },
      { key: 'ip_address', width: 'w-[25%]', sortable: true, header: 'IP ADDRESS', align: 'text-center', sortField: 'ip_address' },
      { key: 'status', width: 'w-[15%]', sortable: true, header: 'STATUS', align: 'text-center', sortField: 'status' },
      { key: 'action', width: 'w-[12%]', sortable: false, header: 'ACTION', align: 'text-center' },
    ],
  }), []);

  /* -------------------- COMPARISON FUNCTION FOR SORTING (FIXED) -------------------- */
  const compareValues = useCallback((a, b, field, direction) => {
    let valA, valB;
    
    try {
      switch (field) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          return direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
          
        case 'ip_address':
          // Sort IP addresses numerically
          valA = a.ip_address.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
          valB = b.ip_address.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
          return direction === 'asc' ? valA - valB : valB - valA;
        
        case 'status':
          // Proper status sorting (Up > Down)
          const statusOrder = { 'Up': 1, 'up': 1, 'Down': 0, 'down': 0 };
          valA = statusOrder[a.status] || 0;
          valB = statusOrder[b.status] || 0;
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

  // Add IP handler
  const handleAddIP = useCallback(() => {
    setModalMode('add');
    setIpToEdit(null);
    setShowModal(true);
  }, []);

  // Bulk upload handler
  const handleBulkUpload = useCallback(() => {
    setShowBulkUploadModal(true);
  }, []);

  // Dropdown items for ActionButtons
  const addDropdownItems = useMemo(() => [
    {
      label: 'Bulk Upload IPs',
      onClick: handleBulkUpload,
      icon: Upload,
    },
  ], [handleBulkUpload]);

  // Edit IP handler
  const handleEditIP = useCallback((e, ip) => {
    e.stopPropagation();
    setModalMode('edit');
    setIpToEdit(ip);
    setShowModal(true);
  }, []);

  // Refresh handler
  const handleManualRefresh = useCallback(async (silent = false) => {
    try {
      setSearchTerm("");
      setDebouncedSearchTerm("");
      setSortStack([]);
      setCurrentPage(1);
      await refetch();
      if (!silent) {
        toast.success('IP monitoring data refreshed');
      }
    } catch (error) {
      if (!silent) {
        toast.error('Failed to refresh data');
      }
    }
  }, [refetch]);

  // Bulk upload success handler (closes modal and refreshes)
  const handleBulkUploadSuccess = useCallback(() => {
    setShowBulkUploadModal(false);
    handleManualRefresh(true);
  }, [handleManualRefresh]);

  // Delete handlers
  const handleDeleteIP = useCallback((e, ip) => {
    e.stopPropagation();
    setIpToDelete(ip);
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

  // Checkbox handlers
  const handleCheckboxChange = useCallback((e, ipId) => {
    e.stopPropagation();
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ipId)) newSet.delete(ipId);
      else newSet.add(ipId);
      return newSet;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Sort handler - client-side only
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
    // Handle row click logic if needed
  }, []);

  /* -------------------- DATA PROCESSING WITH CLIENT-SIDE SORTING (SIMPLIFIED) -------------------- */
  const processedRows = useMemo(() => {
    if (!Array.isArray(ips)) {
      console.error('IPs is not an array:', ips);
      return [];
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    
    // Mapping - only essential fields
    const mappedRows = ips.map((ip, index) => ({
      sl: startIndex + index + 1,
      id: ip.uuid || ip.id,
      name: ip.name,
      ip_address: ip.ip_address,
      status: ip.status, 
      isActive: ip.status === 'Up' ? 'Up' : 'Down' 
    }));

    // Apply client-side sorting if sortStack has entries
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
  }, [ips, currentPage, itemsPerPage, sortStack, compareValues]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) setSelectedRows(new Set(processedRows.map(row => row.id)));
    else setSelectedRows(new Set());
  }, [processedRows]);

  const allSelected = processedRows.length > 0 && selectedRows.size === processedRows.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < processedRows.length;

  const hasActiveFilters = useMemo(
    () => Boolean(debouncedSearchTerm),
    [debouncedSearchTerm]
  );

  /* -------------------- DELETE CONFIGS -------------------- */
  const deleteIPsConfig = useMemo(() => ({
    title: 'Delete IP Addresses',
    message: `Are you sure you want to delete ${selectedRows.size} IP address(es)? This action cannot be undone.`,
    icon: TrashIcon,
    iconColor: isDarkMode ? '#F87171' : '#EF4444',
    itemLabel: 'Selected IPs',
    itemUnit: 'IP(s)',
    dropdownLabel: 'Confirm Deletion',
    dropdownPlaceholder: 'Select an option',
    showDropdown: true,
    requireSelection: true,
    cancelValue: 'false',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    buttonText: 'Delete IPs',
    buttonColor: 'red',
    processingText: 'Deleting...',

    onAction: async (ipIds, selectedValue) => {
      if (selectedValue !== 'true') return;

      try {
        const response = await deleteIPs({ uuid: ipIds }).unwrap();
        toast.success(
          response?.message ||
          `Successfully deleted ${ipIds.length} IP address(es)`
        );
      } catch (error) {
        toast.error(
          error?.data?.message || 'Failed to delete IP addresses'
        );
      }
    },
  }), [selectedRows.size, isDarkMode, deleteIPs]);

  const singleDeleteConfig = useMemo(() => {
    if (!ipToDelete) return null;

    return {
      title: 'Delete IP Address',
      message: `Are you sure you want to delete "${
        ipToDelete.name || ipToDelete.ip_address || 'this IP'
      }"? This action cannot be undone.`,
      icon: TrashIcon,
      iconColor: isDarkMode ? '#F87171' : '#EF4444',
      itemLabel: 'IP Address',
      itemUnit: 'IP',
      dropdownLabel: 'Confirm Deletion',
      dropdownPlaceholder: 'Select an option',
      showDropdown: true,
      requireSelection: true,
      cancelValue: 'false',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      buttonText: 'Delete IP',
      buttonColor: 'red',
      processingText: 'Deleting...',

      onAction: async (_, selectedValue) => {
        if (selectedValue !== 'true') return;

        try {
          const response = await deleteIPs({ uuid: [ipToDelete.id] }).unwrap();
          toast.success(
            response?.message ||
            `Successfully deleted ${
              ipToDelete.name || ipToDelete.ip_address || 'IP address'
            }`
          );
        } catch (error) {
          toast.error(
            error?.data?.message || 'Failed to delete IP address'
          );
        }
      },
    };
  }, [ipToDelete, isDarkMode, deleteIPs]);

  const handleSingleDeleteSuccess = useCallback(() => {
    setShowSingleDeleteModal(false);
    setIpToDelete(null);
    setCurrentPage(1);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setShowModal(false);
    setIpToEdit(null);
    setModalMode('add');
    handleManualRefresh(true);
  }, [handleManualRefresh]);

  const errorMessage = error?.message || error?.error || 'Failed to load IP addresses';

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
              <span className="text-base sm:text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
                IP Monitoring
              </span>

              <ActionButtons
                onAdd={handleAddIP}
                onRefresh={handleManualRefresh}
                isRefreshing={isFetching}
                isDarkMode={isDarkMode}
                addButtonTitle="Add Single IP Address"
                refreshButtonTitle="Refresh IP Data"
                addIcon={Plus}
                refreshIcon={RefreshCw}
                showAddWithoutPermission={true}
                showAddDropdown={true}
                addDropdownItems={addDropdownItems}
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
                disabledTooltip="Select IP addresses to perform actions"
              />
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search name or IP or status"
                isDarkMode={isDarkMode}
                className="border-0 p-0"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-sm">Loading IP addresses...</p>
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
                No IP Addresses Found
              </h3>
              <p className="text-sm mb-4 max-w-md mx-auto">
                {hasActiveFilters ? 'No IP addresses match your search criteria.' : 'No IP addresses are being monitored yet.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearSearch}
                  className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Clear Search
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
              onDeleteDevice={handleDeleteIP}
              onEditDevice={handleEditIP}
              allSelected={allSelected}
              someSelected={someSelected}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalCount={totalCount}
              tableTitle="All IPs"
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <BulkActionModal
        show={showBulkModal}
        onHide={() => setShowBulkModal(false)}
        selectedItems={Array.from(selectedRows)}
        isDarkMode={isDarkMode}
        config={deleteIPsConfig}
        onSuccess={handleBulkSuccess}
      />

      {ipToDelete && (
        <BulkActionModal
          show={showSingleDeleteModal}
          onHide={() => {
            setShowSingleDeleteModal(false);
            setIpToDelete(null);
          }}
          selectedItems={[ipToDelete.id]}
          isDarkMode={isDarkMode}
          config={singleDeleteConfig}
          onSuccess={handleSingleDeleteSuccess}
        />
      )}

      {showModal && (
        <IPModal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setIpToEdit(null);
            setModalMode('add');
          }}
          isDarkMode={isDarkMode}
          mode={modalMode}
          ipData={ipToEdit}
          onSuccess={handleModalSuccess}
          createIP={createIP}
          updateIPs={updateIPs}
        />
      )}

      {showBulkUploadModal && (
        <BulkUploadIPModal
          show={showBulkUploadModal}
          onHide={() => setShowBulkUploadModal(false)}
          isDarkMode={isDarkMode}
          onSuccess={handleBulkUploadSuccess}
          bulkUploadIPs={bulkUploadIPs}
          refetchData={handleManualRefresh}
        />
      )}
    </>
  );
};

export default IPMonitoring;
