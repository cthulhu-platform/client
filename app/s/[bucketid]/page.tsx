'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Nav from '@/components/Nav';
import FileDropzone from '@/components/FileDropzone';
import FileContainer from '@/components/FileContainer';
import { useAuth } from '@/components/hooks/useAuth';

export default function BucketPage() {
  const params = useParams();
  const router = useRouter();
  const bucketId = params.bucketid as string;
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin } = useAuth({ bucketId });

  const handleUploadSuccess = (id: string) => {
    // Upload API creates a new bucket, so navigate to it
    router.push(`/s/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <Nav />
      <main className="flex flex-col items-center justify-center w-full max-w-4xl px-4 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-7xl font-black mb-4 tracking-tight" style={{ color: '#6A4A98' }}>
            CTHULHU
          </h1>
          <p className="text-2xl font-semibold mb-2" style={{ color: '#6A4A98' }}>
            Bucket: {bucketId}
          </p>
          <p className="text-base text-gray-400">
            {isAdmin ? 'Upload more files or manage existing ones' : 'View files in this bucket'}
          </p>
        </div>

        {isAdmin && <FileDropzone onUploadSuccess={handleUploadSuccess} />}
        <div className='w-full' key={refreshKey}>
          <FileContainer bucketId={bucketId} />
        </div>
      </main>
    </div>
  );
}

