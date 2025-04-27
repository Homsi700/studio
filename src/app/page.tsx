'use client'; // Mark as client component for hooks and event handlers

import * as React from 'react';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { AddUserDialog } from '@/components/dashboard/AddUserDialog';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import type { Mikrotik } from '@/services/mikrotik';
import type { Mimosa } from '@/services/mimosa';
import type { Ubnt } from '@/services/ubnt';
import type { NetworkDeviceStatus, DeviceType } from '@/types';
import { checkMikrotikConnection } from '@/services/mikrotik';
import { getMimosaSignalStrength } from '@/services/mimosa';
import { getUbntSignalStrength } from '@/services/ubnt';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { MOCK_MIKROTIK_SERVERS, MOCK_MIMOSA_TOWERS, MOCK_UBNT_TOWERS } from '@/lib/constants'; // Import mock data
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Import Card components
import { cn } from '@/lib/utils'; // Import the cn utility function

// Define the combined device type
type NetworkDevice =
  | ({ type: 'mikrotik' } & Mikrotik)
  | ({ type: 'mimosa' } & Mimosa)
  | ({ type: 'ubnt' } & Ubnt);

export default function Dashboard() {
  const [deviceStatuses, setDeviceStatuses] = React.useState<Record<string, NetworkDeviceStatus>>({});
  const [loading, setLoading] = React.useState<boolean>(true); // Add loading state

  // Combine all devices into a single array for easier mapping
  const allDevices: NetworkDevice[] = React.useMemo(() => [ // Use useMemo to prevent re-creation on every render
    ...MOCK_MIKROTIK_SERVERS.map((d) => ({ ...d, type: 'mikrotik' as const })),
    ...MOCK_MIMOSA_TOWERS.map((d) => ({ ...d, type: 'mimosa' as const })),
    ...MOCK_UBNT_TOWERS.map((d) => ({ ...d, type: 'ubnt' as const })),
  ], []); // Empty dependency array means this runs only once


  const fetchDeviceStatuses = React.useCallback(async () => {
    setLoading(true); // Set loading true at the start
    const newStatuses: Record<string, NetworkDeviceStatus> = {};

    // Use Promise.allSettled to fetch statuses concurrently
    await Promise.allSettled(
      allDevices.map(async (device) => {
        const key = `${device.type}-${device.ipAddress}`; // Unique key for each device
        try {
          let status: NetworkDeviceStatus = { connected: false };
          if (device.type === 'mikrotik') {
            // Simulate API calls (Replace with actual API calls later)
            const isConnected = await checkMikrotikConnection(device);
            const users = isConnected ? Math.floor(Math.random() * 50) : 0;
            const downloadSpeed = isConnected ? `${(Math.random() * 100).toFixed(1)} Mbps` : '0 Mbps';
            const uploadSpeed = isConnected ? `${(Math.random() * 50).toFixed(1)} Mbps` : '0 Mbps';
            status = { connected: isConnected, users, downloadSpeed, uploadSpeed };
          } else if (device.type === 'mimosa') {
             // Simulate API calls
             const signalStrength = await getMimosaSignalStrength(device);
             const isConnected = signalStrength > -90; // Example threshold
             status = { connected: isConnected, signalStrength };
          } else if (device.type === 'ubnt') {
             // Simulate API calls
             const signalStrength = await getUbntSignalStrength(device);
             const isConnected = signalStrength > -90; // Example threshold
             status = { connected: isConnected, signalStrength };
          }
           newStatuses[key] = status;
        } catch (error) {
          console.error(`Failed to fetch status for ${device.name} (${device.ipAddress}):`, error);
          newStatuses[key] = { connected: false }; // Set status to disconnected on error
        }
      })
    );

    setDeviceStatuses(newStatuses);
    setLoading(false); // Set loading false after all fetches complete
  }, [allDevices]); // Add allDevices as dependency

  // Fetch statuses on initial render
  React.useEffect(() => {
    fetchDeviceStatuses();
    // Optional: Set up interval for periodic refresh (e.g., every 30 seconds)
    // const intervalId = setInterval(fetchDeviceStatuses, 30000);
    // return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchDeviceStatuses]);


  // --- WebSocket Simulation (Placeholder) ---
  React.useEffect(() => {
    // Placeholder for WebSocket connection setup
    // const ws = new WebSocket('ws://your-backend-websocket-url');

    // ws.onopen = () => { console.log('WebSocket connected'); };
    // ws.onmessage = (event) => { /* Handle updates */ };
    // ws.onerror = (error) => { console.error('WebSocket error:', error); };
    // ws.onclose = () => { console.log('WebSocket disconnected'); };
    // return () => { ws.close(); }; // Cleanup

     return () => {}; // Return empty cleanup if WebSocket is not used
  }, [allDevices]); // Dependency needed if ws logic uses it


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Network Pilot</h1>
          <p className="text-muted-foreground">Unified Network Management Dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline" size="icon" onClick={fetchDeviceStatuses} disabled={loading} aria-label="Refresh statuses">
             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
           </Button>
          <AddUserDialog mikrotikServers={MOCK_MIKROTIK_SERVERS} />
          <ThemeToggle />
        </div>
      </header>

      {/* Device Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? // Display skeletons while loading
            Array.from({ length: allDevices.length }).map((_, index) => (
              <Card key={index} className="flex flex-col justify-between">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <Skeleton className="h-6 w-3/5" />
                   <Skeleton className="h-5 w-1/4" />
                 </CardHeader>
                 <CardContent>
                    <Skeleton className="h-4 w-2/5 mb-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-4 w-3/4" />
                    </div>
                 </CardContent>
              </Card>
            ))
          : // Display actual device cards when loaded
            allDevices.map((device) => {
              const key = `${device.type}-${device.ipAddress}`;
              const status = deviceStatuses[key] || { connected: false }; // Default to disconnected if status not found
              return (
                <DeviceCard
                  key={key}
                  device={device}
                  type={device.type}
                  status={status}
                />
              );
            })}
      </div>
    </div>
  );
}
