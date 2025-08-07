import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Shield, Coffee, LogOut, Mail } from 'lucide-react';
import Button from '../UI/Button';

const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth0();

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin,
      } 
    });
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Coffee.ai Admin Access Request');
    const body = encodeURIComponent(
      `Hello Coffee.ai Team,\n\nI would like to request access to the Coffee.ai Admin panel.\n\nMy details:\n- Name: ${user?.name || 'N/A'}\n- Email: ${user?.email || 'N/A'}\n\nThank you for your consideration.\n\nBest regards,\n${user?.name || 'User'}`
    );
    window.open(`mailto:support@coffee.ai?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Animated Coffee Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6 mx-auto">
              <img
                src="coffee-logo-bean-64.png"
                className="w-16 h-16 rounded-full"
                alt="Coffee.ai"
              />
            </div>
            
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Not Authorized
            </h1>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Signed in but not authorized for admin access
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
              icon={LogOut}
            >
              Sign Out
            </Button>
          </div>

          
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Coffee.ai Admin Panel • Secure Access Required
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;