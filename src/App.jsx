import { useState } from 'react'
import { AccessTokensList } from './components/AccessTokensList'
import { ApiTokenInput } from './components/ApiTokenInput'
import { LoadTokensButton } from './components/LoadTokensButton'
import { AccountMembersList } from './components/AccountMembersList'
import './App.css'

console.log(import.meta.env.VITE_LD_API_TOKEN)

function App() {
  const [apiToken, setApiToken] = useState(import.meta.env.VITE_LD_API_TOKEN || '');
  const [activeTab, setActiveTab] = useState('tokens');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoadTokens, setShouldLoadTokens] = useState(false);
  const [shouldLoadMembers, setShouldLoadMembers] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  const handleTokenSubmit = (token) => {
    setApiToken(token);
    setTokenCount(0);
    setMemberCount(0);
    setShouldLoadTokens(false);
    setShouldLoadMembers(false);
  };

  const handleLoad = () => {
    if (activeTab === 'tokens') {
      setShouldLoadTokens(false);
      setTimeout(() => setShouldLoadTokens(true), 0);
    } else {
      setShouldLoadMembers(false);
      setTimeout(() => setShouldLoadMembers(true), 0);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    const hasLoaded = activeTab === 'tokens' ? tokenCount > 0 : memberCount > 0;
    if (activeTab === 'tokens') {
      return hasLoaded ? 'Reload Access Tokens' : 'Load Access Tokens';
    }
    return hasLoaded ? 'Reload Account Members' : 'Load Account Members';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 w-screen">
      <div className="w-full mx-auto px-auto sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LaunchDarkly Resource Manager
        </h1>
        <p className="text-gray-600 mb-4">
          Manage your LaunchDarkly access tokens and account members in one place.
        </p>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              activeTab === 'tokens' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Access Tokens
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 ${
              activeTab === 'members' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Account Members
          </button>
        </div>
        <ApiTokenInput 
          defaultToken={import.meta.env.VITE_LD_API_TOKEN}
          onTokenSubmit={handleTokenSubmit}
        />
        {apiToken && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-end">
              <LoadTokensButton
                onLoad={handleLoad}
                isLoading={isLoading}
                hasLoadedTokens={activeTab === 'tokens' ? tokenCount > 0 : memberCount > 0}
                buttonText={getButtonText()}
              />
            </div>
            {activeTab === 'tokens' && (
              <AccessTokensList 
                apiToken={apiToken}
                shouldLoad={shouldLoadTokens}
                onLoadingChange={setIsLoading}
                onTokensLoaded={setTokenCount}
              />
            )}
            {activeTab === 'members' && (
              <AccountMembersList
                apiToken={apiToken}
                shouldLoad={shouldLoadMembers}
                onLoadingChange={setIsLoading}
                onMembersLoaded={setMemberCount}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
