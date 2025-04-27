
import type { PppoeUserDetails } from "@/types"; // Import detailed user type

/**
 * Represents a Mikrotik server.
 */
export interface Mikrotik {
  /**
   * The name of the server.
   */
  name: string;
  /**
   * The IP address of the server.
   */
  ipAddress: string;
  // Add username/password if needed for API calls, handle securely
   adminUsername?: string;
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
 * Asynchronously adds a PPPoE user secret to a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server to add the user to.
 * @param userPayload The PPPoE user data matching API parameters.
 * @param expiryDate Optional expiry date string (YYYY-MM-DD). Handling depends on backend implementation.
 * @returns A promise that resolves when the user is added successfully.
 * @throws If the API call fails.
 */
export async function addPppoeUser(mikrotik: Mikrotik, userPayload: PppoeUserPayload, expiryDate?: string): Promise<void> {
  console.log(`SERVICE: Adding user ${userPayload.username} to Mikrotik ${mikrotik.name} (${mikrotik.ipAddress})`);
  console.log("Payload:", userPayload);
  if (expiryDate) {
    console.log("Expiry Date:", expiryDate);
  }

  // TODO: Implement actual API call to Mikrotik
  // Example using a hypothetical fetch-based API client:
  /*
  try {
    const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers if needed (using mikrotik.adminUsername/Password)
      },
      body: JSON.stringify({
          ...userPayload,
          name: userPayload.username, // Map username to 'name' if API requires
          // Potentially add expiry handling logic here or in the backend API route
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Mikrotik API error (${response.status}): ${errorData.message || 'Failed to add user'}`);
    }
    console.log(`SERVICE: User ${userPayload.username} added successfully.`);

     // If expiryDate is provided, potentially make another API call to schedule deactivation
     if (expiryDate) {
         console.log(`SERVICE: Scheduling deactivation for ${userPayload.username} on ${expiryDate}`);
         // await scheduleUserDeactivation(mikrotik, userPayload.username, expiryDate);
     }

  } catch (error) {
    console.error(`SERVICE: Error adding PPPoE user ${userPayload.username}:`, error);
    throw error; // Re-throw the error to be caught by the calling component
  }
  */

  // Simulate success for now
  await new Promise(resolve => setTimeout(resolve, 500));
   // Simulate potential failure
   if (userPayload.username === 'failme') {
       console.error(`SERVICE: Simulated failure adding user ${userPayload.username}`);
       throw new Error(`Simulated API error: Could not add user '${userPayload.username}'.`);
   }
  console.log(`SERVICE: User ${userPayload.username} added successfully (simulation).`);
}

/**
 * Asynchronously checks the connection to a Mikrotik server.
 * (Simulated - returns true after a short delay)
 *
 * @param mikrotik The Mikrotik server to check the connection to.
 * @returns A promise that resolves to true if the connection is successful, false otherwise.
 */
export async function checkMikrotikConnection(mikrotik: Mikrotik): Promise<boolean> {
  console.log(`SERVICE: Checking connection to Mikrotik server ${mikrotik.name} (${mikrotik.ipAddress})`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  // Simulate occasional failure for testing
  const success = Math.random() > 0.1; // 90% chance of success
  console.log(`SERVICE: Connection check ${success ? 'successful' : 'failed'} (simulation).`);
  return success;
}

/**
 * Asynchronously retrieves the list of active PPPoE users from a Mikrotik server.
 * (Simulated - returns mock data)
 *
 * @param mikrotik The Mikrotik server to query.
 * @returns A promise that resolves to an array of PppoeUserDetails.
 */
export async function getMikrotikUsers(mikrotik: Mikrotik): Promise<PppoeUserDetails[]> {
    console.log(`SERVICE: Fetching users from Mikrotik ${mikrotik.name} (${mikrotik.ipAddress})`);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    // TODO: Implement actual API call to fetch active users (`/ppp active print`)
    // and potentially cross-reference with secrets (`/ppp secret print`) for expiry etc.

    console.log(`SERVICE: Returning mock user data for ${mikrotik.name}.`);
    // Return MOCK_USERS filtered by server name or just return all for now
    return MOCK_USERS.filter(user => user.serverName === mikrotik.name || MOCK_USERS.length < 5); // Simulate getting users for this server or all if few total
}


// --- MOCK DATA ---
// Should be replaced by actual API calls eventually
export const MOCK_USERS: PppoeUserDetails[] = [
    {
        username: 'user1',
        serverName: 'Main Router', // Link to a mock server
        status: 'online',
        speed: '10M/5M',
        registrationDate: '2024-01-15',
        expiryDate: '2025-01-14',
        ipAddress: '10.10.10.101',
        macAddress: '00:11:22:33:44:55',
        uptime: '3d 4h 15m',
    },
    {
        username: 'customer_xyz',
        serverName: 'Main Router',
        status: 'offline',
        speed: '20M/10M',
        registrationDate: '2023-11-01',
        expiryDate: '2024-10-31',
    },
    {
        username: 'test_user',
        serverName: 'Branch Router', // Link to another mock server
        status: 'online',
        speed: '5M/1M',
        registrationDate: '2024-05-01',
        expiryDate: '2024-05-31', // Near expiry
        ipAddress: '10.20.20.201',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        uptime: '0h 55m',
    },
    {
        username: 'expired_user',
        serverName: 'Main Router',
        status: 'offline',
        speed: '1M/1M',
        registrationDate: '2023-01-01',
        expiryDate: '2024-01-01', // Expired
    },
];
