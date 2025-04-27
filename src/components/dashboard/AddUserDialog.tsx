"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusCircle } from "lucide-react";

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
import type { Mikrotik, PppoeUser } from "@/services/mikrotik";
import { addPppoeUser } from "@/services/mikrotik"; // Assuming this function handles API call
import { MOCK_MIKROTIK_SERVERS } from "@/lib/constants"; // Import mock servers

const pppoeUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  mikrotikServerName: z.string().min(1, "Server selection is required"),
  speed: z.string().min(1, "Speed is required (e.g., 10M/10M)"),
  expiry: z.string().min(1, "Expiry date is required (e.g., YYYY-MM-DD)"),
  notes: z.string().optional(),
});

type PppoeUserFormData = z.infer<typeof pppoeUserSchema>;

interface AddUserDialogProps {
  mikrotikServers?: Mikrotik[]; // Make servers optional
}

export function AddUserDialog({ mikrotikServers = MOCK_MIKROTIK_SERVERS }: AddUserDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PppoeUserFormData>({
    resolver: zodResolver(pppoeUserSchema),
  });

   const onSubmit = async (data: PppoeUserFormData) => {
    const selectedServer = mikrotikServers.find(server => server.name === data.mikrotikServerName);
    if (!selectedServer) {
      toast({
        title: "Error",
        description: "Selected Mikrotik server not found.",
        variant: "destructive",
      });
      return;
    }

    const newUser: PppoeUser = {
      username: data.username,
      password: data.password,
      speed: data.speed,
      expiry: data.expiry,
      // notes are optional, not part of PppoeUser interface in services/mikrotik.ts
    };

    try {
      // TODO: Replace with actual API call using addPppoeUser
      console.log("Submitting new user:", newUser, "to server:", selectedServer);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      // await addPppoeUser(selectedServer, newUser);

      toast({
        title: "Success",
        description: `User ${data.username} added successfully to ${selectedServer.name}.`,
      });
      reset(); // Reset form fields
      setIsOpen(false); // Close dialog
    } catch (error) {
      console.error("Failed to add PPPoE user:", error);
      toast({
        title: "Error",
        description: `Failed to add user ${data.username}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add PPPoE User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New PPPoE User</DialogTitle>
          <DialogDescription>
            Enter the details for the new PPPoE user. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" {...register("username")} className="col-span-3" aria-invalid={errors.username ? "true" : "false"} />
              {errors.username && <p className="col-span-4 text-right text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input id="password" type="password" {...register("password")} className="col-span-3" aria-invalid={errors.password ? "true" : "false"}/>
               {errors.password && <p className="col-span-4 text-right text-xs text-destructive">{errors.password.message}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mikrotikServerName" className="text-right">
                Server
              </Label>
               <Select
                 onValueChange={(value) => control._formValues.mikrotikServerName = value} // Use control to set value for Select
                 name="mikrotikServerName" // Add name attribute
               >
                <SelectTrigger className="col-span-3" id="mikrotikServerName" aria-invalid={errors.mikrotikServerName ? "true" : "false"}>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {mikrotikServers.map((server) => (
                    <SelectItem key={server.name} value={server.name}>
                      {server.name} ({server.ipAddress})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mikrotikServerName && <p className="col-span-4 text-right text-xs text-destructive">{errors.mikrotikServerName.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speed" className="text-right">
                Speed
              </Label>
              <Input id="speed" placeholder="e.g., 10M/10M" {...register("speed")} className="col-span-3" aria-invalid={errors.speed ? "true" : "false"}/>
               {errors.speed && <p className="col-span-4 text-right text-xs text-destructive">{errors.speed.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right">
                Expiry Date
              </Label>
              <Input id="expiry" type="date" {...register("expiry")} className="col-span-3" aria-invalid={errors.expiry ? "true" : "false"}/>
               {errors.expiry && <p className="col-span-4 text-right text-xs text-destructive">{errors.expiry.message}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" {...register("notes")} className="col-span-3" placeholder="Optional notes (e.g., customer name, phone)"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
