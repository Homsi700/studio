
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Import Controller
import * as z from "zod";
import { Server, PlusCircle } from "lucide-react";

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
} from "@/components/ui/select"; // Import Select components
import { useToast } from "@/hooks/use-toast";
import type { Mikrotik } from "@/services/mikrotik";
import { addServer } from "@/services/servers"; // Import placeholder addServer function

// Updated schema to include server type and default speed
const serverSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
  serverType: z.enum(["main", "sub"], { required_error: "Server type is required" }), // Made required
  defaultSpeed: z.string().optional(), // Kept optional as per original, can be made required if needed
});

type ServerFormData = z.infer<typeof serverSchema>;

interface AddServerDialogProps {
  onAddServer: (newServer: Mikrotik) => void; // Callback to update parent state
}

export function AddServerDialog({ onAddServer }: AddServerDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control, // Need control for Select
    formState: { errors, isSubmitting },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      username: "",
      password: "",
      serverType: undefined, // Explicitly set optional fields if needed
      defaultSpeed: "",
    }
  });

  const onSubmit = async (data: ServerFormData) => {
    // Prepare the data for the service, including the new fields
    const serverDataForApi = {
        name: data.name,
        ipAddress: data.ipAddress,
        username: data.username,
        password: data.password, // Handle securely in real implementation
        type: data.serverType,
        defaultSpeed: data.defaultSpeed
    };

     // Basic Mikrotik object structure for UI update
    const newServerForUi: Mikrotik = {
      name: data.name,
      ipAddress: data.ipAddress,
    };

    try {
      // TODO: Replace with actual API call using addServer
      console.log("Submitting new server:", serverDataForApi);
      // Simulate checking connection and saving
      const success = await addServer(serverDataForApi); // Pass full form data to service

      if (success) {
          toast({
              title: "Success",
              description: `Server ${data.name} added successfully.`,
          });
          onAddServer(newServerForUi); // Call the callback to update the parent state with UI data
          reset(); // Reset form fields
          setIsOpen(false); // Close dialog
      } else {
          throw new Error("Failed to connect to the server or save.");
      }

    } catch (error) {
      console.error("Failed to add server:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to add server ${data.name}. Please check details and try again.`,
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
          <Server className="mr-2 h-4 w-4" /> Add Server
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Distribution Server</DialogTitle>
          <DialogDescription>
            Enter the details for the new Mikrotik server. Connection will be verified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Server Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Server Name
              </Label>
              <Input id="name" {...register("name")} className="col-span-3" aria-invalid={errors.name ? "true" : "false"} />
              {errors.name && <p className="col-span-4 text-right text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* IP Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ipAddress" className="text-right">
                IP Address
              </Label>
              <Input id="ipAddress" {...register("ipAddress")} className="col-span-3" placeholder="e.g., 192.168.88.1" aria-invalid={errors.ipAddress ? "true" : "false"}/>
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

             {/* Server Type (Main/Sub) - Now Required */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="serverType" className="text-right">
                 Server Type
               </Label>
               <Controller
                  name="serverType"
                  control={control}
                  render={({ field }) => (
                     <Select
                       onValueChange={field.onChange}
                       value={field.value}
                       name={field.name}
                     >
                      <SelectTrigger className="col-span-3" id="serverType" aria-invalid={errors.serverType ? "true" : "false"}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main</SelectItem>
                        <SelectItem value="sub">Sub</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
               {errors.serverType && <p className="col-span-4 text-right text-xs text-destructive">{errors.serverType.message}</p>}
             </div>

             {/* Default Speed (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="defaultSpeed" className="text-right">
                 Default Speed
               </Label>
               <Input id="defaultSpeed" placeholder="e.g., 10M/10M (Optional)" {...register("defaultSpeed")} className="col-span-3" />
             </div>

          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
