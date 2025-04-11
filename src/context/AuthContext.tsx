'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { subscribeToAuthChanges, signIn, signUp, logout, resetPassword } from '../firebase/auth';

// Enable BYPASS_AUTH for development purposes
const BYPASS_AUTH = false;

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

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(BYPASS_AUTH ? mockUser : null);
  const [loading, setLoading] = useState<boolean>(!BYPASS_AUTH);
  const [error, setError] = useState<string | null>(null);

  // Set up auth state listener only if not in bypass mode
  useEffect(() => {
    if (BYPASS_AUTH) return;
    
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (BYPASS_AUTH) {
        // Simulate successful login
        setUser(mockUser);
      } else {
        await signIn(email, password);
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

  // Register function
  const register = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (BYPASS_AUTH) {
        // Simulate successful registration
        const customMockUser = {...mockUser, displayName, email};
        setUser(customMockUser);
      } else {
        await signUp(email, password, displayName);
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
    register,
    logOut,
    resetPassword: resetPasswordFn,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 