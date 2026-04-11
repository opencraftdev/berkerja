'use client';

import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { cn } from '@/utils/cn';

interface CvUploadDropzoneProps {
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function CvUploadDropzone({ isUploading, onUpload }: CvUploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        setError('Please upload a PDF or DOCX file.');
        return;
      }

      setError(null);
      await onUpload(acceptedFiles[0]);
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: isUploading,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center transition',
        isDragActive && 'border-primary bg-blue-50',
        isUploading && 'cursor-not-allowed opacity-70',
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-primary" />
      <h3 className="mt-4 text-lg font-semibold">Upload a CV to start the pipeline</h3>
      <p className="mt-2 text-sm text-slate-500">
        {isUploading ? 'Parsing your CV...' : 'Drag and drop a PDF or DOCX file, or click to browse.'}
      </p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
