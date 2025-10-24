/**
 * Dashboard Component
 * 
 * Simple, elegant landing page after login.
 */

import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuthContext } from '@asgardeo/auth-react';

export default function Dashboard() {
  const { state } = useAuthContext();
  const username = state.username || 'User';
  const displayName = username.split('@')[0] || username;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Hi {displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your micro apps and user profiles from here.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Micro Apps
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload and manage micro applications
          </Typography>
        </Paper>

        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user access and permissions
          </Typography>
        </Paper>

        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure portal settings
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
