import React from 'react';

interface LoadButtonProps {
  onLoad: () => void;
  isLoading: boolean;
  hasLoadedTokens: boolean;
  buttonText: string;
}

export function LoadTokensButton({ onLoad, isLoading, hasLoadedTokens, buttonText }: LoadButtonProps) {
  return (
    <button
      onClick={onLoad}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-gray-700 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      ) : (
        buttonText
      )}
    </button>
  );
} 