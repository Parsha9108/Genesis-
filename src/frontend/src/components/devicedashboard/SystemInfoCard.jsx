import Windows from "../../assets/Windows_logo.svg";
import Ubuntu from "../../assets/Ubuntu_logo.svg";
import { getUptimeDuration } from "../Utilities/getUptimeDuration";
import { formatDateTime } from "../Utilities/formatDateTime";
import { formatDurationString } from "../Utilities/formatDurationString";

const osLogos = { Windows, Ubuntu };

export const SystemInfoCard = ({ isDarkMode, data }) => {
  // ====== Handle uptime display ======
  const getUptimeDisplay = () => {
    const isActive = data?.status === "Active";
    let uptimeText = "N/A";

    if (isActive && data?.uptime_started_at) {
      uptimeText = getUptimeDuration(data?.uptime_started_at);
    } else if (!isActive && data?.last_uptime_duration) {
      uptimeText = formatDurationString(data?.last_uptime_duration);
    }

    return (
      <div className="flex items-center space-x-2">
        {isActive ? (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5M7 7l5-5 5 5" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-5 5-5-5M17 17l-5 5-5-5" />
          </svg>
        )}
        <span className={`text-xs sm:text-sm ${isActive ? "text-green-600" : "text-red-600"}`}>
          {uptimeText}
        </span>
      </div>
    );
  };

  // ====== Get first valid IPv4 from NIC ports ======
  const getCachedIP = () =>
    data?.device?.nic
      ?.flatMap((nic) =>
        nic.port?.flatMap((port) =>
          port.ip?.filter(
            (ip) => typeof ip.gateway === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.gateway)
          )
        )
      )
      ?.[0]?.address || "N/A";

  // ====== Determine correct OS logo ======
  const getOSLogo = () => {
    if (!data?.os) return null;
    const osName = data.os.toLowerCase();

    if (osName.includes("windows")) return osLogos.Windows;
    if (osName.includes("linux") || osName.includes("ubuntu")) return osLogos.Ubuntu;
    return null;
  };

  const logo = getOSLogo();

  // ====== Render Card ======
  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } rounded-xl shadow p-4 sm:p-6 w-full xl:w-80 h-auto xl:h-[500px] flex flex-col justify-between`}
    >
      {/* ===== RESPONSIVE Header ===== */}
      <div className="flex items-center mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0">
          {logo && (
            <img
              src={logo}
              alt={`${data?.os} Logo`}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h3
            className={`text-base sm:text-lg font-semibold truncate ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
            title={getCachedIP()}
          >
            {getCachedIP()}
          </h3>
          <p
            className={`text-xs sm:text-sm truncate ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
            title={`${data?.os} ${data?.os_version}`}
          >
            {`${data?.os} ${data?.os_version}`}
          </p>
        </div>
      </div>

      {/* ===== RESPONSIVE System Info Table ===== */}
      <div className="flex flex-col space-y-2 sm:space-y-3 mt-2 sm:mt-4">
        {[
          { label: "Description", value: data?.device?.model },
          { label: "Hardware", value: data?.device?.cpu?.[0]?.model },
          { label: "Operating System", value: `${data?.os} ${data?.os_version}` },
          { label: "Cached IP", value: getCachedIP() },
          { label: "Location", value: "Unknown" },
          { label: "Agent Started", value: formatDateTime(data?.last_activated_at)},
          { label: "Agent Uptime", value: getUptimeDisplay() },
          ...(data?.status?.toLowerCase() === "inactive"
            ? [{ label: "Agent Last Seen", value: formatDateTime(data?.last_seen) }]
            : []),
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-start border-b border-gray-700/20 pb-2 last:border-none gap-2"
          >
            <span
              className={`text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {item.label}
            </span>
            <div
              className={`text-xs sm:text-sm text-right break-words max-w-[60%] sm:max-w-[160px] ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
              title={typeof item.value === 'string' ? item.value : ''}
            >
              {item.value || "N/A"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
