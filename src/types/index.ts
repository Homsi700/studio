
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

export interface DeviceCardProps {
  device: Mikrotik | Mimosa | Ubnt;
  type: DeviceType;
  status: NetworkDeviceStatus;
  onRestart: () => void; // Callback for restarting the device
  onViewDetails: () => void; // Callback for viewing full status/details
  onOpenWebInterface: () => void; // Callback for opening the device's web UI
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
