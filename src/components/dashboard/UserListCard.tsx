
"use client";

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
import { cn } from "@/lib/utils";
import type { PppoeUserDetails } from "@/types";
import { Users, CalendarDays, Clock, Wifi, WifiOff, Gauge, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface UserListCardProps {
  users: PppoeUserDetails[];
  isLoading: boolean;
}

export function UserListCard({ users = [], isLoading }: UserListCardProps) {

  const getStatusBadgeVariant = (status: 'online' | 'offline') => {
    return status === 'online' ? 'default' : 'secondary';
  };

  const getStatusIcon = (status: 'online' | 'offline') => {
     return status === 'online' ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-muted-foreground" />;
  }

   // Format date for better readability
   const formatDate = (dateString: string | undefined) => {
     if (!dateString) return 'N/A';
     try {
       return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
     } catch {
       return 'Invalid Date';
     }
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
                    <TableHead className="text-center">Expiry</TableHead>
                    {/* <TableHead>IP Address</TableHead> */}
                    {/* <TableHead>Uptime</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username + user.serverName} className={cn(user.status === 'offline' && 'opacity-60')}>
                       <TableCell>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Badge variant={getStatusBadgeVariant(user.status)} className="cursor-default">
                                 {getStatusIcon(user.status)}
                               </Badge>
                             </TooltipTrigger>
                             <TooltipContent>
                                <p className="capitalize">{user.status}</p>
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
                              <p>Expiry: {formatDate(user.expiryDate)}</p>
                              <p>Registered: {formatDate(user.registrationDate)}</p>
                             </TooltipContent>
                           </Tooltip>
                       </TableCell>
                       {/* <TableCell>{user.ipAddress || 'N/A'}</TableCell> */}
                      {/* <TableCell>{user.uptime || 'N/A'}</TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             </TooltipProvider>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
