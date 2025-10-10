import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

let mockAuth;
jest.mock('@asgardeo/auth-react', () => ({
  useAuthContext: () => mockAuth,
}));

// Simplify AntD to avoid heavy DOM
jest.mock('antd', () => {
  const Layout = ({ children }) => <div>{children}</div>;
  Layout.Sider = ({ children }) => <aside>{children}</aside>;
  Layout.Content = ({ children }) => <section>{children}</section>;
  return {
    Layout,
    Content: Layout.Content,
    Menu: ({ items, onClick }) => (
      <nav>
        {items.map(i => (
          <button key={i.key} onClick={() => onClick?.({ key: i.key })}>{i.label}</button>
        ))}
      </nav>
    ),
    Typography: { Title: ({ children }) => <h1>{children}</h1> },
    theme: { useToken: () => ({ token: { colorBgContainer: '#fff', colorTextHeading: '#000' } }) }
  };
});

jest.mock('./constants/api', () => ({
  getEndpoint: jest.fn((k) => k === 'MICROAPPS_LIST' ? 'http://api.test/microapps' : 'http://api.test')
}));

beforeEach(() => {
  mockAuth = {
    state: { isAuthenticated: false, username: '', displayName: '' },
    signIn: jest.fn(),
    signOut: jest.fn(),
    getAccessToken: jest.fn(),
  };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
});

afterEach(() => jest.clearAllMocks());

test('renders sign in screen when not authenticated', () => {
  mockAuth.state.isAuthenticated = false;
  render(<App />);
  expect(screen.getByText(/Please Sign In/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(mockAuth.signIn).toHaveBeenCalled();
});

test('renders menu when authenticated', async () => {
  mockAuth.state.isAuthenticated = true;
  mockAuth.state.displayName = 'Zoe Zebra';
  render(<App />);
  expect(await screen.findByText(/Hi Zoe,/)).toBeInTheDocument();
});
