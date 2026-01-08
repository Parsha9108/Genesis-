import {SystemInfoCard} from '../devicedashboard/SystemInfoCard';
import {CPUCard} from '../devicedashboard/CPUCard';
import {MemoryCard} from '../devicedashboard/MemoryCard';
import {NetworkCard} from '../devicedashboard/NetworkCard';
import {DiskUsageCard} from '../devicedashboard/DiskCard';
import {AlertsCard} from '../devicedashboard/AlertsCard';
import { EventLogsTable } from '../devicedashboard/EventsCard';
import { DeviceSummaryCard } from '../devicedashboard/DeviceSummaryCard';
import { useGetDeviceDetailsByIdQuery } from '../../redux/apiSlice';
import { useParams} from 'react-router-dom';
import Loading from '../../components/User/Loading';
import { AlertCircle, RefreshCw, Monitor } from 'lucide-react';
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const Dashboard = ({isDarkMode, cpuMap, networkMap, memoryMap}) => {
  useDocumentTitle('Device');
  const { id } = useParams();
  const { data, isLoading, error } = useGetDeviceDetailsByIdQuery(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="mb-4 sm:mb-6">
            <Loading />
          </div>
          <div className="space-y-2">
            <h3 
              className="text-base sm:text-lg font-semibold"
              style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
            >
              Loading Device Dashboard
            </h3>
            <p 
              className="text-xs sm:text-sm"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              Fetching device information and monitoring data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 sm:mb-6">
            <AlertCircle 
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" 
              style={{ color: '#EF4444' }}
            />
            <h3 
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
            >
              Failed to Load Device Data
            </h3>
            <p 
              className="text-xs sm:text-sm mb-4 sm:mb-6"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              {error?.data?.message || 'Unable to fetch device information. This might be due to a network issue or server error.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={() => window.history.back()}
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium border ${
                isDarkMode
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300 hover:border-gray-500'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-gray-400'
              }`}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.device) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 sm:mb-6">
            <Monitor 
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" 
              style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }}
            />
            <h3 
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ color: isDarkMode ? '#FFFFFF' : '#1F2937' }}
            >
              Device Not Found
            </h3>
            <p 
              className="text-xs sm:text-sm mb-4 sm:mb-6"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              The requested device could not be found or you don't have permission to access it.
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go Back to Devices
            </button>
          </div>
        </div>
      </div>
    );
  }

  const device = data.device;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[85vh]">
      {/* Fixed DeviceSummaryCard - Responsive positioning */}
      <div 
        className="fixed top-16 left-0 lg:left-64 right-0 z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 rounded-lg mt-1.8"
        style={{
          backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(240, 244, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto">
          <DeviceSummaryCard 
            isDarkMode={isDarkMode} 
            device={device} 
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* Content area with adjusted top margin - Responsive spacing */}
      <div className="pt-10 sm:pt-24 space-y-4 sm:space-y-5 px-3 sm:px-0">
        {/* Main Dashboard Grid - Responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-3 sm:gap-4 w-full">
          {/* System Info Card - Full width on mobile, sidebar on desktop */}
          <div className="w-full">
            <SystemInfoCard isDarkMode={isDarkMode} data={device}/>
          </div>
          
          {/* Stats Cards Grid - Responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <CPUCard isDarkMode={isDarkMode} cpuMap={cpuMap}/>
            <MemoryCard isDarkMode={isDarkMode} memoryMap={memoryMap} />
            <NetworkCard isDarkMode={isDarkMode} networkMap={networkMap}/>
            <DiskUsageCard isDarkMode={isDarkMode} data={device?.device?.storage} />
          </div>
        </div>

        {/* Alerts and Events Section - Responsive spacing */}
        <div className="space-y-4 sm:space-y-6">
         <AlertsCard 
            isDarkMode={isDarkMode} 
            deviceId={device?.uuid}
            limit={100}
          />
          <EventLogsTable 
            isDarkMode={isDarkMode} 
            deviceId={device?.uuid}
            limit={100}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
