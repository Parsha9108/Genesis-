import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import PropTypes from "prop-types";
import "../components/index.css";

function DataTableUI({
  // Data
  data = [],
  loading = false,
  error = "",
  totalCount = 0,

  // Configuration
  title = "Data Table",
  tableHeaders = [],
  isDarkMode = false,
  severityColors = {},
  itemsPerPage = 100,
  tableHeight = "550px",
  itemsPerPageOptions = [],
  onItemsPerPageChange = () => { },
  tableTitle = "",

  // Filters
  filters = {},
  filterConfig = [],
  filterOptions = {},
  hasActiveFilters = false,
  onFiltersChange = () => { },
  onFilterOptionsLoad = () => { },

  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => { },

  // Handlers
  onRowClick = () => { },
  onRetry = () => { },

  // Cell rendering
  renderCell = null,

  // Components
  FilterComponent = null,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(date);
    } catch {
      return "Invalid Date";
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const clearFilter = (key) => {
    if (key === "date") {
      onFiltersChange({ ...filters, dateFrom: "", dateTo: "" });
    } else {
      onFiltersChange({ ...filters, [key]: "" });
    }
  };

  const handleSelectOption = (option) => {
    onItemsPerPageChange(option);
    setIsDropdownOpen(false);
  };

  // When filter button is clicked, trigger filter-options API via parent
  const handleFilterOptionsClick = async () => {
    if (!onFilterOptionsLoad) return;
    try {
      await onFilterOptionsLoad(); // parent updates filterOptions state
    } catch (e) {
      console.error("Failed to load filter options", e);
    }
  };

  /* ------------------ Loading ------------------ */
  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        <p
          className="mt-2"
          style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
        >
          Loading data...
        </p>
      </div>
    );
  }

  /* ------------------ Error ------------------ */
  if (error && data.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-600">
          Failed to Load Data
        </h2>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div
        className="rounded-lg shadow border flex flex-col"
        style={{
          backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
          borderColor: isDarkMode ? "#374151" : "#E5E7EB",
          height: tableHeight,
        }}
      >
        {/* Table Header (inside container) */}
        <div className="flex items-center justify-between px-6 py-3 border-b space-x-3">
          <span
            className="font-semibold"
            style={{ color: isDarkMode ? "#FFF" : "#525759" }}
          >
            {tableTitle || `All ${title}`} ({data.length})
            {loading && (
              <span className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            )}
          </span>

          <div className="flex items-center space-x-2">
            {/* Rows per page dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="perPageSelect"
                className="text-sm"
                style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
              >
                Rows per page:
              </label>

              <div
                className="relative inline-block text-left"
                ref={dropdownRef}
              >
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={handleKeyDown}
                  className="inline-flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[70px]"
                  style={{
                    backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                    color: isDarkMode ? "#F3F4F6" : "#111827",
                    borderWidth: "1px",
                    borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                  }}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                      }`}
                    aria-hidden="true"
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-32 origin-top-right rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    style={{
                      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                      borderWidth: "1px",
                      borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                    }}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-1">
                      {itemsPerPageOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSelectOption(option)}
                          className="w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-opacity-80"
                          style={{
                            backgroundColor:
                              itemsPerPage === option
                                ? isDarkMode
                                  ? "#374151"
                                  : "#F3F4F6"
                                : "transparent",
                            color:
                              itemsPerPage === option
                                ? isDarkMode
                                  ? "#60A5FA"
                                  : "#2563EB"
                                : isDarkMode
                                  ? "#D1D5DB"
                                  : "#374151",
                          }}
                          onMouseEnter={(e) => {
                            if (itemsPerPage !== option) {
                              e.currentTarget.style.backgroundColor =
                                isDarkMode ? "#374151" : "#F3F4F6";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (itemsPerPage !== option) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }
                          }}
                          role="menuitem"
                        >
                          <span>{option}</span>
                          {itemsPerPage === option && (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter button */}
            {FilterComponent && (
              <FilterComponent
                filterConfig={filterConfig}
                filters={filters}
                filterOptions={filterOptions}
                onFiltersChange={onFiltersChange}
                onFilterOptionsLoad={handleFilterOptionsClick}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">
              {hasActiveFilters
                ? "No results for selected filters"
                : "No data available"}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="flex-1 overflow-auto custom-scroll">
              <table className="min-w-full table-fixed">
                <thead
                  className="sticky top-0 z-10"
                  style={{
                    backgroundColor: isDarkMode ? "#111827" : "#F9FAFB",
                  }}
                >
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header.key}
                        className={`px-3 py-3 text-xs font-medium uppercase tracking-wider text-left ${header.className || ""
                          }`}
                        style={{
                          color: isDarkMode ? "#9CA3AF" : "#6B7280",
                        }}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody
                  style={{
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  }}
                >
                  {data.map((item, index) => (
                    <tr
                      key={item.uuid || item.id || index}
                      onClick={() => onRowClick(item)}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? isDarkMode
                              ? "#1F2937"
                              : "#FFFFFF"
                            : isDarkMode
                              ? "#111827"
                              : "#F9FAFB",
                      }}
                    >
                      {tableHeaders.map((header) => (
                        <td
                          key={header.key}
                          className={`px-3 py-3 text-sm ${header.className || ""
                            }`}
                          style={{
                            color: isDarkMode ? "#D1D5DB" : "#6B7280",
                          }}
                        >
                          {renderCell
                            ? renderCell(
                              item,
                              header.key,
                              formatDate,
                              truncateText,
                              severityColors,
                              isDarkMode
                            )
                            : item[header.key] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination with Page Numbers */}
            <div
              className={`flex-shrink-0 flex items-center justify-between px-6 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              style={{
                backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
              }}
            >
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} entries
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : isDarkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  style={{
                    color: isDarkMode ? "#D1D5DB" : "#374151",
                  }}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {/* Page Numbers with Ellipsis */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;

                  if (
                    totalPages <= 7 ||
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 &&
                      pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNumber
                            ? "bg-[#6366f1] text-white"
                            : isDarkMode
                              ? "hover:bg-gray-700 text-gray-300"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="px-2"
                        style={{
                          color: isDarkMode ? "#9CA3AF" : "#6B7280",
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Next Button */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : isDarkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  style={{
                    color: isDarkMode ? "#D1D5DB" : "#374151",
                  }}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

DataTableUI.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  totalCount: PropTypes.number,
  title: PropTypes.string,
  tableHeaders: PropTypes.array,
  isDarkMode: PropTypes.bool,
  severityColors: PropTypes.object,
  itemsPerPage: PropTypes.number,
  itemsPerPageOptions: PropTypes.array,
  onItemsPerPageChange: PropTypes.func,
  tableHeight: PropTypes.string,
  tableTitle: PropTypes.string,
  filters: PropTypes.object,
  filterConfig: PropTypes.array,
  filterOptions: PropTypes.object,
  hasActiveFilters: PropTypes.bool,
  onFiltersChange: PropTypes.func,
  onFilterOptionsLoad: PropTypes.func,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  onRowClick: PropTypes.func,
  onRetry: PropTypes.func,
  renderCell: PropTypes.func,
  FilterComponent: PropTypes.elementType,
};

export default DataTableUI;
