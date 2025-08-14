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
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: 'rgba(51, 51, 51, 1)' }}>
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-300">Welcome</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Type to search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
            style={{ backgroundColor: 'rgba(68, 68, 68, 1)' }}
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
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
                    ? 'text-white shadow-lg'
                    : 'text-gray-200 hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(68, 68, 68, 1)' : 'transparent'
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('bg-gray-600')) {
                  e.currentTarget.style.backgroundColor = 'rgba(68, 68, 68, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('bg-gray-600')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
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
      <div className="p-4 border-t border-gray-700">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Category
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(68, 68, 68, 1)' }}></div>
          <span className="text-sm text-gray-200">#Admin</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;