import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ApolloProvider } from '@apollo/client';
import { auth0Config } from './config/auth0';
import { apolloClient } from './config/apollo';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import DomainList from './components/Domains/DomainList';
import UserList from './components/Users/UserList';
import LoadingSpinner from './components/UI/LoadingSpinner';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();

  React.useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: auth0Config.audience,
            },
          });
          localStorage.setItem('auth0_token', token);
        } catch (error) {
          console.error('Error getting token:', error);
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

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