
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean | undefined; // undefined means initial state/checking
  user: { username: string } | null;
  login: (username: string, pass: string) => Promise<boolean>;
  signup: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data storage (replace with secure backend storage)
const MOCK_USER_DB: Record<string, string> = {
    "admin": "password123",
    "testuser": "testpass"
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined); // Start as undefined
  const [user, setUser] = useState<{ username: string } | null>(null);
  const { toast } = useToast();

  // Check authentication status on initial load (e.g., from localStorage or a token)
  useEffect(() => {
    // Simulate checking token/session storage
    const storedUser = localStorage.getItem('networkPilotUser');
    if (storedUser) {
       try {
         const parsedUser = JSON.parse(storedUser);
         if (parsedUser && parsedUser.username) {
             setUser(parsedUser);
             setIsAuthenticated(true);
         } else {
              setIsAuthenticated(false);
              localStorage.removeItem('networkPilotUser'); // Clean up invalid data
         }
       } catch (e) {
           console.error("Failed to parse stored user data", e);
           setIsAuthenticated(false);
            localStorage.removeItem('networkPilotUser'); // Clean up invalid data
       }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    console.log(`Attempting login for: ${username}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic mock authentication
    if (MOCK_USER_DB[username] && MOCK_USER_DB[username] === pass) {
      const userData = { username };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('networkPilotUser', JSON.stringify(userData)); // Persist login
      console.log("Login successful");
      return true;
    } else {
       toast({
         title: "Login Failed",
         description: "Invalid username or password.",
         variant: "destructive",
       });
      console.log("Login failed: Invalid credentials");
      return false;
    }
  };

  const signup = async (username: string, pass: string): Promise<boolean> => {
     console.log(`Attempting signup for: ${username}`);
     // Simulate API call delay
     await new Promise(resolve => setTimeout(resolve, 500));

     // Check if username already exists
     if (MOCK_USER_DB[username]) {
         toast({
           title: "Signup Failed",
           description: "Username already exists.",
           variant: "destructive",
         });
         console.log("Signup failed: Username taken");
         return false;
     }

     // Add new user (insecure mock - replace with backend call)
     MOCK_USER_DB[username] = pass;
     console.log("Signup successful, user added to mock DB:", username);
     // Optionally log the user in directly after signup, or require them to login
     // For this example, we require login after signup.
     return true;
  };


  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('networkPilotUser'); // Clear persisted login
     toast({
       title: "Logged Out",
       description: "You have been successfully logged out.",
     });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
