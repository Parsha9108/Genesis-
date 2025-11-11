import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../redux/apiSlice';
import { userApiSlice } from '../redux/userApiSlice';
import { portFlagApi } from '../redux/networkFlagApi';
import { storageFlagApi } from '../redux/storageFlagApi';
import { alertFilterApi } from '../redux/alertFilterApi';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Configuration
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;
  const PING_INTERVAL = 30000;
  const HOST = window.location.host;
  const WEBSOCKET_URL = `wss://${HOST}/webapp/api/agent/`;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Setup ping interval
  const setupPing = useCallback((ws) => {
    clearInterval(pingIntervalRef.current);
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, PING_INTERVAL);
  }, []);

  // Connect function
  const connect = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('CONNECTING');
      const ws = new WebSocket(WEBSOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Global WebSocket connected");
        setSocket(ws);
        setConnectionStatus('OPEN');
        setReconnectAttempts(0);
        setupPing(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pong') {
            return;
          }

          if (data.type === 'agent_update' && data.agent?.device?.uuid) {
            dispatch(
              apiSlice.util.invalidateTags([
                'Devices',
                { type: 'Devices', id: data.agent.device.uuid },
              ])
            );
          }
          else if (data.type === 'data_deleted') {
            if (data.agent_uuid) {
              dispatch(
                apiSlice.util.invalidateTags([
                  'Devices',
                  { type: 'Devices', id: data.agent_uuid },
                ])
              );
            }
          }
          else if (data.type === 'monitoring_realtime_update') {
            setMonitoringData(data);
          }
          // 🆕 Handle port flag updates
          else if (data.type === 'port_flag_update') {
            console.log("Port flagged data ", data);
            const entity = data.data.entity_type;
            if (entity === 'port') {
              dispatch(portFlagApi.util.invalidateTags(['FlaggedPort']));
            } else if (entity === 'storage') {
              dispatch(storageFlagApi.util.invalidateTags(['FlaggedStorage']));
            }
          }
        } catch (err) {
          console.error("WebSocket parse error", err);
        }
      };


      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        setConnectionStatus('ERROR');
      };

      ws.onclose = (event) => {
        console.warn("WebSocket closed", event.code, event.reason);
        setConnectionStatus('CLOSED');
        setSocket(null);
        clearTimers();

        // Only attempt reconnect if it wasn't a manual close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error(" Max reconnection attempts reached");
          setConnectionStatus('ERROR');
        }
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus('ERROR');
    }
  }, [dispatch, reconnectAttempts, setupPing]);

  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    if (socketRef.current) {
      socketRef.current.close();
    }
    connect();
  }, [connect]);

  // Send message function
  const sendMessage = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket not connected, message not sent:", message);
    return false;
  }, []);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      clearTimers();
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect, clearTimers]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus === 'CLOSED') {
        console.log("Tab became visible, attempting to reconnect...");
        reconnect();
      }
    };

    const handleOnline = () => {
      if (connectionStatus === 'CLOSED' || connectionStatus === 'ERROR') {
        console.log("Network back online, attempting to reconnect...");
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log("📡 Network offline detected");
      setConnectionStatus('ERROR');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus, reconnect]);

  const contextValue = {
    socket,
    monitoringData,
    connectionStatus,
    reconnectAttempts,
    reconnect,
    sendMessage,
    isConnected: connectionStatus === 'OPEN',
    isConnecting: connectionStatus === 'CONNECTING',
    hasError: connectionStatus === 'ERROR'
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};