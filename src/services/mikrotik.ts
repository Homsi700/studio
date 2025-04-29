import type { PppoeUserDetails } from "@/types"; // Import detailed user type
import { addDays, format } from 'date-fns'; // Import date-fns for renewal

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

  // Construct comment with expiry if provided
   let comment = userPayload.comment || '';
   if (expiryDate) {
     comment = `Expiry:${expiryDate};${comment}`; // Prepend expiry info
   }
   const finalPayload = { ...userPayload, comment: comment.trim() };
    console.log("Final Payload with Comment:", finalPayload);


  // TODO: Implement actual API call to Mikrotik `/ppp secret add`
  // Send `finalPayload` (including the comment with expiry)
  /*
  try {
    const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret`, { // Example API endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Removed invalid block comment
      body: JSON.stringify({
        name: finalPayload.username, // Ensure API field name is correct
        password: finalPayload.password,
        profile: finalPayload.profile,
        service: finalPayload.service || 'pppoe', // Default service if not provided
        comment: finalPayload.comment,
        // Add other fields like localAddress, remoteAddress if needed
      }),
    });
    if (!response.ok) { throw new Error(`Mikrotik API error (${response.status})`); }
    console.log(`SERVICE: User ${userPayload.username} added successfully via API.`);
  } catch (error) {
    console.error(`SERVICE: API Error adding PPPoE user ${userPayload.username}:`, error);
    throw error;
  }
  */

  // Simulate success for now
  await new Promise(resolve => setTimeout(resolve, 500));
   // Simulate potential failure
   if (userPayload.username === 'failme') {
       console.error(`SERVICE: Simulated failure adding user ${userPayload.username}`);
       throw new Error(`Simulated API error: Could not add user '${userPayload.username}'.`);
   }

    // Update mock data if necessary (for local testing without backend)
    const newUserDetail: PppoeUserDetails = {
       username: userPayload.username,
       serverName: mikrotik.name,
       status: 'offline', // New users start offline
       speed: userPayload.profile,
       registrationDate: format(new Date(), 'yyyy-MM-dd'),
       expiryDate: expiryDate || undefined,
       disabled: false, // New users are enabled by default
       comment: finalPayload.comment
    };
    // Add to mock data (ensure MOCK_USERS is mutable)
    MOCK_USERS.push(newUserDetail);

  console.log(`SERVICE: User ${userPayload.username} added successfully (simulation).`);
}

/**
 * Asynchronously enables a PPPoE user secret on a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server.
 * @param username The username of the PPPoE secret to enable.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the API call fails.
 */
export async function enablePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    console.log(`SERVICE: Enabling user ${username} on Mikrotik ${mikrotik.name}`);
    // TODO: Implement actual API call: `/ppp secret enable [find name=username]`
    /*
    try {
        const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret/enable`, { // Example API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Removed inline comment
            body: JSON.stringify({ name: username }), // Send username to identify the secret
        });
        if (!response.ok) { throw new Error(`Mikrotik API error (${response.status})`); }
        console.log(`SERVICE: User ${username} enabled successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error enabling user ${username}:`, error);
        throw error;
    }
    */
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

    // Update mock data (find user and set disabled: false)
    const userIndex = MOCK_USERS.findIndex(u => u.username === username && u.serverName === mikrotik.name);
    if (userIndex > -1) {
        MOCK_USERS[userIndex].disabled = false;
        console.log(`SERVICE: User ${username} enabled in mock data.`);
    } else {
         console.warn(`SERVICE: User ${username} not found in mock data for enabling.`);
         throw new Error(`User ${username} not found.`); // Simulate API failure
    }
}

/**
 * Asynchronously disables a PPPoE user secret on a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server.
 * @param username The username of the PPPoE secret to disable.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the API call fails.
 */
export async function disablePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    console.log(`SERVICE: Disabling user ${username} on Mikrotik ${mikrotik.name}`);
    // TODO: Implement actual API call: `/ppp secret disable [find name=username]`
     /*
    try {
        const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret/disable`, { // Example API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Removed inline comment
            body: JSON.stringify({ name: username }), // Send username to identify the secret
        });
        if (!response.ok) { throw new Error(`Mikrotik API error (${response.status})`); }
        console.log(`SERVICE: User ${username} disabled successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error disabling user ${username}:`, error);
        throw error;
    }
    */
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

    // Update mock data (find user and set disabled: true)
     const userIndex = MOCK_USERS.findIndex(u => u.username === username && u.serverName === mikrotik.name);
    if (userIndex > -1) {
        MOCK_USERS[userIndex].disabled = true;
        MOCK_USERS[userIndex].status = 'offline'; // Disabling often disconnects user
        MOCK_USERS[userIndex].ipAddress = undefined;
        MOCK_USERS[userIndex].uptime = undefined;
        console.log(`SERVICE: User ${username} disabled in mock data.`);
    } else {
         console.warn(`SERVICE: User ${username} not found in mock data for disabling.`);
         throw new Error(`User ${username} not found.`); // Simulate API failure
    }
}

/**
 * Asynchronously deletes a PPPoE user secret from a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server.
 * @param username The username of the PPPoE secret to delete.
 * @returns A promise that resolves when the operation is complete.
 * @throws If the API call fails.
 */
export async function deletePppoeUser(mikrotik: Mikrotik, username: string): Promise<void> {
    console.log(`SERVICE: Deleting user ${username} from Mikrotik ${mikrotik.name}`);
    // TODO: Implement actual API call: `/ppp secret remove [find name=username]`
    /*
    try {
        const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret/remove`, { // Example API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Removed inline comment
            body: JSON.stringify({ name: username }), // Send username to identify the secret
        });
        if (!response.ok) { throw new Error(`Mikrotik API error (${response.status})`); }
        console.log(`SERVICE: User ${username} deleted successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error deleting user ${username}:`, error);
        throw error;
    }
    */
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    // Update mock data (remove user)
    const initialLength = MOCK_USERS.length;
    MOCK_USERS = MOCK_USERS.filter(u => !(u.username === username && u.serverName === mikrotik.name));
    if (MOCK_USERS.length < initialLength) {
        console.log(`SERVICE: User ${username} removed from mock data.`);
    } else {
        console.warn(`SERVICE: User ${username} not found in mock data for deletion.`);
        throw new Error(`User ${username} not found.`); // Simulate API failure
    }
}


/**
 * Asynchronously renews a PPPoE user's subscription (e.g., updates expiry in comment).
 *
 * @param mikrotik The Mikrotik server.
 * @param username The username of the PPPoE secret to renew.
 * @param currentExpiryDate Optional current expiry date (YYYY-MM-DD) for calculation.
 * @param renewalDays Number of days to renew for (default: 30).
 * @returns A promise resolving to the new expiry date string (YYYY-MM-DD).
 * @throws If the API call fails or date parsing fails.
 */
export async function renewPppoeUser(mikrotik: Mikrotik, username: string, currentExpiryDate?: string, renewalDays: number = 30): Promise<string> {
    console.log(`SERVICE: Renewing user ${username} on Mikrotik ${mikrotik.name} for ${renewalDays} days.`);

    let newExpiryDate: Date;
    try {
        // Calculate new expiry date based on current expiry or today
        const baseDate = currentExpiryDate ? new Date(currentExpiryDate) : new Date();
         if (isNaN(baseDate.getTime())) { // Handle invalid currentExpiryDate
            console.warn(`Invalid current expiry date provided: ${currentExpiryDate}. Renewing from today.`);
             newExpiryDate = addDays(new Date(), renewalDays);
         } else {
            // If current expiry is in the past, renew from today, otherwise add to current expiry
            newExpiryDate = addDays(baseDate < new Date() ? new Date() : baseDate, renewalDays);
         }

    } catch (e) {
         console.error("Error calculating new expiry date:", e);
         throw new Error("Failed to calculate new expiry date.");
    }


    const newExpiryString = format(newExpiryDate, 'yyyy-MM-dd');
    console.log(`SERVICE: New expiry date for ${username}: ${newExpiryString}`);

    // TODO: Implement actual API call: `/ppp secret set [find name=username] comment="Expiry:YYYY-MM-DD;[rest of comment]"`
    // 1. Get the current comment for the user.
    // 2. Parse the comment to find existing expiry and other notes.
    // 3. Construct the new comment with the updated expiry date.
    // 4. Make the API call to update the comment.
    /*
     try {
         // Step 1: Get current secret details (including comment) - hypothetical endpoint
         const getResponse = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret?name=${username}`);
         if (!getResponse.ok) throw new Error('Failed to get current user details');
         const userData = await getResponse.json(); // Assuming API returns details including comment
         const currentComment = userData.comment || '';

         // Step 2 & 3: Construct new comment
         const commentParts = currentComment.split(';').filter(part => !part.toLowerCase().startsWith('expiry:'));
         const newComment = `Expiry:${newExpiryString};${commentParts.join(';')}`.trim();

         // Step 4: Update the secret
         const setResponse = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret/set`, { // Example endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' }, // Removed inline comment
             body: JSON.stringify({ name: username, comment: newComment }),
         });
         if (!setResponse.ok) throw new Error(`Mikrotik API error updating comment (${setResponse.status})`);

         console.log(`SERVICE: User ${username} expiry updated successfully via API.`);
         return newExpiryString; // Return the calculated new expiry date

     } catch (error) {
         console.error(`SERVICE: API Error renewing user ${username}:`, error);
         throw error;
     }
    */
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay

    // Update mock data
     const userIndex = MOCK_USERS.findIndex(u => u.username === username && u.serverName === mikrotik.name);
     if (userIndex > -1) {
         // Update comment in mock data
         const currentComment = MOCK_USERS[userIndex].comment || '';
         const commentParts = currentComment.split(';').filter(part => !part.toLowerCase().startsWith('expiry:'));
         const newComment = `Expiry:${newExpiryString};${commentParts.join(';')}`.trim();

         MOCK_USERS[userIndex].expiryDate = newExpiryString;
         MOCK_USERS[userIndex].comment = newComment;
         MOCK_USERS[userIndex].disabled = false; // Ensure user is enabled on renewal
         console.log(`SERVICE: User ${username} renewed in mock data. New expiry: ${newExpiryString}`);
          return newExpiryString;
     } else {
          console.warn(`SERVICE: User ${username} not found in mock data for renewal.`);
          throw new Error(`User ${username} not found for renewal.`); // Simulate API failure if user not found
     }
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
 * Asynchronously retrieves the list of PPPoE users (secrets and active status) from a Mikrotik server.
 * (Simulated - returns mock data, combining secret and active info)
 *
 * @param mikrotik The Mikrotik server to query.
 * @returns A promise that resolves to an array of PppoeUserDetails.
 */
export async function getMikrotikUsers(mikrotik: Mikrotik): Promise<PppoeUserDetails[]> {
    console.log(`SERVICE: Fetching users from Mikrotik ${mikrotik.name} (${mikrotik.ipAddress})`);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    // TODO: Implement actual API calls:
    // 1. Fetch all secrets: `/ppp secret print` (get username, profile, comment, disabled status)
    // 2. Fetch all active connections: `/ppp active print` (get username, ip, uptime, mac)
    // 3. Combine the data: Iterate secrets, find matching active connection if exists.

    console.log(`SERVICE: Returning combined mock user data for ${mikrotik.name}.`);

    // Simulate combining data for users on the specified server
    return MOCK_USERS
        .filter(userSecret => userSecret.serverName === mikrotik.name) // Filter secrets for this server
        .map(userSecret => {
            // Simulate finding active connection (e.g., based on username and 'online' status in mock)
            const isActive = MOCK_ACTIVE_CONNECTIONS.find(
                active => active.name === userSecret.username && active.serverName === mikrotik.name
            );

            // Extract expiry from comment if present
            const commentExpiryMatch = userSecret.comment?.match(/Expiry:(\d{4}-\d{2}-\d{2})/);
            const expiryDate = commentExpiryMatch ? commentExpiryMatch[1] : userSecret.expiryDate; // Use comment date if found

            return {
                ...userSecret,
                status: isActive ? 'online' : 'offline',
                ipAddress: isActive ? isActive.address : undefined,
                macAddress: isActive ? isActive['caller-id'] : undefined, // Mikrotik often uses 'caller-id' for MAC
                uptime: isActive ? isActive.uptime : undefined,
                expiryDate: expiryDate, // Use potentially updated expiry
                disabled: userSecret.disabled ?? false, // Default to false if undefined
            };
        });
}


// --- MOCK DATA ---
// Represents data typically retrieved from `/ppp secret print`
// Needs to be mutable (let) to allow adding/deleting users in simulation
export let MOCK_USERS: PppoeUserDetails[] = [
    {
        username: 'user1',
        serverName: 'Main Router', // Link to a mock server
        status: 'offline', // Base status from secret
        speed: '10M/5M',
        registrationDate: '2024-01-15',
        expiryDate: '2025-01-14', // Stored expiry (might be in comment too)
        disabled: false,
        comment: "Expiry:2025-01-14;John Doe",
    },
    {
        username: 'customer_xyz',
        serverName: 'Main Router',
        status: 'offline',
        speed: '20M/10M',
        registrationDate: '2023-11-01',
        expiryDate: '2024-10-31',
        disabled: false,
        comment: "Expiry:2024-10-31",
    },
    {
        username: 'test_user',
        serverName: 'Branch Router', // Link to another mock server
        status: 'offline',
        speed: '5M/1M',
        registrationDate: '2024-05-01',
        expiryDate: '2024-06-30', // Updated expiry
        disabled: false,
         comment: "Expiry:2024-06-30;Test Account",
    },
    {
        username: 'expired_user',
        serverName: 'Main Router',
        status: 'offline',
        speed: '1M/1M',
        registrationDate: '2023-01-01',
        expiryDate: '2024-01-01', // Expired
        disabled: true, // Often disabled when expired
        comment: "Expiry:2024-01-01;Expired",
    },
     {
        username: 'disabled_user',
        serverName: 'Main Router',
        status: 'offline',
        speed: '5M/5M',
        registrationDate: '2024-03-01',
        expiryDate: '2025-03-01',
        disabled: true, // Manually disabled
        comment: "Expiry:2025-03-01;Admin Disabled",
    },
];

// Represents data typically retrieved from `/ppp active print`
// Note: This only shows *currently* connected users.
const MOCK_ACTIVE_CONNECTIONS = [
    { name: 'user1', service: 'pppoe', address: '10.10.10.101', uptime: '3d 4h 15m', 'caller-id': '00:11:22:33:44:55', serverName: 'Main Router' },
    { name: 'test_user', service: 'pppoe', address: '10.20.20.201', uptime: '0h 55m', 'caller-id': 'AA:BB:CC:DD:EE:FF', serverName: 'Branch Router' },
    // 'customer_xyz', 'expired_user', 'disabled_user' are not in active connections as they are offline/disabled
];
