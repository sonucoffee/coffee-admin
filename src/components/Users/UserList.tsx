import { useMutation, useQuery } from '@apollo/client';
import { Building2, Edit2, Mail, Plus, Shield, Trash2, User, Users, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { DELETE_USER_ROLE } from '../../graphql/mutations';
import { GET_USERS, GET_WORKSPACES } from '../../graphql/queries';
import { User as UserType } from '../../types/graphql';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import UserForm from './UserForm';

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

  const users = data?.users?.edges?.map((edge: any) => edge.node) || [];

  // Filter users based on search query
  const filteredUsers = users.filter((user: UserType) => {
    if (!userSearchQuery.trim()) return true;
    
    const searchTerm = userSearchQuery.toLowerCase();
    const fullName = `${user.givenName} ${user.surname}`.toLowerCase();
    const email = user.email.toLowerCase();
    const role = (user.role || '').toLowerCase();
    
    return fullName.includes(searchTerm) || 
           email.includes(searchTerm) || 
           role.includes(searchTerm);
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Show workspace selection table
  if (showWorkspaceTable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Select a workspace to manage its users
            </p>
          </div>
        </div>

        {/* Workspace Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Search Workspace</h2>
          </div>
          <Input
            label="Search for a specific workspace"
            value={workspaceSearchQuery}
            onChange={handleWorkspaceSearch}
            placeholder="Type workspace name to search..."
          />
        </div>

        {/* Workspaces Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Workspaces</h3>
            <p className="text-sm text-gray-600 mt-1">
              {workspaceSearchQuery ? 'Search results' : 'All workspaces'} ({workspaceState.workspaces.length} loaded){workspaceState.hasNextPage ? ' - Scroll down for more' : ''}
            </p>
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
            <div className="flex-1 overflow-hidden">
              <div ref={scrollContainerRef} className="h-96 overflow-y-auto">
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
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-3" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={handleBackToWorkspaces}
          >
            ← Back to Workspaces
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspaceName}</h1>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={Plus}
        >
          Invite User
        </Button>
      </div>

      {/* User Search */}
      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Input
            label="Search Users"
            value={userSearchQuery}
            onChange={handleUserSearch}
            placeholder="Search by name, email, or role..."
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading users: {error.message}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Users</h3>
            <p className="text-sm text-gray-600 mt-1">
              {userSearchQuery ? `Search results (${filteredUsers.length} of ${users.length})` : `${users.length} users in workspace`}
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user: UserType) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={`${user.givenName} ${user.surname}`}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.givenName} {user.surname}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                {deletingUser.givenName} {deletingUser.surname}
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