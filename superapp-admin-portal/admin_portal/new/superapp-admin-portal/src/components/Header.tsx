/**
 * Header Component
 * 
 * Simple, clean header with branding and user info.
 */

import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useNotification } from '../context';

export default function Header() {
  const { state, signOut } = useAuthContext();
  const { showNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const username = state.username || 'User';
  const displayName = username.split('@')[0] || username;
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    showNotification('Signing out...', 'info');
    // Small delay to show the notification before redirect
    setTimeout(async () => {
      await signOut();
    }, 500);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h6" 
            component="h1" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            SuperApp Admin Portal
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {displayName}
          </Typography>
          
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
              }}
            >
              {initials}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              {username}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
