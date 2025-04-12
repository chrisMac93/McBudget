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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Security,
  Notifications,
  Delete,
  Logout,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import SidebarLayout from '@/components/SidebarLayout';

export default function SettingsPage() {
  const { user, loading, logOut, error, changePassword, clearError } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password change states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const handleOpenPasswordDialog = () => {
    clearError();
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
  };

  const validatePasswordFields = () => {
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return false;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return false;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }
    
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordFields()) {
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword);
      handleClosePasswordDialog();
      setSuccessMessage('Password changed successfully!');
      setShowSuccess(true);
    } catch {
      // Error handling is done in the AuthContext
    }
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
                onClick={handleOpenPasswordDialog}
              >
                Change Password
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
      
      {/* Password Change Dialog */}
      <Dialog 
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Change Password
          <IconButton onClick={handleClosePasswordDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="Current Password"
                type={showCurrentPassword ? "text" : "password"}
                fullWidth
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              <IconButton
                sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                helperText="Password must be at least 6 characters"
              />
              <IconButton
                sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>
            
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success"
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </SidebarLayout>
  );
} 