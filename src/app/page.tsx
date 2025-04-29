
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
import type { NetworkDeviceStatus, AlertState, PppoeUserDetails, NetworkDevice, UserActions, UserActionType } from '@/types'; // Import NetworkDevice, UserActions, UserActionType
import { checkMikrotikConnection, getMikrotikUsers, enablePppoeUser, disablePppoeUser, renewPppoeUser, addPppoeUser, deletePppoeUser } from '@/services/mikrotik'; // Import user actions including deletePppoeUser
import { getMimosaSignalStrength, getMimosaTraffic } from '@/services/mimosa';
import { getUbntSignalStrength, getUbntTraffic } from '@/services/ubnt';
import { addServer, restartMikrotikServer } from '@/services/servers'; // Import server actions
import { addTower, restartTowerDevice } from '@/services/towers'; // Import tower actions
import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut } from 'lucide-react';
import { MOCK_MIKROTIK_SERVERS, MOCK_MIMOSA_TOWERS, MOCK_UBNT_TOWERS, TRAFFIC_THRESHOLD_WARN } from '@/lib/constants'; // Import mock data and constants
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { cn } from '@/lib/utils'; // Import the cn utility function
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import { UserListCard } from '@/components/dashboard/UserListCard'; // Import UserListCard
import { useToast } from '@/hooks/use-toast'; // Import useToast for notifications

// Placeholder WebSocket URL - replace with your actual backend WebSocket endpoint
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws/network-status'; // Example default

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast hook
  const [deviceStatuses, setDeviceStatuses] = React.useState<Record<string, NetworkDeviceStatus>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [devices, setDevices] = React.useState<NetworkDevice[]>([]);
  const [pppoeUsers, setPppoeUsers] = React.useState<PppoeUserDetails[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false);
  const ws = React.useRef<WebSocket | null>(null);
  const reconnectInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    // Check specifically for false after initial check to avoid redirect during initial load
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);


  // Initialize devices state with mock data or from localStorage
  React.useEffect(() => {
    let initialDevices: NetworkDevice[] = [];
    if (typeof window !== 'undefined') {
        const storedDevices = localStorage.getItem('networkPilotDevices');
        if (storedDevices) {
            try {
                initialDevices = JSON.parse(storedDevices);
                if (!Array.isArray(initialDevices)) {
                     console.warn("Invalid device data in localStorage, falling back to mock data.");
                     initialDevices = [];
                }
            } catch (e) {
                console.error("Failed to parse devices from localStorage, falling back to mock data:", e);
                initialDevices = [];
            }
        }
    }
    // If no stored data or parsing failed, use mock data
    if (initialDevices.length === 0) {
        initialDevices = [
            ...MOCK_MIKROTIK_SERVERS.map((d) => ({ ...d, type: 'mikrotik' as const })),
            ...MOCK_MIMOSA_TOWERS.map((d) => ({ ...d, type: 'mimosa' as const })),
            ...MOCK_UBNT_TOWERS.map((d) => ({ ...d, type: 'ubnt' as const })),
        ];
         // Save mock data to localStorage initially if it wasn't there
         if (typeof window !== 'undefined') {
             localStorage.setItem('networkPilotDevices', JSON.stringify(initialDevices));
         }
    }
    setDevices(initialDevices);
    setLoading(false); // Initial device load is finished
  }, []);

    // --- Save devices to localStorage whenever they change ---
    React.useEffect(() => {
        if (typeof window !== 'undefined' && devices.length > 0) { // Don't save empty initial array
            try {
                localStorage.setItem('networkPilotDevices', JSON.stringify(devices));
            } catch (e) {
                console.error("Failed to save devices to localStorage:", e);
            }
        }
    }, [devices]);

   // Helper to find a server by name
   const findServerByName = (name: string): Mikrotik | undefined => {
       return devices.find(d => d.type === 'mikrotik' && d.name === name) as Mikrotik | undefined;
   };

    // Function to fetch users from all Mikrotik servers (can be triggered by polling or WS message)
    const fetchAllMikrotikUsers = React.useCallback(async (showLoading = true) => {
        if (!isAuthenticated) return;
        if (showLoading) setLoadingUsers(true);
        const mikrotikServers = devices.filter(d => d.type === 'mikrotik') as Mikrotik[];
        const allUsersPromises = mikrotikServers.map(server => getMikrotikUsers(server));

        try {
            const results = await Promise.allSettled(allUsersPromises);
            const combinedUsers: PppoeUserDetails[] = [];
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    combinedUsers.push(...result.value);
                } else {
                    console.error(`Failed to fetch users from ${mikrotikServers[index].name}:`, result.reason);
                    // Toast is optional here as it can be noisy during polling
                    // toast({
                    //     title: "User Fetch Error",
                    //     description: `Could not fetch users from ${mikrotikServers[index].name}.`,
                    //     variant: "destructive",
                    // });
                }
            });
            // Simple deduplication by username (assuming usernames are unique across servers for display, might need refinement)
             const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [`${user.username}-${user.serverName}`, user])).values());
             setPppoeUsers(uniqueUsers);

        } catch (error) {
             console.error("Error fetching all Mikrotik users:", error);
             toast({
                 title: "Error Fetching Users",
                 description: "Could not fetch user lists from servers.",
                 variant: "destructive",
             });
        } finally {
            if (showLoading) setLoadingUsers(false);
        }
    }, [devices, isAuthenticated, toast]); // Add toast

    // Function to fetch statuses (can be triggered by polling or WS request)
    const fetchDeviceStatuses = React.useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true); // Set loading true at the start
        const newStatuses: Record<string, NetworkDeviceStatus> = {};


        await Promise.allSettled(
        devices.map(async (device) => {
            const key = `${device.type}-${device.ipAddress}`;
            try {
            let status: NetworkDeviceStatus = { connected: false, alertState: 'normal' };
            let traffic = 0; // Simulate traffic

            if (device.type === 'mikrotik') {
                const isConnected = await checkMikrotikConnection(device);
                let userCount = 0;
                if (isConnected) {
                    try {
                        // Use the cached pppoeUsers state for count if available and recent, else fetch
                        // This is a simplification; a better approach might involve timestamps or specific triggers
                        if (pppoeUsers.length > 0) {
                             userCount = pppoeUsers.filter(u => u.serverName === device.name && u.status === 'online').length;
                        } else {
                             // Fallback to fetching if cached data is unavailable (or considered stale)
                             const serverUsers = await getMikrotikUsers(device);
                             userCount = serverUsers.filter(u => u.status === 'online').length; // Count only online users
                        }
                    } catch { userCount = 0; }
                }

                const downloadSpeed = isConnected ? `${(Math.random() * 100 + 10).toFixed(1)} Mbps` : '0 Mbps';
                const uploadSpeed = isConnected ? `${(Math.random() * 50 + 5).toFixed(1)} Mbps` : '0 Mbps';
                traffic = Math.random() * (TRAFFIC_THRESHOLD_WARN * 1.5);
                status = { connected: isConnected, users: userCount, downloadSpeed, uploadSpeed, alertState: traffic > TRAFFIC_THRESHOLD_WARN ? 'warning' : 'normal' };

            } else if (device.type === 'mimosa') {
                const signalStrength = await getMimosaSignalStrength(device);
                const isConnected = signalStrength > -90;
                traffic = await getMimosaTraffic(device);
                const noiseFactor = Math.random() > 0.9 ? -10 : 0;
                const currentSignal = signalStrength + noiseFactor;
                let alertState: AlertState = 'normal';
                if (traffic > TRAFFIC_THRESHOLD_WARN) alertState = 'warning';
                if (!isConnected || currentSignal < -80) alertState = 'error';
                status = { connected: isConnected, signalStrength: currentSignal, alertState };

            } else if (device.type === 'ubnt') {
                const signalStrength = await getUbntSignalStrength(device);
                const isConnected = signalStrength > -90;
                traffic = await getUbntTraffic(device);
                const noiseFactor = Math.random() > 0.9 ? -10 : 0;
                const currentSignal = signalStrength + noiseFactor;
                let alertState: AlertState = 'normal';
                if (traffic > TRAFFIC_THRESHOLD_WARN) alertState = 'warning';
                if (!isConnected || currentSignal < -80) alertState = 'error';
                status = { connected: isConnected, signalStrength: currentSignal, alertState };
            }
            newStatuses[key] = status;
            } catch (error) {
            console.error(`Failed to fetch status for ${device.name} (${device.ipAddress}):`, error);
            newStatuses[key] = { connected: false, alertState: 'error' };
            }
        })
        );

        setDeviceStatuses(newStatuses);
        if (showLoading) setLoading(false); // Set loading false after all fetches complete
    }, [devices, pppoeUsers]); // Add pppoeUsers dependency


    // Fetch initial data and set up polling intervals (as fallback)
    React.useEffect(() => {
        if (isAuthenticated && devices.length > 0) {
            console.log("Authenticated and devices loaded, fetching initial statuses and users.");
            fetchDeviceStatuses(true); // Show loading for initial fetch
            fetchAllMikrotikUsers(true); // Show loading for initial fetch

            // Set up intervals for periodic refresh (increased intervals, rely on WS for speed)
            const statusIntervalId = setInterval(() => fetchDeviceStatuses(false), 60000); // Fetch every 60 seconds without loading indicator
            const userIntervalId = setInterval(() => fetchAllMikrotikUsers(false), 120000); // Fetch every 120 seconds without loading indicator

            return () => {
                console.log("Cleaning up polling intervals.");
                clearInterval(statusIntervalId);
                clearInterval(userIntervalId);
            }
        } else {
            console.log("Not fetching data: Not authenticated or no devices yet.");
        }
    }, [fetchDeviceStatuses, fetchAllMikrotikUsers, isAuthenticated, devices]); // Include dependencies


    // --- WebSocket Connection for Real-Time Updates ---
    const connectWebSocket = React.useCallback(() => {
        if (!isAuthenticated || ws.current) return; // Don't connect if not auth or already connected

        console.log(`Attempting WebSocket connection to ${WEBSOCKET_URL}...`);
        ws.current = new WebSocket(WEBSOCKET_URL);
        ws.current.binaryType = "blob"; // Or "arraybuffer" depending on backend

        ws.current.onopen = () => {
            console.log('WebSocket connected successfully.');
            toast({ title: "Real-time Connection", description: "Live updates enabled." });
            // Clear any reconnect timer
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
                reconnectInterval.current = null;
            }
            // Optionally send an initial message (e.g., authentication token or subscription request)
            // if (ws.current?.readyState === WebSocket.OPEN) {
            //     ws.current?.send(JSON.stringify({ type: 'authenticate', token: 'your_token' }));
            // }
        };

        ws.current.onmessage = (event) => {
            try {
                 // Check if data is Blob, read it as text
                if (event.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                         try {
                            const messageData = JSON.parse(reader.result as string);
                             console.log('WebSocket message received (Blob):', messageData);
                             handleWebSocketMessage(messageData);
                         } catch (error) {
                            console.error('Error parsing WebSocket Blob message:', error, 'Data:', reader.result);
                         }
                    };
                    reader.onerror = (error) => {
                        console.error('Error reading WebSocket Blob:', error);
                    };
                    reader.readAsText(event.data);
                } else if (typeof event.data === 'string') {
                    // Handle string data directly
                    const messageData = JSON.parse(event.data);
                     console.log('WebSocket message received (String):', messageData);
                     handleWebSocketMessage(messageData);
                } else {
                     console.warn('Received unexpected WebSocket message type:', typeof event.data);
                }


            } catch (error) {
                console.error('Error processing WebSocket message:', error, 'Data:', event.data);
            }
        };

        ws.current.onerror = (event) => {
            // The generic Event object often lacks details. Check Network tab for specifics.
            // Logging the event might show `type: 'error'`, but little else.
            console.error('WebSocket error occurred. Check browser Network tab (WS) for details. Event:', event);
            // Comment out the toast to prevent the annoying notification
            // toast({ title: "Real-time Connection Error", description: "Could not establish or maintain live updates. See console/network tab.", variant: "destructive" });
            // Consider attempting reconnect here or in onClose
        };

        ws.current.onclose = (event) => {
            console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason || 'No reason specified'}, Clean: ${event.wasClean}`);
            ws.current = null; // Clear the ref
            if (event.wasClean) {
                console.log("WebSocket closed cleanly.");
            } else {
                console.error('WebSocket connection died unexpectedly.');
                // Comment out or remove the toast for lost connection if it's also annoying
                // toast({ title: "Real-time Connection Lost", description: "Attempting to reconnect...", variant: "destructive" });
                 // Attempt to reconnect after a delay (e.g., exponential backoff)
                 if (!reconnectInterval.current && isAuthenticated) { // Only reconnect if authenticated
                    console.log("Setting up WebSocket reconnect timer...");
                    reconnectInterval.current = setInterval(() => {
                        console.log("Attempting WebSocket reconnect...");
                        connectWebSocket();
                    }, 5000); // Try reconnecting every 5 seconds
                 }
            }
        };

    }, [isAuthenticated, toast, fetchAllMikrotikUsers]); // Add dependencies

    // Helper function to process parsed WebSocket message data
    const handleWebSocketMessage = (messageData: any) => {
         // --- Handle Different Message Types ---
        if (messageData.type === 'device_status_update' && messageData.payload) {
            const { deviceId, status } = messageData.payload;
            if (deviceId && status) {
                console.log(`Updating status for ${deviceId}`);
                setDeviceStatuses(prev => ({ ...prev, [deviceId]: status }));
            }
        } else if (messageData.type === 'user_list_update' && messageData.payload) {
            console.log('Received user list update via WebSocket.');
            setPppoeUsers(messageData.payload); // Update the user list directly
        } else if (messageData.type === 'trigger_user_refresh') {
            console.log('WebSocket triggered user refresh.');
            fetchAllMikrotikUsers(false); // Refresh users without loading indicator
        } else if (messageData.type === 'alert' && messageData.payload) {
            // Display alerts from the backend
            toast({
                title: messageData.payload.title || "Network Alert",
                description: messageData.payload.description,
                variant: messageData.payload.variant || "default", // e.g., 'destructive'
            });
        }
        // Add more message types as needed (e.g., specific user logged in/out)
    };


    // Effect to manage WebSocket connection lifecycle
    React.useEffect(() => {
        if (isAuthenticated && devices.length > 0) {
            connectWebSocket();
        }

        // Cleanup function: close WebSocket and clear reconnect interval
        return () => {
            if (ws.current) {
                console.log("Closing WebSocket connection due to component unmount or dependency change.");
                ws.current.close();
                ws.current = null;
            }
            if (reconnectInterval.current) {
                 console.log("Clearing WebSocket reconnect timer.");
                 clearInterval(reconnectInterval.current);
                 reconnectInterval.current = null;
             }
        };
    }, [isAuthenticated, devices, connectWebSocket]); // Connect when authenticated and devices are loaded

  // --- Helper function to safely send WebSocket messages ---
  const sendWebSocketMessage = (message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
        console.log("WebSocket message sent:", message);
        return true; // Indicate success
      } catch (error) {
        console.error("Failed to send WebSocket message:", error, message);
        toast({
            title: "Communication Error",
            description: "Could not send update to server.",
            variant: "destructive",
        });
        return false; // Indicate failure
      }
    } else {
      console.warn(`WebSocket not open (state: ${ws.current?.readyState}). Message not sent:`, message);
      // Optionally queue the message or notify the user
       // toast({ // Commented out annoying toast
       //      title: "Real-time Disconnected",
       //      description: "Cannot send update. Check connection.",
       //      variant: "warning",
       // });
       return false; // Indicate failure
    }
  };


  // Handlers to add new devices (will update state and trigger refetch)
  const handleAddServer = (newServerData: Omit<Mikrotik, 'type'>) => {
      const newDevice: NetworkDevice = { ...newServerData, type: 'mikrotik' };
      setDevices(prevDevices => [...prevDevices, newDevice]);
      // Optionally trigger an immediate status fetch for the new device or rely on next poll/WS update
      // fetchSingleDeviceStatus(newDevice);
      // Send update via WebSocket if available
      sendWebSocketMessage({ type: 'device_added', payload: newDevice });
  };

  const handleAddTower = (newTowerData: Omit<Mimosa | Ubnt, 'type'>, type: 'mimosa' | 'ubnt') => {
     const newDevice: NetworkDevice = { ...newTowerData, type };
    setDevices(prevDevices => [...prevDevices, newDevice]);
    // Optionally trigger an immediate status fetch for the new device
    // fetchSingleDeviceStatus(newDevice);
    sendWebSocketMessage({ type: 'device_added', payload: newDevice });
  };

   // Handler for adding a PPPoE User via the dialog
   const handleAddPppoeUser = async (serverName: string, payload: any, expiryDate?: string): Promise<boolean> => {
       const server = findServerByName(serverName);
       if (!server) {
           toast({ title: "Error", description: `Server '${serverName}' not found.`, variant: "destructive" });
           return false;
       }
       try {
           await addPppoeUser(server, payload, expiryDate);
           toast({ title: "Success", description: `User ${payload.username} added to ${serverName}.` });
            fetchAllMikrotikUsers(false); // Refresh user list after adding
            // Notify backend via WebSocket
            sendWebSocketMessage({ type: 'user_added', payload: { serverName, username: payload.username } });
           return true;
       } catch (error) {
            toast({
                title: "Error Adding User",
                description: error instanceof Error ? error.message : `Failed to add user ${payload.username}.`,
                variant: "destructive",
            });
           return false;
       }
   };


  const handleLogout = () => {
    logout(); // This should also trigger WebSocket disconnect in useEffect cleanup
    router.push('/login');
  };

   // Handler to delete a device
   const handleDeleteDevice = async (deviceId: string) => {
       console.log("Deleting device with ID:", deviceId);
       const [type, ip] = deviceId.split('-', 2);

       // TODO: Add API call here to delete the device from the backend database
       // try {
       //   await deleteDeviceFromDB(deviceId); // Replace with your actual API call
       //   sendWebSocketMessage({ type: 'device_deleted', payload: { deviceId } }); // Notify backend
       // } catch (error) { ... }

       setDevices(prevDevices => {
           const updatedDevices = prevDevices.filter(d => !(d.type === type && d.ipAddress === ip));
           // Remove status entry
           setDeviceStatuses(prevStatuses => {
               const newStatuses = { ...prevStatuses };
               delete newStatuses[deviceId];
               return newStatuses;
           });
            // Remove users if it was a Mikrotik server
            if (type === 'mikrotik') {
                const server = prevDevices.find(d => d.type === 'mikrotik' && d.ipAddress === ip);
                 if (server) {
                     setPppoeUsers(prevUsers => prevUsers.filter(user => user.serverName !== server.name));
                 }
            }

           toast({
               title: "Device Removed",
               description: `Device ${type} (${ip}) removed from dashboard.`,
           });
           return updatedDevices;
       });
        // Notify backend after state update (optimistic UI)
        sendWebSocketMessage({ type: 'device_deleted', payload: { deviceId } });
   };

    // Handler for restarting a device
    const handleRestartDevice = async (device: NetworkDevice) => {
        const deviceId = `${device.type}-${device.ipAddress}`;
        console.log(`Restart requested for ${device.name} (${deviceId})`);
         toast({ title: "Restarting...", description: `Sending restart command to ${device.name}.` });
        try {
            let success = false;
            // Send restart request via API/backend
            // Example: const success = await backendApi.restartDevice(deviceId);
             if (device.type === 'mikrotik') {
                 success = await restartMikrotikServer(device.ipAddress);
             } else if (device.type === 'mimosa' || device.type === 'ubnt') {
                 success = await restartTowerDevice(device.ipAddress, device.type as 'mimosa' | 'ubnt'); // Updated cast
             }
            // Notify backend via WS if using it for commands too
            sendWebSocketMessage({ type: 'restart_device', payload: { deviceId } });

            if (success) {
                toast({ title: "Restart Initiated", description: `${device.name} is restarting. Status will update shortly.` });
                // Update local status immediately to show disconnecting/restarting
                setDeviceStatuses(prev => ({ ...prev, [deviceId]: { ...(prev[deviceId] || {}), connected: false, alertState: 'normal' } }));
                 // Rely on WS or polling for the device to come back online
            } else {
                throw new Error("Restart command failed or was not acknowledged.");
            }
        } catch (error) {
             toast({
                 title: "Restart Failed",
                 description: error instanceof Error ? error.message : `Could not restart ${device.name}.`,
                 variant: "destructive"
             });
        }
    };

     // Consolidated handler for user actions from UserListCard
     const handleUserAction = async (action: UserActionType, username: string, serverName: string, payload?: any): Promise<boolean> => {
        const server = findServerByName(serverName);
        if (!server) {
            toast({ title: "Error", description: `Server '${serverName}' not found for user action.`, variant: "destructive" });
            return false;
        }

        let success = false;
        try {
            // Perform the action using the service function
            switch (action) {
                case 'enableUser':
                    await enablePppoeUser(server, username); success = true; break;
                case 'disableUser':
                    await disablePppoeUser(server, username); success = true; break;
                case 'renewUser':
                    await renewPppoeUser(server, username, payload as string | undefined); success = true; break; // Payload is current expiry
                case 'deleteUser':
                    await deletePppoeUser(server, username); success = true; break; // Handle delete action
                default:
                    console.warn("Unknown user action:", action); return false;
            }

            if (success) {
                // Success toast is handled in the UserListCard after this promise resolves
                 fetchAllMikrotikUsers(false); // Refresh user list immediately after action
                 // Notify backend via WebSocket about the user action
                 // Check WebSocket state before sending
                 const messageSent = sendWebSocketMessage({ type: 'user_action', payload: { action, username, serverName } });
                 if (!messageSent) {
                      console.warn("WebSocket not open when trying to send user action notification.");
                      // Optionally inform user that real-time update might be delayed
                 }
            }
            return true;
        } catch (error) {
             console.error(`Error performing ${action} for user ${username}:`, error);
             // Error toast is handled in the UserListCard's catch block or the handler itself
             // Re-throw or return false based on how UserListCard handles it
             // throw error; // Let UserListCard catch it
             return false; // Indicate failure, UserListCard shows toast
        }
    };


  // Show loading indicator until authentication status is confirmed or initial device load is done
  if (isAuthenticated === undefined || loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
             <p className="ml-3 text-muted-foreground">Loading dashboard...</p>
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
           {/* Manual Refresh Button - useful if WS fails or for explicit refresh */}
           <Button variant="outline" size="icon" onClick={() => {fetchDeviceStatuses(true); fetchAllMikrotikUsers(true);}} disabled={loading || loadingUsers} aria-label="Refresh statuses">
             <RefreshCw className={cn("h-4 w-4", (loading || loadingUsers) && "animate-spin")} />
           </Button>
          <AddUserDialog
              mikrotikServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]}
              onAddUser={handleAddPppoeUser} // Pass the handler
          />
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
                {/* Initial Loading Skeletons (removed as main loading handles this) */}
                {/* Display actual device cards */}
                {devices.map((device) => {
                    const key = `${device.type}-${device.ipAddress}`;
                    // Use status from state, provide default if not yet available
                    const status = deviceStatuses[key] || { connected: false, alertState: 'normal' };
                    return (
                    <DeviceCard
                        key={key}
                        deviceId={key} // Pass the generated key as deviceId
                        device={device}
                        type={device.type}
                        status={status} // Pass the current status from state
                        // Add handlers for settings actions
                        onRestart={() => handleRestartDevice(device)} // Pass device object
                        onViewDetails={() => console.log(`View details for ${device.name}`)} // TODO: Implement detail view modal
                        onOpenWebInterface={() => {
                            // Basic assumption, might need https or specific ports
                            const url = `http://${device.ipAddress}`;
                            window.open(url, '_blank');
                        }}
                        onDelete={handleDeleteDevice} // Pass the delete handler
                    />
                    );
                })}
                {devices.length === 0 && !loading && ( // Show only if not loading and no devices
                    <Card className="md:col-span-2 xl:col-span-3 flex items-center justify-center p-10 border-dashed">
                        <p className="text-muted-foreground text-center">
                        No devices added yet. <br/> Click 'Add Server' or 'Add Tower' to get started.
                        </p>
                    </Card>
                )}
              </div>
          </div>

           {/* User List Card (takes 1/3 width on large screens) */}
           <div className="lg:col-span-1">
              <UserListCard
                  users={pppoeUsers}
                  isLoading={loadingUsers}
                  mikrotikServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]} // Pass only Mikrotik servers
                  onUserAction={handleUserAction} // Pass consolidated handler
                  onRefreshUsers={() => fetchAllMikrotikUsers(true)} // Pass refresh handler (with loading indicator)
               />
           </div>
      </div>
    </div>
  );
}
