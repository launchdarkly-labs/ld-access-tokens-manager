import React from 'react';

interface LoadTokensButtonProps {
  onLoad: () => void;
  isLoading: boolean;
}

export function LoadTokensButton({ onLoad, isLoading }: LoadTokensButtonProps) {
  return (
    <button
      onClick={onLoad}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-500 text-gray-800 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      ) : (
        'Load Access Tokens'
      )}
    </button>
  );
} 