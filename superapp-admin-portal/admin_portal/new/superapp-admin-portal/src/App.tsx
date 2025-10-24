/**
 * App Component
 * 
 * Main application entry point with authentication routing.
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { Layout, Dashboard, Loading } from './components';
import Login from './pages/Login';

function App() {
  const { state } = useAuthContext();

  if (state.isLoading) return <Loading />;
  if (!state.isAuthenticated) return <Login />;

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default App;
