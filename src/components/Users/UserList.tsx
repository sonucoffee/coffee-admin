import { useMutation, useQuery } from '@apollo/client';
import { Building2, Edit2, Mail, Plus, Shield, Trash2, User, Users } from 'lucide-react';
import React, { useState } from 'react';
import { DELETE_USER_ROLE } from '../../graphql/mutations';
import { GET_USERS, GET_WORKSPACES } from '../../graphql/queries';
import { User as UserType } from '../../types/graphql';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import SearchableSelect from '../UI/SearchableSelect';
import UserForm from './UserForm';

const UserList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedWorkspaceInfo, setSelectedWorkspaceInfo] = useState<{value: string, label: string, subtitle?: string} | null>(null);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');

  // Query workspaces for search
  const { data: workspacesData, loading: workspacesLoading } = useQuery(GET_WORKSPACES, {
    variables: {
      filter: workspaceSearchQuery ? { search: workspaceSearchQuery } : {},
      first: 20
    },
    skip: !workspaceSearchQuery
  });

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: {
      filter: { workspaceId: selectedWorkspaceId },
      workspaceId: selectedWorkspaceId,
      first: 50
    },
    skip: !selectedWorkspaceId
  });

  const [deleteUser] = useMutation(DELETE_USER_ROLE);

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

  const workspaceOptions = (workspacesData?.workspaces?.edges || []).map((edge: any) => ({
    value: edge.node.id,
    label: edge.node.name,
    subtitle: edge.node.domain
  }));

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    // Find and store the workspace info immediately when selected
    const workspace = workspaceOptions.find((w: any) => w.value === workspaceId);
    if (workspace) {
      setSelectedWorkspaceInfo(workspace);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading users: {error.message}</p>
      </div>
    );
  }

  const users = data?.users?.edges?.map((edge: any) => edge.node) || [];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Invite, edit, and manage user roles and permissions
          </p>
        </div>
        {selectedWorkspaceId && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Invite User
          </Button>
        )}
      </div>

      {/* Workspace Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Select Workspace</h2>
        </div>
        <SearchableSelect
          label="Workspace"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
          onSearch={setWorkspaceSearchQuery}
          options={workspaceOptions}
          placeholder="Search and select a workspace"
          searchPlaceholder="Type to search workspaces..."
          loading={workspacesLoading}
          required
          className="max-w-md"
        />
        {selectedWorkspaceInfo && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Selected workspace: <span className="font-medium text-gray-900">{selectedWorkspaceInfo.label}</span>
              {selectedWorkspaceInfo.subtitle && (
                <span className="text-gray-500"> ({selectedWorkspaceInfo.subtitle})</span>
              )}
            </p>
          </div>
        )}
      </div>

      {!selectedWorkspaceId ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a workspace</h3>
          <p className="text-gray-600">
            Please select a workspace above to view and manage its users
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-6">
            Start by inviting your first user to this workspace
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Invite User
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                {users.map((user: UserType) => (
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
                        {user.role(selectedWorkspaceId) || 'User'}
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
      )}

      {/* Selected Workspace Information */}
      {selectedWorkspaceInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Selected Workspace
              </h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-700">Name:</span>
                  <span className="text-sm text-blue-800">{selectedWorkspaceInfo.label}</span>
                </div>
                {selectedWorkspaceInfo.subtitle && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700">Domain:</span>
                    <span className="text-sm text-blue-800">{selectedWorkspaceInfo.subtitle}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {users.length} user{users.length !== 1 ? 's' : ''} in this workspace
                  </span>
                </div>
              </div>
            </div>
          </div>
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