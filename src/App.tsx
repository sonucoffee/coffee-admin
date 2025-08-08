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
import LoadingSpinner from './components/UI/LoadingSpinner';

const AuthorizedApp: React.FC = () => {
  const { data, loading, error } = useQuery(GET_ME, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all'
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
        <Route path="*" element={<Navigate to="/domains" replace />} />
      </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated, getAccessTokenSilently, error } = useAuth0();
  const [hasRefetchedOnLogin, setHasRefetchedOnLogin] = React.useState(false);

  React.useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
            cacheMode: 'on'
          });
          localStorage.setItem('auth0_token', token);
        } catch (error) {
          console.error('Error getting token:', error);
          // Clear any stale tokens on error
          localStorage.removeItem('auth0_token');
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Refetch ME data when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && !hasRefetchedOnLogin && !isLoading) {
      // Small delay to ensure token is set
      setTimeout(() => {
        // Force Apollo to refetch with new token by clearing cache and refetching
        apolloClient.resetStore().then(() => {
          setHasRefetchedOnLogin(true);
        });
      }, 500); // Increased delay to ensure token is properly set
    } else if (!isAuthenticated) {
      setHasRefetchedOnLogin(false);
      // Clear Apollo cache on logout
      apolloClient.clearStore();
    }
  }, [isAuthenticated, hasRefetchedOnLogin, isLoading]);

  // Also reset Apollo cache when token changes
  React.useEffect(() => {
    const checkTokenAndReset = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
            cacheMode: 'off' // Force fresh token
          });
          const currentToken = localStorage.getItem('auth0_token');
          
          // If token changed, update storage and reset Apollo cache
          if (token !== currentToken) {
            localStorage.setItem('auth0_token', token);
            apolloClient.resetStore();
          }
        } catch (error) {
          console.error('Error getting fresh token:', error);
          localStorage.removeItem('auth0_token');
        }
      }
    };

    if (isAuthenticated && hasRefetchedOnLogin) {
      checkTokenAndReset();
    }
  }, [isAuthenticated, getAccessTokenSilently, hasRefetchedOnLogin]);

  // Original token setting effect - modified
  React.useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
            cacheMode: 'off' // Force fresh token on login
          });
          localStorage.setItem('auth0_token', token);
        } catch (error) {
          console.error('Error getting token:', error);
          localStorage.removeItem('auth0_token');
        }
      } else {
        localStorage.removeItem('auth0_token');
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Remove the old token effect and refetch logic since we're handling it above
  /*
  React.useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
            cacheMode: 'on'
          });
          localStorage.setItem('auth0_token', token);
        } catch (error) {
          console.error('Error getting token:', error);
          localStorage.removeItem('auth0_token');
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Refetch ME data when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && !hasRefetchedOnLogin) {
      // Small delay to ensure token is set
      setTimeout(() => {
        // This will trigger a refetch in the AuthorizedApp component
        setHasRefetchedOnLogin(true);
      }, 100);
    } else if (!isAuthenticated) {
      setHasRefetchedOnLogin(false);
    }
  }, [isAuthenticated, hasRefetchedOnLogin]);
  */

  // Handle Auth0 errors
  if (error) {
    console.error('Auth0 Error:', error);
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">There was an issue with authentication. Please try logging in again.</p>
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
  if (isLoading) {
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
  return <AuthorizedApp key={hasRefetchedOnLogin ? 'authenticated' : 'initial'} />;
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