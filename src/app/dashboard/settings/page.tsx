'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Container, 
  Typography, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  TextField,
  Alert,
  Snackbar,
  Avatar,
} from '@mui/material';
import {
  Security,
  Notifications,
  Delete,
  Logout,
} from '@mui/icons-material';
import SidebarLayout from '@/components/SidebarLayout';

export default function SettingsPage() {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth/login');
    }
    
    // Set initial display name
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, loading, router]);

  const handleSaveProfile = () => {
    // In a real app, would update user profile here
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setShowSuccess(true);
  };

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const handleDeleteAccount = () => {
    // In a real app, would implement account deletion here
    setSuccessMessage('Account deletion is not implemented in this demo.');
    setShowSuccess(true);
  };

  // Don't render anything on server to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show content only if user is authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <SidebarLayout title="Settings">
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 2,
                bgcolor: 'primary.main'
              }}
            >
              {user?.displayName ? user.displayName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
            </Avatar>
            <Box>
              {isEditing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField 
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleSaveProfile}
                    size="small"
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setIsEditing(false)}
                    size="small"
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="h6">
                    {user?.displayName || 'No Display Name Set'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setIsEditing(true)}
                    sx={{ mt: 1 }}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>
        
        <Paper sx={{ borderRadius: 2 }}>
          <List>
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notifications" 
                secondary="Enable email notifications for budget alerts"
              />
              <Switch 
                edge="end"
                disabled
              />
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText 
                primary="Security" 
                secondary="Change password and security settings"
              />
              <Button 
                variant="outlined" 
                size="small"
                disabled
              >
                Manage
              </Button>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                secondary="Sign out of your account"
              />
              <Button 
                variant="outlined" 
                color="primary"
                size="small"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Delete Account" 
                secondary="Permanently delete your account and all data"
              />
              <Button 
                variant="outlined" 
                color="error"
                size="small"
                onClick={handleDeleteAccount}
              >
                Delete
              </Button>
            </ListItem>
          </List>
        </Paper>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Budget This App • Version 1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Budget This
          </Typography>
        </Box>
      </Box>
      
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </SidebarLayout>
  );
} 