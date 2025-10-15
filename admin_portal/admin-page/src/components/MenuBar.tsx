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
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      PaperProps={{
        sx: { position: "sticky", height: "100vh" },
        "data-testid": "sider" as any,
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="h1" sx={{ m: 0 }}>
          Admin Portal
        </Typography>
      </Box>
      <List data-testid="menu">
        {items.map((item) => {
          const selected = activeKey === item.key;
          return (
            <ListItemButton
              key={item.key}
              selected={selected}
              className={selected ? "selected" : ""}
              onClick={() => onClick(item.key)}
              role="menuitem"
              data-testid={`menu-item-${item.key}`}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  color: item.danger ? "error" : undefined,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
