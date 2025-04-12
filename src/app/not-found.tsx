'use client';

import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

export default function NotFound() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          textAlign: 'center',
          width: '100%'
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '6rem', sm: '8rem' }, fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          404
        </Typography>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: '80%' }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/')}
          >
            Go Home
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 