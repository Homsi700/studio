

/**
 * Data structure representing the information needed to add a new tower.
 * Aligns with the form data in AddTowerDialog.
 */
interface TowerData {
  name: string;
  ipAddress: string;
  type: "Mimosa" | "UBNT"; // Device brand/type from the form select
  username: string;
  password: string; // Handle securely!
  linkedServerName: string; // Name of the Mikrotik server it connects through/to
  signalWarningThreshold: number; // Signal level (dBm) to trigger a warning
  speed: string; // Speed profile/limit configuration
  towerType: "main" | "sub"; // Role of the tower (Main or Sub)
  notes?: string; // Optional notes
}

/**
 * Asynchronously adds a new tower (Mimosa or UBNT) to the system via a backend API call.
 * Placeholder function: Should verify connection and save details.
 *
 * @param towerData The data for the new tower, including credentials and configuration.
 * @returns A promise that resolves to true if the tower was added successfully, false otherwise.
 * @throws If the API call to the backend fails.
 */
export async function addTower(towerData: TowerData): Promise<boolean> {
  console.log(`SERVICE: Attempting to add tower: ${towerData.name} (${towerData.ipAddress}) - Type: ${towerData.type}`);
  console.log("Tower Data:", towerData);

  // TODO: Implement actual API call to the backend service
  // 1. Backend receives `towerData`.
  // 2. Backend attempts connection to `towerData.ipAddress` using credentials for the specific `towerData.type`.
  // 3. If connection successful, store tower details in the database.
  // 4. Return success or failure based on the outcome.

  try {
    /*
    const response = await fetch('/api/towers', { // Example backend API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(towerData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add tower and parse error.' }));
        console.error(`SERVICE: Failed to add tower ${towerData.name}. Status: ${response.status}`, errorData);
        throw new Error(errorData.message || `Failed to add tower ${towerData.name}`);
    }

    const result = await response.json();
    console.log("SERVICE: Tower added successfully via API (simulation).");
    return result.success;
    */
    console.log("SERVICE: Tower add API call simulated successfully.");
    return true; // Placeholder success

  } catch (error) {
    console.error(`SERVICE: Error calling backend API to add tower ${towerData.name}:`, error);
    throw error;
  }
}

/**
 * Asynchronously restarts a tower device (Mimosa or UBNT) via a backend API call.
 *
 * @param towerIp The IP address of the tower to restart.
 * @param towerType The type of the tower ('mimosa' or 'ubnt').
 * @returns A promise that resolves to true if the restart command was successfully sent, false otherwise.
 * @throws If the API call to the backend fails.
 */
export async function restartTowerDevice(towerIp: string, towerType: 'mimosa' | 'ubnt'): Promise<boolean> {
    console.log(`SERVICE: Attempting to restart ${towerType} tower ${towerIp}`);

    // TODO: Implement backend API call to trigger reboot command via the respective API (Mimosa/UBNT).
    // The backend needs the tower IP, type, and potentially credentials.
    try {
        /*
        const response = await fetch(`/api/towers/restart`, { // Example backend endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ towerIp: towerIp, towerType: towerType }), // Pass necessary info
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to send restart command.' }));
            console.error(`SERVICE: Failed to restart tower ${towerIp}. Status: ${response.status}`, errorData);
            throw new Error(errorData.message || `Failed to restart tower ${towerIp}`);
        }

        const result = await response.json();
        console.log(`SERVICE: Restart command sent to ${towerIp} successfully via API (simulation).`);
        return result.success;
        */
        console.log(`SERVICE: Restart command API call simulated for ${towerIp}.`);
        return true; // Placeholder success

    } catch (error) {
        console.error(`SERVICE: Error calling backend API to restart tower ${towerIp}:`, error);
        throw error;
    }
}
