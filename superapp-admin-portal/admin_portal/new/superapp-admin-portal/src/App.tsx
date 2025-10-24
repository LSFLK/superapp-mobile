/**
 * App Component
 * 
 * Main application entry point with authentication routing.
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Dashboard, Loading } from './components';
import Login from './pages/Login';
import MicroApps from './pages/MicroApps';
import ComingSoon from './pages/ComingSoon';
import { useNotification } from './context';
import { apiService } from './services';

function App() {
  const { state, getAccessToken, signOut } = useAuthContext();
  const { showNotification } = useNotification();
  const hasShownLoginNotification = useRef(false);

  // Wrap getAccessToken to ensure stable reference
  const _getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessToken();
      return token || '';
    } catch (error) {
      console.error('Error getting access token in App:', error);
      return '';
    }
  }, [getAccessToken]);

  // Wrap signOut to ensure stable reference  
  const stableSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Initialize API service with token getter and sign out function
  useEffect(() => {
    if (state.isAuthenticated) {
      console.log('Setting up API service with auth functions');
      apiService.setTokenGetter(_getAccessToken);
      apiService.setSignOut(stableSignOut);
    }
  }, [state.isAuthenticated, _getAccessToken, stableSignOut]);

  // Show notification when user logs in
  useEffect(() => {
    if (state.isAuthenticated && !hasShownLoginNotification.current) {
      showNotification('Successfully signed in', 'success');
      hasShownLoginNotification.current = true;
    }
  }, [state.isAuthenticated, showNotification]);

  if (state.isLoading) return <Loading />;
  if (!state.isAuthenticated) return <Login />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/microapps" element={<MicroApps />} />
          <Route path="/users" element={<ComingSoon />} />
          <Route path="/analytics" element={<ComingSoon />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
