'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { initiateOAuth, tokenStorage, validateToken, logout, type AuthResponse, type Claims } from '@/lib/api';

function SignInContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Claims | null>(null);
  const [tokens, setTokens] = useState<{ access: string | null; refresh: string | null }>({
    access: null,
    refresh: null,
  });

  // Check if user is already logged in
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (accessToken) {
      setTokens({ access: accessToken, refresh: refreshToken });
      // Validate token and get user info
      validateToken(accessToken)
        .then((claims) => {
          setUser(claims);
        })
        .catch(() => {
          // Token invalid, clear it
          tokenStorage.clearTokens();
          setTokens({ access: null, refresh: null });
        });
    }
  }, []);

  const handleSignIn = () => {
    setLoading(true);
    setError(null);
    // Use existing return URL if available, otherwise default to home
    const existingReturnUrl = localStorage.getItem('oauth_return_url');
    if (!existingReturnUrl) {
      localStorage.setItem('oauth_return_url', '/');
    }
    initiateOAuth('github');
  };

  const handleLogout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    setTokens({ access: null, refresh: null });
    router.push('/signin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center py-16 px-8">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Test OAuth authentication with GitHub
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {user ? (
            <div className="space-y-6">
              <div className="rounded-md bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Successfully authenticated!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
                    User Info
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">User ID:</span>
                      <span className="font-mono text-black dark:text-zinc-50">{user.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Email:</span>
                      <span className="font-mono text-black dark:text-zinc-50">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Provider:</span>
                      <span className="font-mono text-black dark:text-zinc-50">{user.provider}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-zinc-50 mb-2">
                    Access Token (for testing):
                  </h3>
                  <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-3">
                    <p className="font-mono text-xs break-all text-zinc-800 dark:text-zinc-200">
                      {tokens.access?.substring(0, 50)}...
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-zinc-50 mb-2">
                    Refresh Token (for testing):
                  </h3>
                  <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-3">
                    <p className="font-mono text-xs break-all text-zinc-800 dark:text-zinc-200">
                      {tokens.refresh?.substring(0, 50)}...
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Sign in with GitHub
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-zinc-900 dark:text-zinc-50"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

