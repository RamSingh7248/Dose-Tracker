import { useEffect, useState, useCallback } from 'react';
import { connectSocket, getSocket } from '../services/socket';
import { queryClient } from '../main';

export const DASHBOARD_QUERY_KEY = ['admin-dashboard-stats'];

/**
 * useDashboardSocket
 * Hook to handle real-time socket connections & event subscriptions for the Admin Dashboard.
 * Automatically invalidates React Query cache on live backend CRUD events.
 */
export function useDashboardSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);

  const handleDashboardUpdate = useCallback((data) => {
    console.log('⚡ Live Real-Time Dashboard Event:', data);
    setLastEvent(data);
    
    setEventHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        event: data.event,
        payload: data.payload,
        ts: data.ts || new Date().toISOString(),
      },
      ...prev.slice(0, 19), // Keep latest 20 real-time events
    ]);

    // Instantly invalidate TanStack Query cache to refetch live data
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('dashboard:update', handleDashboardUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('dashboard:update', handleDashboardUpdate);
    };
  }, [handleDashboardUpdate]);

  return {
    isConnected,
    lastEvent,
    eventHistory,
    socket: getSocket(),
  };
}
