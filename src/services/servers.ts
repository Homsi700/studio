
/**
 * Data structure representing the information needed to add a new server.
 * Aligns with the form data in AddServerDialog.
 */
interface ServerData {
  name: string;
  ipAddress: string;
  username: string;
  password: string; // Handle securely! Should not be stored long-term plaintext.
  type: "main" | "sub"; // Server role (Main or Sub)
  defaultSpeed?: string; // Optional default speed profile
}

/**
 * Asynchronously adds a new server (typically Mikrotik) to the system.
 * Placeholder function: Should verify connection using credentials and save details via a backend API.
 *
 * @param serverData The data for the new server, including credentials and type.
 * @returns A promise that resolves to true if the server was added successfully, false otherwise.
 * @throws If the API call to the backend fails.
 */
export async function addServer(serverData: ServerData): Promise<boolean> {
  console.log(`SERVICE: Attempting to add server: ${serverData.name} (${serverData.ipAddress})`);
  console.log("Server Data:", serverData);

  // TODO: Implement actual API call to the backend service
  // The backend service should:
  // 1. Receive `serverData`.
  // 2. Securely attempt to connect to `serverData.ipAddress` using `serverData.username` and `serverData.password`.
  // 3. If connection is successful, store server details (name, ip, type, defaultSpeed, encrypted credentials/token) in a database.
  // 4. Return success (e.g., HTTP 201 Created or { success: true }).
  // 5. If connection or storage fails, return an error (e.g., HTTP 400/500 or { success: false, message: '...' }).

  try {
    /*
    const response = await fetch('/api/servers', { // Example backend API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add server and parse error.' }));
        console.error(`SERVICE: Failed to add server ${serverData.name}. Status: ${response.status}`, errorData);
        throw new Error(errorData.message || `Failed to add server ${serverData.name}`);
    }

    const result = await response.json(); // Assuming backend returns { success: true } or similar
    console.log("SERVICE: Server added successfully via API (simulation).");
    return result.success; // Or simply return true if response.ok implies success
    */
    console.log("SERVICE: Server add API call simulated successfully.");
    return true; // Placeholder success

  } catch (error) {
    console.error(`SERVICE: Error calling backend API to add server ${serverData.name}:`, error);
    // Ensure the error is re-thrown so the UI can catch it (e.g., show a toast)
    throw error;
  }
}

/**
 * Asynchronously restarts a Mikrotik server via a backend API call.
 *
 * @param serverIp The IP address of the server to restart.
 * @returns A promise that resolves to true if the restart command was successfully sent, false otherwise.
 * @throws If the API call to the backend fails.
 */
export async function restartMikrotikServer(serverIp: string): Promise<boolean> {
    console.log(`SERVICE: Attempting to restart server ${serverIp}`);

    // TODO: Implement backend API call to trigger /system reboot on the Mikrotik.
    // The backend needs the server IP and potentially credentials (handled securely).
    try {
        /*
        const response = await fetch(`/api/servers/restart`, { // Example backend endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverIp: serverIp }), // Pass necessary info
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to send restart command.' }));
            console.error(`SERVICE: Failed to restart server ${serverIp}. Status: ${response.status}`, errorData);
            throw new Error(errorData.message || `Failed to restart server ${serverIp}`);
        }

        const result = await response.json();
        console.log(`SERVICE: Restart command sent to ${serverIp} successfully via API (simulation).`);
        return result.success; // Assuming backend confirms command sent
        */
        console.log(`SERVICE: Restart command API call simulated for ${serverIp}.`);
        return true; // Placeholder success

    } catch (error) {
        console.error(`SERVICE: Error calling backend API to restart server ${serverIp}:`, error);
        throw error;
    }
}
