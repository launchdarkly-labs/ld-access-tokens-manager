import React, { useEffect, useState, useMemo } from 'react';
import { AccessToken, TokensResponse, ResetTokenResponse, SortField, SortDirection } from '../types/AccessToken';
import { DeleteTokenButton } from './DeleteTokenButton';
import { ResetTokenButton } from './ResetTokenButton';
import { ResetTokenModal } from './ResetTokenModal';
import { NewTokenModal } from './NewTokenModal';
import { determineRole, formatDate } from '../utils/tokenUtils';

interface AccessTokensListProps {
  apiToken: string;
  shouldLoad: boolean;
  onLoadingChange: (isLoading: boolean) => void;
}

export function AccessTokensList({ apiToken, shouldLoad, onLoadingChange }: AccessTokensListProps) {
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
    onLoadingChange(true);
    setError(null);
    const uniqueTokens = new Map<string, AccessToken>();
    const limit = 50;

    try {
      let offset = 0;
      let totalCount = 0;

      do {
        const url = `https://app.launchdarkly.com/api/v2/tokens?offset=${offset}&limit=${limit}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data: TokensResponse = await response.json();
        
        if (offset === 0) {
          totalCount = data.totalCount;
        }

        data.items.forEach(token => {
          uniqueTokens.set(token._id, token);
        });
        
        offset += limit;
      } while (offset < totalCount);

      const allTokens = Array.from(uniqueTokens.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setTokens(allTokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching tokens');
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  useEffect(() => {
    if (shouldLoad) {
      fetchAllTokens();
    }
  }, [shouldLoad]);

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

  const handleDeleteToken = async (tokenId: string, tokenName: string) => {
    setDeletingTokenId(tokenId);
    setDeleteError(null);

    try {
      const response = await fetch(`https://app.launchdarkly.com/api/v2/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete token: ${errorText}`);
      }

      setTokens(prevTokens => prevTokens.filter(token => token._id !== tokenId));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete token');
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
          'Authorization': apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expiry: expiry * 24 * 60 * 60
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset token: ${errorText}`);
      }

      const data: ResetTokenResponse = await response.json();
      setNewToken(data.token);
      await fetchAllTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset token');
    } finally {
      setResettingTokenId(null);
      setSelectedToken(null);
    }
  };

  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(token => 
        token.name.toLowerCase().includes(searchLower) ||
        token._member?.firstName?.toLowerCase().includes(searchLower) ||
        token._member?.lastName?.toLowerCase().includes(searchLower) ||
        determineRole(token).toLowerCase().includes(searchLower)
      );
    }

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

  if (!shouldLoad) {
    return null;
  }

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
                    <span className="truncate">Name</span>&nbsp;&nbsp;{getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('owner')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Owner</span>&nbsp;&nbsp;{getSortIcon('owner')}
                  </div>
                </th>
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('creationDate')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Created</span>&nbsp;&nbsp;{getSortIcon('creationDate')}
                  </div>
                </th>
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastModified')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Modified</span>&nbsp;&nbsp;{getSortIcon('lastModified')}
                  </div>
                </th>
                <th 
                  className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Role</span>&nbsp;&nbsp;{getSortIcon('role')}
                  </div>
                </th>
                {showApiVersion && (
                  <th 
                    className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('apiVersion')}
                  >
                    <div className="flex items-center">
                      <span className="truncate">API Ver</span>&nbsp;&nbsp;{getSortIcon('apiVersion')}
                    </div>
                  </th>
                )}
                <th 
                  className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastUsed')}
                >
                  <div className="flex items-center">
                    <span className="truncate">Last Used</span>&nbsp;&nbsp;{getSortIcon('lastUsed')}
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
                      <DeleteTokenButton
                        tokenId={token._id}
                        tokenName={token.name}
                        isDeleting={deletingTokenId === token._id}
                        onDelete={handleDeleteToken}
                      />
                      <ResetTokenButton
                        token={token}
                        isResetting={resettingTokenId === token._id}
                        onReset={handleResetClick}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResetTokenModal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setSelectedToken(null);
        }}
        onReset={handleResetToken}
        tokenName={selectedToken?.name || ''}
      />

      <NewTokenModal
        token={newToken}
        onClose={() => setNewToken(null)}
      />
    </>
  );
} 
