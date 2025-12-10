'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  isAuthenticated as checkIsAuthenticated, 
  isBucketAdmin as checkIsBucketAdmin,
  logout as apiLogout,
  tokenStorage,
  getCurrentUserId
} from '@/lib/api';

interface UseAuthOptions {
  bucketId?: string | null;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
  logout: () => Promise<void>;
  loading: boolean;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { bucketId } = options;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    const authenticated = checkIsAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      try {
        const currentUserId = await getCurrentUserId();
        setUserId(currentUserId);

        // Check admin status if bucketId is provided
        if (bucketId) {
          try {
            const adminStatus = await checkIsBucketAdmin(bucketId);
            setIsAdmin(adminStatus);
          } catch {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch {
        setUserId(null);
        setIsAdmin(false);
      }
    } else {
      setUserId(null);
      setIsAdmin(false);
    }
    
    setLoading(false);
  }, [bucketId]);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch (error) {
        // Even if API call fails, clear tokens locally
        console.error('Logout error:', error);
      }
    }
    // Clear tokens locally (handled by apiLogout, but ensure it happens)
    tokenStorage.clearTokens();
    // Reset state
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserId(null);
  }, []);

  useEffect(() => {
    // Initial check
    checkAuthStatus();

    // Listen for auth state changes
    const handleAuthStateChange = () => {
      checkAuthStatus();
    };

    // Also check when storage changes (e.g., after login/logout in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

  return {
    isAuthenticated,
    isAdmin,
    userId,
    logout,
    loading,
  };
}

