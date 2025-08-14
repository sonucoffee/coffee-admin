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
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Left side - User info and last login */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(51, 51, 51, 1)' }}>{user?.name || 'Admin User'}</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(51, 51, 51, 0.7)' }}>
            Your last login: Recently from your location.
          </p>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 bg-white">
            <Calendar className="w-4 h-4" style={{ color: 'rgba(51, 51, 51, 0.7)' }} />
            <span className="text-sm" style={{ color: 'rgba(51, 51, 51, 0.8)' }}>Last 7 days</span>
          </div>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50">
            <Download className="w-4 h-4" style={{ color: 'rgba(51, 51, 51, 0.7)' }} />
            <span className="text-sm" style={{ color: 'rgba(51, 51, 51, 0.8)' }}>Export</span>
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50">
            <Info className="w-4 h-4" style={{ color: 'rgba(51, 51, 51, 0.7)' }} />
            <span className="text-sm" style={{ color: 'rgba(51, 51, 51, 0.8)' }}>Info</span>
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-50"
            style={{ color: 'rgba(51, 51, 51, 0.8)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 51, 51, 0.05)'}
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