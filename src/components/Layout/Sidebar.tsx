import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, Globe } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/domains',
      icon: Globe,
      label: 'Whitelist Domains',
      description: 'Manage allowed domains'
    },
    {
      to: '/users',
      icon: Users,
      label: 'User Management',
      description: 'Add, edit, and remove users'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;