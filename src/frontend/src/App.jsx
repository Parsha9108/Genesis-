import { useState, Suspense, lazy, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { WebSocketContext } from './Contexts/WebSocketContext';
import usePersistedTheme from './Hooks/usePersistedTheme';
import { Settings } from 'lucide-react';



// Lazy imports
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const DevicesPage = lazy(() => import('./components/pages/DevicesPage'));
const DashBoard = lazy(() => import('./components/devicedashboard/DashBoard'));
const DiskDetails = lazy(() => import('./components/devicemoredetails/DiskDetails'));
const DiskIo = lazy(() => import('./components/devicemoredetails/DiskIO'));
const CPUDetails = lazy(() => import('./components/devicemoredetails/CPUDetails'));
const CPUUsage = lazy(() => import('./components/usageoverview/CPUUsage'));
const MemoryUsage = lazy(() => import('./components/usageoverview/MemoryUsage'));
const DiskUsage = lazy(() => import('./components/usageoverview/StorageUsage'));
const MemoryDetails = lazy(() => import('./components/devicemoredetails/MemoryDetails'));
const NetworkDetails = lazy(() => import('./components/devicemoredetails/NetworkDetails'));
const AlertPage = lazy(() => import('./components/pages/AlertPage'));
const EventLogsPage = lazy(() => import('./components/pages/EventLogsPage'));
const Storage = lazy(() => import('./components/pages/Storage'));
const CPUHealth = lazy(() => import('./components/pages/Cpu'));
const MemoryHealth = lazy(() => import('./components/pages/Memory'));
const NetworkInterfaces = lazy(() => import('./components/pages/Network'));

// Updated imports - Now using GroupManagement parent component
const GroupManagement = lazy(() => import('./components/pages/GroupManagement'));

// DeviceInventory import
const DeviceInventory = lazy(() => import('./components/devicedashboard/DeviceInventory'));
const ApplicationResource = lazy(() => import('./components/applicationResourcemonitoring/ApplicationResourceWrapper'));

// Application Disk I/O import
const DiskIO = lazy(() => import('./components/applicationResourcemonitoring/DiskIO'));
const MemoryIO =lazy(()=> import('./components/applicationResourcemonitoring/MemoryIO'));
const CpuIO = lazy(() => import('./components/applicationResourcemonitoring/CpuIO'));

//settings page
const SettingsPage = lazy(() => import('./components/layout/Settings'));

const SignIn = lazy(() => import('./components/User/SignIn/SignIn'));
const SignUp = lazy(() => import('./components/User/SignUp/SignUp'));
const EmailVerification = lazy(() => import('./components/User/EmailVerification/EmailVerification'));
const ForgotPassword = lazy(() => import('./components/User/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/User/ResetPassword/ResetPassword'));
const PasswordResetInfo = lazy(() => import('./components/User/ForgotPassword/PasswordResetInfo'));
const PasswordReset = lazy(() => import('./components/User/ResetPassword/PasswordReset'))
const Layout = lazy(() => import('./components/layout/Layout'));
const AdminPanel = lazy(() => import('./components/administratorpanel/AdminPanel'));
const Userlist = lazy(() => import('./components/administratorpanel/UserListTab'));
const RoleManagement = lazy(() => import('./components/administratorpanel/RoleManagement'));

const PermissionManagement = lazy(() => import('./components/permissions/PermissionManagement'));
const UserPermissionsPage = lazy(() => import('./components/permissions/UserPermissionsPage'));

// Main app logic
const AppContent = () => {
  const { monitoringData } = useContext(WebSocketContext);
  const { isDarkMode, toggleTheme } = usePersistedTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [cpuMap, setCpuMap] = useState({});
  const [memoryMap, setMemoryMap] = useState({});
  const [diskMap, setDiskMap] = useState({});
  const [networkMap, setNetworkMap] = useState({});
  const [activeAgents, setActiveAgents] = useState({});
  const [applicationCpuIoMap, setApplicationCpuIoMap] = useState({});
  const [applicationDiskIoMap, setApplicationDiskIoMap] = useState({});
  const [applicationMemoryIoMap, setApplicationMemoryIoMap] = useState({});

  useEffect(() => {
    if (!monitoringData?.data) return;

    const newCpuMap = {};
    const newMemoryMap = {};
    const newDiskMap = {};
    const newNetworkMap = {};
    const newActiveAgents = {};

    const newApplicationCpuIoMap = {};
    const newApplicationDiskIoMap = {};
    const newApplicationMemoryIoMap = {};

    for (const agentId in monitoringData.data) {
      const data = monitoringData.data[agentId];
      console.log("Monitoring data",data);
      newActiveAgents[agentId] = Date.now();
      if (data.cpu) newCpuMap[agentId] = data.cpu;
      if (data.memory) newMemoryMap[agentId] = data.memory;
      if (data.disks) newDiskMap[agentId] = data.disks;
      if (data.network) newNetworkMap[agentId] = data.network;

      if (data.application_cpu_io) newApplicationCpuIoMap[agentId] = data.application_cpu_io;
      if (data.application_disk_io) newApplicationDiskIoMap[agentId] = data.application_disk_io;
      if (data.application_memory_io) newApplicationMemoryIoMap[agentId] = data.application_memory_io;
    }

    setCpuMap(prev => ({ ...prev, ...newCpuMap }));
    setMemoryMap(prev => ({ ...prev, ...newMemoryMap }));
    setDiskMap(prev => ({ ...prev, ...newDiskMap }));
    setNetworkMap(prev => ({ ...prev, ...newNetworkMap }));
    setActiveAgents(prev => ({ ...prev, ...newActiveAgents }));
    setApplicationCpuIoMap(prev => ({ ...prev, ...newApplicationCpuIoMap }));
    setApplicationDiskIoMap(prev => ({ ...prev, ...newApplicationDiskIoMap }));
    setApplicationMemoryIoMap(prev => ({ ...prev, ...newApplicationMemoryIoMap }));
  }, [monitoringData]);

  return (
    
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email/:token" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password-info" element={<PasswordResetInfo />} />
          <Route path="/reset-password/:uuid" element={<ResetPassword />} />
          <Route path="/reset-password/first-time" element={<PasswordReset/>} />
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  refreshInterval={refreshInterval}
                  setRefreshInterval={setRefreshInterval}
                />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path='dashboard' element={<Dashboard isDarkMode={isDarkMode} activeAgents={activeAgents} />} />
            <Route path="devices" element={<DevicesPage isDarkMode={isDarkMode} />} />
            <Route path="devices/:id" element={<DashBoard isDarkMode={isDarkMode} cpuMap={cpuMap} memoryMap={memoryMap} networkMap={networkMap} refreshInterval={refreshInterval} />} />
            <Route path="/profile" element={<AdminPanel isDarkMode={isDarkMode}/> } />
            <Route path="/profile/userlist" element={<Userlist isDarkMode={isDarkMode} />} />

            <Route path="/profile/permissions" element={<PermissionManagement isDarkMode={isDarkMode} />} />
            <Route path="/profile/permissions/setpermissions" element={<UserPermissionsPage isDarkMode={isDarkMode} />} />
            {/* Device-specific routes */}
            <Route path="devices/:id/inventory" element={<DeviceInventory isDarkMode={isDarkMode} />} />
            <Route path="devices/:id/application-resources" element={<ApplicationResource isDarkMode={isDarkMode} applicationDiskData={applicationDiskIoMap} applicationCpuData={applicationCpuIoMap} applicationMemoryData={applicationMemoryIoMap}/>} />
            
            {/* Application Resource I/O routes*/}
            <Route path="devices/:id/application-disk-io/:appId" element={<DiskIO isDarkMode={isDarkMode} applicationData={applicationDiskIoMap}/>} />
            <Route path="devices/:id/application-memory-io/:appId" element={<MemoryIO isDarkMode={isDarkMode}  applicationData={applicationMemoryIoMap}/>} />
            <Route path="devices/:id/application-cpu-io/:appId" element={<CpuIO isDarkMode={isDarkMode} applicationData={applicationCpuIoMap} />} />
            {/*Settings url*/}
            <Route path="/settings" element={<SettingsPage isDarkMode={isDarkMode} />} />
            <Route path="/role-management" element={<RoleManagement isDarkMode={isDarkMode} />} />

            <Route path="devices/:id/disk_details" element={<DiskDetails isDarkMode={isDarkMode} />} />
            <Route path="devices/:id/disk_io" element={<DiskIo isDarkMode={isDarkMode} diskMap={diskMap} />} />
            <Route path="devices/:id/memory_details" element={<MemoryDetails isDarkMode={isDarkMode} />} />
            <Route path="devices/:id/cpu_details" element={<CPUDetails isDarkMode={isDarkMode} />} />
            <Route path="devices/:id/network_details" element={<NetworkDetails isDarkMode={isDarkMode} networkMap={networkMap} />} />
            
            <Route path="alerts" element={<AlertPage isDarkMode={isDarkMode} />} />
            <Route path="event-logs" element={<EventLogsPage isDarkMode={isDarkMode} />} />
            <Route path="/storage" element={<Storage isDarkMode={isDarkMode} />} />
            <Route path="/storage/:id" element={<DiskUsage isDarkMode={isDarkMode} diskMap={diskMap} />} />
            <Route path="/cpu" element={<CPUHealth isDarkMode={isDarkMode} cpuMap={cpuMap} />} />
            <Route path="/cpu/:id" element={<CPUUsage isDarkMode={isDarkMode} cpuMap={cpuMap} />} />
            <Route path="/memory" element={<MemoryHealth isDarkMode={isDarkMode} memoryMap={memoryMap} />} />
            <Route path="/memory/:id" element={<MemoryUsage isDarkMode={isDarkMode} memoryMap={memoryMap} />} />
            <Route path="/network" element={<NetworkInterfaces isDarkMode={isDarkMode} networkMap={networkMap} />} />

            <Route path="/custom-groups" element={<GroupManagement isDarkMode={isDarkMode} />} />
          </Route>
        </Routes>
      </Suspense>
   
  );
};

const App = () => (
  <>
    <AppContent />
    <ToastContainer
      position="top-right"
      autoClose={1000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </>
);

export default App;
