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
    // Dispatch custom event to notify components of auth state change
    window.dispatchEvent(new Event('auth-state-changed'));
  },
  
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Dispatch custom event to notify components of auth state change
    window.dispatchEvent(new Event('auth-state-changed'));
  },
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const accessToken = tokenStorage.getAccessToken();
  return !!accessToken;
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
    `${API_URL}/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
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

// Hard logout - clears tokens and redirects to sign-in
// Used when token refresh fails or authentication is required but unavailable
export const hardLogout = (): void => {
  // Clear tokens from storage
  tokenStorage.clearTokens();
  
  // Redirect to sign-in page
  if (typeof window !== 'undefined') {
    window.location.href = '/signin';
  }
};

// Ensure valid token - validates current token and refreshes if needed
// Returns valid access token or throws error (which triggers hard logout)
export const ensureValidToken = async (): Promise<string> => {
  const accessToken = tokenStorage.getAccessToken();
  const refreshTokenValue = tokenStorage.getRefreshToken();
  
  // If no tokens at all, user is not authenticated
  if (!accessToken || !refreshTokenValue) {
    throw new Error('No authentication tokens available');
  }
  
  try {
    // Try to validate the current access token
    await validateToken(accessToken);
    // Token is valid, return it
    return accessToken;
  } catch (validateError) {
    // Token validation failed, try to refresh
    try {
      const newTokens = await refreshToken(refreshTokenValue);
      // Refresh succeeded, return new access token
      return newTokens.access_token;
    } catch (refreshError) {
      // Refresh failed, perform hard logout
      hardLogout();
      throw new Error('Token refresh failed - user logged out');
    }
  }
};

// File API interfaces
export interface FileInfo {
  original_name: string;
  string_id: string;
  key: string;
  size: number;
  content_type: string;
}

export interface UploadFileResponse {
  transaction_id: string;
  success: boolean;
  error?: string;
  storage_id?: string;
  files?: FileInfo[];
  total_size?: number;
}

export interface BucketMetadata {
  storage_id: string;
  files: FileInfo[];
  total_size: number;
}

export interface AdminInfo {
  user_id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  is_owner: boolean;
  created_at: number;
}

export interface BucketAdminsResponse {
  bucket_id: string;
  owner: AdminInfo | null;
  admins: AdminInfo[];
}

// Upload files
export const uploadFile = async (files: FileList, password?: string): Promise<{ status: boolean; data?: { url: string; storage_id: string }; error?: string }> => {
  const formData = new FormData();

  // Append all files to the form data with 'files' field name
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  // Append password if provided
  if (password && password.trim()) {
    formData.append('password', password.trim());
  }

  // Ensure valid token if user is authenticated (for elevated requests)
  // If token exists, validate and refresh if needed before making request
  const headers: HeadersInit = {};
  const accessToken = tokenStorage.getAccessToken();
  
  if (accessToken) {
    try {
      // Ensure token is valid (validates and refreshes if needed)
      const validToken = await ensureValidToken();
      headers['Authorization'] = `Bearer ${validToken}`;
    } catch (error) {
      // Token validation/refresh failed - hard logout already called
      // Re-throw to prevent upload with invalid token
      throw new Error('Authentication failed - please sign in again');
    }
  }
  // If no token, proceed with anonymous upload (no Authorization header)

  const response = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data: UploadFileResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Upload failed');
  }

  // Construct URL from storage_id
  const url = data.storage_id ? `/files/s/${data.storage_id}` : '';

  return {
    status: true,
    data: {
      url,
      storage_id: data.storage_id || '',
    },
  };
};

// Bucket access token storage utilities
export const bucketTokenStorage = {
  getBucketAccessToken: (bucketId: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`bucket_access_${bucketId}`);
  },
  
  setBucketAccessToken: (bucketId: string, token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`bucket_access_${bucketId}`, token);
  },
  
  clearBucketAccessToken: (bucketId: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`bucket_access_${bucketId}`);
  },
};

// Check if bucket is protected
export const checkBucketProtected = async (bucketId: string): Promise<{protected: boolean, bucket_id: string}> => {
  const response = await fetch(`${API_URL}/files/s/${bucketId}/protected`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check bucket protection' }));
    throw new Error(error.error || 'Failed to check bucket protection');
  }

  const data = await response.json();
  return data;
};

// Authenticate bucket with password
export const authenticateBucket = async (bucketId: string, password: string): Promise<{access_token: string, expires_in: number}> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Include auth token if user is authenticated
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    try {
      const validToken = await ensureValidToken();
      headers['Authorization'] = `Bearer ${validToken}`;
    } catch (error) {
      // Continue without auth token if validation fails
    }
  }

  const response = await fetch(`${API_URL}/files/s/${bucketId}/authenticate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(error.error || 'Authentication failed');
  }

  const data = await response.json();
  return data;
};

// Fetch bucket files
export const fetchBucketFiles = async (bucketId: string): Promise<BucketMetadata> => {
  const headers: HeadersInit = {};
  
  // Include bucket access token if available
  const bucketToken = bucketTokenStorage.getBucketAccessToken(bucketId);
  if (bucketToken) {
    headers['X-Bucket-Access'] = bucketToken;
  }

  const response = await fetch(`${API_URL}/files/s/${bucketId}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch files' }));
    throw new Error(error.error || 'Failed to fetch files');
  }

  const data: BucketMetadata = await response.json();
  return data;
};

// Download file
export const downloadFile = async (bucketId: string, fileName: string): Promise<void> => {
  const bucketToken = bucketTokenStorage.getBucketAccessToken(bucketId);
  const url = `${API_URL}/files/s/${bucketId}/d/${fileName}`;
  
  if (bucketToken) {
    // For protected buckets, use fetch with token in header
    try {
      const response = await fetch(url, {
        headers: {
          'X-Bucket-Access': bucketToken,
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  } else {
    // For unprotected buckets, open directly
    window.open(url, '_blank');
  }
};

// Fetch bucket admins
export const fetchBucketAdmins = async (bucketId: string): Promise<BucketAdminsResponse> => {
  const headers: HeadersInit = {};
  
  // Include bucket access token if available
  const bucketToken = bucketTokenStorage.getBucketAccessToken(bucketId);
  if (bucketToken) {
    headers['X-Bucket-Access'] = bucketToken;
  }

  const response = await fetch(`${API_URL}/files/s/${bucketId}/admins`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch admins' }));
    throw new Error(error.error || 'Failed to fetch admins');
  }

  const data: BucketAdminsResponse = await response.json();
  return data;
};

// Get current user ID from token (returns null if not authenticated or token invalid)
export const getCurrentUserId = async (): Promise<string | null> => {
  const accessToken = tokenStorage.getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const claims = await validateToken(accessToken);
    return claims.user_id;
  } catch {
    // Token invalid or expired
    return null;
  }
};

// Check if current user is a bucket admin
export const isBucketAdmin = async (bucketId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return false;
    }

    const admins = await fetchBucketAdmins(bucketId);
    // Check if user is in admins list (either as owner or regular admin)
    return admins.admins.some(admin => admin.user_id === userId) || 
           (admins.owner !== null && admins.owner.user_id === userId);
  } catch {
    return false;
  }
};

