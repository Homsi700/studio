"use client";

import * as React from "react";
import { Wifi, WifiOff, Server, Users, ArrowDown, ArrowUp, Signal, SignalLow, SignalMedium } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeviceCardProps, DeviceType } from "@/types";
import { SIGNAL_STRENGTH_THRESHOLD_WARN, SIGNAL_STRENGTH_THRESHOLD_ERROR } from "@/lib/constants";

// Helper to determine badge variant based on connection status and signal strength
const getStatusBadgeVariant = (
  connected: boolean,
  signalStrength?: number
): "default" | "secondary" | "destructive" | "outline" => {
  if (!connected) return "destructive";
  if (signalStrength !== undefined) {
    if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_ERROR) return "destructive";
    if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN) return "outline"; // Use outline for warning
  }
  return "default"; // Use default (greenish/primary) for connected/good signal
};

// Helper to get status text
const getStatusText = (
  connected: boolean,
  signalStrength?: number
): string => {
  if (!connected) return "Disconnected";
  if (signalStrength !== undefined) {
    if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_ERROR) return "Very Weak Signal";
    if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN) return "Weak Signal";
    return "Connected";
  }
  return "Connected";
};

// Helper to get appropriate signal icon
const getSignalIcon = (signalStrength?: number): React.ReactNode => {
  if (signalStrength === undefined) return null;
  if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_ERROR) return <SignalLow className="h-4 w-4" />;
  if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN) return <SignalMedium className="h-4 w-4" />;
  return <Signal className="h-4 w-4" />;
};

const DeviceIcon: React.FC<{ type: DeviceType; connected: boolean }> = ({ type, connected }) => {
  const iconClass = "mr-2 h-5 w-5";
  switch (type) {
    case 'mikrotik':
      return <Server className={iconClass} />;
    case 'mimosa':
    case 'ubnt':
      return connected ? <Wifi className={iconClass} /> : <WifiOff className={iconClass} />;
    default:
      return null;
  }
};

export function DeviceCard({ device, type, status }: DeviceCardProps) {
  const badgeVariant = getStatusBadgeVariant(status.connected, status.signalStrength);
  const statusText = getStatusText(status.connected, status.signalStrength);
  const signalIcon = getSignalIcon(status.signalStrength);

  // Determine card border color based on status for visual alerts
   const cardBorderColor = !status.connected
    ? 'border-destructive'
    : status.signalStrength !== undefined && status.signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN
    ? 'border-yellow-500' // Warning border
    : 'border-border'; // Default border

  return (
    <Card className={cn("flex flex-col justify-between transition-shadow duration-300 hover:shadow-lg", cardBorderColor)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <DeviceIcon type={type} connected={status.connected} />
          <CardTitle className="text-lg font-semibold">{device.name}</CardTitle>
        </div>
         <Badge variant={badgeVariant} className="text-xs">
           {statusText} {status.signalStrength !== undefined ? `(${status.signalStrength} dBm)` : ''}
         </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{device.ipAddress}</CardDescription>
         <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {status.users !== undefined && (
                <div className="flex items-center text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{status.users} Users</span>
                </div>
            )}
             {signalIcon && status.signalStrength !== undefined && (
                 <div className="flex items-center text-muted-foreground">
                    {signalIcon}
                    <span>{status.signalStrength} dBm</span>
                 </div>
             )}
            {status.downloadSpeed && (
                <div className="flex items-center text-muted-foreground">
                    <ArrowDown className="mr-1 h-4 w-4" />
                    <span>{status.downloadSpeed}</span>
                </div>
            )}
            {status.uploadSpeed && (
                <div className="flex items-center text-muted-foreground">
                    <ArrowUp className="mr-1 h-4 w-4" />
                    <span>{status.uploadSpeed}</span>
                </div>
            )}
        </div>
      </CardContent>
       {/* Footer can be used for actions later if needed */}
      {/* <CardFooter>
         <Button variant="outline" size="sm">Manage</Button>
      </CardFooter> */}
    </Card>
  );
}
