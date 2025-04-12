'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { 
  subscribeToAuthChanges, 
  signIn, 
  signUp, 
  logout, 
  resetPassword,
  signInWithGoogle
} from '../firebase/auth';
import { useRouter } from 'next/navigation';

// Enable BYPASS_AUTH for development purposes
const BYPASS_AUTH = false;

// Get allowed emails from environment variables
const ALLOWED_EMAILS = process.env.NEXT_PUBLIC_ALLOWED_EMAILS
  ? process.env.NEXT_PUBLIC_ALLOWED_EMAILS.split(',').map(email => email.trim())
  : [];

// Log allowed emails at initialization for debugging
console.log("Allowed emails from env:", ALLOWED_EMAILS);

// Mock user for development when auth is bypassed
const mockUser: User = {
  uid: 'mock-user-id',
  email: 'mock@example.com',
  displayName: 'Mock User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  phoneNumber: null,
  photoURL: null,
  providerId: 'password',
  delete: async () => { },
  getIdToken: async () => '',
  getIdTokenResult: async () => ({
    token: '',
    signInProvider: null,
    claims: {},
    expirationTime: '',
    issuedAtTime: '',
    authTime: '',
    signInSecondFactor: null
  }),
  reload: async () => { },
  toJSON: () => ({})
};

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logOut: async () => {},
  resetPassword: async () => {},
  clearError: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Props for the auth provider
interface AuthProviderProps {
  children: ReactNode;
}

// Check if the email is in the allowed list
const isEmailAllowed = (email: string | null): boolean => {
  if (!email) {
    console.log("Email check failed: No email provided");
    return false;
  }
  
  // Trim and lowercase the email for comparison
  const normalizedEmail = email.trim().toLowerCase();
  console.log("Normalized email for check:", normalizedEmail);
  
  // If no allowed emails specified, allow all
  if (!ALLOWED_EMAILS || ALLOWED_EMAILS.length === 0) {
    console.log("No allowed emails specified, allowing all");
    return true;
  }
  
  // Log the processed allowed emails array for debugging
  const processedAllowedEmails = ALLOWED_EMAILS.map(e => e.trim().toLowerCase());
  console.log("Processed allowed emails:", processedAllowedEmails);
  
  // Check if the email is in the allowed list
  const isAllowed = processedAllowedEmails.includes(normalizedEmail);
  console.log(`Email ${normalizedEmail} allowed: ${isAllowed}`);
  
  return isAllowed;
};

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? mockUser : null);
  const [loading, setLoading] = useState<boolean>(!BYPASS_AUTH);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Set up auth state listener only if not in bypass mode
  useEffect(() => {
    if (BYPASS_AUTH) return;
    
    console.log("Setting up auth state change listener");
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      console.log("Auth state changed:", authUser ? `User: ${authUser.email}` : "No user");
      
      // Handle user authentication
      if (authUser) {
        // Check if the authenticated user's email is allowed
        if (!isEmailAllowed(authUser.email)) {
          console.log("User email not allowed:", authUser.email);
          logout().then(() => {
            setUser(null);
            setError('Access denied. This email is not authorized to use this app.');
            router.push('/auth/login');
          });
        } else {
          // User is authenticated and allowed
          setUser(authUser);
          
          // If we're on an auth page, redirect to dashboard
          const path = window.location.pathname;
          if (path.includes('/auth/') && !path.includes('/auth/reset-password')) {
            router.push('/dashboard');
          }
        }
      } else {
        // No authenticated user
        setUser(null);
      }
      
      setLoading(false);
    });

    // Clean up subscription
    return () => {
      console.log("Cleaning up auth state change listener");
      unsubscribe();
    };
  }, [router]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting email/password login for:", email);
      
      // Check if the email is in the allowed list
      if (!isEmailAllowed(email)) {
        console.log("Email not allowed:", email);
        setError('Access denied. This email is not authorized to use this app.');
        setLoading(false);
        return;
      }
      
      if (BYPASS_AUTH) {
        // Simulate successful login
        setUser(mockUser);
        router.push('/dashboard');
      } else {
        const loggedInUser = await signIn(email, password);
        console.log("Login successful, user:", loggedInUser?.email);
        
        // After successful login, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login function
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Initiating Google sign-in with popup...");
      
      if (BYPASS_AUTH) {
        // Simulate successful login
        setUser(mockUser);
        router.push('/dashboard');
      } else {
        // Directly sign in with Google and get the result
        const googleUser = await signInWithGoogle();
        
        if (googleUser) {
          // Check if the email is allowed
          if (!isEmailAllowed(googleUser.email)) {
            console.log("Email not allowed:", googleUser.email);
            await logout();
            setError('Access denied. This email is not authorized to use this app.');
          } else {
            console.log("Google sign-in successful, user:", googleUser.email);
            setUser(googleUser);
            router.push('/dashboard');
          }
        }
      }
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the email is in the allowed list
      if (!isEmailAllowed(email)) {
        setError('Access denied. This email is not authorized to use this app.');
        setLoading(false);
        return;
      }
      
      if (BYPASS_AUTH) {
        // Simulate successful registration
        const customMockUser = {...mockUser, displayName, email};
        setUser(customMockUser);
        router.push('/dashboard');
      } else {
        const newUser = await signUp(email, password, displayName);
        console.log("Registration successful, user:", newUser?.email);
        
        // After successful registration, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (BYPASS_AUTH) {
        // Simulate successful logout
        setUser(null);
      } else {
        await logout();
      }
      
      // After logout, redirect to login page
      router.push('/auth/login');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPasswordFn = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the email is in the allowed list
      if (!isEmailAllowed(email)) {
        setError('Access denied. This email is not authorized to use this app.');
        setLoading(false);
        return;
      }
      
      if (BYPASS_AUTH) {
        // Simulate successful password reset
        console.log(`Password reset email sent to ${email} (mock)`);
      } else {
        await resetPassword(email);
      }
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logOut,
    resetPassword: resetPasswordFn,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 