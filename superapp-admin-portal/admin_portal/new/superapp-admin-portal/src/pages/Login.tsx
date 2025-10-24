/**
 * Login Page
 * 
 * Simple, elegant login interface.
 * Always uses light mode for consistent branding.
 */

import { Box, Button, Container, Typography, Paper, ThemeProvider } from '@mui/material';
import { useAuthContext } from '@asgardeo/auth-react';
import LoginIcon from '@mui/icons-material/Login';
import loginBanner from '../assets/login_banner.png';
import { createAppTheme } from '../theme';

export default function Login() {
    const { signIn } = useAuthContext();

    // Always use light theme for login page
    const lightTheme = createAppTheme('light');

    return (
        <ThemeProvider theme={lightTheme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                }}
            >
                <Container maxWidth="sm">
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
                        <img
                            src={loginBanner}
                            alt="SuperApp Admin Portal"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                            }}
                        />
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
        </ThemeProvider>
    );
}
