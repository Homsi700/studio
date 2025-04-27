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
}

/**
 * Represents a PPPoE user.
 */
export interface PppoeUser {
  /**
   * The username of the PPPoE user.
   */
  username: string;
  /**
   * The password of the PPPoE user.
   */
  password: string;
  /**
   * The speed of the PPPoE user.
   */
  speed: string;
  /**
   * The expiry date of the PPPoE user.
   */
  expiry: string;
}

/**
 * Asynchronously adds a PPPoE user to a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server to add the user to.
 * @param user The PPPoE user to add.
 * @returns A promise that resolves when the user is added.
 */
export async function addPppoeUser(mikrotik: Mikrotik, user: PppoeUser): Promise<void> {
  // TODO: Implement this by calling an API.
  console.log(`Adding user ${user.username} to Mikrotik server ${mikrotik.name}`);
}

/**
 * Asynchronously checks the connection to a Mikrotik server.
 *
 * @param mikrotik The Mikrotik server to check the connection to.
 * @returns A promise that resolves to true if the connection is successful, false otherwise.
 */
export async function checkMikrotikConnection(mikrotik: Mikrotik): Promise<boolean> {
  // TODO: Implement this by calling an API.
  console.log(`Checking connection to Mikrotik server ${mikrotik.name}`);
  return true;
}
