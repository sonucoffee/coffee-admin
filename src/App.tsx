import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { ApolloProvider } from '@apollo/client';
import { auth0Config } from './config/auth0';
import { apolloClient } from './config/apollo';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import DomainList from './components/Domains/DomainList';
import UserList from './components/Users/UserList';
import CreateWorkspace from './components/Workspaces/CreateWorkspace';
import LoadingSpinner from './components/UI/LoadingSpinner';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated, getAccessTokenSilently, error } = useAuth0();

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
      skipRedirectCallback={window.location.pathname === '/'}
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