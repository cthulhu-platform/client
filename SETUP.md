# OAuth Signin Setup

## Prerequisites

1. Gateway server running on `http://localhost:7777`
2. GitHub OAuth App configured

## Configuration

### 1. Gateway Configuration

Update your gateway `.env` file to point the redirect URI to the frontend callback:

```env
GITHUB_REDIRECT_URI=http://localhost:3000/signin/callback
```

### 2. GitHub OAuth App Settings

In your GitHub OAuth App settings, set the **Authorization callback URL** to:

```
http://localhost:3000/signin/callback
```

**Note:** This should match the `GITHUB_REDIRECT_URI` in your gateway configuration.

### 3. Frontend Environment

The frontend is already configured to use `http://localhost:7777` as the API URL (default in `.env.local`).

## Testing Flow

1. Start the gateway server: `cd gateway/MAIN && go run cmd/api/main.go`
2. Start the frontend: `cd client/MAIN && npm run dev`
3. Navigate to `http://localhost:3000/signin`
4. Click "Sign in with GitHub"
5. Authorize the application on GitHub
6. You'll be redirected back to the signin page with your user info displayed

## Troubleshooting

- **CORS errors**: Make sure `CORS_ORIGIN` in gateway is set to `http://localhost:3000`
- **Redirect mismatch**: Ensure GitHub callback URL matches `GITHUB_REDIRECT_URI` in gateway
- **Token not stored**: Check browser console for errors and ensure localStorage is enabled

