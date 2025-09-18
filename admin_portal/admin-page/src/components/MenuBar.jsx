import React from "react";
import { Layout, Menu, Typography, theme } from "antd";
import { AppstoreOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";

// Contract
// - Inputs: onNavigate(key: string), isAuthed: boolean, onSignOut: () => void, activeKey: string, placement?: 'left' | 'right'
// - Output: Vertical sidebar navigation (Ant Design Sider)
// - Behavior: Highlights active item, triggers callbacks on click; can be placed left or right by parent ordering

const { Sider } = Layout;

export default function MenuBar({ onNavigate, isAuthed, onSignOut, activeKey, placement = "left" }) {
  const {
    token: { colorBgContainer, colorTextHeading }
  } = theme.useToken();

  const items = [
    { key: "microapp", icon: <AppstoreOutlined />, label: "Micro App Management" },
    { key: "profile", icon: <UserOutlined />, label: "User Profile" },
  ];

  if (isAuthed) {
    items.push({ key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true });
  }

  const onClick = (e) => {
    if (e.key === "logout") onSignOut?.();
    else onNavigate?.(e.key);
  };

  return (
    <Sider
      width={240}
      style={{
        background: colorBgContainer,
        borderInlineEnd: placement === "left" ? "1px solid var(--border, #f0f0f0)" : undefined,
        borderInlineStart: placement === "right" ? "1px solid var(--border, #f0f0f0)" : undefined,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
      }}
      theme="light"
      collapsible={false}
      breakpoint="lg"
    >
      <div style={{ padding: 16 }}>
        <Typography.Title level={4} style={{ margin: 0, color: colorTextHeading }}>
          Admin Portal
        </Typography.Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        onClick={onClick}
        style={{ borderInline: 0 }}
      />
    </Sider>
  );
}
