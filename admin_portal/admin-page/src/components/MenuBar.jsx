/**
 * MenuBar Component - Admin Portal Navigation Sidebar
 * 
 * Provides the main navigation interface for the admin portal using Ant Design's
 * sidebar layout. Handles navigation between different admin sections and user logout.
 * 
 * Features:
 * - Responsive sidebar navigation with icons
 * - Active state highlighting
 * - Logout functionality integration
 * - Clean, professional styling with Ant Design theming
 * 
 * Props:
 * @param {Function} onNavigate - Callback when navigation item is clicked
 * @param {boolean} isAuthed - Whether user is currently authenticated
 * @param {Function} onSignOut - Callback to handle user logout
 * @param {string} activeKey - Currently active navigation section
 * @param {string} placement - Sidebar placement (default: 'left')
 * 
 * Navigation Sections:
 * - microapp: Micro-application management interface
 * - profile: User profile and account information
 * - logout: Sign out from the application
 */

import React from "react";
import { Layout, Menu, Typography, theme } from "antd";
import { AppstoreOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Sider } = Layout;

export default function MenuBar({ onNavigate, isAuthed, onSignOut, activeKey, placement = "left" }) {
  // Extract Ant Design theme tokens for consistent styling
  const {
    token: { colorBgContainer, colorTextHeading }
  } = theme.useToken();

  /**
   * Navigation Menu Items Configuration
   * 
   * Defines the structure and appearance of navigation menu items.
   * Each item includes an icon, label, and unique key for identification.
   */
  const items = [
    { 
      key: "microapp", 
      icon: <AppstoreOutlined />, 
      label: "Micro App Management" 
    },
    { 
      key: "profile", 
      icon: <UserOutlined />, 
      label: "User Profile" 
    },
  ];

  // Add logout option only for authenticated users
  if (isAuthed) {
    items.push({ 
      key: "logout", 
      icon: <LogoutOutlined />, 
      label: "Logout", 
      danger: true // Ant Design styling for destructive actions
    });
  }

  /**
   * Menu Click Handler
   * 
   * Processes menu item clicks and routes to appropriate actions:
   * - 'logout': Triggers sign-out process
   * - Other keys: Navigate to corresponding admin section
   * 
   * @param {Object} e - Ant Design menu click event
   * @param {string} e.key - The key of the clicked menu item
   */
  const onClick = (e) => {
    if (e.key === "logout") {
      onSignOut?.(); // Optional chaining in case callback is undefined
    } else {
      onNavigate?.(e.key); // Navigate to selected section
    }
  };

  return (
    <Sider
      width={240} // Fixed width for consistent layout
      style={{
        background: colorBgContainer, // Use Ant Design theme background
        position: "sticky", // Stick to viewport during scroll
        top: 0,
        height: "100vh", // Full viewport height
        overflow: "auto", // Handle content overflow
      }}
      theme="light" // Light theme for professional appearance
      collapsible={false} // Disable collapse to maintain consistent layout
      breakpoint="lg" // Responsive behavior on large screens
    >
      {/* Sidebar Header */}
      <div style={{ padding: 16 }}>
        <Typography.Title level={4} style={{ margin: 0, color: colorTextHeading }}>
          Admin Portal
        </Typography.Title>
      </div>
      
      {/* Navigation Menu */}
      <Menu
        mode="inline" // Vertical inline menu style
        selectedKeys={[activeKey]} // Highlight currently active section
        items={items} // Menu items configuration
        onClick={onClick} // Click handler for navigation and logout
        style={{ borderInline: 0 }} // Remove default Ant Design borders
      />
    </Sider>
  );
}
