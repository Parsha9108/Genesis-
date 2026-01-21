import windows from "../../src/assets/Windows_logo.svg";
import ubuntu from "../../src/assets/Ubuntu_logo.svg";
import { ChevronUp, ChevronDown, TrashIcon, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const osLogos = { windows, ubuntu };

const DataTable = ({
  rows,
  tableConfig,
  sortStack,
  selectedRows,
  isDarkMode = true,
  onSort,
  onCheckboxChange,
  onSelectAll,
  onRowClick,
  onDeleteDevice,
  onEditDevice,
  allSelected,
  someSelected,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  itemsPerPageOptions = [10, 25, 50, 100],
  onPageChange,
  onItemsPerPageChange,
  totalCount,
  tableHeight = "530px",
  tableTitle,
}) => {
  
  const [isPerPageDropdownOpen, setIsPerPageDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPerPageDropdownOpen(false);
      }
    };

    if (isPerPageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPerPageDropdownOpen]);

  const getSortIcon = useCallback((field) => {
    const entry = sortStack?.find(s => s.field === field);
    if (!entry) return null;
    return entry.direction === 'asc'
      ? <ChevronUp className="inline w-3 h-3 ml-1" />
      : <ChevronDown className="inline w-3 h-3 ml-1" />;
  }, [sortStack]);

  const toggleSort = useCallback((field) => {
    onSort?.(field);
  }, [onSort]);

  const handleItemsPerPageChange = useCallback((option) => {
    onItemsPerPageChange?.(option);
    setIsPerPageDropdownOpen(false);
  }, [onItemsPerPageChange]);

  // Helper function to get column config
  const getColumnConfig = useCallback((key) => {
    return tableConfig.columns.find(col => col.key === key);
  }, [tableConfig]);

  // Helper function to check if status is active/up
  const isStatusActive = useCallback((status) => {
    if (!status) return false;
    const statusLower = String(status).toLowerCase();
    return statusLower === 'active' || statusLower === 'up';
  }, []);

  // Helper function to render OS logo
const renderOSLogo = useCallback((os) => {
  if (!os) return <span className="text-xs" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>N/A</span>;
  
  const osName = String(os).toLowerCase().trim();
  let logoSrc = null;
  let displayName = os;

  // Match Windows
  if (osName === 'windows' || osName.includes('win')) {
    logoSrc = osLogos.windows;
    displayName = 'Windows';
  } 
  // Match Ubuntu/Linux
  else if (osName === 'ubuntu' || osName === 'linux' || osName.includes('ubuntu')) {
    logoSrc = osLogos.ubuntu;
    displayName = osName === 'ubuntu' ? 'Ubuntu' : 'Linux';
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {logoSrc ? (
        <>
          <img 
            src={logoSrc} 
            alt={`${displayName} logo`} 
            className="w-5 h-5 object-contain"
            title={displayName}
          />
          <span className="text-xs font-medium tracking-wide" style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}>
            {displayName}
          </span>
        </>
      ) : (
        <span className="text-xs font-medium tracking-wide capitalize" style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}>
          {os}
        </span>
      )}
    </div>
  );
}, [isDarkMode, osLogos]);


  if (!rows?.length) {
    return (
      <div className="text-center py-12" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
        <h3 className="text-lg font-semibold mb-2 tracking-wide" style={{ color: isDarkMode ? '#FFF' : '#1F2937' }}>
          No Device Data Available
        </h3>
        <p className="text-sm font-medium mb-4 max-w-md mx-auto tracking-wide">
          No devices have been registered yet. Connect your agents to start monitoring devices.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-[550px] font-medium tracking-wider text-xs"
      style={{ 
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      }}
    >
      {/* Table Header Section */}
      <div className="flex items-center justify-between px-6 py-3 border-b font-medium tracking-wider text-xs" 
           style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
        <span className="font-semibold tracking-wide" style={{ color: isDarkMode ? '#FFF' : '#525759' }}>
          {tableTitle} ({rows.length})
        </span>

        <div className="flex items-center gap-2">
          <label 
            className="text-sm font-medium tracking-wide" 
            style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
          >
            Rows per page:
          </label>
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsPerPageDropdownOpen(!isPerPageDropdownOpen)}
              className="inline-flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px] tracking-wide"
              style={{
                backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
                color: isDarkMode ? '#F3F4F6' : '#111827',
                border: `1px solid ${isDarkMode ? '#4B5563' : '#D1D5DB'}`,
              }}
            >
              <span>{itemsPerPage}</span>
              <ChevronDown 
                className={`h-4 w-4 transition-transform duration-200 ${isPerPageDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isPerPageDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-32 origin-top-right rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                style={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                }}
              >
                <div className="py-1">
                  {itemsPerPageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleItemsPerPageChange(option)}
                      className="w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between transition-colors hover:bg-opacity-80 tracking-wide"
                      style={{
                        backgroundColor: itemsPerPage === option 
                          ? isDarkMode ? '#374151' : '#F3F4F6' 
                          : 'transparent',
                        color: itemsPerPage === option 
                          ? isDarkMode ? '#60A5FA' : '#2563EB'
                          : isDarkMode ? '#D1D5DB' : '#374151',
                      }}
                    >
                      <span>{option}</span>
                      {itemsPerPage === option && <div className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Scroll Area */}
      <div className="flex-1 overflow-auto custom-scroll" style={{ maxHeight: tableHeight }}>
        <table className="min-w-full table-fixed font-medium tracking-wider text-xs">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }}>
            <tr>
              {tableConfig.columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} px-3 py-3 text-xs font-medium uppercase tracking-wider ${column.align || 'text-left'}`}
                  style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                  onClick={column.sortable ? () => toggleSort(column.sortField) : undefined}
                >
                  <div className="flex items-center justify-center">
                    {column.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected;
                        }}
                        onChange={onSelectAll}
                        className="cursor-pointer w-4 h-4"
                        aria-label="Select all devices"
                      />
                    ) : column.header}
                    {column.sortable && getSortIcon(column.sortField)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="cursor-pointer transition-colors hover:bg-gray-50 font-medium tracking-wider text-sm"
                style={{
                  backgroundColor: index % 2 === 0 ? (isDarkMode ? '#1F2937' : '#FFFFFF') : (isDarkMode ? '#111827' : '#F9FAFB'),
                }}
                onClick={() => onRowClick(row.id)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6'}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 
                    index % 2 === 0 ? (isDarkMode ? '#1F2937' : '#FFFFFF') : (isDarkMode ? '#111827' : '#F9FAFB');
                }}
              >
                {tableConfig.columns.map((column) => {
                  // Check if column has custom renderCell
                  const columnConfig = getColumnConfig(column.key);
                  const cellValue = row[column.key];

                  return (
                    <td key={column.key} className={`${column.width} px-3 py-2 ${column.align || 'text-left'} align-middle font-medium tracking-wider text-xs`}>
                      {/* Use renderCell if available */}
                      {columnConfig?.renderCell ? (
                        columnConfig.renderCell(cellValue, row)
                      ) : (
                        <>
                          {column.key === 'select' && (
                            <input
                              type="checkbox"
                              checked={selectedRows?.has?.(row.id) || false}
                              onChange={(e) => onCheckboxChange(e, row.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="cursor-pointer w-4 h-4"
                            />
                          )}
                          {column.key === 'sl' && <span style={{ color: isDarkMode ? '#D1D5DB' : '#111827' }}>{row.sl}</span>}
                          {/* Name field rendering */}
                          {column.key === 'name' && (
                            <span 
                              className="font-medium tracking-wide text-sm" 
                              style={{ color: isDarkMode ? '#D1D5DB' : '#111827' }} 
                              title={row.name}
                            >
                              {row.name}
                            </span>
                          )}
                          {column.key === 'device_name' && (
                            <span className="font-medium tracking-wide text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#111827' }} title={row.device_name}>{row.device_name}</span>
                          )}
                          {column.key === 'device_type' && (
                            <span className="font-medium tracking-wide text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#111827' }}>{row.device_type}</span>
                          )}
                          {/* OS column with logo rendering */}
                          {column.key === 'os' && renderOSLogo(row.os)}
                          {column.key === 'ip' && (
                            <span className="font-medium tracking-wide text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }} title={row.ip}>{row.ip}</span>
                          )}
                          {column.key === 'uptime' && (
                            <span className="font-medium tracking-wide text-sm" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }} title={row.uptime}>{row.uptime}</span>
                          )}
                          {/* Updated status rendering to handle both 'Active'/'Inactive' and 'Up'/'Down' */}
                          {column.key === 'status' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide text-sm ${
                              isStatusActive(row.isActive)
                                ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                                : isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                            }`}>
                              {row.isActive}
                            </span>
                          )}
                          {column.key === 'ip_address' && (
                            <span className="font-mono font-semibold tracking-wide text-sm" style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }} title={row.ip_address}>
                              {row.ip_address}
                            </span>
                          )}
                          {column.key === 'response_time' && (
                            <span className={`font-semibold tracking-wide text-sm ${
                              parseInt(row.response_time) < 50 ? isDarkMode ? 'text-green-400' : 'text-green-600' :
                              parseInt(row.response_time) < 100 ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600' : 
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {row.response_time}
                            </span>
                          )}
                          {/* Action column with Edit and Delete buttons */}
                          {column.key === 'action' && (
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button - only show if onEditDevice is provided */}
                              {onEditDevice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditDevice(e, {
                                      id: row.id,
                                      name: row.name,
                                      device_name: row.device_name,
                                      ip_address: row.ip_address
                                    });
                                  }}
                                  className={`p-1 rounded transition-colors tracking-wide ${
                                    isDarkMode 
                                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" 
                                      : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                  }`}
                                  title={`Edit ${row.name || row.device_name || row.ip_address || 'item'}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={(e) => onDeleteDevice(e, { 
                                  id: row.id, 
                                  name: row.name, 
                                  device_name: row.device_name, 
                                  ip_address: row.ip_address 
                                })}
                                className={`p-1 rounded transition-colors tracking-wide ${
                                  isDarkMode 
                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                    : "text-red-600 hover:text-red-900 hover:bg-red-50"
                                }`}
                                title={`Delete ${row.name || row.device_name || row.ip_address || 'item'}`}
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div 
        className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t font-medium tracking-wider text-xs"
        style={{
          borderColor: isDarkMode ? '#374151' : '#E5E7EB',
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        }}
      >
        <div className="text-sm font-medium tracking-wide" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-colors font-medium tracking-wide ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              color: isDarkMode ? '#D1D5DB' : '#374151',
              ...(currentPage !== 1 && { 
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' 
              })
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (totalPages <= 7 || pageNumber === 1 || pageNumber === totalPages || 
                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold tracking-wide transition-colors`}
                  style={{
                    backgroundColor: currentPage === pageNumber ? '#6366f1' : 'transparent',
                    color: currentPage === pageNumber ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151'),
                  }}
                >
                  {pageNumber}
                </button>
              );
            } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
              return (
                <span key={pageNumber} className="text-sm font-medium tracking-wide" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-colors font-medium tracking-wide ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              color: isDarkMode ? '#D1D5DB' : '#374151',
              ...(currentPage !== totalPages && { 
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' 
              })
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

DataTable.propTypes = {
  rows: PropTypes.array,
  tableConfig: PropTypes.object,
  sortStack: PropTypes.array,
  selectedRows: PropTypes.instanceOf(Set),
  isDarkMode: PropTypes.bool,
  onSort: PropTypes.func,
  onCheckboxChange: PropTypes.func,
  onSelectAll: PropTypes.func,
  onRowClick: PropTypes.func,
  onDeleteDevice: PropTypes.func,
  onEditDevice: PropTypes.func,
  allSelected: PropTypes.bool,
  someSelected: PropTypes.bool,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  itemsPerPage: PropTypes.number,
  itemsPerPageOptions: PropTypes.array,
  onPageChange: PropTypes.func,
  onItemsPerPageChange: PropTypes.func,
  totalCount: PropTypes.number,
  tableHeight: PropTypes.string,
  tableTitle: PropTypes.string,
};

export default DataTable;
