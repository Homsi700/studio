import type { Mikrotik } from "./mikrotik"; // Import Mikrotik type

/**
 * Data structure representing the information needed to add a new server.
 * Aligns with the form data in AddServerDialog.
 */
export interface ServerData {
  name: string;
  ipAddress: string;
  apiPort?: number; // Optional API Port
  username: string;
  password: string; // Handle securely!
  type: "main" | "sub";
  defaultSpeed?: string;
}

/**
 * Asynchronously adds a new server (typically Mikrotik) to the system via a backend API.
 * The backend service should verify connection using credentials and the specified API port,
 * then save the server details.
 *
 * @param serverData The data for the new server, including credentials, type, and optional API port.
 * @returns A promise that resolves to true if the server was added successfully by the backend, false otherwise.
 * @throws If the API call to the backend fails or the backend returns an unhandled error.
 */
export async function addServer(serverData: ServerData): Promise<boolean> {
  // Use the provided port or default to 6166 if not specified
  const effectiveApiPort = serverData.apiPort || 6166;
  console.log(`SERVICE: Attempting to add server: ${serverData.name} (${serverData.ipAddress}:${effectiveApiPort})`);
  console.log("Server Data:", serverData);

  // *** Backend API Call Simulation ***
  // The backend service receives serverData.
  // It uses ipAddress and effectiveApiPort to connect to the Mikrotik.
  try {
    /*
    const response = await fetch('/api/servers', { // Example backend API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send all necessary data, including the effectiveApiPort
        body: JSON.stringify({ ...serverData, apiPort: effectiveApiPort }),
    });

    if (!response.ok) {
        // Try to parse error message from backend
        let errorMessage = `Failed to add server ${serverData.name}`;
        try {
             const errorData = await response.json();
             errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            // Ignore if response body is not JSON or empty
        }
        console.error(`SERVICE: Backend failed to add server ${serverData.name}. Status: ${response.status}, Message: ${errorMessage}`);
        throw new Error(errorMessage); // Throw error with backend message if available
    }

    const result = await response.json(); // Assuming backend returns { success: true } or similar
    console.log("SERVICE: Server added successfully via backend API.");
    return result.success; // Or simply return true if response.ok implies success
    */

    // Simulate backend connection check based on user's provided details
    if (serverData.ipAddress === '2.2.2.1' && serverData.username === 'ya' && serverData.password === '616' && effectiveApiPort === 6166) {
         console.log(`SERVICE: Simulated backend connection SUCCESS for ${serverData.name} on port ${effectiveApiPort}.`);
         // Here, the backend would store the server details in the database.
         console.log("SERVICE: Server add API call simulated successfully.");
         return true; // Placeholder success
    } else {
         console.log(`SERVICE: Simulated backend connection FAILED for ${serverData.name} (${serverData.ipAddress}:${effectiveApiPort}). Invalid credentials, IP, or Port.`);
         // Make error message more specific
         let reason = "Invalid details";
         if (serverData.ipAddress !== '2.2.2.1') reason = "Incorrect IP";
         else if (serverData.username !== 'ya') reason = "Incorrect username";
         else if (serverData.password !== '616') reason = "Incorrect password";
         else if (effectiveApiPort !== 6166) reason = `Incorrect API port (Expected 6166, got ${effectiveApiPort})`;
         throw new Error(`Simulated backend: Connection failed for ${serverData.name}. Reason: ${reason}. Check IP, port, and credentials.`);
    }


  } catch (error) {
    console.error(`SERVICE: Error calling backend API to add server ${serverData.name}:`, error);
    // Re-throw the error so the UI (e.g., the dialog's onSubmit handler) can catch it and display a toast.
    throw error;
  }
}

/**
 * Asynchronously restarts a Mikrotik server via a backend API call.
 * The backend must connect using the correct IP and API port.
 *
 * @param serverIp The IP address of the server to restart.
 * @param apiPort Optional API port of the server.
 * @param adminUsername Optional admin username for authentication.
 * @param adminPassword Optional admin password for authentication.
 * @returns A promise that resolves to true if the restart command was successfully sent by the backend, false otherwise.
 * @throws If the API call to the backend fails or the backend returns an error.
 */
export async function restartMikrotikServer(
    serverIp: string,
    apiPort?: number,
    adminUsername?: string,
    adminPassword?: string
): Promise<boolean> {
    const effectiveApiPort = apiPort || 6166; // Use 6166 as default for restart too if applicable
    console.log(`SERVICE: Attempting to restart server ${serverIp}:${effectiveApiPort}`);

    // Backend API needs server IP, port, and credentials.
    try {
        /*
        const response = await fetch(`/api/servers/restart`, { // Example backend endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverIp: serverIp,
                apiPort: effectiveApiPort, // Pass effective port
                username: adminUsername, // Pass creds securely
                password: adminPassword,
             }),
        });

        if (!response.ok) {
            let errorMessage = `Failed to restart server ${serverIp}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {}
            console.error(`SERVICE: Backend failed to restart server ${serverIp}. Status: ${response.status}, Message: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log(`SERVICE: Restart command sent to ${serverIp} successfully via backend API.`);
        return result.success;
        */
        console.log(`SERVICE: Restart command backend API call simulated for ${serverIp}.`);
        return true; // Placeholder success

    } catch (error) {
        console.error(`SERVICE: Error calling backend API to restart server ${serverIp}:`, error);
        throw error;
    }
}
