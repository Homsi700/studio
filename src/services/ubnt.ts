/**
 * Represents a UBNT tower.
 */
export interface Ubnt {
  /**
   * The name of the tower.
   */
  name: string;
  /**
   * The IP address of the tower.
   */
  ipAddress: string;
}

/**
 * Asynchronously gets the signal strength of a UBNT tower.
 *
 * @param ubnt The UBNT tower to get the signal strength from.
 * @returns A promise that resolves to the signal strength.
 */
export async function getUbntSignalStrength(ubnt: Ubnt): Promise<number> {
  // TODO: Implement this by calling an API.
  console.log(`Getting signal strength from UBNT tower ${ubnt.name}`);
  return 90;
}
