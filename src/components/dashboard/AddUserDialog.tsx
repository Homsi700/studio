import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Import Controller
import * as z from "zod";
import { PlusCircle } from "lucide-react";
import { format, addMonths } from 'date-fns'; // Import date-fns for formatting and adding months

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
import type { Mikrotik, PppoeUserPayload } from "@/services/mikrotik"; // Import PppoeUserPayload
// Removed direct import of addPppoeUser service

const pppoeUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  mikrotikServerName: z.string().min(1, "Server selection is required"),
  speed: z.string().min(1, "Speed/Profile is required"), // Ensure profile is provided
  // expiry: z.string().optional(), // Make expiry optional, default handled below
  expiry: z.string().refine((date) => date === '' || !isNaN(Date.parse(date)), { // Allow empty or valid date
      message: "Invalid expiry date format (YYYY-MM-DD)",
  }).optional(), // Make expiry optional
  notes: z.string().optional(),
});

type PppoeUserFormData = z.infer<typeof pppoeUserSchema>;

interface AddUserDialogProps {
  mikrotikServers: Mikrotik[]; // Accept servers dynamically via props
  onAddUser: (serverName: string, payload: PppoeUserPayload, expiryDate?: string) => Promise<boolean>; // Callback prop
}

export function AddUserDialog({ mikrotikServers, onAddUser }: AddUserDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control, // Use control for Select
    formState: { errors, isSubmitting },
  } = useForm<PppoeUserFormData>({
    resolver: zodResolver(pppoeUserSchema),
    defaultValues: { // Add default values
        username: "",
        password: "",
        mikrotikServerName: "",
        speed: "",
        // Set default expiry to 1 month from now
        expiry: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        notes: "",
    }
  });

   const onSubmit = async (data: PppoeUserFormData) => {
    const selectedServerName = data.mikrotikServerName; // Get server name from form
    if (!selectedServerName) {
      toast({
        title: "Error",
        description: "Please select a Mikrotik server.",
        variant: "destructive",
      });
      return;
    }

    // Create the payload matching PppoeUserPayload
    const newUserPayload: PppoeUserPayload = {
      username: data.username,
      password: data.password,
      profile: data.speed, // Use speed field as profile name
      comment: data.notes || '', // Use notes as comment
      // No expiry in payload, handled separately via comment or scheduler
    };

    try {
        // Call the parent's handler function
        const success = await onAddUser(selectedServerName, newUserPayload, data.expiry);

        if (success) {
            // Toast is handled by the parent now on success/failure of the actual API call
            // toast({
            //   title: "Success",
            //   description: `User ${data.username} added successfully request sent.`,
            // });
             reset({ // Reset form with default expiry
                username: "",
                password: "",
                mikrotikServerName: data.mikrotikServerName, // Keep server selected
                speed: "",
                 expiry: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
                notes: "",
             });
            setIsOpen(false); // Close dialog
        }
        // else: Failure toast is handled by the parent component's catch block in handleAddPppoeUser
    } catch (error) {
      // This catch block might not be reached if the parent handles errors,
      // but kept for safety.
      console.error("Error in AddUserDialog onSubmit (should be handled by parent):", error);
      toast({
        title: "Dialog Submission Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

   // Function to reset form when dialog is closed
   const handleOpenChange = (open: boolean) => {
    if (!open) {
        reset({ // Ensure expiry is reset to default when closing without submitting
            username: "",
            password: "",
            mikrotikServerName: "",
            speed: "",
             expiry: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
            notes: "",
        });
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={mikrotikServers.length === 0}> {/* Disable if no servers */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add PPPoE User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New PPPoE User</DialogTitle>
          <DialogDescription>
            Enter user details. The account will be created on the selected server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Username */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" {...register("username")} className="col-span-3" aria-invalid={errors.username ? "true" : "false"} />
              {errors.username && <p className="col-span-4 text-right text-xs text-destructive">{errors.username.message}</p>}
            </div>
             {/* Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input id="password" type="password" {...register("password")} className="col-span-3" aria-invalid={errors.password ? "true" : "false"}/>
               {errors.password && <p className="col-span-4 text-right text-xs text-destructive">{errors.password.message}</p>}
            </div>
             {/* Server Selection */}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mikrotikServerName" className="text-right">
                Server
              </Label>
                <Controller
                  name="mikrotikServerName"
                  control={control}
                  render={({ field }) => (
                     <Select
                       onValueChange={field.onChange}
                       value={field.value}
                       name={field.name}
                       disabled={mikrotikServers.length === 0} // Disable if no servers
                     >
                      <SelectTrigger className="col-span-3" id="mikrotikServerName" aria-invalid={errors.mikrotikServerName ? "true" : "false"}>
                        <SelectValue placeholder={mikrotikServers.length === 0 ? "No servers available" : "Select a server"} />
                      </SelectTrigger>
                      <SelectContent>
                        {mikrotikServers.map((server) => (
                          <SelectItem key={server.name} value={server.name}>
                            {server.name} ({server.ipAddress})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              {errors.mikrotikServerName && <p className="col-span-4 text-right text-xs text-destructive">{errors.mikrotikServerName.message}</p>}
            </div>
            {/* Speed/Profile */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speed" className="text-right">
                Speed/Profile
              </Label>
              <Input id="speed" placeholder="e.g., 10M/10M or ProfileName" {...register("speed")} className="col-span-3" aria-invalid={errors.speed ? "true" : "false"}/>
               {errors.speed && <p className="col-span-4 text-right text-xs text-destructive">{errors.speed.message}</p>}
            </div>
            {/* Expiry Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right">
                Expiry Date
              </Label>
              <Input id="expiry" type="date" {...register("expiry")} className="col-span-3" aria-invalid={errors.expiry ? "true" : "false"}/>
               {errors.expiry && <p className="col-span-4 text-right text-xs text-destructive">{errors.expiry.message}</p>}
            </div>
            {/* Notes/Comment */}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes (Comment)
              </Label>
              <Textarea id="notes" {...register("notes")} className="col-span-3" placeholder="Optional notes (e.g., customer name, phone)"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || mikrotikServers.length === 0}>
              {isSubmitting ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
