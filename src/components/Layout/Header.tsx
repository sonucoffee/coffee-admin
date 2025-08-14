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
          <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Admin User'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your last login: Recently from your location.
          </p>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Last 7 days</span>
          </div>
          
          <button className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Export</span>
          </button>
          
          <button className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Info</span>
          </button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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