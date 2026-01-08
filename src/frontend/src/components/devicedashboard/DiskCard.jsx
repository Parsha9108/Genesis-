import React, { useState, useEffect, useRef } from "react";
import { HardDrive, ChevronDown, HardDriveIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import "../index.css";

export const DiskUsageCard = ({ data, isDarkMode }) => {
  console.log("This is the diskcard data :", data);
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedDisk, setSelectedDisk] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter out flagged disks
  const filteredData = Array.isArray(data)
    ? data.filter((disk) => !disk.is_flagged)
    : [];

  // Fix: Only reset selectedDisk if it's out of range after filteredData changes
  useEffect(() => {
    if (filteredData.length > 0) {
      if (selectedDisk >= filteredData.length) {
        setSelectedDisk(0);
      }
    }
  }, [filteredData, selectedDisk]);

  // Watch selectedDisk changes - for debugging or side effects
  useEffect(() => {
    console.log("Selected disk changed to:", selectedDisk);
  }, [selectedDisk]);

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

  if (!filteredData.length) {
    return (
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow p-4 h-60 w-75 flex flex-col items-center justify-center text-center`}
      >
        <HardDriveIcon
          className={`w-8 h-8 mb-3 ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        />
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          No disk data available
        </p>
      </div>
    );
  }

  const selectDisk = filteredData[selectedDisk];
  if (!selectDisk) return null;

  // Debug logs for rendering and data selection
  console.log("Rendering disk card - Selected disk index:", selectedDisk);
  console.log("Selected disk data:", selectDisk);

  const parseGB = (gbString) => {
    return parseFloat(gbString?.replace("GB", "").trim()) || 0;
  };

  const total = parseGB(selectDisk.total_disk_size);
  const used = parseGB(selectDisk.total_disk_usage);
  const unAllocated = parseGB(selectDisk.unallocated_disk_size);
  const free = parseGB(selectDisk.free_space);

  const diskData = [
    { name: "Used", value: used, color: "#4F46E5" },
    { name: "Free", value: free, color: "#E5E7EB" },
    { name: "Unallocated", value: unAllocated, color: "#9CA3AF" },
  ];

  const diskNames = filteredData.map((_, i) => `Disk ${i + 1}`);

  const handleCardClick = () => navigate(`/devices/${id}/disk_details`);
  const stopPropagation = (e) => e.stopPropagation();
  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };
  const handleDiskSelect = (index, e) => {
    e.stopPropagation();
    console.log("Disk selected:", index);
    setSelectedDisk(index);
    setIsDropdownOpen(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload;
      return (
        <div
          className="px-3 py-2 rounded border text-xs shadow-lg"
          style={{
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
            color: isDarkMode ? "#E5E7EB" : "#1F2937",
          }}
        >
          <div className="flex items-center mb-1">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <strong>{item.name}</strong>
          </div>
          <div>{item.value} GB</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      onClick={handleCardClick}
      className={`${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow p-4 h-60 w-75 flex flex-col justify-between cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <HardDrive
            className={`w-4 h-4 mr-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-900"
            }`}
          >
            Disk Usage
          </span>
        </div>

        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleDropdownToggle}
            className={`flex items-center justify-between px-3 py-1.5 text-xs border rounded-md cursor-pointer min-w-[80px] transition-all duration-200 hover:shadow-md
              ${
                isDarkMode
                  ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              }
              ${isDropdownOpen ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
            `}
          >
            <span>{diskNames[selectedDisk]}</span>
            <ChevronDown
              className={`w-3 h-3 ml-1 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 top-full mt-1 w-full min-w-[80px] rounded-md shadow-lg border z-50 transition-all duration-200 origin-top
              ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-200"
              }
              ${
                isDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }
            `}
          >
            <div className="py-1 max-h-32 overflow-y-auto custom-scroll">
              {diskNames.map((disk, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDiskSelect(index, e)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${
                      selectedDisk === index
                        ? "bg-[#6366f1] text-white"
                        : isDarkMode
                        ? "text-gray-200 hover:bg-gray-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {disk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div
        onClick={stopPropagation}
        className="flex items-center justify-center my-2 relative"
      >
        <PieChart width={100} height={100}>
          <Pie
            data={diskData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={45}
            stroke="none"
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {diskData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                outerRadius={hoveredIndex === index ? 50 : 45}
                cursor="pointer"
                style={{ transition: "all 0.2s ease-in-out" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-sm font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {total} GB
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between items-end mt-2 text-xs">
        <div className="space-y-1">
          {diskData.map((entry) => (
            <div className="flex items-center" key={entry.name}>
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                {entry.name} {entry.value} GB
              </span>
            </div>
          ))}
        </div>
        <button
          className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer transition-colors duration-150"
          onClick={handleCardClick}
        >
          View details
        </button>
      </div>
    </div>
  );
};
