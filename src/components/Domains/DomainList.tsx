import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Edit2, Trash2, Globe, Calendar, User } from 'lucide-react';
import { GET_DOMAIN_ALLOWLISTS } from '../../graphql/queries';
import { DELETE_DOMAIN_ALLOWLIST } from '../../graphql/mutations';
import { DomainAllowlist } from '../../types/graphql';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import DomainForm from './DomainForm';

const DomainList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainAllowlist | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainAllowlist | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_DOMAIN_ALLOWLISTS);
  const [deleteDomain] = useMutation(DELETE_DOMAIN_ALLOWLIST);

  const handleDelete = async () => {
    if (!deletingDomain) return;

    try {
      await deleteDomain({
        variables: {
          input: {
            id: parseInt(deletingDomain.id)
          }
        }
      });
      setDeletingDomain(null);
      refetch();
    } catch (error) {
      console.error('Error deleting domain:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingDomain(null);
    refetch();
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
        <p className="text-red-800">Error loading domains: {error.message}</p>
      </div>
    );
  }

  const domains = data?.domainAllowlists || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Whitelist Domains</h1>
          <p className="text-gray-600 mt-1">
            Manage domains that are allowed to access your Coffee.ai workspace
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={Plus}
        >
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No domains added</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first allowed domain to the whitelist
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Add Domain
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {domains.map((domain: DomainAllowlist) => (
                  <tr key={domain.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {domain.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {domain.createdBy ? 
                            `${domain.createdBy.givenName} ${domain.createdBy.surname}` : 
                            'Unknown'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-500">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit2}
                          onClick={() => setEditingDomain(domain)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeletingDomain(domain)}
                        >
                          Delete
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

      {/* Create Domain Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Domain"
      >
        <DomainForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Domain Modal */}
      <Modal
        isOpen={!!editingDomain}
        onClose={() => setEditingDomain(null)}
        title="Edit Domain"
      >
        {editingDomain && (
          <DomainForm
            domain={editingDomain}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingDomain(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDomain}
        onClose={() => setDeletingDomain(null)}
        title="Delete Domain"
        maxWidth="sm"
      >
        {deletingDomain && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the domain{' '}
              <span className="font-medium text-gray-900">{deletingDomain.domain}</span>?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeletingDomain(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete Domain
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DomainList;