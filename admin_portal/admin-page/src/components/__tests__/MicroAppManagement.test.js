/*
These tests cover
  Initial rendering - Verifies component loads correctly
  API integration - Tests fetch calls with authentication
  Loading states - Tests loading indicators and disabled states
  Data display - Verifies micro-apps render correctly in grid
  Error handling - Tests network errors and HTTP error responses
  Upload mode - Tests toggle between list and upload views
  User interactions - Tests refresh, upload, and navigation
  Authentication - Tests authenticated and unauthenticated states
  Edge cases - Tests missing data, incomplete responses
  State management - Tests component state changes
*/

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies with correct paths
jest.mock('@asgardeo/auth-react', () => ({
  useAuthContext: jest.fn()
}));

jest.mock('../UploadMicroApp', () => {
  return function MockUploadMicroApp({ onUploaded }) {
    return (
      <div data-testid="upload-micro-app">
        Upload Component
        <button onClick={onUploaded}>Simulate Upload Success</button>
      </div>
    );
  };
});

jest.mock('../common/Button', () => {
  return function MockButton({ children, onClick, disabled }) {
    return (
      <button onClick={onClick} disabled={disabled} data-testid="button">
        {children}
      </button>
    );
  };
});

jest.mock('../common/Loading', () => {
  return function MockLoading({ message }) {
    return <div data-testid="loading">{message}</div>;
  };
});

jest.mock('../common/Card', () => {
  return function MockCard({ children, style }) {
    return (
      <div data-testid="card" style={style}>
        {children}
      </div>
    );
  };
});

jest.mock('../../constants/styles', () => ({
  COLORS: {
    primary: '#1677ff'
  }
}));

jest.mock('../../constants/api', () => ({
  getEndpoint: jest.fn(() => 'http://api.test/microapps')
}));

// Import after mocking
import { useAuthContext } from '@asgardeo/auth-react';
import { getEndpoint } from '../../constants/api';
import MicroAppManagement from '../MicroAppManagement';

// Mock fetch globally
global.fetch = jest.fn();

describe('MicroAppManagement Component', () => {
  const mockAuth = {
    state: {
      isAuthenticated: true
    },
    getAccessToken: jest.fn(() => Promise.resolve('mock-access-token'))
  };

  const mockMicroApps = [
    {
      micro_app_id: '1',
      name: 'Test App 1',
      version: '1.0.0',
      description: 'Test description 1'
    },
    {
      app_id: '2',
      name: 'Test App 2',
      version: '2.0.0',
      description: 'Test description 2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthContext.mockReturnValue(mockAuth);
    getEndpoint.mockReturnValue('http://api.test/microapps');
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMicroApps)
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

    test('renders refresh button with correct text based on loading state', async () => {
        render(<MicroAppManagement />);
        
        // Initially should show "Refreshing..." while loading
        expect(screen.getByText('Refreshing…')).toBeInTheDocument();
        
        // After loading completes, should show "Refresh"
        await waitFor(() => {
            expect(screen.getByText('Refresh')).toBeInTheDocument();
        });
    });

    test('handles button interactions with flexible text matching', async () => {
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Test App 1')).toBeInTheDocument();
        });
        
        // Use more flexible matching for buttons
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        const addButton = screen.getByRole('button', { name: /add new/i });
        
        expect(refreshButton).toBeInTheDocument();
        expect(addButton).toBeInTheDocument();
        
        fireEvent.click(refreshButton);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    test('displays correct app initials for multiple apps', async () => {
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            const initialsElements = screen.getAllByText('TE');
            expect(initialsElements).toHaveLength(2); // Both "Test App 1" and "Test App 2" show "TE"
        });
    });

    test('handles apps with missing data using flexible matching', async () => {
        const incompleteApps = [
            { micro_app_id: '1' }, // Missing name, version, description
            { name: 'App 2' } // Missing ID, version, description
        ];
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(incompleteApps)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            // Look for the version format with em dash
            expect(screen.getAllByText(/v—/)).toHaveLength(2);
            expect(screen.getAllByText('No description')).toHaveLength(2);
            expect(screen.getByText('App 2')).toBeInTheDocument();
            // The first app might show "?" for initials when name is missing
            expect(screen.getByText('?')).toBeInTheDocument();
        });
    });

    test('displays different app initials correctly', async () => {
        const appsWithDifferentNames = [
            { micro_app_id: '1', name: 'Alpha App', version: '1.0.0' },
            { micro_app_id: '2', name: 'Beta Service', version: '2.0.0' }
        ];
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(appsWithDifferentNames)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('AL')).toBeInTheDocument(); // "Alpha App" -> "AL"
            expect(screen.getByText('BE')).toBeInTheDocument(); // "Beta Service" -> "BE"
        });
    });

    test('handles single word app names for initials', async () => {
        const singleWordApps = [
            { micro_app_id: '1', name: 'Dashboard', version: '1.0.0' },
            { micro_app_id: '2', name: 'A', version: '2.0.0' } // Single character
        ];
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(singleWordApps)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('DA')).toBeInTheDocument(); // "Dashboard" -> "DA"
            expect(screen.getByText('A')).toBeInTheDocument(); // "A" -> "A"
        });
    });

    test('handles network timeout gracefully', async () => {
        fetch.mockImplementation(() => 
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 100)
            )
        );
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Request timeout')).toBeInTheDocument();
        });
    });

    test('handles malformed JSON response', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.reject(new Error('Unexpected token'))
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Unexpected token')).toBeInTheDocument();
        });
    });

    test('handles 404 error response', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 404
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to load micro-apps (404)')).toBeInTheDocument();
        });
    });

    test('handles null response data', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(null)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('No micro-apps found.')).toBeInTheDocument();
        });
    });

    test('handles response with nested data structure', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                data: mockMicroApps,
                meta: { total: 2 }
            })
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Test App 1')).toBeInTheDocument();
        });
    });

    test('prevents multiple simultaneous refresh requests', async () => {
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Test App 1')).toBeInTheDocument();
        });
        
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        
        // Click refresh multiple times quickly
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        
        // Should only make one additional request (total 2: initial + 1 refresh)
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    test('maintains component state during upload mode toggle', async () => {
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Test App 1')).toBeInTheDocument();
        });
        
        // Toggle to upload mode
        fireEvent.click(screen.getByRole('button', { name: /add new/i }));
        expect(screen.getByTestId('upload-micro-app')).toBeInTheDocument();
        
        // Toggle back
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        
        // Apps should still be displayed
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
        expect(screen.getByText('Test App 2')).toBeInTheDocument();
    });

    test('handles very long app names gracefully', async () => {
        const longNameApps = [
            { 
                micro_app_id: '1', 
                name: 'This Is A Very Long Application Name That Might Cause Display Issues',
                version: '1.0.0',
                description: 'A description for the very long named app'
            }
        ];
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(longNameApps)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText(/This Is A Very Long Application Name/)).toBeInTheDocument();
            expect(screen.getByText('TH')).toBeInTheDocument(); // Initials should still work
        });
    });

    test('handles apps with special characters in names', async () => {
        const specialCharApps = [
            { 
                micro_app_id: '1', 
                name: 'Café & Restaurant Manager',
                version: '1.0.0'
            },
            { 
                micro_app_id: '2', 
                name: 'E-Commerce 2.0',
                version: '2.0.0'
            }
        ];
        
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(specialCharApps)
        });
        
        render(<MicroAppManagement />);
        
        await waitFor(() => {
            expect(screen.getByText('Café & Restaurant Manager')).toBeInTheDocument();
            expect(screen.getByText('E-Commerce 2.0')).toBeInTheDocument();
            expect(screen.getByText('CA')).toBeInTheDocument(); // "Café" -> "CA"
            expect(screen.getByText('E-')).toBeInTheDocument(); // "E-Commerce" -> "E-"
        });
    });

  test('renders initial state correctly', async () => {
    render(<MicroAppManagement />);
    
    expect(screen.getByText('Available Micro Apps')).toBeInTheDocument();
    expect(screen.getByText('Add new')).toBeInTheDocument();
    
    // Wait for data to load and then check for Refresh button
    await waitFor(() => {
      expect(screen.getByText('Test App 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('displays loading state when fetching apps', async () => {
    // Mock a delayed response
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve([])
      }), 100);
    }));

    render(<MicroAppManagement />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading micro-apps…')).toBeInTheDocument();
  });

  test('displays micro apps in grid format', async () => {
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test App 1')).toBeInTheDocument();
      expect(screen.getByText('Test App 2')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('v2.0.0')).toBeInTheDocument();
      expect(screen.getByText('Test description 1')).toBeInTheDocument();
      expect(screen.getByText('Test description 2')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('handles HTTP error responses', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500
    });
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load micro-apps (500)')).toBeInTheDocument();
    });
  });

  test('handles different response formats', async () => {
    // Test paginated response format
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockMicroApps })
    });
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Test App 1')).toBeInTheDocument();
    });
  });

  test('displays empty state when no apps available', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('No micro-apps found.')).toBeInTheDocument();
    });
  });

  test('toggles upload mode', async () => {
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Available Micro Apps')).toBeInTheDocument();
    });
    
    // Click "Add new" button
    fireEvent.click(screen.getByText('Add new'));
    
    expect(screen.getByTestId('upload-micro-app')).toBeInTheDocument();
    expect(screen.queryByText('Available Micro Apps')).not.toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  test('closes upload mode', async () => {
    render(<MicroAppManagement />);
    
    // Enter upload mode
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add new'));
    });
    
    expect(screen.getByTestId('upload-micro-app')).toBeInTheDocument();
    
    // Close upload mode
    fireEvent.click(screen.getByText('Close'));
    
    expect(screen.queryByTestId('upload-micro-app')).not.toBeInTheDocument();
    expect(screen.getByText('Available Micro Apps')).toBeInTheDocument();
  });

  test('refreshes micro apps list', async () => {
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    // Wait for initial load to complete before clicking refresh
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
    
    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles successful upload and refreshes list', async () => {
    render(<MicroAppManagement />);
    
    // Enter upload mode
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add new'));
    });
    
    expect(fetch).toHaveBeenCalledTimes(1); // Initial load
    
    // Simulate successful upload
    fireEvent.click(screen.getByText('Simulate Upload Success'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // Refresh after upload
      expect(screen.queryByTestId('upload-micro-app')).not.toBeInTheDocument();
    });
  });

  test('handles unauthenticated state', async () => {
    useAuthContext.mockReturnValue({
      state: { isAuthenticated: false },
      getAccessToken: jest.fn()
    });
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://api.test/microapps', {
        headers: {}
      });
    });
  });

  test('handles authentication token failure', async () => {
    useAuthContext.mockReturnValue({
      state: { isAuthenticated: true },
      getAccessToken: jest.fn(() => Promise.reject(new Error('Token error')))
    });
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://api.test/microapps', {
        headers: {}
      });
      expect(consoleSpy).toHaveBeenCalledWith('Authentication token acquisition failed:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('displays app initials correctly', async () => {
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      const cards = screen.getAllByTestId('card');
      // Find the cards containing app info
      const appCards = cards.filter(card => 
        card.textContent.includes('Test App 1') || card.textContent.includes('Test App 2')
      );
      expect(appCards).toHaveLength(2);
      expect(screen.getAllByText('TE')).toHaveLength(2); // Both apps start with "TE"
    });
  });

  test('handles apps with missing data gracefully', async () => {
    const incompleteApps = [
      { micro_app_id: '1' }, // Missing name, version, description
      { name: 'App 2' } // Missing ID, version, description
    ];
    
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(incompleteApps)
    });
    
    render(<MicroAppManagement />);
    
    await waitFor(() => {
      // For the first app with missing name, it shows the micro_app_id "1"
      expect(screen.getByText('1')).toBeInTheDocument(); // Falls back to ID
      expect(screen.getByText('App 2')).toBeInTheDocument();
      expect(screen.getAllByText(/v—/)).toHaveLength(2); // Missing version (using regex to handle whitespace)
      expect(screen.getAllByText('No description')).toHaveLength(2);
    });
  });

  test('disables refresh button while loading', async () => {
    // Mock a slow response
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve([])
      }), 100);
    }));
    
    render(<MicroAppManagement />);
    
    // Initially should show "Refreshing…" and be disabled
    await waitFor(() => {
      const refreshButton = screen.getByText('Refreshing…');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toBeDisabled();
    });
  });
});