
import type { Mikrotik } from "@/services/mikrotik";
import type { Mimosa } from "@/services/mimosa";
import type { Ubnt } from "@/services/ubnt";

export type AlertState = 'normal' | 'warning' | 'error';

export interface NetworkDeviceStatus {
  connected: boolean;
  signalStrength?: number; // Optional, only for towers
  users?: number; // Optional, only for Mikrotik servers
  uploadSpeed?: string; // Optional, example placeholder
  downloadSpeed?: string; // Optional, example placeholder
  alertState: AlertState; // State for visual indication (e.g., card border/glow)
}

export type DeviceType = 'mikrotik' | 'mimosa' | 'ubnt';

// Combined device type used in the main page state
export type NetworkDevice =
  | ({ type: 'mikrotik' } & Mikrotik)
  | ({ type: 'mimosa' } & Mimosa)
  | ({ type: 'ubnt' } & Ubnt);

// Props for the DeviceCard component
export interface DeviceCardProps {
  device: NetworkDevice; // Use the combined type
  type: DeviceType; // Keep type for specific logic if needed, though derivable from device.type
  status: NetworkDeviceStatus;
  deviceId: string; // Unique identifier for the device (e.g., 'mikrotik-192.168.88.1')
  onRestart: () => void; // Callback for restarting the device
  onViewDetails: () => void; // Callback for viewing full status/details
  onOpenWebInterface: () => void; // Callback for opening the device's web UI
  onDelete: (deviceId: string) => void; // Callback for deleting the device card
}

// Details for displaying individual PPPoE user information
export interface PppoeUserDetails {
    username: string;
    serverName: string; // Server the user is connected to
    status: 'online' | 'offline';
    speed: string; // Current profile/speed
    registrationDate: string; // Date user was added
    expiryDate: string; // Date subscription expires
    ipAddress?: string; // Current IP if online
    macAddress?: string; // MAC Address
    uptime?: string; // Connection duration if online
}
