'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleCallback } from '../../lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = 'github'; // Default provider

    if (!code || !state) {
      setError('Missing code or state parameter');
      setStatus('error');
      return;
    }

    // Handle OAuth callback
    handleCallback(code, state, provider)
      .then(() => {
        setStatus('success');
        // Redirect to signin page after a short delay
        setTimeout(() => {
          router.push('/signin');
        }, 1500);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-md flex-col items-center justify-center py-16 px-8">
        <div className="w-full space-y-6 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          {status === 'loading' && (
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
              <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
                Completing authentication...
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Please wait while we verify your credentials.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
                Authentication successful!
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Redirecting you to the signin page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
                Authentication failed
              </h1>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error || 'An error occurred during authentication'}
              </p>
              <button
                onClick={() => router.push('/signin')}
                className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CallbackPage() {
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
      <CallbackContent />
    </Suspense>
  );
}

