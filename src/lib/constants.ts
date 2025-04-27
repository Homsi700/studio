
// Signal strength thresholds (dBm)
export const SIGNAL_STRENGTH_THRESHOLD_WARN = -70; // Weak signal warning
export const SIGNAL_STRENGTH_THRESHOLD_ERROR = -80; // Critical/disconnected signal

// Traffic threshold for warning (e.g., in Mbps)
export const TRAFFIC_THRESHOLD_WARN = 80.0; // Example: Warn if traffic exceeds 80 Mbps

// Example dummy data structures matching service interfaces
export const MOCK_MIKROTIK_SERVERS = [
  { name: 'Main Router', ipAddress: '192.168.88.1' },
  { name: 'Branch Router', ipAddress: '10.0.0.1' },
  { name: 'Office Router', ipAddress: '172.16.0.1' },
];

export const MOCK_MIMOSA_TOWERS = [
  { name: 'Tower A (Mimosa)', ipAddress: '192.168.1.20' },
  { name: 'Tower D (Mimosa)', ipAddress: '192.168.1.23' },
];

export const MOCK_UBNT_TOWERS = [
  { name: 'Tower B (UBNT)', ipAddress: '192.168.1.21' },
  { name: 'Tower C (UBNT)', ipAddress: '192.168.1.22' },
];
