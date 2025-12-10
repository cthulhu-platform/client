'use client';

import React, { useState, useEffect } from 'react';
import { fetchBucketFiles, BucketMetadata } from '@/lib/api';
import FileEntry from './FileEntry';

interface FileContainerProps {
  bucketId: string | null;
}

export default function FileContainer({ bucketId }: FileContainerProps) {
  const [files, setFiles] = useState<BucketMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputBucketId, setInputBucketId] = useState('');
  const [displayBucketId, setDisplayBucketId] = useState<string | null>(bucketId);

  const PURPLE_THEME = '#6A4A98';

  useEffect(() => {
    if (bucketId) {
      setDisplayBucketId(bucketId);
      fetchFiles(bucketId);
    }
  }, [bucketId]);

  const fetchFiles = async (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchBucketFiles(id);
      setFiles(data);
      setDisplayBucketId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
      setFiles(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputBucketId.trim()) {
      fetchFiles(inputBucketId.trim());
    }
  };

  if (!displayBucketId) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="p-6 rounded-lg border" style={{ borderColor: `${PURPLE_THEME}40` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: PURPLE_THEME }}>
            View Files from Bucket
          </h3>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputBucketId}
              onChange={(e) => setInputBucketId(e.target.value)}
              placeholder="Enter bucket ID"
              className="flex-1 px-4 py-2 rounded-lg border bg-transparent"
              style={{ borderColor: `${PURPLE_THEME}40`, color: '#ededed' }}
            />
            <button
              type="submit"
              className="py-2 px-6 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: PURPLE_THEME,
                color: '#ffffff',
              }}
            >
              View Files
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mt-8">
      <div className="p-6 rounded-lg border" style={{ borderColor: `${PURPLE_THEME}40` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: PURPLE_THEME }}>
            Files in Bucket
          </h3>
          <button
            onClick={() => {
              setDisplayBucketId(null);
              setFiles(null);
              setInputBucketId('');
            }}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Change Bucket
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: PURPLE_THEME }}
            ></div>
            <span className="ml-3 text-gray-400">Loading files...</span>
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchFiles(displayBucketId)}
              className="py-2 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: PURPLE_THEME,
                color: '#ffffff',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && files && (
          <>
            {files.files && files.files.length > 0 ? (
              <div className="space-y-3">
                {files.files.map((file, index) => (
                  <FileEntry
                    key={index}
                    fileName={file.string_id}
                    originalName={file.original_name}
                    size={file.size}
                    bucketId={displayBucketId || ''}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <p>No files found in this bucket</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

