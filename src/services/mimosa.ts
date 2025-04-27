/**
 * Represents a Mimosa tower.
 */
export interface Mimosa {
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
 * Asynchronously gets the signal strength of a Mimosa tower.
 *
 * @param mimosa The Mimosa tower to get the signal strength from.
 * @returns A promise that resolves to the signal strength.
 */
export async function getMimosaSignalStrength(mimosa: Mimosa): Promise<number> {
  // TODO: Implement this by calling an API.
  console.log(`Getting signal strength from Mimosa tower ${mimosa.name}`);
  return 80;
}
