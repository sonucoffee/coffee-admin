import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Edit2, Trash2, Users, Shield, UserCheck, Clock, Search, ArrowUpDown, Download, Building2, Crown } from 'lucide-react';
import { GET_USERS, GET_WORKSPACES } from '../../graphql/queries';
import { DELETE_USER_ROLE } from '../../graphql/mutations';
import { User } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import SearchableSelect from '../UI/SearchableSelect';
import UserForm from './UserForm';

const UserList: React.FC = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('');
  const [showWorkspaceTable, setShowWorkspaceTable] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState<'email' | 'givenName' | 'role' | 'lastLoginTs'>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Workspace search state
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [workspaceOptions, setWorkspaceOptions] = useState<Array<{value: string, label: string, subtitle?: string}>>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceHasNextPage, setWorkspaceHasNextPage] = useState(false);
  const [workspaceEndCursor, setWorkspaceEndCursor] = useState<string | null>(null);

  // Users query
  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(GET_USERS, {
    variables: {
      filter: {
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      },
      workspaceId: selectedWorkspaceId,
      first: 50
    },
    skip: !selectedWorkspaceId,
    fetchPolicy: 'cache-and-network'
  });

  // Workspaces query for search
  const { fetchMore: fetchMoreWorkspaces } = useQuery(GET_WORKSPACES, {
    variables: {
      filter: workspaceSearchQuery.trim() ? { search: workspaceSearchQuery.trim() } : {},
      first: 20,
      after: null
    },
    skip: true, // We'll trigger this manually
    onCompleted: (data) => {
      const edges = data?.workspaces?.edges || [];
      const pageInfo = data?.workspaces?.pageInfo;
      
      const options = edges.map((edge: any) => ({
        value: edge.node.id,
        label: edge.node.name,
        subtitle: edge.node.domain || 'No domain'
      }));
      
      setWorkspaceOptions(options);
      setWorkspaceHasNextPage(pageInfo?.hasNextPage || false);
      setWorkspaceEndCursor(pageInfo?.endCursor || null);
      setWorkspaceLoading(false);
    }
  });

  const [deleteUserRole] = useMutation(DELETE_USER_ROLE);

  // Handle workspace search
  const handleWorkspaceSearch = useCallback(async (query: string) => {
    setWorkspaceSearchQuery(query);
    setWorkspaceLoading(true);
    
    try {
      await fetchMoreWorkspaces({
        variables: {
          filter: query.trim() ? { search: query.trim() } : {},
          first: 20,
          after: null
        }
      });
    } catch (error) {
      console.error('Error searching workspaces:', error);
      setWorkspaceLoading(false);
    }
  }, [fetchMoreWorkspaces]);

  // Handle load more workspaces
  const handleLoadMoreWorkspaces = useCallback(async () => {
    if (!workspaceHasNextPage || workspaceLoading || !workspaceEndCursor) return;
    
    setWorkspaceLoading(true);
    
    try {
      const result = await fetchMoreWorkspaces({
        variables: {
          filter: workspaceSearchQuery.trim() ? { search: workspaceSearchQuery.trim() } : {},
          first: 20,
          after: workspaceEndCursor
        }
      });

      const newEdges = result.data?.workspaces?.edges || [];
      const pageInfo = result.data?.workspaces?.pageInfo;
      
      const newOptions = newEdges.map((edge: any) => ({
        value: edge.node.id,
        label: edge.node.name,
        subtitle: edge.node.domain || 'No domain'
      }));
      
      setWorkspaceOptions(prev => [...prev, ...newOptions]);
      setWorkspaceHasNextPage(pageInfo?.hasNextPage || false);
      setWorkspaceEndCursor(pageInfo?.endCursor || null);
    } catch (error) {
      console.error('Error loading more workspaces:', error);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [workspaceHasNextPage, workspaceLoading, workspaceEndCursor, fetchMoreWorkspaces, workspaceSearchQuery]);

  // Handle workspace selection
  const handleWorkspaceSelect = (workspaceId: string) => {
    const selectedWorkspace = workspaceOptions.find(w => w.value === workspaceId);
    if (selectedWorkspace) {
      setSelectedWorkspaceId(workspaceId);
      setSelectedWorkspaceName(selectedWorkspace.label);
      setShowWorkspaceTable(false);
    }
  };

  // Handle back to workspace selection
  const handleBackToWorkspaces = () => {
    setSelectedWorkspaceId('');
    setSelectedWorkspaceName('');
    setShowWorkspaceTable(true);
    setSearchQuery('');
    setRoleFilter('all');
  };

  const handleDelete = async () => {
    if (!deletingUser || !selectedWorkspaceId) return;

    try {
      await deleteUserRole({
        variables: {
          input: {
            userId: parseInt(deletingUser.id),
            workspaceId: parseInt(selectedWorkspaceId)
          }
        }
      });
      setDeletingUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    refetchUsers();
  };

  const exportToCSV = () => {
    const csvData = filteredAndSortedUsers.map(user => ({
      Email: user.email,
      'First Name': user.givenName,
      'Last Name': user.surname,
      Role: user.role || 'user',
      Status: user.inviteStatus || 'active',
      'Last Login': user.lastLoginTs ? new Date(user.lastLoginTs).toLocaleDateString() : 'Never'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: 'email' | 'givenName' | 'role' | 'lastLoginTs') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Show workspace selection if no workspace is selected
  if (showWorkspaceTable) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a workspace to manage its users
                </p>
              </div>
            </div>
          </div>

          {/* Workspace Selection */}
          <div className="p-6">
            <SearchableSelect
              label="Select Workspace"
              value={selectedWorkspaceId}
              onChange={handleWorkspaceSelect}
              onSearch={handleWorkspaceSearch}
              onLoadMore={handleLoadMoreWorkspaces}
              options={workspaceOptions}
              placeholder="Search and select a workspace..."
              searchPlaceholder="Type to search workspaces..."
              loading={workspaceLoading}
              hasNextPage={workspaceHasNextPage}
              className="max-w-md"
            />
          </div>
        </div>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading users: {usersError.message}</p>
      </div>
    );
  }

  const users = usersData?.users?.edges?.map((edge: any) => edge.node) || [];
  
  // Filter users based on search query and role filter
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = !searchQuery.trim() || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.givenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.surname.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Sort filtered users
  const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'givenName':
        aValue = a.givenName.toLowerCase();
        bValue = b.givenName.toLowerCase();
        break;
      case 'role':
        aValue = a.role || 'user';
        bValue = b.role || 'user';
        break;
      case 'lastLoginTs':
        aValue = a.lastLoginTs ? new Date(a.lastLoginTs).getTime() : 0;
        bValue = b.lastLoginTs ? new Date(b.lastLoginTs).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'owner', label: 'Owners' },
    { value: 'admin', label: 'Admins' },
    { value: 'user', label: 'Users' }
  ];

  const sortOptions = [
    { value: 'email', label: 'Email' },
    { value: 'givenName', label: 'First Name' },
    { value: 'role', label: 'Role' },
    { value: 'lastLoginTs', label: 'Last Login' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={handleBackToWorkspaces}
            icon={Building2}
          >
            Change Workspace
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspaceName}</h1>
            <p className="text-gray-600 mt-1">
              Manage users and their roles in this workspace
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              <p className="text-sm text-blue-600 mt-1">All workspace members</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Owners</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter((u: User) => u.role === 'owner').length}
              </p>
              <p className="text-sm text-red-600 mt-1">Full access</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter((u: User) => u.role === 'admin').length}
              </p>
              <p className="text-sm text-blue-600 mt-1">Administrative access</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter((u: User) => u.isOnboarded).length}
              </p>
              <p className="text-sm text-green-600 mt-1">Onboarded</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter((u: User) => u.inviteStatus === 'pending').length}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Awaiting response</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workspace Users</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage user access and roles for this workspace
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
            >
              Invite User
            </Button>
          </div>
        </div>
        
        {/* Search and Controls */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or email..."
              />
            </div>
            
            <div className="flex items-end space-x-3">
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
                className="min-w-[120px]"
              />
              
              <Select
                value={sortField}
                onChange={(value) => setSortField(value as 'email' | 'givenName' | 'role' | 'lastLoginTs')}
                options={sortOptions}
                className="min-w-[140px]"
              />
              
              <Button
                variant="secondary"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={exportToCSV}
                icon={Download}
                disabled={filteredAndSortedUsers.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
          
          {(searchQuery || roleFilter !== 'all') && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredAndSortedUsers.length} of {users.length} users
            </div>
          )}
        </div>

        {/* Table Content */}
        {filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || roleFilter !== 'all' ? 'No matching users found' : 'No users in workspace'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || roleFilter !== 'all' ? 'Try adjusting your search or filters' : 'Start by inviting your first user to this workspace'}
            </p>
            {!searchQuery && roleFilter === 'all' && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                icon={Plus}
              >
                Invite User
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>User</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Role</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lastLoginTs')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Last Login</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={`${user.givenName} ${user.surname}`}
                            className="w-10 h-10 rounded-full mr-4"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.givenName} {user.surname}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'owner' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                        {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isOnboarded ? 'bg-green-100 text-green-800' :
                        user.inviteStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isOnboarded ? 'Active' : user.inviteStatus || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginTs ? new Date(user.lastLoginTs).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit2}
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeletingUser(user)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Invite New User"
      >
        <UserForm
          workspaceId={selectedWorkspaceId}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            workspaceId={selectedWorkspaceId}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Remove User"
        maxWidth="sm"
      >
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to remove{' '}
              <span className="font-medium text-gray-900">
                {deletingUser.givenName} {deletingUser.surname}
              </span>{' '}
              from this workspace? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Remove User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserList;