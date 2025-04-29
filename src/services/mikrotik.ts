
import type { PppoeUserDetails } from "@/types"; // Import detailed user type
import { addDays, format, differenceInDays, parseISO } from 'date-fns'; // Import date-fns for renewal and difference calculation

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
 * Automatically disables the user if the duration between creation and expiry is 30 days or less.
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

  const registrationDate = new Date(); // User is created now
  // const registrationDateString = format(registrationDate, 'yyyy-MM-dd'); // Not needed for API call itself

  // Construct comment with expiry if provided
   let comment = userPayload.comment || '';
   if (expiryDate) {
     comment = `Expiry:${expiryDate};${comment}`; // Prepend expiry info
   }
   const finalPayload = { ...userPayload, comment: comment.trim() };
    console.log("Final Payload with Comment:", finalPayload);


  // TODO: Implement actual API call to Mikrotik `/ppp secret add`
  // Send `finalPayload` (including the comment with expiry)
  // This API call should happen *before* the disable check, ideally returning the ID or confirming success.

  try {
    /*
    const response = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret`, { // Example API endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Add Authorization headers here if needed, e.g., 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: finalPayload.username, // Ensure API field name is correct
        password: finalPayload.password,
        profile: finalPayload.profile,
        service: finalPayload.service || 'pppoe', // Default service if not provided
        comment: finalPayload.comment,
        // Add other fields like localAddress, remoteAddress if needed
      }),
    });
    if (!response.ok) { throw new Error(`Mikrotik API error adding user (${response.status})`); }
    console.log(`SERVICE: User ${userPayload.username} added successfully via API.`);
    */
    console.log(`SERVICE: Simulated API call to add user ${userPayload.username}.`);
    // --- Automatic Disabling Check ---
     let isDisabled = false;
     if (expiryDate) {
         try {
             const expiry = parseISO(expiryDate);
             const durationDays = differenceInDays(expiry, registrationDate);
             console.log(`SERVICE: User ${userPayload.username} duration: ${durationDays} days.`);
             if (durationDays <= 30) {
                 console.warn(`SERVICE: User ${userPayload.username} has a duration of ${durationDays} days (<= 30). Disabling automatically.`);
                 // Ideally, the add API would support adding as disabled,
                 // otherwise, make a second call to disable.
                 await disablePppoeUser(mikrotik, userPayload.username); // Call disable function
                 isDisabled = true;
             }
         } catch (e) {
             console.error(`SERVICE: Could not parse expiry date "${expiryDate}" for automatic disabling check.`, e);
             // Decide if this should throw an error or just log
         }
     }
     console.log(`SERVICE: User ${userPayload.username} added/checked for disable. Disabled: ${isDisabled}`);

  } catch (error) {
    console.error(`SERVICE: API Error adding PPPoE user ${userPayload.username}:`, error);
    throw error; // Re-throw to be caught by the caller
  }


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
    // The backend API needs to receive the mikrotik details (ip, credentials) and username.

    try {

        const response = await fetch(`/api/mikrotik/action/enableUser`, { // Example consolidated API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverIp: mikrotik.ipAddress,
                // Include auth details securely if needed by backend
                username: username,
                adminUsername: mikrotik.adminUsername, // Pass admin credentials if needed
                adminPassword: mikrotik.adminPassword,
            }),
        });
        if (!response.ok) { throw new Error(`Mikrotik API error enabling user (${response.status})`); }

        console.log(`SERVICE: User ${username} enabled successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error enabling user ${username}:`, error);
        throw error;
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
    // The backend API needs to receive the mikrotik details (ip, credentials) and username.

     try {

        const response = await fetch(`/api/mikrotik/action/disableUser`, { // Example consolidated API endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 // Include auth details securely if needed by backend
                 username: username,
                 adminUsername: mikrotik.adminUsername,
                 adminPassword: mikrotik.adminPassword,
             }),
        });
        if (!response.ok) { throw new Error(`Mikrotik API error disabling user (${response.status})`); }

        console.log(`SERVICE: User ${username} disabled successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error disabling user ${username}:`, error);
        throw error;
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
    // The backend API needs to receive the mikrotik details (ip, credentials) and username.

    try {

        const response = await fetch(`/api/mikrotik/action/deleteUser`, { // Example consolidated API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverIp: mikrotik.ipAddress,
                // Include auth details securely if needed by backend
                username: username,
                adminUsername: mikrotik.adminUsername,
                adminPassword: mikrotik.adminPassword,
            }),
        });
        if (!response.ok) { throw new Error(`Mikrotik API error deleting user (${response.status})`); }

        console.log(`SERVICE: User ${username} deleted successfully via API.`);
    } catch (error) {
        console.error(`SERVICE: API Error deleting user ${username}:`, error);
        throw error;
    }

}


/**
 * Asynchronously renews a PPPoE user's subscription (e.g., updates expiry in comment).
 * Also ensures the user is enabled after renewal.
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
        const baseDate = currentExpiryDate ? parseISO(currentExpiryDate) : new Date(); // Use parseISO for better date handling
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

    // TODO: Implement actual API call to update comment and ensure user is enabled:
    // 1. Get the current comment for the user.
    // 2. Parse the comment to find existing expiry and other notes.
    // 3. Construct the new comment with the updated expiry date.
    // 4. Make the API call to `/ppp secret set [find name=username] comment="newComment" disabled=no`
    //    This single API call updates the comment and ensures the user is enabled.

     try {

         // Step 1: Get current secret details (optional if backend handles parsing)
         // const getResponse = await fetch(`/api/mikrotik/${mikrotik.ipAddress}/ppp/secret?name=${username}`);
         // if (!getResponse.ok) throw new Error('Failed to get current user details');
         // const userData = await getResponse.json();
         // const currentComment = userData.comment || '';

         // Construct new comment (backend could also do this)
         // const commentParts = currentComment.split(';').filter(part => !part.toLowerCase().startsWith('expiry:'));
         // const newComment = `Expiry:${newExpiryString};${commentParts.join(';')}`.trim();

         // Update the secret comment AND set disabled=no
         const setResponse = await fetch(`/api/mikrotik/action/renewUser`, { // Example consolidated endpoint
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 // Include auth details securely if needed by backend
                 username: username,
                 newExpiry: newExpiryString, // Send the new expiry date
                 adminUsername: mikrotik.adminUsername,
                 adminPassword: mikrotik.adminPassword,
                 // Backend logic would fetch current comment, update it, and set disabled=no
             }),
         });
         if (!setResponse.ok) throw new Error(`Mikrotik API error renewing user (${setResponse.status})`);


         console.log(`SERVICE: User ${username} renewal and enable successful via API.`);
         return newExpiryString; // Return the calculated new expiry date

     } catch (error) {
         console.error(`SERVICE: API Error renewing user ${username}:`, error);
         throw error;
     }

}


/**
 * Asynchronously checks the connection to a Mikrotik server.
 * (Placeholder - requires real API implementation)
 *
 * @param mikrotik The Mikrotik server to check the connection to.
 * @returns A promise that resolves to true if the connection is successful, false otherwise.
 */
export async function checkMikrotikConnection(mikrotik: Mikrotik): Promise<boolean> {
  console.log(`SERVICE: Checking connection to Mikrotik server ${mikrotik.name} (${mikrotik.ipAddress})`);
  // TODO: Implement actual API call to check connection (e.g., simple command like `/system resource print`)
  // The backend needs to handle the connection attempt with provided credentials.
   try {

        const response = await fetch(`/api/mikrotik/status/checkConnection`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 username: mikrotik.adminUsername,
                 password: mikrotik.adminPassword, // Handle securely!
             }),
        });
        const success = response.ok;

        console.log(`SERVICE: Connection check ${success ? 'successful' : 'failed'}.`);
        return success;
   } catch (error) {
        console.error(`SERVICE: Error checking connection to ${mikrotik.name}:`, error);
        return false;
   }
}

/**
 * Asynchronously retrieves the list of PPPoE users (secrets and active status) from a Mikrotik server.
 * (Placeholder - requires real API implementation)
 *
 * @param mikrotik The Mikrotik server to query.
 * @returns A promise that resolves to an array of PppoeUserDetails.
 */
export async function getMikrotikUsers(mikrotik: Mikrotik): Promise<PppoeUserDetails[]> {
    console.log(`SERVICE: Fetching users from Mikrotik ${mikrotik.name} (${mikrotik.ipAddress})`);

    // TODO: Implement actual API calls:
    // 1. Fetch all secrets: `/ppp secret print` (get username, profile, comment, disabled status)
    // 2. Fetch all active connections: `/ppp active print` (get username, ip, uptime, mac)
    // 3. Combine the data: Iterate secrets, find matching active connection if exists.
    // The backend API should handle these calls and the data combination logic.

    try {

        const response = await fetch(`/api/mikrotik/users`, { // Example API endpoint
             method: 'POST', // Or GET if params are in URL
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 serverIp: mikrotik.ipAddress,
                 username: mikrotik.adminUsername,
                 password: mikrotik.adminPassword, // Handle securely!
             }),
        });
        if (!response.ok) {
             throw new Error(`Mikrotik API error fetching users (${response.status})`);
        }
        const usersData: PppoeUserDetails[] = await response.json();
        console.log(`SERVICE: Received ${usersData.length} users from API for ${mikrotik.name}.`);
        return usersData;


        // console.log(`SERVICE: Returning empty user list for ${mikrotik.name} (API simulation).`);
        // return []; // Return empty array as placeholder

    } catch (error) {
        console.error(`SERVICE: Error fetching users from ${mikrotik.name}:`, error);
        throw error; // Re-throw for the UI to handle
    }
}


// --- MOCK DATA (Removed - rely on actual API calls) ---
// export let MOCK_USERS: PppoeUserDetails[] = [...];
// const MOCK_ACTIVE_CONNECTIONS = [...];

    