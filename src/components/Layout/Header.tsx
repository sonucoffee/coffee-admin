import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogOut, User, Coffee, Calendar, Download, Info } from 'lucide-react';

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
    <header className="border-b border-gray-600 shadow-sm px-6 py-4" style={{ backgroundColor: 'rgba(68, 68, 68, 1)' }}>
      <div className="flex justify-between items-center">
        {/* Left side - User info and last login */}
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{user?.name || 'Admin User'}</h1>
          <p className="text-sm text-gray-300 mt-1">
            Your last login: Recently from your location.
          </p>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-500" style={{ backgroundColor: 'rgba(85, 85, 85, 1)' }}>
            <Calendar className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-200">Last 7 days</span>
          </div>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-500 transition-colors hover:bg-opacity-80" style={{ backgroundColor: 'rgba(85, 85, 85, 1)' }}>
            <Download className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-200">Export</span>
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-500 transition-colors hover:bg-opacity-80" style={{ backgroundColor: 'rgba(85, 85, 85, 1)' }}>
            <Info className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-200">Info</span>
          </button>
          
          <div className="w-px h-6 bg-gray-500"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-200 hover:text-white rounded-lg transition-colors hover:bg-opacity-50"
            style={{ ':hover': { backgroundColor: 'rgba(85, 85, 85, 0.5)' } }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(85, 85, 85, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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