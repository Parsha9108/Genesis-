import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { useGetDevicesdataQuery } from "../../redux/apiSlice";
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";

const parseNetworkValue = (str) => {
  const units = {
    bps: 1,
    kbps: 1000,
    Mbps: 1000000,
    Gbps: 1000000000,
    pps: 1,
  };
  const match = str.match(/^([\d.]+)([a-zA-Z]+)$/);
  if (!match) return 0;
  const [, num, unit] = match;
  return parseFloat(num) * (units[unit] || 1);
};

const getPortTypeColor = (media) => {
  switch (media.toLowerCase()) {
    case "loopback":
      return "bg-green-400";
    case "ethernet":
      return "bg-cyan-400";
    default:
      return "bg-gray-400";
  }
};

const compareNetworkValues = (a, b, field, direction) => {
  let valA = a[field];
  let valB = b[field];

  if (["bitsIn", "bitsOut", "pktsIn", "pktsOut"].includes(field)) {
    valA = parseNetworkValue(valA);
    valB = parseNetworkValue(valB);
  }

  if (valA < valB) return direction === "asc" ? -1 : 1;
  if (valA > valB) return direction === "asc" ? 1 : -1;
  return 0;
};

const NetworkInterfaces = ({ isDarkMode = true, networkMap }) => {
  useDocumentTitle("Health");
  const { data, isLoading } = useGetDevicesdataQuery();
  const [sortStack, setSortStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [networkData, setNetworkData] = useState([]);
  
  // REFS FOR RATE CALCULATION
  const networkRatesRef = useRef({});

  // Format bytes to appropriate unit
  const formatBitsRate = (kbps) => {
    if (kbps === 0) return "0 Kbps";
    if (kbps < 1) return `${(kbps * 1000).toFixed(0)} bps`;
    if (kbps < 1000) return `${kbps.toFixed(2)} Kbps`;
    if (kbps < 1000000) return `${(kbps / 1000).toFixed(2)} Mbps`;
    return `${(kbps / 1000000).toFixed(2)} Gbps`;
  };

  // **IMPROVED CALCULATE NETWORK RATES FUNCTION**
  const calculateNetworkRates = (agentId, portId, liveData) => {
    const key = `${agentId}-${portId}`;
    const currentTimestamp = Date.now();

    const currentBytesReceived = Number(liveData?.bytes_received || 0);
    const currentBytesSent = Number(liveData?.bytes_sent || 0);
    const currentPacketsReceived = Number(liveData?.packet_received || 0);
    const currentPacketsSent = Number(liveData?.packet_sent || 0);

    // Create hash to detect data changes
    const currentDataHash = `${currentBytesReceived}-${currentBytesSent}-${currentPacketsReceived}-${currentPacketsSent}`;

    const prevData = networkRatesRef.current[key];

    // **INITIALIZE WITH CURRENT VALUES**
    if (!prevData) {
      networkRatesRef.current[key] = {
        prevBytesReceived: currentBytesReceived,
        prevBytesSent: currentBytesSent,
        prevPacketsReceived: currentPacketsReceived,
        prevPacketsSent: currentPacketsSent,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash,
        bitsInRate: 0,
        bitsOutRate: 0,
        pktsInRate: 0,
        pktsOutRate: 0
      };
      return networkRatesRef.current[key];
    }

    // **ONLY CALCULATE IF DATA CHANGED**
    if (currentDataHash !== prevData.lastDataHash && prevData.lastDataHash !== null) {
      const timeDiff = (currentTimestamp - prevData.prevTimestamp) / 1000; // Convert to seconds

      if (timeDiff > 0) {
        // **CALCULATE RATES - BYTES**
        const bytesReceivedPerSec = Math.max(0, (currentBytesReceived - prevData.prevBytesReceived) / timeDiff);
        const bytesSentPerSec = Math.max(0, (currentBytesSent - prevData.prevBytesSent) / timeDiff);
        
        // Convert bytes/sec to Kbps (multiply by 8 to get bits, divide by 1000 to get Kbps)
        const bitsInKbps = (bytesReceivedPerSec * 8) / 1000;
        const bitsOutKbps = (bytesSentPerSec * 8) / 1000;

        // **CALCULATE RATES - PACKETS**
        const packetsReceivedPerSec = Math.max(0, (currentPacketsReceived - prevData.prevPacketsReceived) / timeDiff);
        const packetsSentPerSec = Math.max(0, (currentPacketsSent - prevData.prevPacketsSent) / timeDiff);

        const packetsSentPPS = Math.round(packetsSentPerSec);
        const packetsReceivedPPS = Math.round(packetsReceivedPerSec);
        // **UPDATE WITH NEW CALCULATED RATES**
        networkRatesRef.current[key] = {
          prevBytesReceived: currentBytesReceived,
          prevBytesSent: currentBytesSent,
          prevPacketsReceived: currentPacketsReceived,
          prevPacketsSent: currentPacketsSent,
          prevTimestamp: currentTimestamp,
          lastDataHash: currentDataHash,
          bitsInRate: bitsInKbps,
          bitsOutRate: bitsOutKbps,
          pktsInRate: packetsReceivedPPS,
          pktsOutRate: packetsSentPPS
        };
      }
    }

    // Always update ref for next calculation
    if (currentDataHash !== prevData.lastDataHash) {
      networkRatesRef.current[key] = {
        ...networkRatesRef.current[key],
        prevBytesReceived: currentBytesReceived,
        prevBytesSent: currentBytesSent,
        prevPacketsReceived: currentPacketsReceived,
        prevPacketsSent: currentPacketsSent,
        prevTimestamp: currentTimestamp,
        lastDataHash: currentDataHash
      };
    }

    return networkRatesRef.current[key];
  };

  // ADD useEffect TO HANDLE RATE CALCULATIONS
  useEffect(() => {
    if (isLoading || !Array.isArray(data?.device) || !networkMap) {
      return;
    }

    const calculatedData = data.device.flatMap((device, deviceIndex) => {
      const agentId = device?.uuid;
      const staticNics = device?.device?.nic || [];
      const liveNics = networkMap?.[agentId] || [];

      return staticNics.map((nic, nicIndex) => {
        const portId = nic?.port?.[0]?.uuid;
        const live = liveNics.find((l) => l.port_id === portId) || {};

        // CALCULATE RATES ON EACH DATA UPDATE
        const rates = calculateNetworkRates(agentId, portId, live);

        return {
          device: device?.hostname || `Device-${deviceIndex}`,
          port: nic?.port?.[0]?.interface_name || `Port-${nicIndex}`,
          mac: nic?.mac_address || "Unknown",
          ipVersion: "IPv4",
          // USE CALCULATED RATES WITH PROPER FORMATTING
          bitsIn: formatBitsRate(rates.bitsInRate),
          bitsOut: formatBitsRate(rates.bitsOutRate),
          pktsIn: rates.pktsInRate > 0 
            ? `${Math.round(rates.pktsInRate)} pps` 
            : "0 pps",
          pktsOut: rates.pktsOutRate > 0 
            ? `${Math.round(rates.pktsOutRate)} pps` 
            : "0 pps",
          media: nic?.media_type || "Ethernet",
        };
      });
    });

    setNetworkData(calculatedData);
  }, [data, isLoading, networkMap]);

  const toggleSort = (field) => {
    setSortStack((prev) => {
      const foundIndex = prev.findIndex((s) => s.field === field);
      if (foundIndex !== -1) {
        const currentDirection = prev[foundIndex].direction;
        if (currentDirection === "asc") {
          const updated = [...prev];
          updated[foundIndex] = { field, direction: "desc" };
          return updated;
        } else if (currentDirection === "desc") {
          return prev.filter((_, index) => index !== foundIndex);
        }
      }
      return [...prev, { field, direction: "asc" }];
    });
  };

  const getSortArrow = (field) => {
    const found = sortStack.find((s) => s.field === field);
    if (!found) return null;
    return found.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline" />
    );
  };

  // USE networkData STATE INSTEAD OF CALCULATED DATA
  const filteredRows = useMemo(() => {
    let rows = [...networkData];
    if (searchTerm.trim()) {
      rows = rows.filter(
        (row) =>
          row.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.port.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.media.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    for (const { field, direction } of sortStack) {
      rows.sort((a, b) => compareNetworkValues(a, b, field, direction));
    }
    return rows;
  }, [searchTerm, sortStack, networkData]);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div
        className="rounded-lg shadow-md overflow-visible relative"
        style={{
          backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
          border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
        }}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 flex justify-between items-center flex-wrap gap-2 font-medium tracking-wider text-sm text-gray-600">
          <span
            className="text-base sm:text-lg font-semibold"
            style={{ color: isDarkMode ? "#FFF" : "#525759" }}
          >
            Network Interfaces ({filteredRows.length})
          </span>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search devices or types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-1.5 rounded-md border text-sm shadow-sm w-full focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? "bg-[#1F2937] text-white border-[#374151] placeholder-gray-400 focus:ring-blue-500"
                  : "bg-gray-100 text-gray-800 border-gray-300 placeholder-gray-400 focus:ring-blue-300"
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.82 4.82a1 1 0 01-1.42 1.42l-4.82-4.82A6 6 0 012 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[25rem] overflow-y-auto px-2 sm:px-4 py-4">
          <div className="w-full">
            {isLoading ? (
              <div
                className="text-center py-8"
                style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
              >
                Loading Network data...
              </div>
            ) : filteredRows.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
              >
                No Network health data available.
              </div>
            ) : (
              <table
                className={`w-full table-fixed text-sm text-left border-collapse font-medium tracking-wider ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <thead>
                  <tr
                    className="sticky top-[-17px] z-10 font-normal"
                    style={{
                      backgroundColor: isDarkMode ? "#111827" : "#f2f5f7",
                    }}
                  >
                    <th className="w-32 px-4 py-2">Device</th>
                    <th className="w-24 px-4 py-2">Port</th>
                    <th
                      onClick={() => toggleSort("bitsIn")}
                      className="w-28 px-4 py-2 cursor-pointer"
                    >
                      <div className="flex items-center">
                        Bits In {getSortArrow("bitsIn")}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("bitsOut")}
                      className="w-28 px-4 py-2 cursor-pointer"
                    >
                      <div className="flex items-center">
                        Bits Out {getSortArrow("bitsOut")}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("pktsIn")}
                      className="w-28 px-4 py-2 cursor-pointer"
                    >
                      <div className="flex items-center">
                        Packets In {getSortArrow("pktsIn")}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("pktsOut")}
                      className="w-28 px-4 py-2 cursor-pointer"
                    >
                      <div className="flex items-center">
                        Packets Out {getSortArrow("pktsOut")}
                      </div>
                    </th>
                    <th className="w-40 px-4 py-2">MAC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? idx % 2 === 0
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-900 hover:bg-gray-800"
                          : idx % 2 === 0
                          ? "bg-gray-50 hover:bg-blue-50"
                          : "bg-white hover:bg-blue-50"
                      }`}
                    >
                      <td className="px-4 py-2 truncate">
                        <div
                          className={`w-1 h-6 ${getPortTypeColor(
                            row.media
                          )} rounded-full mr-2 inline-block`}
                        ></div>
                        {row.device}
                      </td>
                      <td className="px-4 py-2">{row.port}</td>
                      <td className="px-4 py-2 text-blue-500">{row.bitsIn}</td>
                      <td className="px-4 py-2 text-green-500">{row.bitsOut}</td>
                      <td className="px-4 py-2 text-purple-500">
                        {row.pktsIn}
                      </td>
                      <td className="px-4 py-2 text-orange-500">
                        {row.pktsOut}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs truncate">
                        {row.mac || <span className="text-gray-400">N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkInterfaces;