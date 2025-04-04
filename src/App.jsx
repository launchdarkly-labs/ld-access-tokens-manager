import { useState } from 'react'
import { AccessTokensList } from './components/AccessTokensList'
import './App.css'

console.log(import.meta.env.VITE_LD_API_TOKEN)

function App() {
  const [count, setCount] = useState(0)

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
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <p className="text-sm text-gray-500">
            The API token used by this service is:
            <br />
            <code className="bg-gray-100 px-2 py-1 rounded">{import.meta.env.VITE_LD_API_TOKEN}</code>
          </p>
        </div>
        <AccessTokensList />
      </div>
    </div>
  )
}

export default App
