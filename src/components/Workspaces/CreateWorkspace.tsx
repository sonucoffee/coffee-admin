import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { CREATE_WORKSPACE } from '../../graphql/mutations';
import { CreateWorkspaceInput } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';

const CreateWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [createWorkspace] = useMutation(CREATE_WORKSPACE);

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

    if (!domain.trim()) {
      setError('Domain is required');
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
        addCreatorAsOwner: false
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
              placeholder="company.com"
              required
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

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Workspace Setup Guide</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Name:</strong> Choose a descriptive name for your workspace</li>
              <li>• <strong>Domain:</strong> Optional - restrict access to users with specific email domains</li>
              <li>• <strong>Logo:</strong> Optional - add a custom logo URL for branding</li>
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