'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container, Typography, TextField, Button, Box, Link, Alert, Divider, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, error, loading, clearError } = useAuth();
  // Use client-side only rendering to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  // Track Google sign-in loading state separately
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if the current URL contains error parameters from Google redirect
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
      console.error("Redirect error detected:", errorMessage);
    }
    
    // Check for existing Firebase token in localStorage
    const storedToken = localStorage.getItem('firebaseToken');
    if (storedToken) {
      console.log("Found existing token, setting session cookie");
      // Set the cookie from the stored token to ensure middleware can read it
      document.cookie = `__session=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      // Rely on loginWithGoogle to handle the entire process
      await loginWithGoogle();
    } catch (error) {
      console.error("Error during Google login:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Don't render until client-side
  if (!mounted) {
    return null;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Log in
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Log In'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>OR</Divider>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={googleLoading ? null : <GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            sx={{ mb: 2 }}
          >
            {googleLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign in with Google'
            )}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link href="/auth/reset-password" variant="body2" component="a">
              Forgot password?
            </Link>
            <Link href="/auth/signup" variant="body2" component="a">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
} 