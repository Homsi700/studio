
"use client";

import * as React from "react";
import { Wifi, WifiOff, Server, Users, ArrowDown, ArrowUp, Signal, SignalLow, SignalMedium, AlertTriangle, Settings, MoreVertical, RefreshCcw, ExternalLink, Info, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog" // Import AlertDialog components
import { cn } from "@/lib/utils";
import type { DeviceCardProps, DeviceType, AlertState } from "@/types";
import { SIGNAL_STRENGTH_THRESHOLD_WARN, SIGNAL_STRENGTH_THRESHOLD_ERROR, TRAFFIC_THRESHOLD_WARN } from "@/lib/constants";

// Helper to determine badge variant based on connection status and alert state
const getStatusBadgeVariant = (
  connected: boolean,
  alertState: AlertState
): "default" | "secondary" | "destructive" | "outline" | "warning" => { // Add 'warning' variant type
  if (!connected || alertState === 'error') return "destructive";
  if (alertState === 'warning') return "warning"; // Use custom warning variant
  return "default"; // Use default (greenish/primary) for connected/good signal
};

// Helper to get status text based on alert state first
const getStatusText = (
  connected: boolean,
  alertState: AlertState,
  signalStrength?: number
): string => {
  if (!connected) return "Disconnected";
  if (alertState === 'error') {
    if (signalStrength !== undefined && signalStrength < SIGNAL_STRENGTH_THRESHOLD_ERROR) return "Critical Signal";
    return "Error / Disconnected";
  }
  if (alertState === 'warning') {
     if (signalStrength !== undefined && signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN) return "Weak Signal";
     // Check if traffic exceeded threshold (assuming traffic data is available implicitly via alertState)
     // In a real scenario, you'd have traffic value here.
     // For now, we just infer from the warning state.
     return "High Traffic / Weak Signal";
  }
  return "Connected";
};


// Helper to get appropriate signal icon
const getSignalIcon = (signalStrength?: number): React.ReactNode => {
  if (signalStrength === undefined) return null;
  if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_ERROR) return <SignalLow className="h-4 w-4 text-destructive" />;
  if (signalStrength < SIGNAL_STRENGTH_THRESHOLD_WARN) return <SignalMedium className="h-4 w-4 text-yellow-500" />; // Warning color
  return <Signal className="h-4 w-4 text-green-500" />; // Good signal color
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

export function DeviceCard({ device, type, status, deviceId, onRestart, onViewDetails, onOpenWebInterface, onDelete }: DeviceCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const badgeVariant = getStatusBadgeVariant(status.connected, status.alertState);
  const statusText = getStatusText(status.connected, status.alertState, status.signalStrength);
  const signalIcon = getSignalIcon(status.signalStrength);

  // Determine card border color based on alert state for visual alerts
   const cardBorderColor =
    status.alertState === 'error' ? 'border-destructive'
    : status.alertState === 'warning' ? 'border-yellow-500' // Warning border
    : 'border-border'; // Default border

  // Determine card background glow based on alert state
  const cardGlow =
    status.alertState === 'error' ? 'shadow-lg shadow-red-500/30 dark:shadow-red-800/30'
    : status.alertState === 'warning' ? 'shadow-lg shadow-yellow-500/30 dark:shadow-yellow-800/30'
    : 'hover:shadow-lg'; // Default hover shadow

  const handleDeleteClick = (event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent dropdown from closing immediately
      setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(deviceId);
    setShowDeleteConfirm(false);
  }

  return (
    <Card className={cn("flex flex-col justify-between transition-shadow duration-300", cardBorderColor, cardGlow)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <DeviceIcon type={type} connected={status.connected} />
          <CardTitle className="text-lg font-semibold">{device.name}</CardTitle>
        </div>
         <Badge variant={badgeVariant} className="text-xs flex items-center gap-1">
            {status.alertState === 'warning' && <AlertTriangle className="h-3 w-3" />}
            {statusText}
         </Badge>
      </CardHeader>
      <CardContent className="flex-grow">
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
      {/* Footer with Settings Dropdown */}
      <CardFooter className="pt-4">
         <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className="ml-auto">
                   <Settings className="mr-2 h-4 w-4" /> Settings
                   {/* <MoreVertical className="h-4 w-4" /> */}
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={onRestart}>
                   <RefreshCcw className="mr-2 h-4 w-4" />
                   <span>Restart Device</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onViewDetails}>
                    <Info className="mr-2 h-4 w-4" />
                   <span>View Full Status</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onOpenWebInterface}>
                   <ExternalLink className="mr-2 h-4 w-4" />
                   <span>Open Web Interface</span>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 {/* Use AlertDialogTrigger within the DropdownMenuItem */}
                  <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={(e) => e.preventDefault()} // Prevent default closing on select
                      >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Device</span>
                      </DropdownMenuItem>
                  </AlertDialogTrigger>
               </DropdownMenuContent>
             </DropdownMenu>

           {/* Confirmation Dialog Content */}
            <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                   <AlertDialogDescription>
                     This action cannot be undone. This will permanently remove the device
                     <span className="font-semibold"> {device.name} ({device.ipAddress}) </span>
                      from the dashboard. It will not remove the device from your network.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
                     Delete
                   </AlertDialogAction>
                 </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
      </CardFooter>
    </Card>
  );
}

// Helper function to get buttonVariants class names
import { buttonVariants } from "@/components/ui/button" // Make sure this import is correct
