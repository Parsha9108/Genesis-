import React, { useEffect, useState, useMemo } from "react";
import backendApi from "../../api/backendAxiosInstance"
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from 'lucide-react';

import DataTableUI from "../DataTableUI";
import AlertModal from "./AlertModal";
import FilterDropdown from "./FilterDropdown";
import SearchBar from "../SearchBar";
import ActionButtons from "../ActionButtons";

function Alert({ isDarkMode = false }) {
  /* -------------------- STATE -------------------- */
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    Number(searchParams.get("page_size")) || 10
  );

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  
  // Debounced search value (for API calls)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [filters, setFilters] = useState({
    device: searchParams.get("device") || "",
    component: searchParams.get("component") || "",
    severity: searchParams.get("severity") || "",
    dateFrom: searchParams.get("start_date") || "",
    dateTo: searchParams.get("end_date") || "",
  });

  const [filterOptions, setFilterOptions] = useState({
    device: [],
    component: [],
    severity: [],
  });

  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPageOptions = [10, 25, 50, 100];

  /* ---------------- TABLE CONFIG ---------------- */
  const TABLE_HEADERS = [
    { key: "created_at", label: "TIME", className: "w-40" },
    { key: "device", label: "DEVICE", className: "w-40" },
    { key: "component", label: "COMPONENT", className: "w-40" },
    { key: "severity", label: "SEVERITY", className: "w-40" },
    { key: "description", label: "DESCRIPTION" },
  ];

  const SEVERITY_COLORS = {
    Critical: "bg-red-100 text-red-600",
    Warning: "bg-yellow-100 text-yellow-700",
    Info: "bg-green-100 text-green-600",
  };

  const filterConfig = [
    { key: "device", label: "Device", type: "select", optionsKey: "device" },
    {
      key: "component",
      label: "Component",
      type: "select",
      optionsKey: "component",
    },
    {
      key: "severity",
      label: "Severity",
      type: "select",
      optionsKey: "severity",
    },
    { key: "date", label: "Date Range", type: "dateRange" },
  ];

  /* -------------------- EFFECTS -------------------- */
  // Debounce search term (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage);
    params.set("page_size", itemsPerPage);

    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (filters.device) params.set("device_name", filters.device);
    if (filters.component) params.set("alert_type", filters.component);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.dateFrom) params.set("start_date", filters.dateFrom);
    if (filters.dateTo) params.set("end_date", filters.dateTo);

    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filters, setSearchParams]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Fetch alerts when dependencies change
  useEffect(() => {
    document.title = "Alerts";
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filters]);

  /* ---------------- ALERTS API (PAGE BASED) ---------------- */
  const fetchAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage,
        page_size: itemsPerPage,
      });

      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (filters.device) params.append("device_name", filters.device);
      if (filters.component) params.append("alert_type", filters.component);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.dateFrom) params.append("start_date", filters.dateFrom);
      if (filters.dateTo) params.append("end_date", filters.dateTo);

      const res = await backendApi.get(
        `/get_alerts?${params.toString()}`
      );

      const alerts = res.data?.results?.alerts || [];
      const apiCount = res.data?.count || 0;

      setData(alerts);
      setTotalCount(apiCount);
      setTotalPages(Math.ceil(apiCount / itemsPerPage));
    } catch (err) {
      console.error(err);
      setError("Failed to load alerts");
      setData([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER OPTIONS (LAZY) ---------------- */
  const fetchFilterOptions = async () => {
    if (filterOptionsLoaded || filterOptionsLoading) return filterOptions;

    try {
      setFilterOptionsLoading(true);

      const res = await backendApi.get("/get_alert_filter_options");
      console.log("Filter options response:", res.data);

      const options = {
        device: Array.isArray(res.data?.device) ? res.data.device : [],
        component: Array.isArray(res.data?.component)
          ? res.data.component
          : [],
        severity: Array.isArray(res.data?.severity) ? res.data.severity : [],
      };

      setFilterOptions(options);
      setFilterOptionsLoaded(true);

      return options;
    } catch (err) {
      console.error("Failed to load filter options", err);
      return filterOptions;
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  /* ---------------- HANDLERS ---------------- */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      setFilters({
        device: "",
        component: "",
        severity: "",
        dateFrom: "",
        dateTo: "",
      });
      setSearchTerm("");
      setDebouncedSearchTerm("");

      setCurrentPage(1);
      await fetchAlerts();

      toast.success("Alerts refreshed successfully");
    } catch {
      toast.error("Failed to refresh alerts");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRowClick = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (num) => {
    setItemsPerPage(num);
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean) || Boolean(debouncedSearchTerm),
    [filters, debouncedSearchTerm]
  );

  /* ---------------- CELL RENDERER ---------------- */
  const renderCell = (item, key, formatDate, truncateText, severityColors) => {
    switch (key) {
      case "created_at":
        return (
          <span className="whitespace-nowrap">
            {formatDate(item.created_at)}
          </span>
        );
      case "device":
        return item.device_name || item.hostname || "---";
      case "component":
        return (
          <span className="font-medium">{item.alert_type || "---"}</span>
        );
      case "severity":
        return (
          <span
            className={`inline-flex justify-center px-2 py-1 rounded-full text-xs font-medium mx-auto ${
              severityColors[item.severity] || severityColors.Info
            }`}
          >
            {item.severity}
          </span>
        );
      case "description":
        return (
          <span title={item.message || item.details}>
            {truncateText(item.message || item.details || "---", 60)}
          </span>
        );
      default:
        return item[key] || "---";
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-6">
      {/* Custom Header with SearchBar and ActionButtons */}
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
          
          {/* Left: Title + Refresh Button + Count */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-semibold" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
              Alerts
            </span>

            {/* ActionButtons for Refresh */}
            <ActionButtons
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              isDarkMode={isDarkMode}
              refreshButtonTitle="Refresh Alerts"
              refreshIcon={RefreshCw}
            />

            <span 
          className="inline-flex items-center justify-center px-2 py-1 rounded-full
             text-sm font-semibold leading-none
             bg-blue-500/10 text-blue-500"        >
          {totalCount} alerts
        </span>
          </div>

          {/* Right: SearchBar */}
          <div className="flex items-center gap-3">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search alerts..."
              isDarkMode={isDarkMode}
              className="border-0 p-0"
            />
          </div>
        </div>

        {/* DataTableUI without built-in controls */}
        <DataTableUI
          data={data}
          loading={loading}
          error={error}
          totalCount={totalCount}
          tableTitle="All Alerts" 
          tableHeaders={TABLE_HEADERS}
          tableHeight="550px"
          isDarkMode={isDarkMode}
          severityColors={SEVERITY_COLORS}
          filters={filters}
          filterConfig={filterConfig}
          filterOptions={filterOptions}
          onFilterOptionsLoad={fetchFilterOptions}
          hasActiveFilters={hasActiveFilters}
          onFiltersChange={handleFiltersChange}
          FilterComponent={FilterDropdown}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onRetry={fetchAlerts}
          renderCell={renderCell}
          itemsPerPage={itemsPerPage}
          itemsPerPageOptions={itemsPerPageOptions}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alert={selectedAlert}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default Alert;
