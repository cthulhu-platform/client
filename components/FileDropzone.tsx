'use client';

import React, { useState, useRef } from 'react';
import { uploadFile } from '@/lib/api';

interface FileDropzoneProps {
  onUploadSuccess?: (bucketId: string) => void;
}

export default function FileDropzone({ onUploadSuccess }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PURPLE_THEME = '#6A4A98';
  const PURPLE_LIGHT = '#8B6FB8';
  const PURPLE_DARK = '#5A3A78';

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);

    try {
      const result = await uploadFile(files);
      
      if (result.status && result.data) {
        // Extract bucket ID from URL (format: /files/s/{id})
        const urlMatch = result.data.url.match(/\/files\/s\/([^\/]+)/);
        const bucketId = urlMatch ? urlMatch[1] : null;
        
        setUploadProgress(`✅ Upload successful!`);
        
        if (bucketId && onUploadSuccess) {
          onUploadSuccess(bucketId);
        }

        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadProgress('');
        }, 3000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(`❌ Upload failed: ${errorMessage}`);
      setUploadProgress('');

      // Reset after 5 seconds
      setTimeout(() => {
        setUploadError(null);
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-opacity-100' : 'border-opacity-50'
        }`}
        style={{
          borderColor: isDragActive ? PURPLE_THEME : PURPLE_LIGHT,
          backgroundColor: isDragActive ? `${PURPLE_THEME}10` : 'transparent',
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="flex flex-col items-center justify-center">
          {isUploading ? (
            <div className="w-16 h-16 mb-4 flex items-center justify-center">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: PURPLE_THEME }}
              ></div>
            </div>
          ) : (
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: PURPLE_THEME }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
          <h3 className="text-xl font-semibold mb-2" style={{ color: PURPLE_THEME }}>
            {isUploading ? 'Uploading Files...' : 'Drag & Drop Files Here'}
          </h3>
          <p className="mb-4 text-gray-400">
            {isUploading ? 'Please wait while your files are being uploaded' : 'or click to browse (multiple files supported)'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileInputChange}
          />
          <button
            className="py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{
              backgroundColor: PURPLE_THEME,
              color: '#ffffff',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            type="button"
            disabled={isUploading}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = PURPLE_LIGHT;
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = PURPLE_THEME;
              }
            }}
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </button>
        </div>
      </div>

      {uploadProgress && (
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: `${PURPLE_THEME}20` }}>
          <p className="text-sm font-medium" style={{ color: PURPLE_THEME }}>
            {uploadProgress}
          </p>
        </div>
      )}

      {uploadError && (
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: '#fee2e220' }}>
          <p className="text-sm font-medium text-red-400">
            {uploadError}
          </p>
        </div>
      )}
    </div>
  );
}

