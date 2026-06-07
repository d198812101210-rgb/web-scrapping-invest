import { useState, useEffect } from 'react';

export type ConnectionStatus = 'good' | 'slow' | 'offline';

interface ConnectivityState {
  status: ConnectionStatus;
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Custom hook to monitor internet connectivity and connection quality
 * Returns connection status: 'good', 'slow', or 'offline'
 */
export const useConnectivity = () => {
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    status: 'good',
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const updateConnectivity = () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        setConnectivity({
          status: 'offline',
          isOnline: false,
        });
        return;
      }

      // Check Network Information API if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink; // Mbps
        const rtt = connection.rtt; // Round-trip time in ms

        // Determine connection quality
        let status: ConnectionStatus = 'good';

        // Check for slow connection based on multiple factors
        if (
          effectiveType === 'slow-2g' || 
          effectiveType === '2g' ||
          (downlink && downlink < 1) || // Less than 1 Mbps
          (rtt && rtt > 500) // RTT greater than 500ms
        ) {
          status = 'slow';
        } else if (
          effectiveType === '3g' ||
          (downlink && downlink < 2) || // Less than 2 Mbps
          (rtt && rtt > 300) // RTT greater than 300ms
        ) {
          status = 'slow';
        }

        setConnectivity({
          status,
          isOnline: true,
          effectiveType,
          downlink,
          rtt,
        });
      } else {
        // Fallback: If Network Information API is not available
        // Perform a simple connectivity check
        setConnectivity({
          status: 'good',
          isOnline: true,
        });
      }
    };

    // Initial check
    updateConnectivity();

    // Listen for online/offline events
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);

    // Listen for connection changes if Network Information API is available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateConnectivity);
    }

    // Periodic check every 10 seconds
    const intervalId = setInterval(updateConnectivity, 10000);

    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
      
      if (connection) {
        connection.removeEventListener('change', updateConnectivity);
      }
      
      clearInterval(intervalId);
    };
  }, []);

  return connectivity;
};