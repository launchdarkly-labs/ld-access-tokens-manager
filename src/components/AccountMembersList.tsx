import React, { useEffect, useState } from 'react';
import { AccountMember, MembersResponse } from '../types/AccountMember';

interface AccountMembersListProps {
  apiToken: string;
  shouldLoad: boolean;
  onLoadingChange: (isLoading: boolean) => void;
  onMembersLoaded: (count: number) => void;
}

export function AccountMembersList({ 
  apiToken, 
  shouldLoad, 
  onLoadingChange,
  onMembersLoaded 
}: AccountMembersListProps) {
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

  const BASE_URL = 'https://app.launchdarkly.com/api/v2/';

  const fetchMembers = async (queryParams: string) => {
    try {
      const response = await fetch(`${BASE_URL}members?${queryParams}`, {
        headers: {
          'Authorization': apiToken,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: MembersResponse = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const fetchAllMembers = async () => {
    setIsLoading(true);
    onLoadingChange(true);
    setError(null);
    setMembers([]);
    setNextPageUrl(null);

    try {
      let queryParams = '';
      let allMembers: AccountMember[] = [];

      while (true) {
        const data = await fetchMembers(queryParams);
        allMembers = [...allMembers, ...data.items];
        
        if (!data._links?.next?.href) break;
        queryParams = data._links.next.href.split('?')[1] || '';
      }

      setMembers(allMembers);
      onMembersLoaded(allMembers.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching members');
      onMembersLoaded(0);
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  useEffect(() => {
    if (shouldLoad) fetchAllMembers();
  }, [shouldLoad]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`https://app.launchdarkly.com/api/v2/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': apiToken,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Failed to delete member: ${await response.text()}`);
      setMembers(members => members.filter(m => m._id !== id));
      onMembersLoaded(members.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

  if (!shouldLoad) return null;
  if (isLoading) return <div className="p-4">Loading account members...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Account Members ({members.length})</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map(member => (
              <tr key={member._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.firstName} {member.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(member.creationDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.lastSeen ? new Date(member.lastSeen).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleDelete(member._id)}
                    disabled={deletingId === member._id}
                    className="px-3 py-1 bg-red-500 text-gray-700 rounded hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
                  >
                    {deletingId === member._id ? 'Deleting...' : 'Delete'}
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