import React from 'react';

interface NewTokenDisplayProps {
  token: string | null;
  onClose: () => void;
}

export function NewTokenModal({ token, onClose }: NewTokenDisplayProps) {
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 
