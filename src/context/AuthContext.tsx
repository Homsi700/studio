
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

// Key for storing the mock user database in localStorage
const MOCK_DB_STORAGE_KEY = 'networkPilotMockUserDB';

// Function to get the mock DB from localStorage or initialize it
const getMockUserDB = (): Record<string, string> => {
    if (typeof window === 'undefined') {
        // Return default during SSR or if window is not available
        return { "admin": "password123", "testuser": "testpass" };
    }
    try {
        const storedDB = localStorage.getItem(MOCK_DB_STORAGE_KEY);
        if (storedDB) {
            const parsedDB = JSON.parse(storedDB);
            // Basic validation
            if (typeof parsedDB === 'object' && parsedDB !== null) {
                 console.log("Loaded mock user DB from localStorage:", parsedDB);
                 return parsedDB;
            }
        }
    } catch (e) {
        console.error("Failed to load or parse mock user DB from localStorage:", e);
    }
    // Default initial DB if not found or invalid
    const initialDB = { "admin": "password123", "testuser": "testpass" };
    try {
         localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(initialDB));
    } catch (e) {
         console.error("Failed to save initial mock user DB to localStorage:", e);
    }
    console.log("Initialized mock user DB:", initialDB);
    return initialDB;
};

// Function to save the mock DB to localStorage
const saveMockUserDB = (db: Record<string, string>) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db));
            console.log("Saved mock user DB to localStorage:", db);
        } catch (e) {
            console.error("Failed to save mock user DB to localStorage:", e);
        }
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined); // Start as undefined
  const [user, setUser] = useState<{ username: string } | null>(null);
   // Initialize mock user DB from localStorage
  const [mockUserDB, setMockUserDB] = useState<Record<string, string>>(() => getMockUserDB());
  const { toast } = useToast();

  // Check authentication status on initial load (e.g., from localStorage or a token)
  useEffect(() => {
    // Simulate checking token/session storage for the currently logged-in user
    const storedUser = localStorage.getItem('networkPilotUser');
    if (storedUser) {
       try {
         const parsedUser = JSON.parse(storedUser);
         if (parsedUser && parsedUser.username) {
             // Verify if the stored user still exists in our mock DB (consistency check)
             if (mockUserDB[parsedUser.username]) {
                setUser(parsedUser);
                setIsAuthenticated(true);
             } else {
                 // User existed in localStorage but not in DB anymore (e.g., DB cleared)
                 setIsAuthenticated(false);
                 localStorage.removeItem('networkPilotUser'); // Clean up invalid data
             }
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
     // Ensure mock DB is loaded on client-side mount
     setMockUserDB(getMockUserDB());
  }, []); // Run only once on mount

  const login = async (username: string, pass: string): Promise<boolean> => {
    console.log(`Attempting login for: ${username}`);
     // Ensure the latest DB state is used
    const currentMockDB = getMockUserDB();
    console.log("Current Mock DB state during login:", currentMockDB);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic mock authentication against the current DB state
    if (currentMockDB[username] && currentMockDB[username] === pass) {
      const userData = { username };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('networkPilotUser', JSON.stringify(userData)); // Persist login session
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
     // Get the current state of the DB before modifying
     const currentMockDB = getMockUserDB();
     console.log("Current Mock DB state during signup:", currentMockDB);

     // Simulate API call delay
     await new Promise(resolve => setTimeout(resolve, 500));

     // Check if username already exists
     if (currentMockDB[username]) {
         toast({
           title: "Signup Failed",
           description: "Username already exists.",
           variant: "destructive",
         });
         console.log("Signup failed: Username taken");
         return false;
     }

     // Add new user to the DB object
     const updatedDB = { ...currentMockDB, [username]: pass };

     // Update the state and save to localStorage
     setMockUserDB(updatedDB);
     saveMockUserDB(updatedDB);

     console.log("Signup successful, user added to mock DB:", username);
     // For this example, we require login after signup.
     return true;
  };


  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('networkPilotUser'); // Clear persisted login session
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
