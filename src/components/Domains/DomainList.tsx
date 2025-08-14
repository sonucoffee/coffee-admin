import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Edit2, Trash2, Globe, Calendar, User, Search, ArrowUpDown, Download } from 'lucide-react';
import { GET_DOMAIN_ALLOWLISTS } from '../../graphql/queries';
import { DELETE_DOMAIN_ALLOWLIST } from '../../graphql/mutations';
import { DomainAllowlist } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import DomainForm from './DomainForm';

const DomainList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainAllowlist | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainAllowlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'domain' | 'createdAt' | 'createdBy'>('domain');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const exportToCSV = () => {
    const csvData = filteredAndSortedDomains.map(domain => ({
      Domain: domain.domain,
      'Created By': domain.createdBy ? `${domain.createdBy.givenName} ${domain.createdBy.surname}` : 'Unknown',
      'Created At': new Date(domain.createdAt).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelisted-domains-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: 'domain' | 'createdAt' | 'createdBy') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
        <p className="text-red-800">Error loading domains: {error.message}</p>
      </div>
    );
  }

  const domains = data?.domainAllowlists || [];
  
  // Filter domains based on search query
  const filteredDomains = domains.filter((domain: DomainAllowlist) => {
    if (!searchQuery.trim()) return true;
    
    const searchTerm = searchQuery.toLowerCase();
    const domainName = domain.domain.toLowerCase();
    const createdBy = domain.createdBy ? 
      `${domain.createdBy.givenName} ${domain.createdBy.surname}`.toLowerCase() : '';
    
    return domainName.includes(searchTerm) || createdBy.includes(searchTerm);
  });

  // Sort filtered domains
  const filteredAndSortedDomains = [...filteredDomains].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'domain':
        aValue = a.domain.toLowerCase();
        bValue = b.domain.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'createdBy':
        aValue = a.createdBy ? `${a.createdBy.givenName} ${a.createdBy.surname}`.toLowerCase() : '';
        bValue = b.createdBy ? `${b.createdBy.givenName} ${b.createdBy.surname}`.toLowerCase() : '';
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

  const sortOptions = [
    { value: 'domain', label: 'Domain Name' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'createdBy', label: 'Created By' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Domains</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{domains.length}</p>
              <p className="text-sm text-green-600 mt-1">Active whitelist</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Additions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {domains.filter((d: DomainAllowlist) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(d.createdAt) > weekAgo;
                }).length}
              </p>
              <p className="text-sm text-blue-600 mt-1">This week</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Status</p>
              <p className="text-3xl font-bold text-green-600 mt-2">Active</p>
              <p className="text-sm text-gray-500 mt-1">All systems operational</p>
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
              <h2 className="text-xl font-semibold text-gray-900">Whitelist Domains</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage domains that are allowed to access your workspace
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Domain
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
                placeholder="Search by domain name or creator..."
                className="border-gray-300"
              />
            </div>
            
            <div className="flex items-end space-x-3">
              <Select
                value={sortField}
                onChange={(value) => setSortField(value as 'domain' | 'createdAt' | 'createdBy')}
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
                disabled={filteredAndSortedDomains.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
          
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredAndSortedDomains.length} of {domains.length} domains
            </div>
          )}
        </div>

        {/* Table Content */}
        {filteredAndSortedDomains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching domains found' : 'No domains added'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first allowed domain to the whitelist'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                icon={Plus}
              >
                Add Domain
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
                      onClick={() => handleSort('domain')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Domain</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('createdBy')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Created By</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Created At</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDomains.map((domain: DomainAllowlist) => (
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
        )}
      </div>
    </div>
  );
};

export default DomainList;
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