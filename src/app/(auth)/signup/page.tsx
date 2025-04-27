
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook
import { UserPlus } from "lucide-react";

// Signup form schema
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});


type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth(); // Use signup function from context
  const router = useRouter();
  const { toast } = useToast();
   const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
     defaultValues: {
        username: "",
        password: "",
        confirmPassword: ""
    }
  });

   // Redirect if already authenticated
   React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/'); // Redirect to dashboard
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: SignupFormData) => {
     setIsSubmitting(true);
    try {
      // Call the signup function from AuthContext
      const success = await signup(data.username, data.password);

      if (success) {
        toast({
          title: "Signup Successful",
          description: "Account created. Please log in.",
        });
        router.push('/login'); // Redirect to login page after successful signup
      } else {
        // Signup function should ideally handle specific error toasts (e.g., username taken)
         // If not, show a generic failure toast here:
         // toast({
         //   title: "Signup Failed",
         //   description: "Could not create account. Please try again.",
         //   variant: "destructive",
         // });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "An Error Occurred",
        description: "Could not process signup request. Please try again.",
        variant: "destructive",
      });
    } finally {
       setIsSubmitting(false);
    }
  };

   // Render null or a loading indicator while checking auth status
   if (isAuthenticated === undefined || isAuthenticated === true) {
       return null; // Or a loading spinner
   }

  return (
     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
             <UserPlus className="h-6 w-6" /> Create Account
          </CardTitle>
          <CardDescription>Enter your details to create a new account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Choose a username"
                {...register("username")}
                aria-invalid={errors.username ? "true" : "false"}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                {...register("password")}
                 aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                 aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
               {isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>
             <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                   Login
                </Link>
             </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
