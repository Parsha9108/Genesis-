import React, { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const FilterDropdown = ({
  filterConfig,
  filters,
  filterOptions = {},
  onFiltersChange,
  onFilterOptionsLoad,
  isDarkMode = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchStates, setSearchStates] = useState({});
  const dropdownRef = useRef(null);

  // Initialize search states based on config
  useEffect(() => {
    const initial = {};
    filterConfig.forEach((config) => {
      if (config.type !== "dateRange") initial[config.key] = "";
    });
    setSearchStates(initial);
  }, [filterConfig]);

  // Sync internal with external filters
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterButtonClick = async () => {
    // Trigger parent to load options (lazy)
    if (onFilterOptionsLoad) {
      try {
        await onFilterOptionsLoad();
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    }
    // Then toggle dropdown; options come via props on next render
    setShowDropdown((prev) => !prev);
    setActiveSubmenu(null);
  };

  const clearFilters = () => {
    const resetFilters = {};
    const resetSearch = {};

    filterConfig.forEach((config) => {
      if (config.type === "dateRange") {
        resetFilters[`${config.key}From`] = "";
        resetFilters[`${config.key}To`] = "";
      } else {
        resetFilters[config.key] = "";
        resetSearch[config.key] = "";
      }
    });

    setTempFilters(resetFilters);
    setSearchStates(resetSearch);
    onFiltersChange(resetFilters);
    setShowDropdown(false);
    setActiveSubmenu(null);
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setShowDropdown(false);
    setActiveSubmenu(null);
  };

  const renderFilterSubmenu = (config) => {
    const list = Array.isArray(filterOptions?.[config.optionsKey])
      ? filterOptions[config.optionsKey]
      : [];
    const searchValue = searchStates[config.key] || "";

    return (
      <>
        <div className="mb-2">
          <h4 className="text-sm font-semibold mb-2">
            Select {config.label}
          </h4>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${config.label.toLowerCase()}...`}
              value={searchValue}
              onChange={(e) =>
                setSearchStates({
                  ...searchStates,
                  [config.key]: e.target.value,
                })
              }
              className={`w-full pl-8 pr-2 py-1.5 text-sm rounded border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        <div className="max-h-[180px] overflow-y-auto custom-scroll">
          {list
            .filter((o) =>
              o.toLowerCase().includes(searchValue.toLowerCase())
            )
            .map((option) => (
              <div
                key={option}
                className={`flex items-center justify-between px-3 py-2 text-sm ${
                  tempFilters[config.key] === option
                    ? "bg-[#6366f1]/10 text-[#6366f1] font-medium"
                    : isDarkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                } transition-colors rounded mb-1`}
              >
                <button
                  onClick={() => {
                    setTempFilters({ ...tempFilters, [config.key]: option });
                    setActiveSubmenu(null);
                  }}
                  className="flex-1 text-left"
                >
                  {option}
                </button>

                {tempFilters[config.key] === option && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, [config.key]: "" });
                    }}
                  >
                    <XMarkIcon className="h-4 w-4 text-red-600" />
                  </button>
                )}
              </div>
            ))}
        </div>
      </>
    );
  };

  const renderDateRangeSubmenu = (config) => (
    <>
      <h4 className="text-sm font-semibold mb-3">
        Select {config.label}
      </h4>
      <div className="space-y-3">
        {["From", "To"].map((type) => (
          <div key={type}>
            <label className="block text-xs font-medium mb-1">
              {type} Date
            </label>
            <input
              type="datetime-local"
              value={tempFilters[`${config.key}${type}`] || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  [`${config.key}${type}`]: e.target.value,
                })
              }
              className={`w-full px-2 py-1.5 text-sm rounded border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleFilterButtonClick}
        className={`flex items-center gap-2 px-4 py-1 rounded-lg border ${
          isDarkMode
            ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
            : "bg-white border-gray-300 hover:bg-gray-50"
        } transition-colors`}
      >
        Filter
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 flex gap-2 z-50">
          {activeSubmenu && (
            <div
              className={`w-64 p-2 shadow-xl rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              {filterConfig.map(
                (config) =>
                  config.key === activeSubmenu &&
                  (config.type === "dateRange"
                    ? renderDateRangeSubmenu(config)
                    : renderFilterSubmenu(config))
              )}
            </div>
          )}

          <div
            className={`w-64 shadow-xl rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-2 space-y-1">
              {filterConfig.map((config) => {
                const isDate = config.type === "dateRange";
                const hasValue = isDate
                  ? tempFilters[`${config.key}From`] ||
                    tempFilters[`${config.key}To`]
                  : tempFilters[config.key];

                return (
                  <button
                    key={config.key}
                    type="button"
                    onClick={() =>
                      setActiveSubmenu((prev) =>
                        prev === config.key ? null : config.key
                      )
                    }
                    className={`w-full px-3 py-2 text-left flex items-center justify-between rounded ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {config.label}
                    </span>
                    {hasValue && (
                      <span className="text-xs bg-blue-500 text-white px-2 rounded">
                        {isDate ? "Set" : tempFilters[config.key]}
                      </span>
                    )}
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t flex justify-end gap-2">
              <button
                onClick={clearFilters}
                className={`px-3 py-1 text-sm rounded ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                Clear
              </button>

              <button
                onClick={applyFilters}
                className="px-3 py-1 text-sm rounded bg-[#6366f1] text-white hover:bg-[#6366f1]/80"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
