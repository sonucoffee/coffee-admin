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
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;