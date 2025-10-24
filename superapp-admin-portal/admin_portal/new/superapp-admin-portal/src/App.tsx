/**
 * App Component
 * 
 * Main application entry point with authentication routing.
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useEffect, useRef } from 'react';
import { Layout, Dashboard, Loading } from './components';
import Login from './pages/Login';
import { useNotification } from './context';

function App() {
  const { state } = useAuthContext();
  const { showNotification } = useNotification();
  const hasShownLoginNotification = useRef(false);

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
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default App;
