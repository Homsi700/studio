
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Mimosa } from "@/services/mimosa"; // Use existing Mimosa type
import type { Ubnt } from "@/services/ubnt"; // Use existing Ubnt type
import type { Mikrotik } from "@/services/mikrotik"; // For linking server
import { addTower } from "@/services/towers"; // Import placeholder addTower function
import { MOCK_MIKROTIK_SERVERS } from "@/lib/constants"; // Assuming you have mock servers for selection

// Schema based on original request details for adding a tower
const towerSchema = z.object({
  name: z.string().min(1, "Tower name is required"),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  type: z.enum(["Mimosa", "UBNT"], { required_error: "Device type is required" }),
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
  linkedServerName: z.string().min(1, "Linked server is required"), // Assuming linking by name
  minSignal: z.number().int().optional(),
  maxSignal: z.number().int().optional(),
  notes: z.string().optional(),
  // Other optional fields from request: defaultSpeed, alternativeFrequency
});

type TowerFormData = z.infer<typeof towerSchema>;

interface AddTowerDialogProps {
  // TODO: Fetch actual servers instead of using mock
  linkedServers?: Mikrotik[];
  onAddTower: (newTower: Mimosa | Ubnt, type: 'mimosa' | 'ubnt') => void; // Callback
}

export function AddTowerDialog({ linkedServers = MOCK_MIKROTIK_SERVERS, onAddTower }: AddTowerDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control, // Needed for Select component
    formState: { errors, isSubmitting },
  } = useForm<TowerFormData>({
    resolver: zodResolver(towerSchema),
    defaultValues: {
        name: "",
        ipAddress: "",
        type: undefined,
        username: "",
        password: "",
        linkedServerName: "",
        minSignal: undefined,
        maxSignal: undefined,
        notes: "",
    }
  });

   const onSubmit = async (data: TowerFormData) => {
     const newTowerBase = {
       name: data.name,
       ipAddress: data.ipAddress,
       // Again, handle credentials securely in real app
     };

    try {
      // TODO: Replace with actual API call using addTower
      console.log("Submitting new tower:", data);
      const success = await addTower(data); // Pass full form data

       if (success) {
           toast({
               title: "Success",
               description: `Tower ${data.name} (${data.type}) added successfully.`,
           });
           // Call the callback with the correct type
            const towerType = data.type.toLowerCase() as 'mimosa' | 'ubnt';
            onAddTower(newTowerBase, towerType);
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
      reset(); // Reset form when closing
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
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

            {/* IP Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ipAddress" className="text-right">
                IP Address
              </Label>
              <Input id="ipAddress" {...register("ipAddress")} className="col-span-3" placeholder="e.g., 192.168.1.20" aria-invalid={errors.ipAddress ? "true" : "false"}/>
              {errors.ipAddress && <p className="col-span-4 text-right text-xs text-destructive">{errors.ipAddress.message}</p>}
            </div>

             {/* Device Type */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="type" className="text-right">
                 Type
               </Label>
               <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      name={field.name}
                    >
                      <SelectTrigger className="col-span-3" id="type" aria-invalid={errors.type ? "true" : "false"}>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mimosa">Mimosa</SelectItem>
                        <SelectItem value="UBNT">UBNT</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
               {errors.type && <p className="col-span-4 text-right text-xs text-destructive">{errors.type.message}</p>}
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
                     >
                       <SelectTrigger className="col-span-3" id="linkedServerName" aria-invalid={errors.linkedServerName ? "true" : "false"}>
                         <SelectValue placeholder="Select linked server" />
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

            {/* Signal Strength Limits (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minSignal" className="text-right">
                Min Signal (dBm)
              </Label>
              <Input
                id="minSignal"
                type="number"
                placeholder="e.g., -80 (Optional)"
                 {...register("minSignal", { valueAsNumber: true })} // Ensure value is treated as number
                className="col-span-3"
                aria-invalid={errors.minSignal ? "true" : "false"}
                />
              {errors.minSignal && <p className="col-span-4 text-right text-xs text-destructive">{errors.minSignal.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxSignal" className="text-right">
                Max Signal (dBm)
              </Label>
              <Input
                id="maxSignal"
                type="number"
                placeholder="e.g., -50 (Optional)"
                 {...register("maxSignal", { valueAsNumber: true })} // Ensure value is treated as number
                className="col-span-3"
                aria-invalid={errors.maxSignal ? "true" : "false"}
                />
               {errors.maxSignal && <p className="col-span-4 text-right text-xs text-destructive">{errors.maxSignal.message}</p>}
            </div>

            {/* Notes (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" {...register("notes")} className="col-span-3" placeholder="Optional notes"/>
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Tower"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
