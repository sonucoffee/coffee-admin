import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Building2, Settings, Plus, Edit2, Trash2, Save, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { GET_WORKSPACES, GET_WORKSPACE_PREFERENCES } from '../../graphql/queries';
import { UPDATE_WORKSPACE_PREFERENCES } from '../../graphql/mutations';
import { WorkspacePreferences as WorkspacePreferencesType } from '../../types/graphql';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';

const WorkspacePreferences: React.FC = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState('');
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [showWorkspaceTable, setShowWorkspaceTable] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

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

  // Query workspace preferences
  const { data: preferencesData, loading: preferencesLoading, refetch: refetchPreferences } = useQuery(GET_WORKSPACE_PREFERENCES, {
    variables: { workspaceId: selectedWorkspaceId },
    skip: !selectedWorkspaceId,
    onCompleted: (data) => {
      if (data?.workspacePreferences?.preferences) {
        try {
          const parsedPrefs = JSON.parse(data.workspacePreferences.preferences);
          setPreferences(parsedPrefs);
        } catch (error) {
          console.error('Error parsing preferences:', error);
          setPreferences({});
        }
      } else {
        setPreferences({});
      }
    }
  });

  const [updatePreferences] = useMutation(UPDATE_WORKSPACE_PREFERENCES);

  // Handle workspace search
  const handleWorkspaceSearch = (query: string) => {
    setWorkspaceSearchQuery(query);
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
    setPreferences({});
    setShowWorkspaceTable(true);
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setError('');
      await updatePreferences({
        variables: {
          input: {
            workspaceId: selectedWorkspaceId,
            preferences: JSON.stringify(preferences)
          }
        }
      });
      refetchPreferences();
    } catch (error: any) {
      setError(error.message || 'Failed to save preferences');
    }
  };

  // Add new preference
  const handleAddPreference = () => {
    if (!newKey.trim()) {
      setError('Key is required');
      return;
    }

    if (preferences.hasOwnProperty(newKey)) {
      setError('Key already exists');
      return;
    }

    let parsedValue: any;
    try {
      // Try to parse as JSON first
      parsedValue = JSON.parse(newValue);
    } catch {
      // If not valid JSON, treat as string
      parsedValue = newValue;
    }

    setPreferences(prev => ({
      ...prev,
      [newKey]: parsedValue
    }));

    setNewKey('');
    setNewValue('');
    setIsAddModalOpen(false);
    setError('');
  };

  // Update preference
  const handleUpdatePreference = (key: string, value: string) => {
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    setPreferences(prev => ({
      ...prev,
      [key]: parsedValue
    }));
    setEditingKey(null);
  };

  // Delete preference
  const handleDeletePreference = (key: string) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      delete newPrefs[key];
      return newPrefs;
    });
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
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
                <h2 className="text-xl font-semibold text-gray-900">Workspace Preferences</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a workspace to manage its preferences
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
      </div>
    );
  }

  // Show preferences management for selected workspace
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={handleBackToWorkspaces}
            icon={ArrowLeft}
          >
            Back to Workspaces
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedWorkspaceName}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-gray-600">Manage workspace preferences</p>
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <Settings className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {Object.keys(preferences).length} {Object.keys(preferences).length === 1 ? 'Setting' : 'Settings'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            icon={Plus}
            variant="secondary"
          >
            Add Preference
          </Button>
          <Button
            onClick={savePreferences}
            icon={Save}
            disabled={preferencesLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {preferencesLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : Object.keys(preferences).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No preferences configured</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first workspace preference
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            icon={Plus}
          >
            Add Preference
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(preferences).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Preference Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                      <Settings className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{key}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {typeof value}
                        </span>
                        <span className="text-xs text-gray-500">
                          {typeof value === 'object' ? `${Object.keys(value).length} properties` : 'Simple value'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {editingKey !== key && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Edit2}
                        onClick={() => setEditingKey(key)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleDeletePreference(key)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preference Content */}
              <div className="p-6">
                {editingKey === key ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edit Value for "{key}"
                      </label>
                      <textarea
                        defaultValue={formatValue(value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={typeof value === 'object' ? 8 : 4}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingKey(null);
                          }
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleUpdatePreference(key, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                        placeholder="Enter your preference value..."
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        💡 Tip: Use Ctrl+Enter to save quickly, or Escape to cancel
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Make sure your JSON is valid for object/array values
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingKey(null)}
                          icon={X}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const textarea = document.querySelector(`textarea`) as HTMLTextAreaElement;
                            if (textarea) {
                              handleUpdatePreference(key, textarea.value);
                            }
                          }}
                          icon={Save}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Value:
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-800 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {formatValue(value)}
                        </pre>
                      </div>
                    </div>
                    
                    {typeof value === 'object' && (
                      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                        📋 This is a JSON object with {Object.keys(value).length} properties
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Preference Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewKey('');
          setNewValue('');
          setError('');
        }}
        title="Add New Workspace Preference"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Adding New Preference</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Create a new configuration setting for this workspace. Use descriptive keys and valid JSON for complex values.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Preference Key"
              value={newKey}
              onChange={setNewKey}
              placeholder="e.g., api_timeout, feature_flags, user_limits"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preference Value
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder='Examples:
"simple string value"
42
true
{"timeout": 5000, "retries": 3}
["option1", "option2", "option3"]'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
              />
              <div className="mt-2 text-xs text-gray-500">
                💡 Supports: strings, numbers, booleans, JSON objects, and arrays
              </div>
            </div>
          </div>
          

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 justify-end pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewKey('');
                setNewValue('');
                setError('');
              }}
              icon={X}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddPreference}
              icon={Plus}
            >
              Create Preference
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspacePreferences;