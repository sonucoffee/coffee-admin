import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogOut } from 'lucide-react';

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
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Empty left side for spacing */}
        <div></div>
        
        {/* Right side - Only logout button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-50"
            style={{ color: 'rgba(51, 51, 51, 0.8)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;