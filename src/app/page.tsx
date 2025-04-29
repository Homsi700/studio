
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
import { MOCK_MIKROTIK_SERVERS, MOCK_MIMOSA_TOWERS, MOCK_UBNT_TOWERS, TRAFFIC_THRESHOLD_WARN } from '@/lib/constants'; // Still needed for initial default if localStorage is empty
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { cn } from '@/lib/utils'; // Import the cn utility function
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import { UserListCard } from '@/components/dashboard/UserListCard'; // Import UserListCard
import { useToast } from '@/hooks/use-toast'; // Import useToast for notifications

// Placeholder WebSocket URL - replace with your actual backend WebSocket endpoint
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws/network-status'; // Example default

export default function Dashboard() {
  const { isAuthenticated, logout, user } = useAuth(); // Add user for potential future use
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast hook
  const [deviceStatuses, setDeviceStatuses] = React.useState<Record<string, NetworkDeviceStatus>>({});
  const [loadingDevices, setLoadingDevices] = React.useState<boolean>(true); // Loading state for devices themselves
  const [loadingStatuses, setLoadingStatuses] = React.useState<boolean>(false); // Loading state for device statuses
  const [devices, setDevices] = React.useState<NetworkDevice[]>([]);
  const [pppoeUsers, setPppoeUsers] = React.useState<PppoeUserDetails[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false); // Separate loading state for user list
  const ws = React.useRef<WebSocket | null>(null);
  const reconnectInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    // Check specifically for false after initial check to avoid redirect during initial load
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);


  // Initialize devices state with data from localStorage or mock data
  React.useEffect(() => {
    setLoadingDevices(true); // Start loading devices
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
            ...MOCK_MIKROTIK_SERVERS.map((d) => ({ ...d, type: 'mikrotik' as const, adminUsername: 'admin', adminPassword: 'password123' })), // Add dummy credentials for services
            ...MOCK_MIMOSA_TOWERS.map((d) => ({ ...d, type: 'mimosa' as const, adminUsername: 'admin', adminPassword: 'password123' })),
            ...MOCK_UBNT_TOWERS.map((d) => ({ ...d, type: 'ubnt' as const, adminUsername: 'admin', adminPassword: 'password123' })),
        ];
         // Save mock data to localStorage initially if it wasn't there
         if (typeof window !== 'undefined') {
             localStorage.setItem('networkPilotDevices', JSON.stringify(initialDevices));
         }
    }
    setDevices(initialDevices);
    setLoadingDevices(false); // Finish loading devices
  }, []);

    // --- Save devices to localStorage whenever they change ---
    React.useEffect(() => {
        // Only save if devices are loaded and not empty
        if (!loadingDevices && devices.length > 0 && typeof window !== 'undefined') {
            try {
                localStorage.setItem('networkPilotDevices', JSON.stringify(devices));
            } catch (e) {
                console.error("Failed to save devices to localStorage:", e);
            }
        }
    }, [devices, loadingDevices]);

   // Helper to find a server by name
   const findServerByName = (name: string): Mikrotik | undefined => {
       return devices.find(d => d.type === 'mikrotik' && d.name === name) as Mikrotik | undefined;
   };

    // Function to fetch users from all Mikrotik servers
    const fetchAllMikrotikUsers = React.useCallback(async (showLoadingIndicator = true) => {
        if (!isAuthenticated || devices.length === 0) return; // Don't fetch if not auth or no devices
        if (showLoadingIndicator) setLoadingUsers(true);
        const mikrotikServers = devices.filter(d => d.type === 'mikrotik') as Mikrotik[];
        const allUsersPromises = mikrotikServers.map(server =>
            getMikrotikUsers(server).catch(error => { // Catch errors per server
                console.error(`Failed to fetch users from ${server.name}:`, error);
                toast({
                    title: "User Fetch Error",
                    description: `Could not fetch users from ${server.name}. ${error.message}`,
                    variant: "destructive",
                 });
                return []; // Return empty array on error for this server
            })
        );

        try {
            // Promise.allSettled is less ideal here as we handle errors individually
            const results = await Promise.all(allUsersPromises);
            const combinedUsers = results.flat(); // Flatten the array of arrays

            // Simple deduplication by username (assuming usernames are unique across servers for display, might need refinement)
             const uniqueUsers = Array.from(new Map(combinedUsers.map(user => [`${user.username}-${user.serverName}`, user])).values());
             setPppoeUsers(uniqueUsers);

        } catch (error) {
             // This catch is less likely now, but kept for safety
             console.error("Unexpected error during fetchAllMikrotikUsers Promise.all:", error);
             toast({
                 title: "Error Fetching Users",
                 description: "An unexpected error occurred while processing user lists.",
                 variant: "destructive",
             });
        } finally {
            if (showLoadingIndicator) setLoadingUsers(false);
        }
    }, [devices, isAuthenticated, toast]); // Added toast

    // Function to fetch statuses for all devices
     const fetchDeviceStatuses = React.useCallback(async (showLoadingIndicator = true) => {
        if (!isAuthenticated || devices.length === 0) return;
        if (showLoadingIndicator) setLoadingStatuses(true);
        const newStatuses: Record<string, NetworkDeviceStatus> = {};

        // Use Promise.allSettled to fetch all statuses even if some fail
        const results = await Promise.allSettled(
            devices.map(async (device) => {
                const key = `${device.type}-${device.ipAddress}`;
                try {
                   let status: NetworkDeviceStatus = { connected: false, alertState: 'normal' };
                   let traffic = 0;

                   if (device.type === 'mikrotik') {
                       const isConnected = await checkMikrotikConnection(device);
                       let userCount = 0;
                       let downloadSpeed = 'N/A';
                       let uploadSpeed = 'N/A';
                       if (isConnected) {
                           try {
                               // In a real app, fetch live traffic/user count via API
                               userCount = pppoeUsers.filter(u => u.serverName === device.name && u.status === 'online').length; // Use cached user count for now
                               downloadSpeed = `${(Math.random() * 100 + 10).toFixed(1)} Mbps`; // Simulate
                               uploadSpeed = `${(Math.random() * 50 + 5).toFixed(1)} Mbps`; // Simulate
                               traffic = parseFloat(downloadSpeed); // Simulate traffic based on speed
                           } catch (userCountError) {
                               console.error(`Error getting details for Mikrotik ${device.name}:`, userCountError);
                           }
                       }
                       status = { connected: isConnected, users: userCount, downloadSpeed, uploadSpeed, alertState: traffic > TRAFFIC_THRESHOLD_WARN ? 'warning' : 'normal' };

                   } else if (device.type === 'mimosa' || device.type === 'ubnt') {
                        let signalStrength = -99; // Default to a disconnected value
                        let isConnected = false;
                        let alertState: AlertState = 'error'; // Default to error if fetches fail

                        try {
                            signalStrength = device.type === 'mimosa'
                                ? await getMimosaSignalStrength(device)
                                : await getUbntSignalStrength(device);
                            isConnected = signalStrength > -90; // Basic connectivity check

                            if (isConnected) {
                                traffic = device.type === 'mimosa'
                                    ? await getMimosaTraffic(device)
                                    : await getUbntTraffic(device);

                                // Determine alert state based on fetched data
                                if (signalStrength < -80) alertState = 'error';
                                else if (traffic > TRAFFIC_THRESHOLD_WARN || signalStrength < -70) alertState = 'warning';
                                else alertState = 'normal';
                            } else {
                                // Already disconnected based on signal
                                alertState = 'error';
                            }

                        } catch (fetchError) {
                            console.error(`Error fetching status for ${device.type} ${device.name}:`, fetchError);
                            // Keep signalStrength low and alertState as 'error'
                             isConnected = false;
                             alertState = 'error';
                        }
                         status = { connected: isConnected, signalStrength, alertState };
                   }
                   return { key, status }; // Return key and status on success
                } catch (error) {
                   console.error(`Failed to process status for ${device.name} (${device.ipAddress}):`, error);
                   // Return key and error status for this specific device
                   return { key, status: { connected: false, alertState: 'error' as AlertState } };
                }
            })
        );

        // Update statuses based on results
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                newStatuses[result.value.key] = result.value.status;
            }
            // Optional: Handle 'rejected' status if the outer try/catch in the map wasn't sufficient
            // else if (result.status === 'rejected') { ... }
        });

        setDeviceStatuses(newStatuses);
        if (showLoadingIndicator) setLoadingStatuses(false);

    }, [devices, isAuthenticated, pppoeUsers]); // Removed getMikrotikUsers dependency as it's not directly called here


    // --- Fetch initial data and set up polling intervals ---
    React.useEffect(() => {
        // Fetch only when authenticated and devices are loaded
        if (isAuthenticated && !loadingDevices && devices.length > 0) {
            console.log("Authenticated and devices loaded, fetching initial statuses and users.");
            fetchDeviceStatuses(true); // Show main loading indicator for initial status fetch
            fetchAllMikrotikUsers(true); // Show user list loading indicator

            // Set up intervals for periodic refresh
            const statusIntervalId = setInterval(() => fetchDeviceStatuses(false), 60000); // Fetch every 60s without indicator
            const userIntervalId = setInterval(() => fetchAllMikrotikUsers(false), 120000); // Fetch every 120s without indicator

            return () => {
                console.log("Cleaning up polling intervals.");
                clearInterval(statusIntervalId);
                clearInterval(userIntervalId);
            }
        } else if (isAuthenticated === false) {
             console.log("Not authenticated, skipping initial fetch.");
        } else if (loadingDevices) {
             console.log("Devices still loading, waiting to fetch data...");
        } else if (devices.length === 0) {
             console.log("No devices configured, skipping fetch.");
             setLoadingStatuses(false); // Ensure status loading is false if no devices
             setLoadingUsers(false); // Ensure user loading is false if no devices
        }
    }, [fetchDeviceStatuses, fetchAllMikrotikUsers, isAuthenticated, devices, loadingDevices]); // Depend on device loading state


    // --- WebSocket Connection ---
    const connectWebSocket = React.useCallback(() => {
        if (!isAuthenticated || ws.current) return;

        console.log(`Attempting WebSocket connection to ${WEBSOCKET_URL}...`);
        ws.current = new WebSocket(WEBSOCKET_URL);
        ws.current.binaryType = "blob";

        ws.current.onopen = () => {
            console.log('WebSocket connected successfully.');
            toast({ title: "Real-time Connection", description: "Live updates enabled." });
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
                reconnectInterval.current = null;
            }
        };

        ws.current.onmessage = (event) => {
            try {
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
            console.error('WebSocket error occurred. Check browser Network tab (WS) for details. Event:', event);
            // toast({ title: "Real-time Connection Error", description: "Could not establish or maintain live updates. See console/network tab.", variant: "destructive" });
        };

        ws.current.onclose = (event) => {
            console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason || 'No reason specified'}, Clean: ${event.wasClean}`);
            ws.current = null;
            if (!event.wasClean && isAuthenticated) { // Only reconnect if closed unexpectedly and user is still logged in
                console.error('WebSocket connection died unexpectedly.');
                 if (!reconnectInterval.current) {
                    console.log("Setting up WebSocket reconnect timer...");
                    reconnectInterval.current = setInterval(() => {
                        console.log("Attempting WebSocket reconnect...");
                        connectWebSocket();
                    }, 5000);
                 }
            } else if (event.wasClean) {
                 console.log("WebSocket closed cleanly.");
            }
        };

    }, [isAuthenticated, toast, fetchAllMikrotikUsers]); // Add dependencies

    // Helper function to process parsed WebSocket message data
    const handleWebSocketMessage = (messageData: any) => {
        if (messageData.type === 'device_status_update' && messageData.payload) {
            const { deviceId, status } = messageData.payload;
            if (deviceId && status) {
                console.log(`WS Updating status for ${deviceId}`);
                setDeviceStatuses(prev => ({ ...prev, [deviceId]: status }));
            }
        } else if (messageData.type === 'user_list_update' && messageData.payload) {
            console.log('WS Received user list update.');
             const uniqueUsers = Array.from(new Map(messageData.payload.map((user: PppoeUserDetails) => [`${user.username}-${user.serverName}`, user])).values());
             setPppoeUsers(uniqueUsers);
        } else if (messageData.type === 'trigger_user_refresh') {
            console.log('WS triggered user refresh.');
            fetchAllMikrotikUsers(false);
        } else if (messageData.type === 'trigger_status_refresh') {
             console.log('WS triggered status refresh.');
             fetchDeviceStatuses(false);
        } else if (messageData.type === 'alert' && messageData.payload) {
            toast({
                title: messageData.payload.title || "Network Alert",
                description: messageData.payload.description,
                variant: messageData.payload.variant || "default",
            });
        }
        // Add more message types as needed
    };


    // Effect to manage WebSocket connection lifecycle
    React.useEffect(() => {
        if (isAuthenticated && !loadingDevices && devices.length > 0) {
            connectWebSocket();
        }

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
    }, [isAuthenticated, devices, loadingDevices, connectWebSocket]); // Connect when authenticated and devices are loaded

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
       // toast({ // Commented out annoying toast
       //      title: "Real-time Disconnected",
       //      description: "Cannot send update. Check connection.",
       //      variant: "warning",
       // });
       return false; // Indicate failure
    }
  };


  // --- Device and User Management Handlers ---

  const handleAddServer = async (newServerData: Omit<Mikrotik, 'type'> & { adminUsername?: string; adminPassword?: string; type: 'main' | 'sub'; defaultSpeed?: string }) => {
      const newDevice: NetworkDevice = { ...newServerData, type: 'mikrotik' };
       try {
           // Call the actual service function which interacts with the backend API
           // The service function now returns a boolean or throws an error
           const success = await addServer(newServerData); // Pass the data expected by addServer

           if (success) {
               setDevices(prevDevices => [...prevDevices, newDevice]);
               toast({ title: "Success", description: `Server ${newDevice.name} added.` });
               // Trigger an immediate status fetch for the new device
               fetchDeviceStatuses(false); // No loading indicator needed for single update usually
                // Notify backend via WebSocket if available
                sendWebSocketMessage({ type: 'device_added', payload: newDevice });
               return true; // Indicate success to the dialog
           } else {
               // The addServer function should have thrown an error if backend returned failure
               // If it returns false without throwing, handle it here
                toast({ title: "Error", description: `Failed to add server ${newDevice.name}. Backend rejected the request.`, variant: "destructive" });
                return false;
           }
       } catch (error) {
            // Error is caught from the addServer service function
            toast({
                title: "Error Adding Server",
                description: error instanceof Error ? error.message : `Failed to add server ${newDevice.name}.`,
                variant: "destructive",
            });
            return false; // Indicate failure to the dialog
       }
  };

  const handleAddTower = async (newTowerData: Omit<Mimosa | Ubnt, 'type'> & { type: 'Mimosa' | 'UBNT'; adminUsername?: string; adminPassword?: string; linkedServerName: string; signalWarningThreshold: number; speed: string; towerType: 'main' | 'sub'; notes?: string }, uiType: 'mimosa' | 'ubnt') => {
     const newDevice: NetworkDevice = { ...newTowerData, type: uiType }; // Use uiType ('mimosa' | 'ubnt')
     try {
         // Call the actual service function
         const success = await addTower(newTowerData); // Pass the data expected by addTower

          if (success) {
             setDevices(prevDevices => [...prevDevices, newDevice]);
             toast({ title: "Success", description: `Tower ${newDevice.name} added.` });
             fetchDeviceStatuses(false); // Trigger status refresh
             sendWebSocketMessage({ type: 'device_added', payload: newDevice });
             return true; // Indicate success to the dialog
          } else {
              toast({ title: "Error", description: `Failed to add tower ${newDevice.name}. Backend rejected the request.`, variant: "destructive" });
              return false;
          }

     } catch (error) {
        toast({
            title: "Error Adding Tower",
            description: error instanceof Error ? error.message : `Failed to add tower ${newDevice.name}.`,
            variant: "destructive",
        });
        return false; // Indicate failure to the dialog
     }
  };

   // Handler for adding a PPPoE User via the dialog
   const handleAddPppoeUser = async (serverName: string, payload: any, expiryDate?: string): Promise<boolean> => {
       const server = findServerByName(serverName);
       if (!server) {
           toast({ title: "Error", description: `Server '${serverName}' not found.`, variant: "destructive" });
           return false;
       }
       try {
           // Call the service function (which calls the backend API)
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
       const deviceToDelete = devices.find(d => d.type === type && d.ipAddress === ip);

        if (!deviceToDelete) {
             toast({ title: "Error", description: "Device not found for deletion.", variant: "destructive"});
             return;
        }

       // TODO: Add API call here to delete the device from the backend database
        try {
           // Assume backend has an endpoint like /api/devices/:type/:ip
           // const response = await fetch(`/api/devices/${type}/${ip}`, { method: 'DELETE' });
           // if (!response.ok) { throw new Error('Failed to delete device on backend.'); }
           console.log(`SERVICE: Simulated backend call to delete device ${deviceId}`);

           // --- Optimistic UI Update ---
           setDevices(prevDevices => prevDevices.filter(d => d !== deviceToDelete));
           // Remove status entry
           setDeviceStatuses(prevStatuses => {
               const newStatuses = { ...prevStatuses };
               delete newStatuses[deviceId];
               return newStatuses;
           });
            // Remove users if it was a Mikrotik server
            if (type === 'mikrotik') {
                 setPppoeUsers(prevUsers => prevUsers.filter(user => user.serverName !== deviceToDelete.name));
            }
           // --- End Optimistic UI Update ---

           toast({
               title: "Device Removed",
               description: `Device ${deviceToDelete.name} (${ip}) removed from dashboard.`,
           });
            // Notify backend via WebSocket *after* backend confirmation (or optimistically if preferred)
            sendWebSocketMessage({ type: 'device_deleted', payload: { deviceId } });

        } catch (error) {
            console.error(`Error deleting device ${deviceId}:`, error);
             toast({
                 title: "Error Deleting Device",
                 description: error instanceof Error ? error.message : `Could not remove ${deviceToDelete.name}.`,
                 variant: "destructive"
             });
              // Optional: Revert optimistic UI update if necessary
        }
   };

    // Handler for restarting a device
    const handleRestartDevice = async (device: NetworkDevice) => {
        const deviceId = `${device.type}-${device.ipAddress}`;
        console.log(`Restart requested for ${device.name} (${deviceId})`);
         toast({ title: "Restarting...", description: `Sending restart command to ${device.name}.` });
        try {
            let success = false;
             // Choose the correct service function based on type
             if (device.type === 'mikrotik') {
                 success = await restartMikrotikServer(device.ipAddress);
             } else if (device.type === 'mimosa' || device.type === 'ubnt') {
                 success = await restartTowerDevice(device.ipAddress, device.type as 'mimosa' | 'ubnt');
             }

            if (success) {
                toast({ title: "Restart Initiated", description: `${device.name} is restarting. Status will update shortly.` });
                // Update local status immediately to show disconnecting/restarting
                setDeviceStatuses(prev => ({ ...prev, [deviceId]: { ...(prev[deviceId] || {}), connected: false, alertState: 'normal' } }));
                // Notify backend via WS if using it for commands too
                sendWebSocketMessage({ type: 'restart_device', payload: { deviceId } });
                 // Rely on WS or polling for the device to come back online
            } else {
                // Service function should throw on failure, but handle boolean false just in case
                throw new Error("Restart command failed or was not acknowledged by the backend.");
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

        // Show loading state in UI immediately (if UserListCard implements it)
        console.log(`Performing action '${action}' for user '${username}' on server '${serverName}'`);

        try {
            // Perform the action using the service function (which calls the backend API)
            switch (action) {
                case 'enableUser':
                    await enablePppoeUser(server, username); break;
                case 'disableUser':
                    await disablePppoeUser(server, username); break;
                case 'renewUser':
                    await renewPppoeUser(server, username, payload as string | undefined); break;
                case 'deleteUser':
                    await deletePppoeUser(server, username); break;
                default:
                    console.warn("Unknown user action:", action); return false;
            }

            // Success toast is handled in the UserListCard after this promise resolves true
            fetchAllMikrotikUsers(false); // Refresh user list immediately after action success
            // Notify backend via WebSocket about the user action
            const messageSent = sendWebSocketMessage({ type: 'user_action', payload: { action, username, serverName } });
            if (!messageSent) {
                 console.warn("WebSocket not open when trying to send user action notification.");
            }
            return true; // Indicate success

        } catch (error) {
             console.error(`Error performing ${action} for user ${username}:`, error);
             // Error toast is handled by the UserListCard's catch block or the handler itself
             // We return false here to signal failure to the UserListCard
             toast({
                title: `Error: ${action}`,
                description: error instanceof Error ? error.message : `Failed action for ${username}`,
                variant: "destructive",
             });
             return false; // Indicate failure
        }
    };


  // --- Render Logic ---

  // Show loading indicator while authenticating OR loading initial devices OR loading initial statuses
  if (isAuthenticated === undefined || loadingDevices || (loadingStatuses && devices.length > 0)) { // Show loading if statuses are loading *and* there are devices
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
           {/* Manual Refresh Button */}
           <Button variant="outline" size="icon" onClick={() => {fetchDeviceStatuses(true); fetchAllMikrotikUsers(true);}} disabled={loadingStatuses || loadingUsers} aria-label="Refresh statuses">
             <RefreshCw className={cn("h-4 w-4", (loadingStatuses || loadingUsers) && "animate-spin")} />
           </Button>
          <AddUserDialog
              mikrotikServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]}
              onAddUser={handleAddPppoeUser}
          />
          <AddServerDialog onAddServer={handleAddServer} />
          <AddTowerDialog
             onAddTower={handleAddTower}
             linkedServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]}
          />
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
                {/* Skeletons shown only if devices are present but statuses are still loading */}
                {loadingStatuses && devices.length > 0 && Array.from({ length: devices.length }).map((_, index) => (
                    <Card key={index} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-6 w-3/5" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-2/5" />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </Card>
                 ))}

                {/* Display actual device cards when statuses are loaded */}
                {!loadingStatuses && devices.map((device) => {
                    const key = `${device.type}-${device.ipAddress}`;
                    const status = deviceStatuses[key] || { connected: false, alertState: 'error' }; // Default to error if status missing
                    return (
                    <DeviceCard
                        key={key}
                        deviceId={key}
                        device={device}
                        type={device.type}
                        status={status}
                        onRestart={() => handleRestartDevice(device)}
                        onViewDetails={() => console.log(`View details for ${device.name}`)} // TODO: Implement detail view modal
                        onOpenWebInterface={() => {
                            const protocol = device.ipAddress.startsWith('192.168') || device.ipAddress.startsWith('10.') ? 'http' : 'https'; // Basic guess
                            window.open(`${protocol}://${device.ipAddress}`, '_blank');
                        }}
                        onDelete={handleDeleteDevice}
                    />
                    );
                })}

                {/* Message when no devices are configured */}
                {!loadingDevices && devices.length === 0 && (
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
                  isLoading={loadingUsers} // Use separate loading state for users
                  mikrotikServers={devices.filter(d => d.type === 'mikrotik') as Mikrotik[]}
                  onUserAction={handleUserAction}
                  onRefreshUsers={() => fetchAllMikrotikUsers(true)} // Pass refresh handler (with loading indicator)
               />
           </div>
      </div>
    </div>
  );
}
