import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetAuditLogsQuery,
  useLazyGetFilterOptionsQuery,
  useLazyExportAuditLogsQuery,
} from "../../redux/auditLogsApi";
import DataTableUI from "../DataTableUI";
import AuditLogModal from "./AuditLogModal";
import FilterDropdown from "./FilterDropdown";
import "../../components/index.css";

const AuditLogs = ({ isDarkMode = false }) => {
  /* -------------------- CONSTANTS -------------------- */
  const TABLE_HEADERS = [
    { key: "timestamp", label: "DATE", className: "w-32" },
    { key: "user", label: "USER", className: "w-24" },
    { key: "action", label: "ACTION", className: "w-28" },
    { key: "model_name", label: "RESOURCE", className: "w-28" },
    { key: "description", label: "DESCRIPTION" },
    { key: "ip", label: "IP", className: "w-32" },
    { key: "severity_display", label: "SEVERITY", className: "w-24" },
  ];

  const filterConfig = [
    { key: "user", label: "User", optionsKey: "users", type: "select" },
    { key: "action", label: "Action", optionsKey: "actions", type: "select" },
    {
      key: "severity",
      label: "Severity",
      optionsKey: "severities",
      type: "select",
    },
    {
      key: "resource",
      label: "Resource",
      optionsKey: "resources",
      type: "select",
    },
    { key: "date", label: "Date Range", type: "dateRange" },
  ];

  const SEVERITY_COLORS = {
    Critical: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    Delete: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    Create:
      "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    Update:
      "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    Success:
      "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    Warning:
      "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    Info: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  };

  /* -------------------- STATE -------------------- */
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [5, 10, 20, 50, 100];

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  
  // Debounced search value (for API calls)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [appliedFilters, setAppliedFilters] = useState({
    user: searchParams.get("user") || "",
    action: searchParams.get("action") || "",
    resource: searchParams.get("resource") || "",
    severity: searchParams.get("severity") || "",
    dateFrom: searchParams.get("start_date") || "",
    dateTo: searchParams.get("end_date") || "",
  });

  // local state for filter options
  const [filterOptions, setFilterOptions] = useState({
    users: [],
    actions: [],
    resources: [],
    severities: [],
  });

  /* -------------------- LAZY QUERIES -------------------- */
  const [triggerGetFilterOptions] = useLazyGetFilterOptionsQuery();
  const [triggerExport] = useLazyExportAuditLogsQuery();

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
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (appliedFilters.user) params.set("user", appliedFilters.user);
    if (appliedFilters.action) params.set("action", appliedFilters.action);
    if (appliedFilters.resource) params.set("resource", appliedFilters.resource);
    if (appliedFilters.severity) params.set("severity", appliedFilters.severity);
    if (appliedFilters.dateFrom)
      params.set("start_date", appliedFilters.dateFrom);
    if (appliedFilters.dateTo) params.set("end_date", appliedFilters.dateTo);

    setSearchParams(params, { replace: true });
  }, [currentPage, debouncedSearchTerm, appliedFilters, setSearchParams]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  /* -------------------- RTK QUERY -------------------- */
  const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery(
    {
      page: currentPage,
      page_size: itemsPerPage,
      user: appliedFilters.user,
      action: appliedFilters.action,
      model_name: appliedFilters.resource,
      severity: appliedFilters.severity,
      start_date: appliedFilters.dateFrom,
      end_date: appliedFilters.dateTo,
      search: debouncedSearchTerm, 
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const logs = data?.audit_logs || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  /* -------------------- HANDLERS -------------------- */
  const handleFilterOptionsLoad = async () => {
    try {
      const result = await triggerGetFilterOptions().unwrap();
      setFilterOptions(result);
      return result;
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      const empty = {
        users: [],
        actions: [],
        resources: [],
        severities: [],
      };
      setFilterOptions(empty);
      return empty;
    }
  };

  const handleFiltersChange = (newFilters) => {
    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      const emptyFilters = {
        user: "",
        action: "",
        resource: "",
        severity: "",
        dateFrom: "",
        dateTo: "",
      };
      setAppliedFilters(emptyFilters);
      setSearchTerm("");
      setDebouncedSearchTerm(""); 
      setCurrentPage(1);
      await refetch();
      toast.success("Audit logs refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh audit logs");
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await triggerExport({
        user: appliedFilters.user,
        action: appliedFilters.action,
        model_name: appliedFilters.resource,
        severity: appliedFilters.severity,
        start_date: appliedFilters.dateFrom,
        end_date: appliedFilters.dateTo,
        search: debouncedSearchTerm, 
      }).unwrap();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit_logs_export_${new Date().getTime()}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Audit logs exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export audit logs");
    }
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (num) => {
    setItemsPerPage(num);
    setCurrentPage(1);
  };

  /* -------------------- CELL RENDERER -------------------- */
  const renderCell = (
    item,
    key,
    formatDate,
    truncateText,
    severityColors,
    isDarkMode
  ) => {
    switch (key) {
      case "timestamp":
        return (
          <span className="whitespace-nowrap">
            {formatDate(item.timestamp)}
          </span>
        );
      case "user":
        return item.user || "---";
      case "action":
        return <span className="font-medium">{item.action}</span>;
      case "model_name":
        return item.model_name || "---";
      case "description":
        return (
          <span title={item.description}>
            {truncateText(item.description, 60)}
          </span>
        );
      case "ip":
        return item.ip || "---";
      case "severity_display":
        return (
          <div className="flex items-center justify-center">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                severityColors[item.severity_display] || severityColors.Info
              }`}
            >
              {item.severity_display}
            </span>
          </div>
        );
      default:
        return item[key] || "---";
    }
  };

  const hasActiveFilters =
    Object.values(appliedFilters).some(Boolean) || Boolean(debouncedSearchTerm);

  /* -------------------- RENDER -------------------- */
  return (
    <div className="space-y-6">
      <DataTableUI
        data={logs}
        loading={isLoading}
        error=""
        totalCount={totalCount}
        title="Audit Logs"
        tableHeaders={TABLE_HEADERS}
        tableHeight="550px"
        isDarkMode={isDarkMode}
        severityColors={SEVERITY_COLORS}
        filters={appliedFilters}
        filterConfig={filterConfig}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={handleFiltersChange}
        FilterComponent={FilterDropdown}
        onFilterOptionsLoad={handleFilterOptionsLoad}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onRetry={refetch}
        renderCell={renderCell}
        itemsPerPage={itemsPerPage}
        itemsPerPageOptions={itemsPerPageOptions}
        onItemsPerPageChange={handleItemsPerPageChange}
        headerTitle="Audit Logs"
        headerCountLabel={`${totalCount} logs`}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        showDownload={true}
        onDownload={handleDownload}
      />

      <AuditLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        log={selectedLog}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default AuditLogs;
