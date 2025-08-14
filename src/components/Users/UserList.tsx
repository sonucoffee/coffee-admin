import { useMutation, useQuery } from '@apollo/client';
import { Building2, Edit2, Mail, Plus, Shield, Trash2, User, Users, ChevronRight, Download, ArrowUpDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { DELETE_USER_ROLE } from '../../graphql/mutations';
import { GET_USERS, GET_WORKSPACES } from '../../graphql/queries';
import { User as UserType } from '../../types/graphql';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import UserForm from './UserForm';

// Helper function to extract name from email
const extractNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0];
  // Replace common separators with spaces and capitalize
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to get display name
const getDisplayName = (user: UserType): { name: string; isExtracted: boolean } => {
  const hasName = user.givenName?.trim() && user.surname?.trim();
  
  if (hasName) {
    return {
      name: `${user.givenName} ${user.surname}`,
      isExtracted: false
    };
  }
  
  return {
    name: extractNameFromEmail(user.email),
    isExtracted: true
  };
};
const UserList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('');
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [showWorkspaceTable, setShowWorkspaceTable] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortField, setUserSortField] = useState<'name' | 'email' | 'role' | 'status'>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');

  // Workspace pagination state
  const [workspaceState, setWorkspaceState] = useState({
    workspaces: [] as any[],
    hasNextPage: false,
    endCursor: null as string | null
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Query workspaces with pagination
  const { loading: workspacesLoading, fetchMore: fetchMoreWorkspaces } = useQuery(GET_WORKSPACES, {
    variables: {
      filter: workspaceSearchQuery.trim() ? { search: workspaceSearchQuery.trim() } : {},
      first: 50,
      after: null
    },
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      const edges = data?.workspaces?.edges || [];
      const pageInfo = data?.workspaces?.pageInfo;
      
      setWorkspaceState({
        workspaces: edges,
        hasNextPage: pageInfo?.hasNextPage || false,
        endCursor: pageInfo?.endCursor || null
      });
      setIsLoadingMore(false);
    }
  });

  // Query users for selected workspace
  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: {
      filter: { workspaceId: selectedWorkspaceId },
      workspaceId: selectedWorkspaceId,
      first: 50
    },
    skip: !selectedWorkspaceId
  });

  const [deleteUser] = useMutation(DELETE_USER_ROLE);

  // Handle workspace search
  const handleWorkspaceSearch = (query: string) => {
    setWorkspaceSearchQuery(query);
  };

  // Handle user search
  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
  };

  // Handle load more workspaces
  const handleLoadMoreWorkspaces = React.useCallback(async () => {
    if (workspaceState.hasNextPage && !workspacesLoading && !isLoadingMore && workspaceState.endCursor) {
      setIsLoadingMore(true);
      
      try {
        const result = await fetchMoreWorkspaces({
          variables: {
            filter: workspaceSearchQuery.trim() ? { search: workspaceSearchQuery.trim() } : {},
            first: 50,
            after: workspaceState.endCursor
          }
        });

        const newEdges = result.data?.workspaces?.edges || [];
        const pageInfo = result.data?.workspaces?.pageInfo;
        
        setWorkspaceState(prev => ({
          workspaces: [...prev.workspaces, ...newEdges],
          hasNextPage: pageInfo?.hasNextPage || false,
          endCursor: pageInfo?.endCursor || null
        }));
      } catch (error) {
        console.error('Error loading more workspaces:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [workspaceState.hasNextPage, workspacesLoading, isLoadingMore, workspaceState.endCursor, fetchMoreWorkspaces, workspaceSearchQuery]);

  // Auto-scroll loading effect
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      
      // Load more when user scrolls to within 50px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 50 && 
          workspaceState.hasNextPage && 
          !workspacesLoading && 
          !isLoadingMore) {
        handleLoadMoreWorkspaces();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleLoadMoreWorkspaces, workspaceState.hasNextPage, workspacesLoading, isLoadingMore]);

  // Handle workspace selection
  const handleWorkspaceSelect = (workspace: any) => {
    setSelectedWorkspaceId(workspace.id);
    setSelectedWorkspaceName(workspace.name);
    setShowWorkspaceTable(false);
  };

  // Handle back to workspace selection
  const handleBackToWorkspaces = () => {
    setSelectedWorkspaceId('');
    setSelectedWorkspaceName('');
    setUserSearchQuery(''); // Clear user search when going back
    setShowWorkspaceTable(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser({
        variables: {
          input: {
            userId: parseInt(deletingUser.id),
            workspaceId: parseInt(selectedWorkspaceId)
          }
        }
      });
      setDeletingUser(null);
      refetch();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    refetch();
  };

  const exportUsersToCSV = () => {
    const csvData = filteredAndSortedUsers.map(user => ({
      Name: getDisplayName(user).name,
      Email: user.email,
      Role: user.role || 'User',
      Status: user.isOnboarded ? 'Active' : 'Pending',
      'Invite Status': user.inviteStatus || 'N/A',
      'Last Login': user.lastLoginTs ? new Date(user.lastLoginTs).toLocaleDateString() : 'Never'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-users-${selectedWorkspaceName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUserSort = (field: 'name' | 'email' | 'role' | 'status') => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };

  const users = data?.users?.edges?.map((edge: any) => edge.node) || [];

  // Filter users based on search query
  const filteredUsers = users.filter((user: UserType) => {
    if (!userSearchQuery.trim()) return true;
    
    const searchTerm = userSearchQuery.toLowerCase();
    const fullName = getDisplayName(user).name.toLowerCase();
    const email = user.email.toLowerCase();
    const role = (user.role || '').toLowerCase();
    
    return fullName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           role.includes(searchTerm);
  });

  // Sort filtered users
  const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (userSortField) {
      case 'name':
        aValue = getDisplayName(a).name.toLowerCase();
        bValue = getDisplayName(b).name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = (a.role || 'user').toLowerCase();
        bValue = (b.role || 'user').toLowerCase();
        break;
      case 'status':
        aValue = a.isOnboarded ? 'active' : 'pending';
        bValue = b.isOnboarded ? 'active' : 'pending';
        break;
      default:
        return 0;
    }

    if (userSortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const userSortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Status' }
  ];

  // Show workspace selection table
  if (showWorkspaceTable) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{workspaceState.workspaces.length}</p>
                <p className="text-sm text-blue-600 mt-1">Available</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {workspaceState.workspaces.reduce((acc: number, edge: any) => acc + (edge.node.userCount || 0), 0) || '---'}
                </p>
                <p className="text-sm text-green-600 mt-1">Across all workspaces</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Management Status</p>
                <p className="text-3xl font-bold text-green-600 mt-2">Active</p>
                <p className="text-sm text-gray-500 mt-1">Ready to manage</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
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
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a workspace to manage its users
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <Input
              value={workspaceSearchQuery}
              onChange={handleWorkspaceSearch}
              placeholder="Type workspace name to search..."
            />
          </div>

          {(workspacesLoading && workspaceState.workspaces.length === 0) ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : workspaceState.workspaces.length === 0 ? (
            <div className="text-center py-12 h-96 flex flex-col items-center justify-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>
              <p className="text-gray-600">
                {workspaceSearchQuery ? 'Try a different search term' : 'No workspaces available'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workspaceState.workspaces.map((edge: any) => {
                    const workspace = edge.node;
                    return (
                      <tr 
                        key={workspace.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleWorkspaceSelect(workspace)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {workspace.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {workspace.domain || 'No domain'}
                            </div>
                          <div className="flex items-center justify-end">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

                {/* Loading indicator at bottom of table */}
                {isLoadingMore && (
                  <div className="text-center py-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span className="text-sm text-gray-600">Loading more workspaces...</span>
                    </div>
                  </div>
                )}

                {/* End of results indicator */}
                {!workspaceState.hasNextPage && !isLoadingMore && workspaceState.workspaces.length > 0 && (
                  <div className="text-center py-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">No more workspaces to load</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show user management for selected workspace
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              <p className="text-sm text-blue-600 mt-1">In workspace</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {users.filter((u: UserType) => u.isOnboarded).length}
              </p>
              <p className="text-sm text-green-600 mt-1">Onboarded</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {users.filter((u: UserType) => !u.isOnboarded).length}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Invitations</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {users.filter((u: UserType) => u.role === 'owner' || u.role === 'admin').length}
              </p>
              <p className="text-sm text-purple-600 mt-1">With admin access</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={handleBackToWorkspaces}
              >
                ← Back to Workspaces
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedWorkspaceName}</h2>
                <p className="text-sm text-gray-600 mt-1">Manage users in this workspace</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Invite User
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        {!loading && !error && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <Input
                  value={userSearchQuery}
                  onChange={handleUserSearch}
                  placeholder="Search by name, email, or role..."
                />
              </div>
              
              {users.length > 0 && (
                <div className="flex items-end space-x-3">
                  <Select
                    value={userSortField}
                    onChange={(value) => setUserSortField(value as 'name' | 'email' | 'role' | 'status')}
                    options={userSortOptions}
                    className="min-w-[120px]"
                  />
                  
                  <Button
                    variant="secondary"
                    onClick={() => setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {userSortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={exportUsersToCSV}
                    icon={Download}
                    disabled={filteredAndSortedUsers.length === 0}
                  >
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
            
            {userSearchQuery && users.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredAndSortedUsers.length} of {users.length} users
              </div>
            )}
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
            <p className="text-red-800">Error loading users: {error.message}</p>
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userSearchQuery ? 'No matching users found' : 'No users found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userSearchQuery ? 'Try adjusting your search terms' : 'Start by inviting your first user to this workspace'}
            </p>
            {!userSearchQuery && (
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
                      onClick={() => handleUserSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>User</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleUserSort('email')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Email</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleUserSort('role')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Role</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleUserSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user: UserType) => {
                  const displayName = getDisplayName(user);
                  return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={displayName.name}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {displayName.name}
                            </div>
                            {displayName.isExtracted && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <Mail className="w-3 h-3 mr-1" />
                                from email
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role || 'User')}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isOnboarded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.isOnboarded ? 'Active' : 'Pending'}
                      </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Show search results summary */}
      {userSearchQuery && filteredUsers.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

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
                {getDisplayName(deletingUser).name}
              </span>{' '}
              from the workspace? This action cannot be undone.
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