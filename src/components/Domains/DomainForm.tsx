import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_DOMAIN_ALLOWLIST, UPDATE_DOMAIN_ALLOWLIST } from '../../graphql/mutations';
import { DomainAllowlist } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';

interface DomainFormProps {
  domain?: DomainAllowlist;
  onSuccess: () => void;
  onCancel: () => void;
}

const DomainForm: React.FC<DomainFormProps> = ({
  domain,
  onSuccess,
  onCancel
}) => {
  const [domainValue, setDomainValue] = useState(domain?.domain || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [createDomain] = useMutation(CREATE_DOMAIN_ALLOWLIST);
  const [updateDomain] = useMutation(UPDATE_DOMAIN_ALLOWLIST);

  const validateDomain = (value: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!domainValue.trim()) {
      setError('Domain is required');
      setLoading(false);
      return;
    }

    if (!validateDomain(domainValue.trim())) {
      setError('Please enter a valid domain name');
      setLoading(false);
      return;
    }

    try {
      if (domain) {
        // Update existing domain
        await updateDomain({
          variables: {
            input: {
              id: parseInt(domain.id),
              domain: domainValue.trim()
            }
          }
        });
      } else {
        // Create new domain
        await createDomain({
          variables: {
            input: {
              domain: domainValue.trim()
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
        label="Domain"
        value={domainValue}
        onChange={setDomainValue}
        placeholder="example.com"
        required
        error={error}
        disabled={loading}
      />
      
      <div className="text-sm text-gray-600">
        <p className="mb-2">Examples of valid domains:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>example.com</li>
          <li>subdomain.example.com</li>
          <li>my-company.co.uk</li>
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
          {loading ? 'Saving...' : domain ? 'Update Domain' : 'Add Domain'}
        </Button>
      </div>
    </form>
  );
};

export default DomainForm;