import React, { useState, useEffect, useMemo } from "react";
import backendApi from "../../api/backendAxiosInstance";
import { useSearchParams } from "react-router-dom";
import DataTableUI from "../DataTableUI";
import FilterDropdown from "../tables/FilterDropdown";
import SearchBar from "../SearchBar";
import ActionButtons from "../ActionButtons"; 
import { RefreshCw, Download } from 'lucide-react'; 
import { toast } from "react-toastify";

const EVENT_TYPE_DISPLAY = {
  MON_DATA: "Monitoring Data",
  INFO: "Info",
  ALERT: "Alert",
  ERROR: "Error",
  UPDATE: "Update",
  DELETE: "Delete",
  CREATE: "Create",
  CONNECTION: "Connection",
  DISCONNECT: "Disconnect",
};

const SUCCESS_EVENTS = ["MON_DATA", "INFO", "CONNECTION", "CREATE", "UPDATE"];
const WARNING_EVENTS = ["ALERT", "DISCONNECT", "DELETE"];
const ERROR_EVENTS = ["ERROR"];

const EventLogs = ({ isDarkMode = false }) => {
  /* -------------------- STATE -------------------- */
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize from URL params
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    Number(searchParams.get("page_size")) || 10
  );
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const [filters, setFilters] = useState({
    device: searchParams.get("device") || "",
    eventType: searchParams.get("event_type") || "",
    component: searchParams.get("component") || "",
    timeRangeFrom: searchParams.get("from") || "",
    timeRangeTo: searchParams.get("to") || "",
  });

  const [filterOptions, setFilterOptions] = useState({
    devices: [],
    eventTypes: [],
    components: [],
  });

  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const itemsPerPageOptions = [10, 25, 50, 100];

  /* -------------------- TABLE CONFIG -------------------- */
  const TABLE_HEADERS = [
    { key: "time", label: "TIME", className: "w-40" },
    { key: "device", label: "DEVICE", className: "w-40" },
    { key: "eventType", label: "EVENT TYPE", className: "w-40" },
    { key: "component", label: "COMPONENT", className: "w-40" },
    { key: "description", label: "DESCRIPTION" },
  ];

  const filterConfig = [
    { key: "device", label: "Device", type: "select", optionsKey: "devices" },
    {
      key: "eventType",
      label: "Event Type",
      type: "select",
      optionsKey: "eventTypes",
    },
    {
      key: "component",
      label: "Component",
      type: "select",
      optionsKey: "components",
    },
    { key: "timeRange", label: "Time Range", type: "dateRange" },
  ];

  /* -------------------- EFFECTS -------------------- */
  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage);
    params.set("page_size", itemsPerPage);

    if (searchTerm) params.set("search", searchTerm);
    if (filters.device) params.set("device", filters.device);
    if (filters.eventType) params.set("event_type", filters.eventType);
    if (filters.component) params.set("component", filters.component);
    if (filters.timeRangeFrom) params.set("from", filters.timeRangeFrom);
    if (filters.timeRangeTo) params.set("to", filters.timeRangeTo);

    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, searchTerm, filters, setSearchParams]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch event logs when dependencies change
  useEffect(() => {
    document.title = "Event Logs";
    fetchEventLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  /* -------------------- API CALLS -------------------- */
  const fetchEventLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage,
        page_size: itemsPerPage,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (filters.device) params.append("device_name", filters.device);
      if (filters.eventType) params.append("event_type", filters.eventType);
      if (filters.component) params.append("component_type", filters.component);
      if (filters.timeRangeFrom) params.append("start_date", filters.timeRangeFrom);
      if (filters.timeRangeTo) params.append("end_date", filters.timeRangeTo);

      const res = await backendApi.get(
        `/get_eventlogs?${params.toString()}`
      );

      const events = res.data?.results?.events || [];
      const count = res.data?.count || 0;

      setData(events);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
      setError("Failed to load event logs");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    if (filterOptionsLoaded) return filterOptions;

    try {
      const res = await backendApi.get(
        "/get_eventlogs?page=1&page_size=1000"
      );
      const events = res.data?.results?.events || [];

      const devices = Array.from(
        new Set(events.map((r) => r.device_name))
      ).filter(Boolean);
      const eventTypes = Array.from(
        new Set(events.map((r) => r.event_type))
      ).filter(Boolean);
      const components = Array.from(
        new Set(events.map((r) => r.component_type))
      ).filter(Boolean);

      const options = {
        devices,
        eventTypes,
        components,
      };

      setFilterOptions(options);
      setFilterOptionsLoaded(true);
      return options;
    } catch (err) {
      console.error("Failed to load filter options", err);
      return filterOptions;
    }
  };

  /* -------------------- HANDLERS -------------------- */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Clear all filters and search
      setFilters({
        device: "",
        eventType: "",
        component: "",
        timeRangeFrom: "",
        timeRangeTo: "",
      });
      setSearchTerm("");
      setCurrentPage(1);
      
      await fetchEventLogs();
      toast.success("Event logs refreshed");
    } catch (err) {
      toast.error("Failed to refresh event logs");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams();

      // Apply same filters and search as current view (no pagination)
      if (searchTerm) params.append("search", searchTerm);
      if (filters.device) params.append("device", filters.device);
      if (filters.eventType) params.append("event_type", filters.eventType);
      if (filters.component) params.append("component_type", filters.component);
      if (filters.timeRangeFrom) params.append("from", filters.timeRangeFrom);
      if (filters.timeRangeTo) params.append("to", filters.timeRangeTo);

      const response = await backendApi.get(
        `/export_eventlogs?${params.toString()}`,
        {
          responseType: "blob", 
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `event_logs_export_${new Date().getTime()}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Event logs exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export event logs");
    }
  };

  /* -------------------- COMPUTED -------------------- */
  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean) || Boolean(searchTerm),
    [filters, searchTerm]
  );

  /* -------------------- CELL RENDERER -------------------- */
  const renderCell = (item, key, formatDate, truncateText) => {
    switch (key) {
      case "time":
        return formatDate(item.created_at);
      case "device":
        return item.device_name;
      case "eventType":
        return EVENT_TYPE_DISPLAY[item.event_type] || item.event_type;
      case "component":
        return item.component_type;
      default:
        return truncateText(item[key] ?? item.description);
    }
  };

  /* -------------------- RENDER -------------------- */
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
              Event Logs
            </span>

            {/* ActionButtons for Refresh */}
            <ActionButtons
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              isDarkMode={isDarkMode}
              refreshButtonTitle="Refresh Event Logs"
              refreshIcon={RefreshCw}
            />

            <span 
           className="inline-flex items-center justify-center px-2 py-1 rounded-full
             text-sm font-semibold leading-none
             bg-blue-500/10 text-blue-500"
        >
          {totalCount} events
        </span>
          </div>

          {/* Right: SearchBar + Download Button */}
          <div className="flex items-center gap-3">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search event logs..."
              isDarkMode={isDarkMode}
              className="border-0 p-0"
            />

            <button
              onClick={handleDownload}
              className={`p-2 rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isDarkMode
                  ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 border border-blue-900/30'
                  : 'bg-blue-100/80 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border border-blue-200/50'
                }`}
              title="Download Event Logs"
              aria-label="Download Event Logs"
            >
              <Download className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* DataTableUI without built-in controls */}
        <DataTableUI
          data={data}
          loading={loading}
          error={error}
          totalCount={totalCount}
          tableTitle="All Event Logs"
          tableHeaders={TABLE_HEADERS}
          tableHeight="550px"
          isDarkMode={isDarkMode}
          filters={filters}
          filterConfig={filterConfig}
          filterOptions={filterOptions}
          hasActiveFilters={hasActiveFilters}
          onFiltersChange={handleFiltersChange}
          FilterComponent={FilterDropdown}
          onFilterOptionsLoad={fetchFilterOptions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRetry={fetchEventLogs}
          renderCell={renderCell}
          itemsPerPage={itemsPerPage}
          itemsPerPageOptions={itemsPerPageOptions}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
};

export default EventLogs;
