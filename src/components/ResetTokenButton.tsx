import React from 'react';
import { AccessToken } from '../types/AccessToken';

interface ResetTokenButtonProps {
  token: AccessToken;
  isResetting: boolean;
  onReset: (token: AccessToken) => void;
}

export function ResetTokenButton({ token, isResetting, onReset }: ResetTokenButtonProps) {
  return (
    <button
      onClick={() => onReset(token)}
      disabled={isResetting}
      className={`text-blue-600 hover:text-blue-800 text-sm font-medium ${
        isResetting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isResetting ? 'Resetting...' : 'Reset'}
    </button>
  );
} 