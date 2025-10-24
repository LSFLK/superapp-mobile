/**
 * Login Page
 * 
 * Simple, elegant login interface.
 */

import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useAuthContext } from '@asgardeo/auth-react';
import LoginIcon from '@mui/icons-material/Login';

export default function Login() {
  const { signIn } = useAuthContext();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            SuperApp Admin
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to manage your applications
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => signIn()}
            startIcon={<LoginIcon />}
            sx={{ py: 1.5 }}
          >
            Sign In
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            Powered by Asgardeo
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
