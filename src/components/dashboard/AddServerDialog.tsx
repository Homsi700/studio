
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import type { Mikrotik } from "@/services/mikrotik"; // Use existing Mikrotik type
import { addServer } from "@/services/servers"; // Import placeholder addServer function

// Schema based on original request details for adding a server
const serverSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
  // Type and default speed are optional according to request
  type: z.enum(["main", "sub"]).optional(),
  defaultSpeed: z.string().optional(),
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
    formState: { errors, isSubmitting },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      username: "",
      password: "",
      type: undefined, // Explicitly set optional fields if needed
      defaultSpeed: "",
    }
  });

  const onSubmit = async (data: ServerFormData) => {
    const newServer: Mikrotik = {
      name: data.name,
      ipAddress: data.ipAddress,
      // NOTE: In a real scenario, username/password would be stored securely
      // and used for API calls, not directly in the Mikrotik object shown in UI.
      // We are adding them here just to fulfill the form structure.
      // Consider how you want to manage credentials.
    };

    try {
      // TODO: Replace with actual API call using addServer
      console.log("Submitting new server:", data);
      // Simulate checking connection and saving
      const success = await addServer(data); // Pass full form data to service

      if (success) {
          toast({
              title: "Success",
              description: `Server ${data.name} added successfully.`,
          });
          onAddServer(newServer); // Call the callback to update the parent state
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

             {/* Optional Fields - Type and Default Speed */}
             {/* Example using Select for Type (optional) */}
             {/*
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="type" className="text-right">
                 Type
               </Label>
               <Select onValueChange={(value) => control._formValues.type = value} name="type">
                 <SelectTrigger className="col-span-3" id="type">
                   <SelectValue placeholder="Select type (optional)" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="main">Main</SelectItem>
                   <SelectItem value="sub">Sub</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             */}

             {/* Example for Default Speed (optional) */}
            {/*
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="defaultSpeed" className="text-right">
                 Default Speed
               </Label>
               <Input id="defaultSpeed" placeholder="e.g., 10M/10M (optional)" {...register("defaultSpeed")} className="col-span-3" />
             </div>
            */}

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
