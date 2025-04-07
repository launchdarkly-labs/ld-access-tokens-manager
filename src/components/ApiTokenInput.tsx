import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ApiTokenInputProps {
  defaultToken?: string;
  onTokenSubmit: (token: string) => void;
}

export function ApiTokenInput({ defaultToken = '', onTokenSubmit }: ApiTokenInputProps) {
  const [token, setToken] = useState(defaultToken);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Please enter an API token');
      return;
    }

    if (!token.startsWith('api-')) {
      setError('API token must start with "api-"');
      return;
    }

    onTokenSubmit(token);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-4">
          <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
            LaunchDarkly API Token
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="apiToken"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your API token"
              />
              <div
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 bg-transparent"
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeSlashIcon className="h-5 w-5 opacity-50 hover:opacity-100 transition-opacity" />
                ) : (
                  <EyeIcon className="h-5 w-5 opacity-50 hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-gray-800 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
            >
              Set Token
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
          Your API token should have read and write access to the API Access Tokens resource. You can create a new API token in your{' '}
            <a
              href="https://app.launchdarkly.com/settings/authorization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              LaunchDarkly Account Settings
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
} 