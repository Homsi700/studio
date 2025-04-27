import type { Mikrotik } from "@/services/mikrotik";
import type { Mimosa } from "@/services/mimosa";
import type { Ubnt } from "@/services/ubnt";

export interface NetworkDeviceStatus {
  connected: boolean;
  signalStrength?: number; // Optional, only for towers
  users?: number; // Optional, only for Mikrotik servers
  uploadSpeed?: string; // Optional, example placeholder
  downloadSpeed?: string; // Optional, example placeholder
}

export type DeviceType = 'mikrotik' | 'mimosa' | 'ubnt';

export interface DeviceCardProps {
  device: Mikrotik | Mimosa | Ubnt;
  type: DeviceType;
  status: NetworkDeviceStatus;
}
