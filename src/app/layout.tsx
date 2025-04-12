'use client';

import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ClientAuthProvider from '@/context/ClientAuthProvider';
import { useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../components/theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Metadata needs to be in a separate layout file or handled differently with Next.js App Router
// since you can't export metadata from a client component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Set up theme preference on client side only to avoid hydration mismatch
  useEffect(() => {
    // Check system theme preference first, then local storage
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedMode = localStorage.getItem('themeMode');
    
    if (storedMode) {
      setIsDarkMode(storedMode === 'dark');
    } else {
      setIsDarkMode(prefersDark);
    }
    
    // Check for existing auth token and ensure cookie is set
    const storedToken = localStorage.getItem('firebaseToken');
    if (storedToken) {
      console.log("Root: Found stored token, setting session cookie");
      document.cookie = `__session=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('themeMode', !isDarkMode ? 'dark' : 'light');
  };

  // Add toggleTheme to theme object
  const theme = {
    ...(isDarkMode ? darkTheme : lightTheme),
    toggleTheme,
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <html lang="en" className={roboto.className}><body></body></html>;
  }

  return (
    <html lang="en" className={roboto.className}>
      <head>
        <title>Budget This</title>
        <meta name="description" content="A budget management application" />
      </head>
      <body>
        <ClientAuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
