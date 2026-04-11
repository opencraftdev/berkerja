'use client';

import { useEffect, useState } from 'react';

import { CvList } from '@/components/cv/cv-list';
import { CvUploadDropzone } from '@/components/cv/upload-dropzone';
import { CvViewer } from '@/components/cv/cv-viewer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getUserCVs, uploadCV } from '@/features/cv-management/api/upload';
import { useAuthStore } from '@/stores/auth-store';
import type { CV } from '@/types/cv';

export default function CvPage() {
  const { user, hydrate } = useAuthStore();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCv, setSelectedCv] = useState<CV | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    getUserCVs(user?.id)
      .then((data) => {
        setCvs(data);
        setSelectedCv((current) => current ?? data[0] ?? null);
      })
      .catch((value: Error) => setError(value.message));
  }, [user?.id]);

  async function handleUpload(file: File) {
    if (!user?.id) {
      setError('Set a user id in the header before uploading a CV.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const cv = await uploadCV(file, user?.id);
      setCvs((current) => [cv, ...current]);
      setSelectedCv(cv);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-blue-600">Phase 1</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">CV management</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Upload a CV, parse its raw text, and inspect the analysis that powers keyword generation.
        </p>
      </div>

      <CvUploadDropzone isUploading={isUploading} onUpload={handleUpload} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-950">Uploaded CVs</h2>
          </CardHeader>
          <CardContent>
            <CvList cvs={cvs} selectedCvId={selectedCv?.id} onSelect={setSelectedCv} />
          </CardContent>
        </Card>
        <CvViewer cv={selectedCv} />
      </div>
    </div>
  );
}
