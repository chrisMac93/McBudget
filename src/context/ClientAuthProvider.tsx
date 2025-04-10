'use client';

import { ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from './AuthContext';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export default function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  // Use this state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Only render on client-side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Return nothing on server-side rendering
  }

  return <AuthProvider>{children}</AuthProvider>;
} 