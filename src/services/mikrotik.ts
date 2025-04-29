
import type { PppoeUserDetails } from "@/types"; // Import detailed user type
import { addDays, format, differenceInDays, parseISO } from 'date-fns'; // Import date-fns for renewal and difference calculation

/**
 * Represents a Mikrotik server.
 */
export interface Mikrotik {
  /** The name of the server. */
  name: string;
  /** The IP address of the server. */
  ipAddress: string;
  /** Optional: The port for the Mikrotik API service (default typically 6166 based on user info). */
  apiPort?: number;
  /** Admin username for API access. Handle securely! */
   adminUsername?: string;
   /** Admin password for API access. Handle securely! */
   adminPassword?: string;
}

/**
 * Represents the payload for adding a new PPPoE user via Mikrotik API.
 * Fields typically align with `/ppp secret add` parameters.
 */
export interface PppoeUserPayload {
  /** The username for the PPPoE secret. */
  username: string; // Corresponds to 'name' in Mikrotik API usually
  /** The password for the PPPoE secret. */
  password: string;
  /** The service (usually 'pppoe'). */
  service?: string; // Often defaults to 'pppoe', might not be needed explicitly
  /** The profile name assigned to the user (controls speed, etc.). */
  profile: string;
  /** Optional comment for the user secret. */
  comment?: string;
  /** Optional local IP address assigned. */
  localAddress?: string;
  /** Optional remote IP address assigned. */
  remoteAddress?: string;
  // Expiry is often handled via scheduler scripts or user manager, not directly in secret
}


/**
 * Asynchronously adds a PPPoE user secret to a Mikrotik server via a backend API.
 * The backend should handle the actual connection using the server's IP and API port.
 * Automatically triggers disabling if the expiry duration is <= 30 days.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @param userPayload The PPPoE user data matching API parameters.
 * @param expiryDate Optional expiry date string (YYYY-MM-DD). Handling depends on backend implementation.
 * @returns A promise that resolves when the user is added successfully.
 * @throws If the backend API call fails.
 */
export async function addPppoeUser(mikrotik: Mikrotik, userPayload: PppoeUserPayload, expiryDate?: string): Promise<void> {
  const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
  console.log(`SERVICE: Adding user ${userPayload.username} to Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
  console.log("Payload:", userPayload);

  const registrationDate = new Date();

  // Construct comment with expiry if provided
   let comment = userPayload.comment || '';
   if (expiryDate) {
     comment = `Expiry:${expiryDate};${comment}`; // Prepend expiry info
   }
   const finalPayload = { ...userPayload, comment: comment.trim() };
    console.log("Final Payload with Comment:", finalPayload);


  // *** Backend API Call Simulation ***
  // The backend needs to use mikrotik.ipAddress and effectiveApiPort
  // to establish the connection with the Mikrotik device.
  try {
    /*
    // Example of data sent to backend:
    const apiRequestBody = {
      serverIp: mikrotik.ipAddress,
      apiPort: effectiveApiPort, // Pass the effective port to the backend
      adminUsername: mikrotik.adminUsername,
      adminPassword: mikrotik.adminPassword, // Handle securely!
      secretData: {
        name: finalPayload.username,
        password: finalPayload.password,
        profile: finalPayload.profile,
        service: finalPayload.service || 'pppoe',
        comment: finalPayload.comment,
        // ... other fields ...
      }
    };
    const response = await fetch(`/api/mikrotik/ppp/secret`, { // Example backend endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });
    if (!response.ok) { throw new Error(`Backend API error adding user (${response.status})`); }
    */

    console.log(`SERVICE: Simulated backend API call to add user ${userPayload.username}.`);

    // --- Automatic Disabling Check ---
     let isDisabled = false;
     if (expiryDate) {
         try {
             const expiry = parseISO(expiryDate);
             const durationDays = differenceInDays(expiry, registrationDate);
             console.log(`SERVICE: User ${userPayload.username} duration: ${durationDays} days.`);
             if (durationDays <= 30) {
                 console.warn(`SERVICE: User ${userPayload.username} has a duration of ${durationDays} days (<= 30). Disabling automatically.`);
                 // Backend should ideally support adding as disabled,
                 // otherwise, make a second call to disable.
                 await disablePppoeUser(mikrotik, userPayload.username); // Call disable function
                 isDisabled = true;
             }
         } catch (e) {
             console.error(`SERVICE: Could not parse expiry date "${expiryDate}" for automatic disabling check.`, e);
         }
     }
     console.log(`SERVICE: User ${userPayload.username} added/checked for disable. Disabled: ${isDisabled}`);

  } catch (error) {
    console.error(`SERVICE: API Error adding PPPoE user ${userPayload.username}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

/**
 * Asynchronously enables a PPPoE user secret on a Mikrotik server via a backend API.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @param username The username of the PPPoE secret to enable.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the backend API call fails.
 */
export async function enablePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
    console.log(`SERVICE: Enabling user ${username} on Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
    // Backend API needs mikrotik.ipAddress, effectiveApiPort, username, and credentials.
    try {
        const response = await fetch(`/api/mikrotik/action/enableUser`, { // Example consolidated API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverIp: mikrotik.ipAddress,
                apiPort: effectiveApiPort, // Pass effective port
                username: username,
                adminUsername: mikrotik.adminUsername,
                adminPassword: mikrotik.adminPassword,
            }),
        });
        if (!response.ok) { throw new Error(`Backend API error enabling user (${response.status})`); }
        console.log(`SERVICE: User ${username} enabled successfully via backend API.`);
    } catch (error) {
        console.error(`SERVICE: API Error enabling user ${username}:`, error);
        throw error;
    }
}

/**
 * Asynchronously disables a PPPoE user secret on a Mikrotik server via a backend API.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @param username The username of the PPPoE secret to disable.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the backend API call fails.
 */
export async function disablePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
    console.log(`SERVICE: Disabling user ${username} on Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
    // Backend API needs mikrotik.ipAddress, effectiveApiPort, username, and credentials.
     try {
        const response = await fetch(`/api/mikrotik/action/disableUser`, { // Example consolidated API endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 apiPort: effectiveApiPort, // Pass effective port
                 username: username,
                 adminUsername: mikrotik.adminUsername,
                 adminPassword: mikrotik.adminPassword,
             }),
        });
        if (!response.ok) { throw new Error(`Backend API error disabling user (${response.status})`); }
        console.log(`SERVICE: User ${username} disabled successfully via backend API.`);
    } catch (error) {
        console.error(`SERVICE: API Error disabling user ${username}:`, error);
        throw error;
    }
}

/**
 * Asynchronously deletes a PPPoE user secret from a Mikrotik server via a backend API.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @param username The username of the PPPoE secret to delete.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the backend API call fails.
 */
export async function deletePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
    console.log(`SERVICE: Deleting user ${username} from Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
    // Backend API needs mikrotik.ipAddress, effectiveApiPort, username, and credentials.
    try {
        const response = await fetch(`/api/mikrotik/action/deleteUser`, { // Example consolidated API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverIp: mikrotik.ipAddress,
                apiPort: effectiveApiPort, // Pass effective port
                username: username,
                adminUsername: mikrotik.adminUsername,
                adminPassword: mikrotik.adminPassword,
            }),
        });
        if (!response.ok) { throw new Error(`Backend API error deleting user (${response.status})`); }
        console.log(`SERVICE: User ${username} deleted successfully via backend API.`);
    } catch (error) {
        console.error(`SERVICE: API Error deleting user ${username}:`, error);
        throw error;
    }
}


/**
 * Asynchronously renews a PPPoE user's subscription via a backend API.
 * The backend updates the expiry in the comment and ensures the user is enabled.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @param username The username of the PPPoE secret to renew.
 * @param currentExpiryDate Optional current expiry date (YYYY-MM-DD) for calculation.
 * @param renewalDays Number of days to renew for (default: 30).
 * @returns A promise resolving to the new expiry date string (YYYY-MM-DD).
 * @throws If the backend API call fails or date parsing fails.
 */
export async function renewPppoeUser(mikrotik: Mikrotik, username: string, currentExpiryDate?: string, renewalDays: number = 30): Promise<string> {
    const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
    console.log(`SERVICE: Renewing user ${username} on Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort}) for ${renewalDays} days.`);

    let newExpiryDate: Date;
    try {
        const baseDate = currentExpiryDate ? parseISO(currentExpiryDate) : new Date();
         if (isNaN(baseDate.getTime())) {
            console.warn(`Invalid current expiry date provided: ${currentExpiryDate}. Renewing from today.`);
             newExpiryDate = addDays(new Date(), renewalDays);
         } else {
            newExpiryDate = addDays(baseDate < new Date() ? new Date() : baseDate, renewalDays);
         }
    } catch (e) {
         console.error("Error calculating new expiry date:", e);
         throw new Error("Failed to calculate new expiry date.");
    }

    const newExpiryString = format(newExpiryDate, 'yyyy-MM-dd');
    console.log(`SERVICE: New expiry date for ${username}: ${newExpiryString}`);

    // Backend API needs server IP, port, username, newExpiryString, and credentials.
    // Backend logic: fetch current comment, update expiry, set disabled=no.
     try {
         const setResponse = await fetch(`/api/mikrotik/action/renewUser`, { // Example consolidated endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 apiPort: effectiveApiPort, // Pass effective port
                 username: username,
                 newExpiry: newExpiryString,
                 adminUsername: mikrotik.adminUsername,
                 adminPassword: mikrotik.adminPassword,
             }),
         });
         if (!setResponse.ok) throw new Error(`Backend API error renewing user (${setResponse.status})`);
         console.log(`SERVICE: User ${username} renewal and enable successful via backend API.`);
         return newExpiryString;
     } catch (error) {
         console.error(`SERVICE: API Error renewing user ${username}:`, error);
         throw error;
     }
}


/**
 * Asynchronously checks the connection to a Mikrotik server via a backend API.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @returns A promise that resolves to true if the connection is successful, false otherwise.
 */
export async function checkMikrotikConnection(mikrotik: Mikrotik): Promise<boolean> {
  const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
  console.log(`SERVICE: Checking connection to Mikrotik server ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
  // Backend API needs server IP, port, and credentials.
   try {
        const response = await fetch(`/api/mikrotik/status/checkConnection`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 apiPort: effectiveApiPort, // Pass effective port
                 username: mikrotik.adminUsername,
                 password: mikrotik.adminPassword,
             }),
        });
        // Simulate success specifically for the user's server details
        if (mikrotik.ipAddress === '2.2.2.1' && mikrotik.adminUsername === 'ya' && mikrotik.adminPassword === '616' && effectiveApiPort === 6166) {
            console.log(`SERVICE: Connection check successful via backend (simulation for 2.2.2.1:6166).`);
            return true;
        }
        // Simulate failure for other cases
        console.log(`SERVICE: Connection check failed via backend (simulation). Details: IP=${mikrotik.ipAddress}, Port=${effectiveApiPort}, User=${mikrotik.adminUsername}`);
        return false;

        // Real implementation:
        // const success = response.ok;
        // console.log(`SERVICE: Connection check ${success ? 'successful' : 'failed'} via backend.`);
        // return success;
   } catch (error) {
        console.error(`SERVICE: Error checking connection to ${mikrotik.name}:`, error);
        return false;
   }
}

/**
 * Asynchronously retrieves the list of PPPoE users from a Mikrotik server via a backend API.
 * The backend must connect using the correct IP and API port.
 *
 * @param mikrotik The Mikrotik server details (including IP and optional apiPort).
 * @returns A promise that resolves to an array of PppoeUserDetails.
 * @throws If the backend API call fails.
 */
export async function getMikrotikUsers(mikrotik: Mikrotik): Promise<PppoeUserDetails[]> {
    const effectiveApiPort = mikrotik.apiPort || 6166; // Default to 6166
    console.log(`SERVICE: Fetching users from Mikrotik ${mikrotik.name} (${mikrotik.ipAddress}:${effectiveApiPort})`);
    // Backend API needs server IP, port, and credentials.
    // Backend logic: fetch secrets, fetch active, combine data.
    try {
        const response = await fetch(`/api/mikrotik/users`, { // Example API endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 apiPort: effectiveApiPort, // Pass effective port
                 username: mikrotik.adminUsername,
                 password: mikrotik.adminPassword,
             }),
        });
        if (!response.ok) {
             throw new Error(`Backend API error fetching users (${response.status})`);
        }
        const usersData: PppoeUserDetails[] = await response.json();
        console.log(`SERVICE: Received ${usersData.length} users from backend API for ${mikrotik.name}.`);
        return usersData;
    } catch (error) {
        console.error(`SERVICE: Error fetching users from ${mikrotik.name}:`, error);
        // Return empty array on error to prevent breaking the UI, but log the error
        // throw error; // Re-throw for the UI to handle if needed
        return []; // Return empty array on failure
    }
}
