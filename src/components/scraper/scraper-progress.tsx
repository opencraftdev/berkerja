'use client';

import type { ScraperProgress } from '@/hooks/use-scraper-sse';

interface ScraperProgressProps {
  status: 'idle' | 'scraping' | 'done' | 'error';
  progress: ScraperProgress | null;
  onRetry?: () => void;
}

export function ScraperProgress({ status, progress, onRetry }: ScraperProgressProps) {
  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
      {status === 'scraping' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-48 animate-pulse rounded-full bg-slate-200" />
            <span className="text-sm text-slate-500">
              {progress?.message ?? `Scraping page ${progress?.page ?? '?'}/${progress?.total ?? '?'}`}
              {progress?.jobs !== undefined ? ` · ${progress.jobs} jobs found` : ''}
            </span>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>✓</span>
          <span>
            {progress?.jobs ?? 0} jobs scraped
            {progress?.selectorUpdated ? ' · Selectors auto-updated' : ''}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600">✗ {progress?.error ?? 'Scraping failed'}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}