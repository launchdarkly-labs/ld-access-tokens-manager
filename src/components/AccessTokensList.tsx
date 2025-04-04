import React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';

interface AccessToken {
  _id: string;
  name: string;
  _member?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  creationDate: number;
  customRoleIds?: string[];
  inlineRole?: Array<{ effect: string }>;
  role?: string;
  serviceToken: boolean;
  defaultApiVersion: number;
  lastUsed: number;
  lastModified?: number;
}

interface TokensResponse {
  items: AccessToken[];
  totalCount: number;
  _links: {
    self?: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
}

interface ResetTokenResponse {
  token: string;
}

type SortField = 'name' | 'owner' | 'creationDate' | 'role' | 'apiVersion' | 'lastUsed' | 'lastModified';
type SortDirection = 'asc' | 'desc';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (expiry: number) => void;
  tokenName: string;
}

function ResetModal({ isOpen, onClose, onReset, tokenName }: ResetModalProps) {
  const [expiry, setExpiry] = useState('30');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Reset Access Token</h3>
        <p className="mb-4 text-gray-600">
          Set expiry time for token: <span className="font-medium">{tokenName}</span>
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Token expiry (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onReset(parseInt(expiry))}
            className="px-4 py-2 bg-blue-500 text-red-800 rounded hover:bg-blue-600"
          >
            Reset Token
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewTokenDisplayProps {
  token: string | null;
  onClose: () => void;
}

function NewTokenDisplay({ token, onClose }: NewTokenDisplayProps) {
  if (!token) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">New Access Token</h3>
        <p className="text-red-600 mb-4 text-sm">
          Make sure to copy your new access token now. You won't be able to see it again!
        </p>
        <div className="bg-gray-100 p-3 rounded-md mb-4 break-all font-mono text-sm">
          {token}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(token)}
            className="px-4 py-2 bg-blue-500 text-gray-800 rounded hover:bg-blue-600"
          >
            Copy token
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccessTokensList() {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showApiVersion, setShowApiVersion] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<AccessToken | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [resettingTokenId, setResettingTokenId] = useState<string | null>(null);

  const fetchAllTokens = async () => {
    setIsLoading(true);
    setError(null);
    const uniqueTokens = new Map<string, AccessToken>();
    const limit = 50;

    try {
      let offset = 0;
      let totalCount = 0;

      do {
        const url = `https://app.launchdarkly.com/api/v2/tokens?offset=${offset}&limit=${limit}`;
        console.log('Making request to:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': import.meta.env.VITE_LD_API_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data: TokensResponse = await response.json();
        
        // Set totalCount on first request
        if (offset === 0) {
          totalCount = data.totalCount;
          console.log('Total tokens to fetch:', totalCount);
        }

        console.log('Response data:', {
          offset,
          itemsCount: data.items.length,
          totalCount: data.totalCount,
        });
        
        // Add new tokens to our map, using _id as unique identifier
        data.items.forEach(token => {
          uniqueTokens.set(token._id, token);
        });

        console.log(`Fetched ${data.items.length} tokens, unique tokens so far: ${uniqueTokens.size}`);
        
        // Increment offset for next request
        offset += limit;
      } while (offset < totalCount);

      // Convert map to array and sort by name
      const allTokens = Array.from(uniqueTokens.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setTokens(allTokens);
      console.log(`Finished fetching. Total unique tokens: ${allTokens.length}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTokens();
  }, []);

  const determineRole = (token: AccessToken): string => {
    if (token.customRoleIds?.length) {
      return 'Custom Roles';
    }
    if (token.inlineRole?.length) {
      return 'Inline Role';
    }
    return token.role || 'Unknown';
  };

  const formatDate = (timestamp: number): string => {
    try {
      if (!timestamp) return 'Never';
      // Convert timestamp to milliseconds if it's in seconds
      const timestampInMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
      const date = new Date(timestampInMs);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'PPP');
    } catch (err) {
      return 'Invalid date';
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(token => 
        token.name.toLowerCase().includes(searchLower) ||
        token._member?.firstName?.toLowerCase().includes(searchLower) ||
        token._member?.lastName?.toLowerCase().includes(searchLower) ||
        determineRole(token).toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareResult = 0;
      switch (sortField) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'owner':
          const aOwner = a._member ? `${a._member.firstName} ${a._member.lastName}` : '';
          const bOwner = b._member ? `${b._member.firstName} ${b._member.lastName}` : '';
          compareResult = aOwner.localeCompare(bOwner);
          break;
        case 'creationDate':
          compareResult = a.creationDate - b.creationDate;
          break;
        case 'role':
          compareResult = determineRole(a).localeCompare(determineRole(b));
          break;
        case 'apiVersion':
          compareResult = a.defaultApiVersion - b.defaultApiVersion;
          break;
        case 'lastUsed':
          compareResult = a.lastUsed - b.lastUsed;
          break;
        case 'lastModified':
          compareResult = (a.lastModified || a.creationDate) - (b.lastModified || b.creationDate);
          break;
      }
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [tokens, sortField, sortDirection, searchTerm]);

  const handleDeleteToken = async (tokenId: string, tokenName: string) => {
    setDeletingTokenId(tokenId);
    setDeleteError(null);

    try {
      const response = await fetch(`https://app.launchdarkly.com/api/v2/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': import.meta.env.VITE_LD_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete token: ${errorText}`);
      }

      // Remove the token from the local state
      setTokens(prevTokens => prevTokens.filter(token => token._id !== tokenId));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete token');
      console.error('Error deleting token:', err);
    } finally {
      setDeletingTokenId(null);
    }
  };

  const handleResetClick = (token: AccessToken) => {
    setSelectedToken(token);
    setResetModalOpen(true);
  };

  const handleResetToken = async (expiry: number) => {
    if (!selectedToken) return;

    setResetModalOpen(false);
    setResettingTokenId(selectedToken._id);
    setError(null);

    try {
      const response = await fetch(`https://app.launchdarkly.com/api/v2/tokens/${selectedToken._id}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': import.meta.env.VITE_LD_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expiry: expiry * 24 * 60 * 60 // Convert days to seconds
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset token: ${errorText}`);
      }

      const data: ResetTokenResponse = await response.json();
      setNewToken(data.token);
      
      // Refresh the tokens list
      await fetchAllTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset token');
      console.error('Error resetting token:', err);
    } finally {
      setResettingTokenId(null);
      setSelectedToken(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading tokens...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-4">
          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{deleteError}</span>
              <span 
                className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
                onClick={() => setDeleteError(null)}
              >
                ×
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-bold">Service Access Tokens ({filteredAndSortedTokens.length} total)</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showApiVersion}
                  onChange={(e) => setShowApiVersion(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                Show API Version
              </label>
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 shadow">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th 
                  className="w-64 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Name</span> {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('owner')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Owner</span> {getSortIcon('owner')}
                  </div>
                </th>
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('creationDate')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Created</span> {getSortIcon('creationDate')}
                  </div>
                </th>
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastModified')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Modified</span> {getSortIcon('lastModified')}
                  </div>
                </th>
                <th 
                  className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Role</span> {getSortIcon('role')}
                  </div>
                </th>
                {showApiVersion && (
                  <th 
                    className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('apiVersion')}
                  >
                    <div className="flex items-center">
                      <span className="truncate">API Ver</span> {getSortIcon('apiVersion')}
                    </div>
                  </th>
                )}
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastUsed')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Last Used</span> {getSortIcon('lastUsed')}
                  </div>
                </th>
                <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAndSortedTokens.map((token, index) => (
                <tr key={token._id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={token.name}>
                      {token.name}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 truncate" title={token._member ? `${token._member.firstName} ${token._member.lastName}` : 'N/A'}>
                      {token._member ? 
                        `${token._member.firstName} ${token._member.lastName}` : 
                        'N/A'}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 truncate" title={formatDate(token.creationDate)}>
                      {formatDate(token.creationDate)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 truncate" title={formatDate(token.lastModified || token.creationDate)}>
                      {formatDate(token.lastModified || token.creationDate)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 truncate" title={determineRole(token)}>
                      {determineRole(token)}
                    </div>
                  </td>
                  {showApiVersion && (
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 truncate">
                        {token.defaultApiVersion || '-'}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 truncate" title={formatDate(token.lastUsed)}>
                      {formatDate(token.lastUsed)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteToken(token._id, token.name)}
                        disabled={deletingTokenId === token._id}
                        className={`text-red-600 hover:text-red-800 text-sm font-medium ${
                          deletingTokenId === token._id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {deletingTokenId === token._id ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => handleResetClick(token)}
                        disabled={resettingTokenId === token._id}
                        className={`text-blue-600 hover:text-blue-800 text-sm font-medium ${
                          resettingTokenId === token._id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {resettingTokenId === token._id ? 'Resetting...' : 'Reset'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setSelectedToken(null);
        }}
        onReset={handleResetToken}
        tokenName={selectedToken?.name || ''}
      />

      <NewTokenDisplay
        token={newToken}
        onClose={() => setNewToken(null)}
      />
    </>
  );
} 
