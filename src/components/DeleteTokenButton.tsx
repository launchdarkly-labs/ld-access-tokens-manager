import React from 'react';

interface DeleteTokenButtonProps {
  tokenId: string;
  tokenName: string;
  isDeleting: boolean;
  onDelete: (tokenId: string, tokenName: string) => Promise<void>;
}

export function DeleteTokenButton({ tokenId, tokenName, isDeleting, onDelete }: DeleteTokenButtonProps) {
  return (
    <button
      onClick={() => onDelete(tokenId, tokenName)}
      disabled={isDeleting}
      className={`text-red-600 hover:text-red-800 text-sm font-medium ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
} 