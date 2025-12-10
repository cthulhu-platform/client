const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface Claims {
  user_id: string;
  email: string;
  provider: string;
}

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// Initiate OAuth flow - redirects to gateway
export const initiateOAuth = (provider: string = 'github'): void => {
  if (typeof window === 'undefined') return;
  window.location.href = `${API_URL}/auth/oauth/${provider}`;
};

// Handle OAuth callback
export const handleCallback = async (
  code: string,
  state: string,
  provider: string = 'github'
): Promise<AuthResponse> => {
  const response = await fetch(
    `${API_URL}/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to authenticate' }));
    throw new Error(error.error || 'Failed to authenticate');
  }

  const data: AuthResponse = await response.json();
  
  // Store tokens
  tokenStorage.setTokens(data.access_token, data.refresh_token);
  
  return data;
};

// Validate access token
export const validateToken = async (token: string): Promise<Claims> => {
  const response = await fetch(`${API_URL}/auth/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Invalid token' }));
    throw new Error(error.error || 'Invalid token');
  }

  const data = await response.json();
  return data.claims;
};

// Refresh tokens
export const refreshToken = async (refreshToken: string): Promise<TokenPair> => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to refresh token' }));
    throw new Error(error.error || 'Failed to refresh token');
  }

  const data: TokenPair = await response.json();
  
  // Update stored tokens
  tokenStorage.setTokens(data.access_token, data.refresh_token);
  
  return data;
};

// Logout
export const logout = async (refreshToken: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } finally {
    // Always clear tokens locally
    tokenStorage.clearTokens();
  }
};

