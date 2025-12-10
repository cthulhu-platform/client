'use client';

import React, { useState } from 'react';
import { authenticateBucket, bucketTokenStorage } from '@/lib/api';

interface BucketPasswordModalProps {
  bucketId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const PURPLE_THEME = '#6A4A98';
const PURPLE_LIGHT = '#8B6FB8';

export default function BucketPasswordModal({ bucketId, onSuccess, onCancel }: BucketPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticateBucket(bucketId, password);
      
      // Store token
      bucketTokenStorage.setBucketAccessToken(bucketId, result.access_token);
      
      // Clear password
      setPassword('');
      
      // Call success callback
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 border-2" style={{ borderColor: PURPLE_THEME }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: PURPLE_THEME }}>
          Protected Bucket
        </h2>
        <p className="text-gray-400 mb-6">
          This bucket is password protected. Please enter the password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: PURPLE_LIGHT }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: error ? '#ef4444' : PURPLE_THEME,
                color: '#ffffff',
                focusRingColor: PURPLE_THEME,
              }}
              placeholder="Enter password"
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: PURPLE_THEME,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && password.trim()) {
                  e.currentTarget.style.backgroundColor = PURPLE_LIGHT;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && password.trim()) {
                  e.currentTarget.style.backgroundColor = PURPLE_THEME;
                }
              }}
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: `1px solid ${PURPLE_THEME}`,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

