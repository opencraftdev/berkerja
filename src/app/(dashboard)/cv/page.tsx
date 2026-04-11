'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/components/cv/upload-dropzone';
import { CV } from '@/types/cv';

export default function CVPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCv, setSelectedCv] = useState<CV | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'demo-user');

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const cv = await response.json();
      setCvs([cv, ...cvs]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CV Management</h1>
      
      <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your CVs</h2>
        {cvs.length === 0 ? (
          <p className="text-gray-500">No CVs uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {cvs.map((cv) => (
              <div
                key={cv.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedCv(cv)}
              >
                <p className="font-medium">{cv.file_name}</p>
                <p className="text-sm text-gray-500">
                  Uploaded {new Date(cv.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCv && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">CV Content</h2>
          <pre className="p-4 bg-gray-100 rounded-lg overflow-auto whitespace-pre-wrap">
            {selectedCv.raw_text}
          </pre>
        </div>
      )}
    </div>
  );
}
