import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; // To handle potentially long lists
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { cn } from "@/lib/utils";
import type { PppoeUserDetails, UserActions, Mikrotik } from "@/types"; // Import UserActions, Mikrotik
import { Users, CalendarDays, Clock, Wifi, WifiOff, Gauge, Info, MoreVertical, CheckCircle, XCircle, RefreshCcw, Settings } from "lucide-react"; // Import new icons
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { differenceInDays, parseISO, format } from 'date-fns'; // Import date-fns

interface UserListCardProps {
  users: PppoeUserDetails[];
  isLoading: boolean;
  mikrotikServers: Mikrotik[]; // Pass servers to find correct one for actions
  onUserAction: (action: keyof UserActions, username: string, serverName: string, payload?: any) => Promise<boolean>; // Consolidated action handler
  onRefreshUsers: () => void; // Add callback to refresh user list
}


// Helper function to find the server object by name
const findServerByName = (servers: Mikrotik[], name: string): Mikrotik | undefined => {
    return servers.find(s => s.name === name);
};


export function UserListCard({ users = [], isLoading, mikrotikServers, onUserAction, onRefreshUsers }: UserListCardProps) {
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({}); // Track loading state per user action

    const handleAction = async (action: keyof UserActions, user: PppoeUserDetails) => {
        const actionKey = `${action}-${user.username}-${user.serverName}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));
        try {
            let payload: any = undefined;
            if (action === 'onRenewUser') {
                payload = user.expiryDate; // Pass current expiry for renewal calculation
            }

            const success = await onUserAction(action, user.username, user.serverName, payload);

            if (success) {
                 toast({
                    title: "Success",
                    description: `User ${user.username} ${action.includes('Enable') ? 'enabled' : action.includes('Disable') ? 'disabled' : 'renewal initiated'}.`,
                 });
                 onRefreshUsers(); // Refresh list after successful action
            } else {
                 // Error toast is handled within the onUserAction promise rejection usually
            }

        } catch (error) {
             toast({
               title: `Error ${action.includes('Enable') ? 'Enabling' : action.includes('Disable') ? 'Disabling' : 'Renewing'} User`,
               description: error instanceof Error ? error.message : `Failed to perform action for ${user.username}.`,
               variant: "destructive",
             });
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };


  const getStatusBadgeVariant = (status: 'online' | 'offline', disabled?: boolean) => {
    if (disabled) return 'secondary'; // Grey out if disabled
    return status === 'online' ? 'default' : 'outline'; // Green if online, outline if offline but enabled
  };

  const getStatusIcon = (status: 'online' | 'offline', disabled?: boolean) => {
     if (disabled) return <XCircle className="h-3 w-3 text-muted-foreground" />;
     return status === 'online' ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-muted-foreground" />;
  }

   // Format date for better readability
   const formatDate = (dateString: string | undefined): string => {
     if (!dateString) return 'N/A';
     try {
        // Check if the date string is already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString; // Return as is if correct format
        }
        // Otherwise, try parsing (might be from different source)
       return format(parseISO(dateString), 'yyyy-MM-dd'); // Use parseISO and format
     } catch {
       return 'Invalid Date'; // Return if parsing fails
     }
   };

   // Calculate remaining days until expiry
    const getRemainingDays = (expiryDateString: string | undefined): number | string => {
        if (!expiryDateString) return '-';
        try {
            const expiryDate = parseISO(formatDate(expiryDateString)); // Ensure correct format before parsing
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
             expiryDate.setHours(0, 0, 0, 0); // Normalize expiry date

            const days = differenceInDays(expiryDate, today);
            return days; // Can be negative if expired
        } catch {
            return '-'; // Handle invalid date format
        }
    };

    // Get color based on remaining days
    const getExpiryColor = (days: number | string): string => {
        if (typeof days !== 'number') return 'text-muted-foreground';
        if (days < 0) return 'text-destructive'; // Expired
        if (days <= 7) return 'text-yellow-500'; // Expires within a week
        return 'text-green-600'; // Expires later
    };


  return (
    <Card className="h-full flex flex-col"> {/* Ensure card takes full height */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> PPPoE Users ({isLoading ? '...' : users.length})
        </CardTitle>
        <CardDescription>List of connected and configured PPPoE users.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0"> {/* Allow content to grow and hide overflow */}
        <ScrollArea className="h-[60vh] md:h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                   <Skeleton className="h-5 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                 <Info className="h-10 w-10 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">No PPPoE users found.</p>
                 <p className="text-xs text-muted-foreground mt-1">Check server connections or add users.</p>
              </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead className="text-center">Expires</TableHead>
                     <TableHead className="text-center">Remaining</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const remainingDays = getRemainingDays(user.expiryDate);
                    const expiryColor = getExpiryColor(remainingDays);
                    const isActionLoading = actionLoading[`enable-${user.username}-${user.serverName}`] ||
                                             actionLoading[`disable-${user.username}-${user.serverName}`] ||
                                             actionLoading[`renew-${user.username}-${user.serverName}`];

                     return (
                      <TableRow key={`${user.username}-${user.serverName}`} className={cn(user.disabled && 'opacity-50 bg-muted/30')}>
                       <TableCell>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Badge variant={getStatusBadgeVariant(user.status, user.disabled)} className="cursor-default">
                                 {getStatusIcon(user.status, user.disabled)}
                               </Badge>
                             </TooltipTrigger>
                             <TooltipContent>
                                <p className="capitalize">{user.disabled ? 'Disabled' : user.status}</p>
                                {user.status === 'online' && user.ipAddress && <p>IP: {user.ipAddress}</p>}
                                {user.status === 'online' && user.uptime && <p>Uptime: {user.uptime}</p>}
                                {user.macAddress && <p>MAC: {user.macAddress}</p>}
                             </TooltipContent>
                           </Tooltip>
                       </TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{user.serverName}</TableCell>
                       <TableCell>
                         <Tooltip>
                            <TooltipTrigger asChild>
                               <Badge variant="outline" className="flex items-center gap-1 cursor-default">
                                  <Gauge className="h-3 w-3"/> {user.speed}
                               </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assigned Profile/Speed</p>
                              {user.comment && <p className="text-xs mt-1">Comment: {user.comment}</p>}
                            </TooltipContent>
                          </Tooltip>
                       </TableCell>
                       <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <span className="text-xs flex items-center justify-center gap-1 cursor-default">
                                  <CalendarDays className="h-3 w-3"/> {formatDate(user.expiryDate)}
                               </span>
                             </TooltipTrigger>
                             <TooltipContent>
                              <p>Expiry Date: {formatDate(user.expiryDate)}</p>
                              {user.registrationDate && <p>Registered: {formatDate(user.registrationDate)}</p>}
                             </TooltipContent>
                           </Tooltip>
                       </TableCell>
                        <TableCell className={cn("text-center text-xs font-medium", expiryColor)}>
                           {typeof remainingDays === 'number'
                               ? `${remainingDays} ${remainingDays === 1 || remainingDays === -1 ? 'day' : 'days'}`
                               : remainingDays}
                        </TableCell>
                         <TableCell className="text-right">
                             <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="icon" disabled={isActionLoading} className="h-7 w-7">
                                        {isActionLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                     </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                     <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                     <DropdownMenuSeparator />
                                     {user.disabled ? (
                                         <DropdownMenuItem onClick={() => handleAction('onEnableUser', user)}>
                                             <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Enable Account
                                         </DropdownMenuItem>
                                     ) : (
                                         <DropdownMenuItem onClick={() => handleAction('onDisableUser', user)}>
                                             <XCircle className="mr-2 h-4 w-4 text-destructive" /> Disable Account
                                         </DropdownMenuItem>
                                     )}
                                     <DropdownMenuItem onClick={() => handleAction('onRenewUser', user)}>
                                         <RefreshCcw className="mr-2 h-4 w-4 text-blue-500" /> Renew (30 Days)
                                     </DropdownMenuItem>
                                     {/* Add other actions like delete, view details etc. */}
                                      <DropdownMenuItem disabled>
                                        <Settings className="mr-2 h-4 w-4"/> More Settings...
                                      </DropdownMenuItem>
                                 </DropdownMenuContent>
                             </DropdownMenu>
                         </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
             </TooltipProvider>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
