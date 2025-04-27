
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, NextRouter } from "next/navigation";
import Link from 'next/link'; // Import Link for navigation
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
import { LogIn } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router: NextRouter = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        username: "",
        password: "",
    }
  });

   // Redirect if already authenticated
   React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/'); // Redirect to dashboard
    }
  }, [isAuthenticated, router]);


  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
       // Call the login function from AuthContext
      const success = await login(data.username, data.password);

      if (success) {
        toast({
          title: "Login Successful",
          description: "Redirecting to dashboard...",
        });
        router.push('/'); // Redirect to dashboard on successful login
      } else {
         // Login function already handles toast for failure in this example
         // If not, add a generic failure toast here:
         // toast({
         //   title: "Login Failed",
         //   description: "Invalid username or password.",
         //   variant: "destructive",
         // });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "An Error Occurred",
        description: "Could not process login request. Please try again.",
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
             <LogIn className="h-6 w-6" /> Network Pilot Login
          </CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
               {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
             <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                   Sign Up
                </Link>
             </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
