import React, { useState } from 'react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (expiry: number) => void;
  tokenName: string;
}

export function ResetTokenModal({ isOpen, onClose, onReset, tokenName }: ResetModalProps) {
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
