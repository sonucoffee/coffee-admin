import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from '../UI/LoadingSpinner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;