
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

// Updated schema to include server type, default speed, and optional API port
const serverSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  apiPort: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)), // Convert empty string to undefined, otherwise number
        z.number().int().positive().lte(65535).optional()
      ).describe("API Port (default: 8728/8729)"),
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
  serverType: z.enum(["main", "sub"], { required_error: "Server type is required" }),
  defaultSpeed: z.string().optional(),
});

type ServerFormData = z.infer<typeof serverSchema>;

interface AddServerDialogProps {
  // The callback now expects the full Mikrotik data structure, including the optional port
  onAddServer: (newServer: Omit<Mikrotik, 'type'> & { type: 'main' | 'sub' }) => Promise<boolean>; // Modified callback type
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
      apiPort: undefined, // Default to undefined
      username: "",
      password: "",
      serverType: undefined,
      defaultSpeed: "",
    }
  });

  const onSubmit = async (data: ServerFormData) => {
    // Prepare the data for the service, including the optional port
    const serverDataForApi = {
        name: data.name,
        ipAddress: data.ipAddress,
        apiPort: data.apiPort, // Pass the port
        username: data.username,
        password: data.password, // Handle securely in real implementation
        type: data.serverType,
        defaultSpeed: data.defaultSpeed
    };

    try {
      // Call the parent's onAddServer function which should handle the API call
      const success = await onAddServer(serverDataForApi); // Pass full form data

      if (success) {
          // Toast is handled by the parent now
          reset(); // Reset form fields
          setIsOpen(false); // Close dialog
      }
      // Failure toast is handled by the parent

    } catch (error) {
      // This catch might not be reached if parent handles it, but kept for safety
      console.error("Failed to add server (dialog onSubmit):", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to submit server data.`,
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

             {/* API Port (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiPort" className="text-right">
                API Port
              </Label>
              <Input
                id="apiPort"
                type="number"
                 {...register("apiPort")}
                className="col-span-3"
                placeholder="Optional (e.g., 8728)"
                aria-invalid={errors.apiPort ? "true" : "false"}
                />
              {errors.apiPort && <p className="col-span-4 text-right text-xs text-destructive">{errors.apiPort.message}</p>}
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
