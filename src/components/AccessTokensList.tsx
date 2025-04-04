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

type SortField = 'name' | 'owner' | 'creationDate' | 'role' | 'apiVersion' | 'lastUsed';
type SortDirection = 'asc' | 'desc';

export function AccessTokensList() {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading tokens...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="p-4">
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

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Service Access Tokens ({filteredAndSortedTokens.length} total)</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name {getSortIcon('name')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('owner')}
              >
                Owner {getSortIcon('owner')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('creationDate')}
              >
                Created {getSortIcon('creationDate')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('role')}
              >
                Role {getSortIcon('role')}
              </th>
              {filteredAndSortedTokens.some(token => token.defaultApiVersion) && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('apiVersion')}
                >
                  API Version {getSortIcon('apiVersion')}
                </th>
              )}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('lastUsed')}
              >
                Last Used {getSortIcon('lastUsed')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedTokens.map((token, index) => (
              <tr key={token._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{token.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {token._member ? 
                    `${token._member.firstName} ${token._member.lastName}` : 
                    'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(token.creationDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{determineRole(token)}</td>
                {filteredAndSortedTokens.some(token => token.defaultApiVersion) && (
                  <td className="px-6 py-4 whitespace-nowrap">{token.defaultApiVersion || '-'}</td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(token.lastUsed)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteToken(token._id, token.name)}
                    disabled={deletingTokenId === token._id}
                    className={`text-red-600 hover:text-red-800 font-medium ${
                      deletingTokenId === token._id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {deletingTokenId === token._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 