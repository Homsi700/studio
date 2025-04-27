
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Wifi, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Keep for notes if desired
import { useToast } from "@/hooks/use-toast";
import type { Mimosa } from "@/services/mimosa";
import type { Ubnt } from "@/services/ubnt";
import type { Mikrotik } from "@/services/mikrotik";
import { addTower } from "@/services/towers";
// Removed MOCK import, will use props

// Updated schema based on the latest request
const towerSchema = z.object({
  name: z.string().min(1, "Tower name is required"),
  deviceType: z.enum(["Mimosa", "UBNT"], { required_error: "Device type is required" }),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
  signalWarningThreshold: z.number().int().lt(0, "Signal must be negative (dBm)"), // Single warning threshold, must be negative
  speed: z.string().min(1, "Speed profile/limit is required"),
  linkedServerName: z.string().min(1, "Linked server is required"),
  towerType: z.enum(["main", "sub"], { required_error: "Tower type is required" }), // Main or Sub tower
  // notes: z.string().optional(), // Keep notes optional if needed
});

type TowerFormData = z.infer<typeof towerSchema>;

interface AddTowerDialogProps {
  linkedServers: Mikrotik[]; // Use passed servers
  onAddTower: (newTower: Mimosa | Ubnt, type: 'mimosa' | 'ubnt') => void;
}

export function AddTowerDialog({ linkedServers = [], onAddTower }: AddTowerDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TowerFormData>({
    resolver: zodResolver(towerSchema),
    defaultValues: {
        name: "",
        deviceType: undefined,
        ipAddress: "",
        username: "",
        password: "",
        signalWarningThreshold: -70, // Default warning threshold
        speed: "",
        linkedServerName: "",
        towerType: undefined,
        // notes: "",
    }
  });

   const onSubmit = async (data: TowerFormData) => {
     // Prepare data for the API call
     const towerDataForApi = {
         name: data.name,
         ipAddress: data.ipAddress,
         type: data.deviceType, // 'Mimosa' or 'UBNT'
         username: data.username,
         password: data.password, // Handle securely
         signalWarningThreshold: data.signalWarningThreshold,
         speed: data.speed,
         linkedServerName: data.linkedServerName,
         towerType: data.towerType, // 'main' or 'sub'
         // notes: data.notes,
     };

     // Basic structure for UI update
     const newTowerForUi = {
       name: data.name,
       ipAddress: data.ipAddress,
     };

    try {
      // TODO: Replace with actual API call using addTower
      console.log("Submitting new tower:", towerDataForApi);
      const success = await addTower(towerDataForApi); // Pass full form data

       if (success) {
           toast({
               title: "Success",
               description: `Tower ${data.name} (${data.deviceType}) added successfully.`,
           });
           // Call the callback with the correct type for UI state
            const towerTypeUi = data.deviceType.toLowerCase() as 'mimosa' | 'ubnt';
            onAddTower(newTowerForUi, towerTypeUi);
           reset(); // Reset form fields
           setIsOpen(false); // Close dialog
       } else {
           throw new Error("Failed to connect to the tower or save.");
       }

    } catch (error) {
      console.error("Failed to add tower:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to add tower ${data.name}. Please check details and try again.`,
        variant: "destructive",
      });
    }
  };

   // Function to reset form when dialog is closed
   const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={linkedServers.length === 0}> {/* Disable if no servers to link */}
          <Wifi className="mr-2 h-4 w-4" /> Add Tower
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Network Tower</DialogTitle>
          <DialogDescription>
            Enter details for the Mimosa or UBNT tower. Connection will be verified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Tower Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tower Name
              </Label>
              <Input id="name" {...register("name")} className="col-span-3" aria-invalid={errors.name ? "true" : "false"}/>
               {errors.name && <p className="col-span-4 text-right text-xs text-destructive">{errors.name.message}</p>}
            </div>

             {/* Device Type (Mimosa/UBNT) */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="deviceType" className="text-right">
                 Device Type
               </Label>
               <Controller
                  name="deviceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      name={field.name}
                    >
                      <SelectTrigger className="col-span-3" id="deviceType" aria-invalid={errors.deviceType ? "true" : "false"}>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mimosa">Mimosa</SelectItem>
                        <SelectItem value="UBNT">UBNT</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
               {errors.deviceType && <p className="col-span-4 text-right text-xs text-destructive">{errors.deviceType.message}</p>}
             </div>

            {/* IP Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ipAddress" className="text-right">
                IP Address
              </Label>
              <Input id="ipAddress" {...register("ipAddress")} className="col-span-3" placeholder="e.g., 192.168.1.20" aria-invalid={errors.ipAddress ? "true" : "false"}/>
              {errors.ipAddress && <p className="col-span-4 text-right text-xs text-destructive">{errors.ipAddress.message}</p>}
            </div>

            {/* Admin Username */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Admin User
              </Label>
              <Input id="username" {...register("username")} className="col-span-3" aria-invalid={errors.username ? "true" : "false"}/>
              {errors.username && <p className="col-span-4 text-right text-xs text-destructive">{errors.username.message}</p>}
            </div>

            {/* Admin Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Admin Password
              </Label>
              <Input id="password" type="password" {...register("password")} className="col-span-3" aria-invalid={errors.password ? "true" : "false"}/>
              {errors.password && <p className="col-span-4 text-right text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Signal Warning Threshold */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="signalWarningThreshold" className="text-right">
                Warn Signal (dBm)
              </Label>
              <Input
                id="signalWarningThreshold"
                type="number"
                placeholder="e.g., -70"
                {...register("signalWarningThreshold", { valueAsNumber: true })}
                className="col-span-3"
                aria-invalid={errors.signalWarningThreshold ? "true" : "false"}
                />
              {errors.signalWarningThreshold && <p className="col-span-4 text-right text-xs text-destructive">{errors.signalWarningThreshold.message}</p>}
            </div>

             {/* Speed */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speed" className="text-right">
                Speed Profile
              </Label>
              <Input id="speed" {...register("speed")} className="col-span-3" placeholder="e.g., 50M/20M or ProfileName" aria-invalid={errors.speed ? "true" : "false"}/>
               {errors.speed && <p className="col-span-4 text-right text-xs text-destructive">{errors.speed.message}</p>}
            </div>

             {/* Linked Server */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="linkedServerName" className="text-right">
                 Linked Server
               </Label>
                <Controller
                  name="linkedServerName"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      name={field.name}
                      disabled={linkedServers.length === 0}
                     >
                       <SelectTrigger className="col-span-3" id="linkedServerName" aria-invalid={errors.linkedServerName ? "true" : "false"}>
                         <SelectValue placeholder={linkedServers.length === 0 ? "No servers available" : "Select linked server"} />
                       </SelectTrigger>
                       <SelectContent>
                         {linkedServers.map((server) => (
                           <SelectItem key={server.name} value={server.name}>
                             {server.name} ({server.ipAddress})
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   )}
                 />
               {errors.linkedServerName && <p className="col-span-4 text-right text-xs text-destructive">{errors.linkedServerName.message}</p>}
             </div>

             {/* Tower Type (Main/Sub) */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="towerType" className="text-right">
                 Tower Type
               </Label>
               <Controller
                  name="towerType"
                  control={control}
                  render={({ field }) => (
                     <Select
                       onValueChange={field.onChange}
                       value={field.value}
                       name={field.name}
                     >
                      <SelectTrigger className="col-span-3" id="towerType" aria-invalid={errors.towerType ? "true" : "false"}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main</SelectItem>
                        <SelectItem value="sub">Sub</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
               {errors.towerType && <p className="col-span-4 text-right text-xs text-destructive">{errors.towerType.message}</p>}
             </div>

            {/* Notes (Optional) - Uncomment if needed
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" {...register("notes")} className="col-span-3" placeholder="Optional notes"/>
            </div>
             */}

          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || linkedServers.length === 0}>
              {isSubmitting ? "Adding..." : "Add Tower"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
