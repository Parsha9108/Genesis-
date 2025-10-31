import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import '../index.css';
import {
  Server,
  TriangleAlert,
  FileText,
  Sun,
  Moon,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Package,
  Settings,
  Activity,
  X
} from 'lucide-react';

const Sidebar = ({ isDarkMode, toggleTheme, isSidebarOpen, closeSidebar }) => {
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showDevicesDropdown, setShowDevicesDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Debug log to see state changes
  useEffect(() => {
    console.log('📱 Sidebar isSidebarOpen changed to:', isSidebarOpen);
  }, [isSidebarOpen]);

  const handleDashboardClick = useCallback(() => {
    setShowDashboardDropdown(prev => !prev);
    setOpenDropdown(null);
  }, []);

  const handleDevicesClick = useCallback(() => {
    if (location.pathname !== '/devices') {
      navigate('/devices');
    }
    setOpenDropdown(null);
    if (window.innerWidth < 1024) {
      closeSidebar?.();
    }
  }, [location.pathname, navigate, closeSidebar]);

  const toggleDropdown = useCallback((name) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  }, []);

  const isDashboardActive =
    /^(\/dashboard|\/cpu|\/memory|\/storage|\/network)(\/.*)?$/.test(location.pathname) ||
    location.pathname === '/';
  const isDevicesActive = location.pathname.startsWith('/devices');
  const shouldShowDevicesDropdown = /^\/devices\/[^/]+(\/.*)?$/.test(location.pathname);
  const isSettingsActive = location.pathname.startsWith('/settings') || 
                           location.pathname.startsWith('/custom-groups') || 
                           location.pathname.startsWith('/profile');

  useEffect(() => {
    setShowDashboardDropdown(isDashboardActive && !isSettingsActive);
    setShowDevicesDropdown(shouldShowDevicesDropdown && !isSettingsActive);
  }, [location.pathname, isSettingsActive, shouldShowDevicesDropdown, isDashboardActive]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      closeSidebar?.();
    }
  }, [location.pathname, closeSidebar]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscapeKey = event => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        if (window.innerWidth < 1024) {
          closeSidebar?.();
        }
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [closeSidebar]);

  const getNavLinkStyles = (isActive) => ({
    backgroundColor: isActive ? '#6366F1' : 'transparent',
    color: isActive ? '#FFFFFF' : isDarkMode ? '#D1D5DB' : '#374151'
  });

  const getDropdownItemStyles = (isActive) => ({
    backgroundColor: isActive ? '#E0E7FF' : 'transparent',
    color: isActive ? '#4338CA' : isDarkMode ? '#D1D5DB' : '#374151'
  });

  const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';

  return (
   <aside
  onClick={(e) => e.stopPropagation()} // ✅ Prevent clicks inside sidebar from closing it
  className={`
    fixed left-0 w-64 border-r flex flex-col
    transition-transform duration-300 ease-in-out
    top-0 h-screen
    ${isSidebarOpen ? 'translate-x-0 z-[150]' : '-translate-x-full z-[150]'}
    lg:top-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:rounded-tr-lg lg:rounded-br-lg lg:z-40
  `}
  style={{
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderColor: isDarkMode ? '#374151' : '#E5E7EB'
  }}
  role="navigation"
  aria-label="Main navigation"
>

      {/* Mobile Header - Only visible below lg */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
        <h2 className="text-lg font-bold" style={{ color: textColor }}>
          GENESIS
        </h2>
        <button
          onClick={() => {
            console.log('❌ X button clicked, closing sidebar');
            closeSidebar();
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" style={{ color: textColor }} />
        </button>
      </div>

      <nav className="p-3 sm:p-4 space-y-2 flex-1 overflow-y-auto custom-scroll">
        {/* Dashboard */}
        <div className="space-y-1">
          <NavLink
            to="/"
            onClick={handleDashboardClick}
            className={`cursor-pointer w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              isDashboardActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={getNavLinkStyles(isDashboardActive)}
            aria-label="Dashboard"
          >
            <DashboardIcon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate text-sm sm:text-base">Dashboard</span>
          </NavLink>

          <div
            className={`pl-6 overflow-hidden transition-all duration-300 ease-in-out transform ${
              showDashboardDropdown
                ? 'max-h-[500px] opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 -translate-y-2'
            }`}
            role="menu"
            aria-label="Dashboard submenu"
          >
            <div className="space-y-1 py-1">
              {[
                { to: '/cpu', label: 'CPU', icon: <Cpu /> },
                { to: '/memory', label: 'Memory', icon: <MemoryStick /> },
                { to: '/storage', label: 'Disk', icon: <HardDrive /> },
                { to: '/network', label: 'Network', icon: <Network /> }
              ].map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-200 active:scale-[0.98] ${
                      isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                  style={({ isActive }) => getDropdownItemStyles(isActive)}
                  role="menuitem"
                  aria-label={label}
                >
                  {React.cloneElement(icon, { className: 'w-4 h-4 flex-shrink-0' })}
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Devices */}
        <div className="space-y-1">
          <NavLink
            to="/devices"
            onClick={handleDevicesClick}
            className={`cursor-pointer w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              isDevicesActive && !isSettingsActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={getNavLinkStyles(isDevicesActive && !isSettingsActive)}
            aria-label="Devices"
          >
            <Server className="w-5 h-5 flex-shrink-0" />
            <span className="truncate text-sm sm:text-base">Devices</span>
          </NavLink>

          <div
            className={`pl-6 overflow-hidden transition-all duration-300 ease-in-out transform ${
              showDevicesDropdown
                ? 'max-h-[700px] opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 -translate-y-2'
            }`}
            role="menu"
            aria-label="Devices submenu"
          >
            <div className="space-y-1 py-1">
              <NavLink
                to={`/devices/${id}/inventory`}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-200 active:scale-[0.98] ${
                    isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                style={({ isActive }) => getDropdownItemStyles(isActive)}
                role="menuitem"
                aria-label="Hardware Inventory"
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Hardware Inventory</span>
              </NavLink>

              <NavLink
                to={`/devices/${id}/application-resources`}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-200 active:scale-[0.98] ${
                    isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                style={({ isActive }) => getDropdownItemStyles(isActive)}
                role="menuitem"
                aria-label="Application Resources"
              >
                <Activity className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Application Resources</span>
              </NavLink>

              <div className="my-2 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }} />

              {[
                { to: `/devices/${id}/cpu_details`, label: 'CPU', icon: <Cpu /> },
                { to: `/devices/${id}/memory_details`, label: 'Memory', icon: <MemoryStick /> },
                { to: `/devices/${id}/disk_details`, label: 'Disk', icon: <HardDrive /> },
                { to: `/devices/${id}/network_details`, label: 'Network I/O', icon: <Network /> },
                { to: `/devices/${id}/disk_io`, label: 'Disk I/O', icon: <HardDrive /> }
              ].map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-200 active:scale-[0.98] ${
                      isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                  style={({ isActive }) => getDropdownItemStyles(isActive)}
                  role="menuitem"
                  aria-label={label}
                >
                  {React.cloneElement(icon, { className: 'w-4 h-4 flex-shrink-0' })}
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
          style={({ isActive }) => getNavLinkStyles(isActive)}
          aria-label="Alerts"
        >
          <TriangleAlert className="w-5 h-5 flex-shrink-0" />
          <span className="truncate text-sm sm:text-base">Alerts</span>
        </NavLink>

        {/* Event Logs */}
        <NavLink
          to="/event-logs"
          className={({ isActive }) =>
            `w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
          style={({ isActive }) => getNavLinkStyles(isActive)}
          aria-label="Event Logs"
        >
          <FileText className="w-5 h-5 flex-shrink-0" />
          <span className="truncate text-sm sm:text-base">Event Logs</span>
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200 active:scale-[0.98] ${
              isActive ? 'shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
          style={({ isActive }) => getNavLinkStyles(isActive)}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="truncate text-sm sm:text-base">Settings</span>
        </NavLink>
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
        <button
          className="w-full flex justify-between items-center px-3 py-2 text-sm rounded-lg transition-all duration-200"
          style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontWeight: 500 }}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
        >
          <span>Theme</span>
          <div
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 active:scale-[0.98]"
          >
            {isDarkMode ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
