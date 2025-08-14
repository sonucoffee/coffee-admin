import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, Globe, Building2, Settings, Search } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth0();

  const navItems = [
    {
      to: '/create-workspace',
      icon: Building2,
      label: 'Create Workspace',
      description: 'Set up new workspace',
      isNew: false
    },
    {
      to: '/domains',
      icon: Globe,
      label: 'Whitelist Domains',
      description: 'Manage allowed domains',
      isNew: false
    },
    {
      to: '/users',
      icon: Users,
      label: 'User Management',
      description: 'Add, edit, and remove users',
      isNew: true
    },
    {
      to: '/workspace-preferences',
      icon: Settings,
      label: 'Workspace Preferences',
      description: 'Manage workspace settings',
      isNew: false
    }
  ];

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(51, 51, 51, 0.1)' }}>
                <Users className="w-5 h-5" style={{ color: 'rgba(51, 51, 51, 1)' }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(51, 51, 51, 0.7)' }}>Welcome</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4">
        <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'shadow-lg'
                    : 'hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(51, 51, 51, 0.1)' : 'transparent',
                color: isActive ? 'rgba(51, 51, 51, 1)' : 'rgba(51, 51, 51, 0.8)'
              })}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 51, 51, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: 'inherit' }} />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              </div>
            </NavLink>
          );
        })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;