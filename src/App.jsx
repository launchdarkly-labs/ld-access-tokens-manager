import { useState } from 'react'
import { AccessTokensList } from './components/AccessTokensList'
import { ApiTokenInput } from './components/ApiTokenInput'
import { LoadTokensButton } from './components/LoadTokensButton'
import './App.css'

console.log(import.meta.env.VITE_LD_API_TOKEN)

function App() {
  const [apiToken, setApiToken] = useState(import.meta.env.VITE_LD_API_TOKEN || '');
  const [showTokensList, setShowTokensList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoadTokens, setShouldLoadTokens] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const handleTokenSubmit = (token) => {
    setApiToken(token);
    setShowTokensList(true);
    setShouldLoadTokens(false);
    setTokenCount(0);
  };

  const handleLoadTokens = () => {
    setShouldLoadTokens(false);
    setTimeout(() => setShouldLoadTokens(true), 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 w-screen">
      <div className="w-full mx-auto px-auto sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LaunchDarkly API service token manager
        </h1>
        <p className="text-gray-600 mb-4">
          This is a simple client for managing API (service) access tokens in
          LaunchDarkly.
        </p>
        <ApiTokenInput 
          defaultToken={import.meta.env.VITE_LD_API_TOKEN}
          onTokenSubmit={handleTokenSubmit}
        />
        {showTokensList && apiToken && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-end">
              <LoadTokensButton
                onLoad={handleLoadTokens}
                isLoading={isLoading}
                hasLoadedTokens={tokenCount > 0}
              />
            </div>
            <AccessTokensList 
              apiToken={apiToken}
              shouldLoad={shouldLoadTokens}
              onLoadingChange={setIsLoading}
              onTokensLoaded={setTokenCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
