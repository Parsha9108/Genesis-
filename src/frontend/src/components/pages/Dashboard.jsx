import { lazy, Suspense } from 'react';

// Lazy load heavy components
const MetricsOverview = lazy(() => import('../MetricsOverview'));
const MemoryChart = lazy(() => import('../charts/MemoryChart'));
const TopDevicesChart = lazy(() => import('../charts/TopDevicesChart'));
const AlertsTable = lazy(() => import('../tables/AlertsTable'));
const EventLogs = lazy(() => import('../tables/EventsTable'));
const DonutChart = lazy(() => import('../charts/DonutChart'));
import { useGetDevicesdataQuery } from "../../redux/apiSlice"
import { useDocumentTitle } from '../../Hooks/useDocumentTitle';

const Dashboard = ({ isDarkMode, activeAgents }) => {
  useDocumentTitle('Dashboard');
  const { data, isLoading, error } = useGetDevicesdataQuery();

// Access results array, not device
  const device = Array.isArray(data?.results) ? data.results : [];

  let vmCount = 0;
  let pmCount = 0;
  let activeCount = 0;
  let inactiveCount = 0;

  // Safely access nested device properties
  device.forEach((d) => {
    const type = d?.device?.dev_phy_vm;
    const status = d?.status;

    if (type === 'Virtual Machine') {
      vmCount++;
    } else if (type === 'Physical Machine') {
      pmCount++;
    }

    if (status === 'Active') {
      activeCount++;
    } else if (status === 'Inactive') {
      inactiveCount++;
    }
  });

  if (isLoading) return <div className="p-4 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading dashboard data</div>;

  const dashboardData = {
    memoryUsage: [
      { time: '00:00', usage: 45 },
      { time: '04:00', usage: 52 },
      { time: '08:00', usage: 58 },
      { time: '12:00', usage: 65 },
      { time: '16:00', usage: 72 },
      { time: '20:00', usage: 78 },
      { time: '24:00', usage: 85 }
    ],
    topDevices: [
      { id: 'S_P1', value: 45 },
      { id: 'S_P2', value: 75 },
      { id: 'S_P3', value: 85 },
      { id: 'S_P4', value: 25 }
    ]
  };

  const deviceTypes = {
    VMS: vmCount,
    Physicals: pmCount,
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="p-4 text-center">Loading dashboard overview...</div>}>
        <MetricsOverview 
          data={data?.results || []} 
          isDarkMode={isDarkMode} 
          activeDevicesCount={activeCount} 
          inactiveDevicesCount={inactiveCount}
        />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<div className="p-4 text-center">Loading memory chart...</div>}>
          <MemoryChart usageData={dashboardData.memoryUsage} isDarkMode={isDarkMode} />
        </Suspense>
        <Suspense fallback={<div className="p-4 text-center">Loading top devices chart...</div>}>
          <TopDevicesChart devices={dashboardData.topDevices} isDarkMode={isDarkMode} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<div className="p-4 text-center">Loading donut chart...</div>}>
          <DonutChart
            title="Device Status"
            activeCount={activeCount}
            inactiveCount={inactiveCount}
            isDarkMode={isDarkMode}
          />
        </Suspense>
        <Suspense fallback={<div className="p-4 text-center">Loading device type chart...</div>}>
          <DonutChart
            title="Device Types"
            deviceTypes={deviceTypes}
            isDarkMode={isDarkMode}
          />
        </Suspense>
        <Suspense fallback={<div className="p-4 text-center">Loading alerts...</div>}>
          <AlertsTable
            alerts={device.flatMap((dev) => dev.monitoring_data?.alerts || [])}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      </div>

      <Suspense fallback={<div className="p-4 text-center">Loading event logs...</div>}>
        <EventLogs 
          eventLogs={device.flatMap((dev) => dev.monitoring_data?.events || [])} 
          isDarkMode={isDarkMode} 
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
