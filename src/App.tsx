import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { ApolloProvider, useQuery } from '@apollo/client';
import { auth0Config } from './config/auth0';
import { apolloClient } from './config/apollo';
import { GET_ME } from './graphql/queries';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import UnauthorizedPage from './components/Auth/UnauthorizedPage';
import DomainList from './components/Domains/DomainList';
import UserList from './components/Users/UserList';
import CreateWorkspace from './components/Workspaces/CreateWorkspace';
import WorkspacePreferences from './components/Workspaces/WorkspacePreferences';
import LoadingSpinner from './components/UI/LoadingSpinner';

const AuthorizedApp: React.FC = () => {
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
    skip: false
  });

  if (loading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  if (error) {
    console.error('Error fetching user data:', error);
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to verify permissions</h2>
            <p className="text-gray-600 mb-4">There was an issue checking your account permissions.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if user is superuser
  if (!data?.me?.isSuperuser) {
    return <UnauthorizedPage />;
  }

  // User is authorized, show the main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/domains" replace />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />
        <Route path="/domains" element={<DomainList />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/workspace-preferences" element={<WorkspacePreferences />} />
        <Route path="*" element={<Navigate to="/domains" replace />} />
      </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated, getAccessTokenSilently, error } = useAuth0();
  const [tokenReady, setTokenReady] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Single effect to handle token and initialization
  React.useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated) {
        try {
          setIsInitializing(true);
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
            cacheMode: 'off'
          });
          
          localStorage.setItem('auth0_token', token);
          
          // Reset Apollo cache once with new token
          await apolloClient.resetStore();
          
          setTokenReady(true);
          setIsInitializing(false);
        } catch (error) {
          console.error('Error getting token:', error);
          localStorage.removeItem('auth0_token');
          setTokenReady(false);
          setIsInitializing(false);
        }
      } else {
        localStorage.removeItem('auth0_token');
        apolloClient.clearStore();
        setTokenReady(false);
        setIsInitializing(false);
      }
    };

    if (!isLoading) {
      initializeAuth();
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  // Handle Auth0 errors
  if (error) {
    console.error('Auth0 Error:', error);
    
    // Check if it's a domain not in allowlist error
    const isDomainError = error.message?.includes('Domain not in allowlist');
    
    if (isDomainError) {
      // Redirect to login page which will handle the domain error display
      return (
        <Layout>
          <LoginPage />
        </Layout>
      );
    }
    
    // Handle other authentication errors
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">There was an issue with authentication. Please try logging in again.</p>
            <div className="text-sm text-gray-500 mb-4">
              Error: {error.message || 'Unknown authentication error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (isLoading || isInitializing) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <LoginPage />
      </Layout>
    );
  }

  // User is authenticated, now check if they're authorized
  return tokenReady ? <AuthorizedApp /> : <LoadingSpinner message="Preparing your workspace..." />;
};

const App: React.FC = () => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri:  window.location.origin,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <ApolloProvider client={apolloClient}>
        <Router>
          <AppContent />
        </Router>
      </ApolloProvider>
    </Auth0Provider>
  );
};

export default App;