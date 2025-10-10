import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuBar from '../MenuBar';

// Mock Ant Design components and theme
jest.mock('antd', () => ({
  Layout: {
    Sider: ({ children, ...props }) => <div data-testid="sider" {...props}>{children}</div>
  },
  Menu: ({ items, onClick, selectedKeys, ...props }) => (
    <div data-testid="menu" {...props}>
      {items.map(item => (
        <div 
          key={item.key}
          data-testid={`menu-item-${item.key}`}
          onClick={() => onClick({ key: item.key })}
          className={selectedKeys?.includes(item.key) ? 'selected' : ''}
        >
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  ),
  Typography: {
    Title: ({ children, ...props }) => <h1 data-testid="title" {...props}>{children}</h1>
  },
  theme: {
    useToken: () => ({
      token: {
        colorBgContainer: '#ffffff',
        colorTextHeading: '#000000'
      }
    })
  }
}));

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  AppstoreOutlined: () => <span data-testid="appstore-icon">AppstoreIcon</span>,
  UserOutlined: () => <span data-testid="user-icon">UserIcon</span>,
  LogoutOutlined: () => <span data-testid="logout-icon">LogoutIcon</span>
}));

describe('MenuBar Component', () => {
  const defaultProps = {
    onNavigate: jest.fn(),
    onSignOut: jest.fn(),
    isAuthed: true,
    activeKey: 'microapp',
    placement: 'left'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders MenuBar with all required elements', () => {
    render(<MenuBar {...defaultProps} />);
    
    expect(screen.getByTestId('sider')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByTestId('menu')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  test('renders all navigation menu items when authenticated', () => {
    render(<MenuBar {...defaultProps} />);
    
    expect(screen.getByTestId('menu-item-microapp')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-profile')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-logout')).toBeInTheDocument();
    
    expect(screen.getByText('Micro App Management')).toBeInTheDocument();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('does not render logout item when not authenticated', () => {
    render(<MenuBar {...defaultProps} isAuthed={false} />);
    
    expect(screen.getByTestId('menu-item-microapp')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-profile')).toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-logout')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('renders correct icons for each menu item', () => {
    render(<MenuBar {...defaultProps} />);
    
    expect(screen.getByTestId('appstore-icon')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  test('calls onNavigate when clicking navigation items', () => {
    const onNavigateMock = jest.fn();
    render(<MenuBar {...defaultProps} onNavigate={onNavigateMock} />);
    
    fireEvent.click(screen.getByTestId('menu-item-microapp'));
    expect(onNavigateMock).toHaveBeenCalledWith('microapp');
    
    fireEvent.click(screen.getByTestId('menu-item-profile'));
    expect(onNavigateMock).toHaveBeenCalledWith('profile');
    
    expect(onNavigateMock).toHaveBeenCalledTimes(2);
  });

  test('calls onSignOut when clicking logout item', () => {
    const onSignOutMock = jest.fn();
    render(<MenuBar {...defaultProps} onSignOut={onSignOutMock} />);
    
    fireEvent.click(screen.getByTestId('menu-item-logout'));
    expect(onSignOutMock).toHaveBeenCalledTimes(1);
  });

  test('does not call onNavigate when clicking logout item', () => {
    const onNavigateMock = jest.fn();
    render(<MenuBar {...defaultProps} onNavigate={onNavigateMock} />);
    
    fireEvent.click(screen.getByTestId('menu-item-logout'));
    expect(onNavigateMock).not.toHaveBeenCalled();
  });

  test('handles missing onNavigate callback gracefully', () => {
    const { container } = render(<MenuBar {...defaultProps} onNavigate={undefined} />);
    
    expect(() => {
      fireEvent.click(screen.getByTestId('menu-item-microapp'));
    }).not.toThrow();
  });

  test('handles missing onSignOut callback gracefully', () => {
    const { container } = render(<MenuBar {...defaultProps} onSignOut={undefined} />);
    
    expect(() => {
      fireEvent.click(screen.getByTestId('menu-item-logout'));
    }).not.toThrow();
  });

  test('highlights active menu item', () => {
    render(<MenuBar {...defaultProps} activeKey="profile" />);
    
    const profileItem = screen.getByTestId('menu-item-profile');
    expect(profileItem).toHaveClass('selected');
  });

  test('applies correct Sider configuration', () => {
    render(<MenuBar {...defaultProps} />);
    
    const sider = screen.getByTestId('sider');
    expect(sider).toHaveAttribute('width', '240');
    expect(sider).toHaveAttribute('theme', 'light');
    //expect(sider).toHaveAttribute('collapsible', 'false');
    expect(sider).toHaveAttribute('breakpoint', 'lg');
  });

  test('applies Menu configuration correctly', () => {
    render(<MenuBar {...defaultProps} activeKey="microapp" />);
    
    const menu = screen.getByTestId('menu');
    expect(menu).toHaveAttribute('mode', 'inline');
  });

  test('renders with different activeKey values', () => {
    const { rerender } = render(<MenuBar {...defaultProps} activeKey="microapp" />);
    expect(screen.getByTestId('menu-item-microapp')).toHaveClass('selected');
    
    rerender(<MenuBar {...defaultProps} activeKey="profile" />);
    expect(screen.getByTestId('menu-item-profile')).toHaveClass('selected');
    expect(screen.getByTestId('menu-item-microapp')).not.toHaveClass('selected');
  });

  test('handles undefined activeKey', () => {
    render(<MenuBar {...defaultProps} activeKey={undefined} />);
    
    expect(screen.getByTestId('menu-item-microapp')).not.toHaveClass('selected');
    expect(screen.getByTestId('menu-item-profile')).not.toHaveClass('selected');
  });

  test('uses default placement when not provided', () => {
    const { placement, ...propsWithoutPlacement } = defaultProps;
    render(<MenuBar {...propsWithoutPlacement} />);
    
    // Component should render without errors even without placement prop
    expect(screen.getByTestId('sider')).toBeInTheDocument();
  });

});