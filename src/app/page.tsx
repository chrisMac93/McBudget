'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // First, check for existing token
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('firebaseToken') : null;
    
    if (storedToken) {
      document.cookie = `__session=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    // Immediate redirect based on auth state - don't wait for a delay
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Only show a loading spinner, never any content
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
