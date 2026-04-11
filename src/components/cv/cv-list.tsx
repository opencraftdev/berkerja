'use client';

import type { CV } from '@/types/cv';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

interface CvListProps {
  cvs: CV[];
  selectedCvId?: string;
  onSelect: (cv: CV) => void;
}

export function CvList({ cvs, selectedCvId, onSelect }: CvListProps) {
  if (cvs.length === 0) {
    return <p className="text-sm text-slate-500">No CVs uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {cvs.map((cv) => (
        <button
          key={cv.id}
          type="button"
          className={cn(
            'w-full rounded-2xl border border-border bg-white p-4 text-left transition hover:border-primary hover:bg-blue-50',
            selectedCvId === cv.id && 'border-primary bg-blue-50',
          )}
          onClick={() => onSelect(cv)}
        >
          <p className="font-medium text-slate-950">{cv.file_name}</p>
          <p className="mt-1 text-sm text-slate-500">Uploaded {formatDate(cv.created_at)}</p>
        </button>
      ))}
    </div>
  );
}
