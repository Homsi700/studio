export const SIGNAL_STRENGTH_THRESHOLD_WARN = -70; // Example threshold for weak signal (dBm)
export const SIGNAL_STRENGTH_THRESHOLD_ERROR = -80; // Example threshold for very weak/disconnected signal (dBm)

// Example dummy data structures matching service interfaces
export const MOCK_MIKROTIK_SERVERS = [
  { name: 'Main Router', ipAddress: '192.168.88.1' },
  { name: 'Branch Router', ipAddress: '10.0.0.1' },
];

export const MOCK_MIMOSA_TOWERS = [
  { name: 'Tower A (Mimosa)', ipAddress: '192.168.1.20' },
];

export const MOCK_UBNT_TOWERS = [
  { name: 'Tower B (UBNT)', ipAddress: '192.168.1.21' },
  { name: 'Tower C (UBNT)', ipAddress: '192.168.1.22' },
];
