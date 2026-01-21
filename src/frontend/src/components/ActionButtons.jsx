import React, { useState, useRef, useEffect } from "react";
import { PlusIcon, ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import RenderIfAllowed from "../components/Utilities/RenderIfAllowed";

const ActionButtons = ({
  onAdd,
  onRefresh,
  isRefreshing = false,
  isDarkMode = true,
  addButtonTitle = "Add New Item",
  refreshButtonTitle = "Refresh Data",
  addModule = "users_management",
  addAction = "create",
  className = "",
  showAddWithoutPermission = false,

  // Customizable icons
  addIcon: AddIcon = PlusIcon,
  refreshIcon: RefreshIcon = ArrowPathIcon,

  // New props for dropdown
  showAddDropdown = false,
  addDropdownItems = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const renderAddButton = () => {
    if (!onAdd) return null;

    const addButtonContent = (
      <div className="relative inline-flex" ref={showAddDropdown ? dropdownRef : null}>
        {/* Main Add Button */}
        <button
          onClick={onAdd}
          className={`p-2 transition-all duration-200 flex items-center justify-center focus:outline-none
            ${showAddDropdown ? "rounded-l-lg" : "rounded-lg"}
            ${
              isDarkMode
                ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 border border-blue-900/30"
                : "bg-blue-100/80 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border border-blue-200/50"
            }`}
          title={addButtonTitle}
          aria-label={addButtonTitle}
        >
          <AddIcon className="w-5 h-5 flex-shrink-0" />
        </button>

        {/* Dropdown Arrow Button */}
        {showAddDropdown && addDropdownItems.length > 0 && (
          <>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-2 rounded-r-lg border-l transition-all duration-200 flex items-center justify-center
                ${
                  isDarkMode
                    ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 border-blue-900/30 border-l-blue-900/50"
                    : "bg-blue-100/80 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200/50 border-l-blue-300"
                }`}
              title="More options"
              aria-label="More options"
            >
              <ChevronDownIcon
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute left-0 mt-14 w-56 origin-top-left rounded-lg shadow-lg focus:outline-none z-50"
                style={{
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
                }}
              >
                <div className="py-1">
                  {addDropdownItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors duration-150
                        ${
                          isDarkMode
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );

    if (showAddWithoutPermission) {
      return addButtonContent;
    }

    return (
      <RenderIfAllowed module={addModule} action={addAction}>
        {addButtonContent}
      </RenderIfAllowed>
    );
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Add Button with optional dropdown */}
      {renderAddButton()}

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center
            ${
              isRefreshing
                ? "opacity-50 cursor-not-allowed"
                : isDarkMode
                ? "bg-green-900/20 text-green-400 hover:bg-green-900/40 hover:text-green-300"
                : "bg-green-100/80 text-green-600 hover:bg-green-200 hover:text-green-700"
            }`}
          title={isRefreshing ? "Refreshing..." : refreshButtonTitle}
          aria-label={refreshButtonTitle}
        >
          <RefreshIcon
            className={`w-5 h-5 flex-shrink-0 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
