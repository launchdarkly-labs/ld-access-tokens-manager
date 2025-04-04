import React, { useState } from 'react';

interface ApiTokenInputProps {
  defaultToken?: string;
  onTokenSubmit: (token: string) => void;
}

export function ApiTokenInput({ defaultToken = '', onTokenSubmit }: ApiTokenInputProps) {
  const [token, setToken] = useState(defaultToken);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!token.trim()) {
      setError('API token is required');
      return;
    }

    if (!token.startsWith('api-')) {
      setError('API token should start with "api-"');
      return;
    }

    setError(null);
    onTokenSubmit(token.trim());
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
            LaunchDarkly API Token
          </label>
          <div className="flex gap-4">
            <input
              id="apiToken"
              type="text" 
              value={token.slice(0, -4).replace(/./g, '•') + token.slice(-4)}
              onChange={(e) => {
                setToken(e.target.value);
                setError(null);
              }}
              placeholder="Enter your LaunchDarkly API token"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-gray-800 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Set Token
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-500">
          <p>
            Your API token should have read and write access to the API Access Tokens resource.
            You can create a new token in your{' '}
            <a
              href="https://app.launchdarkly.com/settings/authorization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              LaunchDarkly Account Settings
            </a>.
          </p>
        </div>
      </form>
    </div>
  );
} 