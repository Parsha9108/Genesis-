import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Notification from "../pages/Popup_notification";
import { useAuth } from "../../Contexts/AuthContext";
import { toast } from "react-toastify";
import { useNavigate, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useGetDevicesdataQuery, apiSlice } from "../../redux/apiSlice";
import { useRefreshSettings } from "../../Contexts/RefreshContext";
import { useAutoRefresh } from "../../Hooks/useAutoRefresh";
import { useSidebar } from "../../Contexts/SidebarContext";


const Layout = ({
  isDarkMode,
  toggleTheme,
  searchQuery,
  setSearchQuery,
  onRefresh,
}) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  const { user, setUser, setAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);
  const audioRef = useRef(null);
  const previousAlertCountRef = useRef(0);

  const { refreshInterval } = useRefreshSettings();
  const { data, isLoading, refetch } = useGetDevicesdataQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const allAlerts = useMemo(() => {
    if (!data?.device || !Array.isArray(data.device)) return [];
    return data.device.flatMap((device) => {
      const deviceAlerts = device?.monitoring_data?.alerts || [];
      return deviceAlerts.map((alert) => ({
        ...alert,
        device_name: device.device?.name || "Unknown Device",
        device_uuid: device.device?.uuid,
      }));
    });
  }, [data]);

  // ✅ Enable audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (audioRef.current && !audioEnabled) {
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioEnabled(true);
            console.log('🔊 Audio enabled');
          })
          .catch(() => console.log('🔊 Audio blocked by browser'));
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, enableAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, [audioEnabled]);

  // ✅ Play sound when alert count increases
  useEffect(() => {
    if (!allAlerts || allAlerts.length === 0) {
      previousAlertCountRef.current = 0;
      return;
    }

    const currentCount = allAlerts.length;
    
    // If alert count increased AND we have audio enabled
    if (currentCount > previousAlertCountRef.current && previousAlertCountRef.current > 0) {
      console.log(`🔔 New alert detected! Count: ${previousAlertCountRef.current} → ${currentCount}`);
      
      if (audioRef.current && audioEnabled) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => 
          console.warn('🔊 Sound playback failed:', err.message)
        );
      }
    }
    
    previousAlertCountRef.current = currentCount;
  }, [allAlerts, audioEnabled]);

  const handleDataRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      await refetch();
      if (onRefresh) await onRefresh();
      console.log("Data refreshed at:", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Data refresh failed:", error);
      toast.error("Failed to refresh data");
    }
  }, [refetch, onRefresh]);

  useAutoRefresh(refreshInterval, handleDataRefresh);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      try {
        const res = await axios.post(
          "/api/webuser/logout/",
          {},
          { withCredentials: true }
        );
        if (res.status === 200)
          toast.success(res.data.message || "Logout successful!");
      } catch {
        console.warn("Server logout failed, continuing cleanup");
      }

      dispatch(apiSlice.util.resetApiState());
      dispatch({ type: "auth/logout" });
      setUser(null);
      setAuthenticated(false);
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
      setTimeout(() => (window.location.href = "/signin"), 1000);
    }
  }, [dispatch, setUser, setAuthenticated, navigate]);

  return (
    <div
      className={
        isDarkMode ? "dark bg-gray-900 text-white" : "bg-[#F0F4FF] text-black"
      }
    >
      <div className="flex min-h-screen">
        <Sidebar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
          closeSidebar={closeSidebar}
        />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[90] lg:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeSidebar();
              }
            }}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowNotificationModal={setShowNotificationModal}
            alerts={allAlerts}
            userEmail={user?.email}
            userName={user?.username}
            onLogout={handleLogout}
            onRefresh={handleDataRefresh}
            toggleSidebar={() => toggleSidebar("header-button")}
          />

          <main className="mt-16 sm:mt-20 lg:ml-64 flex-1 min-h-0">
            <div className="h-full overflow-y-auto">
              <div className="p-2 sm:p-4 lg:p-6">
                <div className="w-full max-w-[1440px] mx-auto">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>

          {showNotificationModal && (
            <Notification
              isDarkMode={isDarkMode}
              alerts={allAlerts}
              onClose={() => setShowNotificationModal(false)}
            />
          )}
        </div>
      </div>

      {/* ✅ Audio element for notification sound */}
      <audio 
        ref={audioRef} 
        preload="auto"
      >
        <source src="./notification.mp3" type="audio/mpeg" />
        <source src="./notification.wav" type="audio/wav" />
      </audio>
    </div>
  );
};


export default Layout;
