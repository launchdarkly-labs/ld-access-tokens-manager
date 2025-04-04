# LaunchDarkly API Service Token Manager

A React application for managing LaunchDarkly API service tokens. This tool allows you to view, search, sort, delete, and reset your LaunchDarkly API access tokens.

## Features

- View all API service tokens
- Search tokens by name, owner, or role
- Sort tokens by various attributes
- Delete tokens
- Reset tokens with custom expiry

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ld-access-tokens-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your LaunchDarkly API token (optional):
```bash
VITE_LD_API_TOKEN=api-YOUR-TOKEN-HERE
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Enter your LaunchDarkly API token in the input field
   - The token should have read and write access to the API Access Tokens resource
   - You can create a new token in your [LaunchDarkly Account Settings](https://app.launchdarkly.com/settings/authorization)
   - If you provided a token in the `.env` file, it will be pre-filled

2. Click "Set Token" to validate and save your API token

3. Click "Load Access Tokens" to fetch and display your tokens

4. Use the available features:
   - Search tokens using the search box
   - Sort columns by clicking on column headers
   - Toggle API Version visibility using the checkbox
   - Delete tokens using the Delete button
   - Reset tokens using the Reset button (allows setting custom expiry)

## Development

- Built with React + Vite
- Uses Tailwind CSS for styling
- TypeScript for type safety
- Modern component architecture with proper separation of concerns

## Security Notes

- API tokens are handled securely and never stored permanently
- Token input is masked for privacy
- Environment variables are used for secure token storage during development