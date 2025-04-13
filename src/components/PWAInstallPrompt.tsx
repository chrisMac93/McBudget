'use client';

import { useState, useEffect } from 'react';
import { Alert, Button, Snackbar, Box } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

// BeforeInstallPromptEvent is not part of standard TypeScript DOM lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Interface for Navigator with standalone property (iOS PWA detection)
interface IosNavigator extends Navigator {
  standalone?: boolean;
}

// Interface for Window with MSStream property (iOS detection)
interface EnhancedWindow extends Window {
  MSStream?: unknown;
}

export default function PWAInstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as IosNavigator).standalone || 
                         document.referrer.includes('android-app://');
    
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as EnhancedWindow).MSStream;
    setIsIOS(iOS);
    
    // Only show the prompt if not already installed 
    if (!isStandalone) {
      // For Chrome, Edge, etc., store the install event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallEvent(e as BeforeInstallPromptEvent);
        setShowInstallPrompt(true);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // For iOS Safari, check if we should show iOS specific instructions
      if (iOS && !isStandalone) {
        // If localStorage doesn't have a record of showing the iOS prompt recently
        const lastPrompt = localStorage.getItem('iosInstallPromptShown');
        const now = new Date().getTime();
        
        if (!lastPrompt || (now - parseInt(lastPrompt)) > 1000 * 60 * 60 * 24 * 7) { // 7 days
          setShowInstallPrompt(true);
          localStorage.setItem('iosInstallPromptShown', now.toString());
        }
      }
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);
  
  const handleInstall = () => {
    if (installEvent && !isIOS) {
      // For Chrome, trigger the native install prompt
      installEvent.prompt();
      installEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setShowInstallPrompt(false);
        setInstallEvent(null);
      });
    } else {
      // For iOS, just close the prompt - they'll follow the instructions
      setShowInstallPrompt(false);
    }
  };
  
  return (
    <Snackbar 
      open={showInstallPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 70, sm: 20 } }} // Give space for mobile navigation
    >
      <Alert 
        severity="info"
        sx={{ 
          width: '100%', 
          maxWidth: 450, 
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        onClose={() => setShowInstallPrompt(false)}
        action={
          <Button 
            color="inherit" 
            size="small" 
            variant="outlined"
            startIcon={<InstallMobileIcon />}
            onClick={handleInstall}
          >
            Install
          </Button>
        }
      >
        {isIOS ? (
          <>
            Install this app: tap 
            <Box component="span" sx={{ mx: 0.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.5 16.5,18 12,18C7.5,18 5,14.5 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19M7,20V22H17V20H7Z" />
              </svg>
            </Box>
            then &quot;Add to Home Screen&quot;
          </>
        ) : (
          <>Add Budget This to your home screen for a better experience</>
        )}
      </Alert>
    </Snackbar>
  );
} 