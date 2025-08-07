import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogOut, User, Coffee } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth0();

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin,
      } 
    });
  };

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
              {/* <Coffee className="w-6 h-6 text-white" /> */}
              <img
                  src={'coffee-logo-bean-64.png'}
                  className="w-8 h-8 rounded-full"
                />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">The Coffee Bar</h1>
              <p className="text-sm text-gray-500">Internal Admin Tool</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;