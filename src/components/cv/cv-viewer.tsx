import type { CV } from '@/types/cv';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CvViewerProps {
  cv: CV | null;
}

export function CvViewer({ cv }: CvViewerProps) {
  if (!cv) {
    return (
      <Card>
        <CardContent className="text-sm text-slate-500">Select a CV to inspect its parsed text.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-950">{cv.file_name}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {cv.analysis_result ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Summary</p>
            <p className="mt-2">{cv.analysis_result.summary || 'No summary yet.'}</p>
          </div>
        ) : null}
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
          {cv.raw_text}
        </pre>
      </CardContent>
    </Card>
  );
}
