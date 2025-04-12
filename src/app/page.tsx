'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, Typography, Button, CircularProgress, Container } from '@mui/material';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // First, check for existing token
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('firebaseToken') : null;
    
    if (storedToken) {
      console.log("Found token in home page, setting cookie");
      // Set the cookie and continue authentication check
      document.cookie = `__session=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    setCheckingToken(false);
    
    // Redirect based on auth state
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const goToLogin = () => {
    router.push('/auth/login');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading || checkingToken) {
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

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h3" component="h1" align="center">
          Budget This
        </Typography>
        
        <Typography variant="h6" align="center">
          A simple budget tracking application
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={goToDashboard}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            size="large"
            onClick={goToLogin}
          >
            Login / Sign Up
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2 }} align="center">
          Note: Authentication is bypassed in test mode.
        </Typography>
      </Box>
    </Container>
  );
}
