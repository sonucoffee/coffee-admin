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
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(51, 51, 51, 0.7)' }}>Welcome</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(51, 51, 51, 0.5)' }} />
          <input
            type="text"
            placeholder="Type to search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
            style={{ 
              backgroundColor: 'rgba(51, 51, 51, 0.05)',
              color: 'rgba(51, 51, 51, 1)',
              focusRingColor: 'rgba(51, 51, 51, 0.3)'
            }}
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(51, 51, 51, 0.6)' }}>
            Admin Menu
          </p>
        </div>
        
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
              {item.isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                  New
                </span>
              )}
            </NavLink>
          );
        })}
        </nav>
      </div>

      {/* Category Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(51, 51, 51, 0.6)' }}>
            Category
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(51, 51, 51, 1)' }}></div>
          <span className="text-sm" style={{ color: 'rgba(51, 51, 51, 0.8)' }}>#Admin</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;