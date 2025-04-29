import type { Mikrotik } from "./mikrotik";
import type { Mimosa } from "./mimosa";
import type { Ubnt } from "./ubnt";

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
    serverName: string; // Server the user is configured on (from PPP Secret)
    status: 'online' | 'offline'; // Actual connection status from PPP Active
    speed: string; // Current profile/speed (from PPP Secret)
    registrationDate?: string; // Date user was added (might be from comment or DB)
    expiryDate?: string; // Date subscription expires (might be from comment or DB)
    ipAddress?: string; // Current IP if online
    macAddress?: string; // MAC Address if available
    uptime?: string; // Connection duration if online
    disabled?: boolean; // Whether the account is administratively disabled (from PPP Secret)
    comment?: string; // Comment field from PPP Secret (often used for notes/expiry)
}

// Actions for User Management - Define action names more clearly
export type UserActionType = 'enableUser' | 'disableUser' | 'renewUser' | 'deleteUser';

// Map action types to functions
export interface UserActions {
    onEnableUser: (username: string, serverName: string) => Promise<boolean>;
    onDisableUser: (username: string, serverName: string) => Promise<boolean>;
    onRenewUser: (username: string, serverName: string, currentExpiry?: string) => Promise<boolean>;
    onDeleteUser: (username: string, serverName: string) => Promise<boolean>; // Add delete action
}


// Re-export Mikrotik type for easier import in components that need it
export type { Mikrotik };
