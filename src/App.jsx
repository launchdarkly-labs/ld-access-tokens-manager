import { useState } from 'react'
import { AccessTokensList } from './components/AccessTokensList'
import './App.css'

console.log(import.meta.env.VITE_LD_API_TOKEN)

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>LaunchDarkly API service token manager</h1>
      <p>
        This is a simple client for managing API (service) access tokens in
        LaunchDarkly.
      </p>
      <p>
        The API token used by this service is:
        <br />
        <code>{import.meta.env.VITE_LD_API_TOKEN}</code>
      </p>
      <AccessTokensList />
    </>
  )
}

export default App
