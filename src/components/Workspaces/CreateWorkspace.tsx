import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Users, Crown, User, X, Plus, Search } from 'lucide-react';
import { CREATE_WORKSPACE } from '../../graphql/mutations';
import { SEARCH_USERS } from '../../graphql/queries';
import { CreateWorkspaceInput, User as UserType } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';

const CreateWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedOwners, setSelectedOwners] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchType, setSearchType] = useState<'owners' | 'users'>('owners');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [createWorkspace] = useMutation(CREATE_WORKSPACE);

  // Search users query
  const { data: usersData, loading: usersLoading } = useQuery(SEARCH_USERS, {
    variables: {
      filter: userSearchQuery ? { search: userSearchQuery } : {},
      first: 20
    },
    skip: !userSearchQuery || !showUserSearch
  });

  const validateDomain = (value: string): boolean => {
    if (!value) return true; // Domain is optional
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(value);
  };

  const validateUrl = (value: string): boolean => {
    if (!value) return true; // Logo URL is optional
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Workspace name is required');
      setLoading(false);
      return;
    }

    if (domain && !validateDomain(domain.trim())) {
      setError('Please enter a valid domain name');
      setLoading(false);
      return;
    }

    if (logoUrl && !validateUrl(logoUrl.trim())) {
      setError('Please enter a valid URL for the logo');
      setLoading(false);
      return;
    }

    try {
      const input: CreateWorkspaceInput = {
        name: name.trim(),
        ...(domain.trim() && { domain: domain.trim() }),
        ...(logoUrl.trim() && { logoUrl: logoUrl.trim() }),
        ...(selectedOwners.length > 0 && {
          owners: selectedOwners.map(user => ({ id: parseInt(user.id) }))
        }),
        ...(selectedUsers.length > 0 && {
          users: selectedUsers.map(user => ({ id: parseInt(user.id) }))
        })
      };

      const result = await createWorkspace({
        variables: { input }
      });

      if (result.data?.createWorkspace?.success) {
        navigate('/users');
      } else {
        setError(result.data?.createWorkspace?.error || 'Failed to create workspace');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (user: UserType, type: 'owners' | 'users') => {
    if (type === 'owners') {
      if (!selectedOwners.find(u => u.id === user.id)) {
        setSelectedOwners([...selectedOwners, user]);
      }
    } else {
      if (!selectedUsers.find(u => u.id === user.id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
    setShowUserSearch(false);
    setUserSearchQuery('');
  };

  const handleRemoveUser = (userId: string, type: 'owners' | 'users') => {
    if (type === 'owners') {
      setSelectedOwners(selectedOwners.filter(u => u.id !== userId));
    } else {
      setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    }
  };

  const openUserSearch = (type: 'owners' | 'users') => {
    setSearchType(type);
    setShowUserSearch(true);
    setUserSearchQuery('');
  };

  const availableUsers = (usersData?.users?.edges || [])
    .map((edge: any) => edge.node)
    .filter((user: UserType) => {
      const isAlreadyOwner = selectedOwners.find(u => u.id === user.id);
      const isAlreadyUser = selectedUsers.find(u => u.id === user.id);
      return !isAlreadyOwner && !isAlreadyUser;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          icon={ArrowLeft}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Workspace</h1>
          <p className="text-gray-600 mt-1">
            Set up a new workspace for your team
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            </div>

            <Input
              label="Workspace Name"
              value={name}
              onChange={setName}
              placeholder="My Company Workspace"
              required
              disabled={loading}
            />

            <Input
              label="Domain"
              value={domain}
              onChange={setDomain}
              placeholder="company.com (optional)"
              disabled={loading}
            />

            <Input
              label="Logo URL"
              value={logoUrl}
              onChange={setLogoUrl}
              placeholder="https://example.com/logo.png (optional)"
              disabled={loading}
            />
          </div>

          {/* User Management */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
            </div>

            {/* Owners Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <label className="text-sm font-medium text-gray-700">Workspace Owners</label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openUserSearch('owners')}
                  icon={Plus}
                  disabled={loading}
                >
                  Add Owner
                </Button>
              </div>
              
              {selectedOwners.length > 0 ? (
                <div className="space-y-2">
                  {selectedOwners.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={`${user.givenName} ${user.surname}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.givenName} {user.surname}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id, 'owners')}
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  No owners selected. Owners have full administrative access to the workspace.
                </div>
              )}
            </div>

            {/* Users Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <label className="text-sm font-medium text-gray-700">Workspace Users</label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openUserSearch('users')}
                  icon={Plus}
                  disabled={loading}
                >
                  Add User
                </Button>
              </div>
              
              {selectedUsers.length > 0 ? (
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={`${user.givenName} ${user.surname}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.givenName} {user.surname}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id, 'users')}
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  No users selected. Users will have standard access to the workspace.
                </div>
              )}
            </div>
          </div>

          {/* User Search Modal */}
          {showUserSearch && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                  onClick={() => setShowUserSearch(false)}
                />
                
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Add {searchType === 'owners' ? 'Owner' : 'User'}
                    </h3>
                    <button
                      onClick={() => setShowUserSearch(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {usersLoading ? (
                        <div className="p-3 text-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Searching...</p>
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          {userSearchQuery ? 'No users found' : 'Start typing to search users'}
                        </div>
                      ) : (
                        availableUsers.map((user: UserType) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleAddUser(user, searchType)}
                            className="w-full p-3 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {user.profileImageUrl ? (
                                <img
                                  src={user.profileImageUrl}
                                  alt={`${user.givenName} ${user.surname}`}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.givenName} {user.surname}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Workspace Setup Guide</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Name:</strong> Choose a descriptive name for your workspace</li>
              <li>• <strong>Domain:</strong> Optional - restrict access to users with specific email domains</li>
              <li>• <strong>Logo:</strong> Optional - add a custom logo URL for branding</li>
              <li>• <strong>Owners:</strong> Users with full administrative access</li>
              <li>• <strong>Users:</strong> Standard workspace members</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Workspace...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspace;