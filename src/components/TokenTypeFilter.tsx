import React from 'react';
import { TokenType } from '../types/AccessToken';

interface TokenTypeFilterProps {
  selectedType: TokenType | 'all';
  onChange: (type: TokenType | 'all') => void;
}

export function TokenTypeFilter({ selectedType, onChange }: TokenTypeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Token Type:</label>
      <select
        value={selectedType}
        onChange={(e) => onChange(e.target.value as TokenType | 'all')}
        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Tokens</option>
        <option value="service">Service Tokens</option>
        <option value="personal">Personal Tokens</option>
      </select>
    </div>
  );
} 