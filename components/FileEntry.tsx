'use client';

import React from 'react';
import { downloadFile } from '@/lib/api';
import { useAuth } from '@/components/hooks/useAuth';

interface FileEntryProps {
  fileName: string;
  originalName: string;
  size: number;
  bucketId: string;
}

export default function FileEntry({ fileName, originalName, size, bucketId }: FileEntryProps) {
  const { isAdmin } = useAuth({ bucketId });
  const PURPLE_THEME = '#6A4A98';
  const PURPLE_LIGHT = '#8B6FB8';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      await downloadFile(bucketId, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please check if you have access to this bucket.');
    }
  };

  const handleDelete = () => {
    console.log('Delete file:', { bucketId, fileName, originalName });
  };

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-lg"
      style={{
        borderColor: `${PURPLE_THEME}40`,
        backgroundColor: `${PURPLE_THEME}05`,
      }}
    >
      <div className="flex items-center flex-1 min-w-0">
        <svg
          className="w-6 h-6 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: PURPLE_THEME }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate" style={{ color: PURPLE_THEME }}>
            {originalName}
          </h3>
          <p className="text-sm text-gray-400">{formatFileSize(size)}</p>
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="py-2 px-4 rounded-lg transition-colors font-medium flex-shrink-0"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            Delete
          </button>
        )}
        <button
          onClick={handleDownload}
          className="py-2 px-4 rounded-lg transition-colors font-medium flex-shrink-0"
          style={{
            backgroundColor: PURPLE_THEME,
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = PURPLE_LIGHT;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = PURPLE_THEME;
          }}
        >
          Download
        </button>
      </div>
    </div>
  );
}

