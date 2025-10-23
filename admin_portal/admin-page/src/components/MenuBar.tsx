import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export type MenuBarProps = {
  onNavigate?: (key: string) => void;
  isAuthed: boolean;
  onSignOut?: () => void;
  activeKey: string;
  placement?: "left" | "right";
};

const drawerWidth = 200;

export default function MenuBar({
  onNavigate,
  isAuthed,
  onSignOut,
  activeKey,
  placement = "left",
}: MenuBarProps) {

  const items: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
  }> = [
    { key: "microapp", icon: <AppsIcon />, label: "Micro App Management" },
    { key: "profile", icon: <PersonIcon />, label: "User Profile" },
  ];
  if (isAuthed)
    items.push({
      key: "logout",
      icon: <LogoutIcon color="error" />,
      label: "Logout",
      danger: true,
    });

  const onClick = (key: string) => {
    if (key === "logout") onSignOut?.();
    else onNavigate?.(key);
  };

  return (
    <Drawer
      variant="permanent"
      anchor={placement}
      open
      sx={{
        width: { xs: '100vw', sm: drawerWidth },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: drawerWidth },
          boxSizing: 'border-box',
          position: { xs: 'fixed', sm: 'sticky' },
          height: { xs: 56, sm: '100vh' },
          flexDirection: { xs: 'row', sm: 'column' },
          display: 'flex',
          alignItems: { xs: 'center', sm: 'stretch' },
          justifyContent: { xs: 'flex-start', sm: 'flex-start' },
          padding: 0,
        },
      }}
      PaperProps={{
        sx: { position: { xs: 'fixed', sm: 'sticky' }, height: { xs: 56, sm: '100vh' } },
        'data-testid': 'sider' as any,
      }}
    >
      <Toolbar sx={{ display: { xs: 'none', sm: 'block' } }} />
      <Box
        sx={{
          pt: { xs: 0, sm: -10 },
          pb: { xs: 0, sm: 2 },
          px: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'column' },
          alignItems: 'center',
          width: { xs: 'auto', sm: '100%' },
          minWidth: 0,
        }}
      >
        <img
          src={process.env.PUBLIC_URL + '/download.jpeg'}
          alt="Download"
          style={{
            width: 40,
            height: 40,
            marginBottom: 0,
            marginTop: 0,
            borderRadius: 8,
            display: 'block',
          }}
        />
        <Typography
          variant="h6"
          component="h1"
          sx={{
            m: 0,
            ml: { xs: 2, sm: 0 },
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            display: { xs: 'inline', sm: 'block' },
            whiteSpace: { xs: 'nowrap', sm: 'normal' },
          }}
        >
          Admin Portal
        </Typography>
      </Box>
      <List data-testid="menu" sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, width: '100%' }}>
        {items.map((item) => {
          const selected = activeKey === item.key;
          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              className={selected ? 'selected' : ''}
              onClick={() => onClick(item.key)}
              role="menuitem"
              data-testid={`menu-item-${item.key}`}
              sx={{
                flex: { xs: 1, sm: 'unset' },
                justifyContent: { xs: 'center', sm: 'flex-start' },
                minWidth: 0,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  color: item.danger ? 'error' : undefined,
                  sx: { display: { xs: 'none', sm: 'block' } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
