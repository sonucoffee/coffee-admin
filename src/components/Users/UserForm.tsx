import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { INVITE_USER, UPDATE_USER } from '../../graphql/mutations';
import { User } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';

interface UserFormProps {
  user?: User;
  workspaceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  workspaceId,
  onSuccess,
  onCancel
}) => {
  const [email, setEmail] = useState(user?.email || '');
  const [givenName, setGivenName] = useState(user?.givenName || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [inviteUser] = useMutation(INVITE_USER);
  const [updateUser] = useMutation(UPDATE_USER);

  const roleOptions = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' }
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!givenName.trim()) {
      setError('First name is required');
      setLoading(false);
      return;
    }

    if (!surname.trim()) {
      setError('Last name is required');
      setLoading(false);
      return;
    }

    try {
      if (user) {
        // Update existing user
        await updateUser({
          variables: {
            input: {
              id: parseInt(user.id),
              givenName: givenName.trim(),
              surname: surname.trim(),
              workspaceRole: {
                workspaceId: parseInt(workspaceId),
                role: role
              },
              workspaceId: workspaceId
            }
          }
        });
      } else {
        // Invite new user
        await inviteUser({
          variables: {
            input: {
              workspaceId: workspaceId,
              email: email.trim(),
              role: role
            }
          }
        });
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="user@example.com"
        required
        disabled={!!user || loading}
        error={error && error.includes('email') ? error : ''}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={givenName}
          onChange={setGivenName}
          placeholder="John"
          required
          disabled={loading}
          error={error && error.includes('First name') ? error : ''}
        />
        
        <Input
          label="Last Name"
          value={surname}
          onChange={setSurname}
          placeholder="Doe"
          required
          disabled={loading}
          error={error && error.includes('Last name') ? error : ''}
        />
      </div>

      <Select
        label="Role"
        value={role}
        onChange={setRole}
        options={roleOptions}
        required
        disabled={loading}
      />

      {error && !error.includes('email') && !error.includes('First name') && !error.includes('Last name') && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="text-sm text-gray-600">
        <p className="mb-2">Role permissions:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Owner:</strong> Full access to all features and workspace management</li>
          <li><strong>Admin:</strong> Administrative access to workspace features</li>
          <li><strong>User:</strong> Standard access to workspace features</li>
        </ul>
      </div>

      <div className="flex space-x-3 justify-end pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : user ? 'Update User' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;