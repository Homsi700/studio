
'use client'; // Mark as client component for hooks and event handlers

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { AddUserDialog } from '@/components/dashboard/AddUserDialog';
import { AddServerDialog } from '@/components/dashboard/AddServerDialog';
import { AddTowerDialog } from '@/components/dashboard/AddTowerDialog';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import type { Mikrotik } from '@/services/mikrotik';
import type { Mimosa } from '@/services/mimosa';
import type { Ubnt } from '@/services/ubnt';
import type { NetworkDeviceStatus, AlertState, PppoeUserDetails } from '@/types';
import { checkMikrotikConnection, getMikrotikUsers, MOCK_USERS } from '@/services/mikrotik';
import { getMimosaSignalStrength, getMimosaTraffic } from '@/services/mimosa';
import { getUbntSignalStrength, getUbntTraffic } from '@/services/ubnt';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut } from 'lucide-react';
import { MOCK_MIKROTIK_SERVERS, MOCK_MIMOSA_TOWERS, MOCK_UBNT_TOWERS, TRAFFIC_THRESHOLD_WARN } from '@/lib/constants'; // Import mock data and constants
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { cn } from '@/lib/utils'; // Import the cn utility function
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import { UserListCard } from '@/components/dashboard/UserListCard'; // Import UserListCard

// Define the combined device type
export type NetworkDevice =
  | ({ type: 'mikrotik' } & Mikrotik)
  | ({ type: 'mimosa' } & Mimosa)
  | ({ type: 'ubnt' } & Ubnt);

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [deviceStatuses, setDeviceStatuses] = React.useState<Record<string, NetworkDeviceStatus>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [devices, setDevices] = React.useState<NetworkDevice[]>([]);
  const [pppoeUsers, setPppoeUsers] = React.useState<PppoeUserDetails[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (isAuthenticated === false) { // Check specifically for false after initial check
      router.push('/login');
    }
  }, [isAuthenticated, router]);


  // Initialize devices state with mock data
  React.useEffect(() => {
    setDevices([
        ...MOCK_MIKROTIK_SERVERS.map((d) => ({ ...d, type: 'mikrotik' as const })),
        ...MOCK_MIMOSA_TOWERS.map((d) => ({ ...d, type: 'mimosa' as const })),
        ...MOCK_UBNT_TOWERS.map((d) => ({ ...d, type: 'ubnt' as const })),
      ]
    );
  }, []);

  const fetchDeviceStatuses = React.useCallback(async () => {
    setLoading(true); // Set loading true at the start
    const newStatuses: Record<string, NetworkDeviceStatus> = {};

    await Promise.allSettled(
      devices.map(async (device) => {
        const key = `${device.type}-${device.ipAddress}`;
        try {
          let status: NetworkDeviceStatus = { connected: false, alertState: 'normal' };
          let traffic = 0; // Simulate traffic

          if (device.type === 'mikrotik') {
            const isConnected = await checkMikrotikConnection(device);
            const users = isConnected ? Math.floor(Math.random() * 50) + 5 : 0; // Simulate 5-55 users
            const downloadSpeed = isConnected ? `${(Math.random() * 100 + 10).toFixed(1)} Mbps` : '0 Mbps'; // 10-110 Mbps
            const uploadSpeed = isConnected ? `${(Math.random() * 50 + 5).toFixed(1)} Mbps` : '0 Mbps'; // 5-55 Mbps
            traffic = Math.random() * (TRAFFIC_THRESHOLD_WARN * 1.5); // Simulate traffic
            status = { connected: isConnected, users, downloadSpeed, uploadSpeed, alertState: traffic > TRAFFIC_THRESHOLD_WARN ? 'warning' : 'normal' };

             // Fetch users only for connected Mikrotik devices (can be optimized)
             if (isConnected) {
                setLoadingUsers(true);
                try {
                  // const usersData = await getMikrotikUsers(device); // Use actual API call later
                  const usersData = MOCK_USERS; // Using mock data for now
                  setPppoeUsers(prev => [...new Map([...prev, ...usersData].map(item => [item.username, item])).values()]); // Merge and deduplicate users
                } catch (userError) {
                  console.error(`Failed to fetch users for ${device.name}:`, userError);
                   // Handle user fetch error if needed, maybe show a toast
                } finally {
                    setLoadingUsers(false);
                }
             }


          } else if (device.type === 'mimosa') {
             const signalStrength = await getMimosaSignalStrength(device); // Simulate signal
             const isConnected = signalStrength > -90; // Example threshold
             traffic = await getMimosaTraffic(device); // Simulate traffic
             // Simulate noise affecting signal
             const noiseFactor = Math.random() > 0.9 ? -10 : 0; // 10% chance of extra noise
             const currentSignal = signalStrength + noiseFactor;

             let alertState: AlertState = 'normal';
             if (traffic > TRAFFIC_THRESHOLD_WARN) alertState = 'warning';
             if (!isConnected || currentSignal < -80) alertState = 'error'; // Prioritize connection/critical signal over traffic warning

             status = { connected: isConnected, signalStrength: currentSignal, alertState };
             // TODO: Implement frequency switching logic based on noise/signal if needed

          } else if (device.type === 'ubnt') {
             const signalStrength = await getUbntSignalStrength(device); // Simulate signal
             const isConnected = signalStrength > -90; // Example threshold
             traffic = await getUbntTraffic(device); // Simulate traffic
             // Simulate noise affecting signal
             const noiseFactor = Math.random() > 0.9 ? -10 : 0; // 10% chance of extra noise
             const currentSignal = signalStrength + noiseFactor;

             let alertState: AlertState = 'normal';
             if (traffic > TRAFFIC_THRESHOLD_WARN) alertState = 'warning';
              if (!isConnected || currentSignal < -80) alertState = 'error'; // Prioritize connection/critical signal

             status = { connected: isConnected, signalStrength: currentSignal, alertState };
             // TODO: Implement frequency switching logic
          }
           newStatuses[key] = status;
        } catch (error) {
          console.error(`Failed to fetch status for ${device.name} (${device.ipAddress}):`, error);
          newStatuses[key] = { connected: false, alertState: 'error' }; // Set status to disconnected on error
        }
      })
    );

    setDeviceStatuses(newStatuses);
    setLoading(false); // Set loading false after all fetches complete
  }, [devices]); // Add devices as dependency

  // Fetch statuses on initial render and when devices change
  React.useEffect(() => {
    if (isAuthenticated) { // Only fetch if authenticated
        fetchDeviceStatuses();
        // Fetch initial user list from all servers? Or just first? Decide strategy.
        // Example: fetch from the first Mikrotik server
        const firstMikrotik = devices.find(d => d.type === 'mikrotik');
        // if (firstMikrotik) {
        //     // fetchInitialUsers(firstMikrotik); // Call a function to fetch initial users
        //      setPppoeUsers(MOCK_USERS); // Using mock data for now
        // }

        // Set up interval for periodic refresh (e.g., every 30 seconds)
        const intervalId = setInterval(fetchDeviceStatuses, 30000);
        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [fetchDeviceStatuses, isAuthenticated, devices]); // Include devices in dependencies


  // --- WebSocket Simulation (Placeholder) ---
  React.useEffect(() => {
    if (!isAuthenticated) return; // Don't connect if not authenticated
    // Placeholder for WebSocket connection setup
    // const ws = new WebSocket('ws://your-backend-websocket-url');

    // ws.onopen = () => { console.log('WebSocket connected'); };
    // ws.onmessage = (event) => {
        // const updatedData = JSON.parse(event.data);
        // Handle updates: update deviceStatuses, pppoeUsers etc.
        // Example: setDeviceStatuses(prev => ({ ...prev, [updatedData.key]: updatedData.status }));
    // };
    // ws.onerror = (error) => { console.error('WebSocket error:', error); };
    // ws.onclose = () => { console.log('WebSocket disconnected'); };
    // return () => { ws.close(); }; // Cleanup

     return () => {}; // Return empty cleanup if WebSocket is not used
  }, [isAuthenticated, devices]); // Reconnect if auth status or devices change

  // Handlers to add new devices (will update state and trigger refetch)
  const handleAddServer = (newServer: Mikrotik) => {
    setDevices(prevDevices => [...prevDevices, { ...newServer, type: 'mikrotik' }]);
     // Optionally trigger an immediate status fetch for the new device
     // fetchSingleDeviceStatus({ ...newServer, type: 'mikrotik' });
  };

  const handleAddTower = (newTower: Mimosa | Ubnt, type: 'mimosa' | 'ubnt') => {
    setDevices(prevDevices => [...prevDevices, { ...newTower, type }]);
    // Optionally trigger an immediate status fetch for the new device
    // fetchSingleDeviceStatus({ ...newTower, type });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading indicator until authentication status is confirmed
  if (isAuthenticated === undefined) {
    return (
        <div className="flex h-screen items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Network Pilot</h1>
          <p className="text-muted-foreground">Unified Network Management Dashboard</p>
        </div>
        <div className="flex flex-wrap items-center space-x-2">
           <Button variant="outline" size="icon" onClick={fetchDeviceStatuses} disabled={loading} aria-label="Refresh statuses">
             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
           </Button>
          <AddUserDialog mikrotikServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]} />
          <AddServerDialog onAddServer={handleAddServer} /> {/* Add Server Button */}
          <AddTowerDialog
             onAddTower={handleAddTower}
             linkedServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]}
          /> {/* Add Tower Button */}
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Device Grid (takes 2/3 width on large screens) */}
          <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? // Display skeletons while loading
                    Array.from({ length: devices.length || 6 }).map((_, index) => ( // Use devices.length or fallback
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
                         {/* Skeleton for footer actions */}
                         <div className="flex items-center p-6 pt-0">
                            <Skeleton className="h-8 w-20"/>
                         </div>
                      </Card>
                    ))
                  : // Display actual device cards when loaded
                    devices.map((device) => {
                      const key = `${device.type}-${device.ipAddress}`;
                      const status = deviceStatuses[key] || { connected: false, alertState: 'normal' }; // Default status
                      return (
                        <DeviceCard
                          key={key}
                          device={device}
                          type={device.type}
                          status={status}
                          // Add handlers for settings actions
                          onRestart={() => console.log(`Restart requested for ${device.name}`)}
                          onViewDetails={() => console.log(`View details for ${device.name}`)}
                          onOpenWebInterface={() => {
                             // In a real app, might need http/https prefix
                             const url = `http://${device.ipAddress}`; // Basic assumption
                             window.open(url, '_blank');
                          }}
                        />
                      );
                    })}
              </div>
          </div>

           {/* User List Card (takes 1/3 width on large screens) */}
           <div className="lg:col-span-1">
              <UserListCard users={pppoeUsers} isLoading={loadingUsers} />
           </div>
      </div>
    </div>
  );
}

