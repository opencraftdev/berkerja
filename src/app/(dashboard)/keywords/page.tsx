'use client';

import { useEffect, useMemo, useState } from 'react';

import { KeywordAnalysisNotes } from '@/components/keywords/keyword-analysis-notes';
import { KeywordEditor } from '@/components/keywords/keyword-editor';
import { KeywordGenerateButton } from '@/components/keywords/keyword-generate-button';
import { ScraperProgress } from '@/components/scraper/scraper-progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getUserCVs } from '@/features/cv-management/api/upload';
import { getKeywords, updateKeywords } from '@/features/keyword-generation/api/generate';
import { useScraperSSE } from '@/hooks/use-scraper-sse';
import { useAuthStore } from '@/stores/auth-store';
import type { CV } from '@/types/cv';
import type { KeywordRecord } from '@/types/keyword';

export default function KeywordsPage() {
  const { user, hydrate } = useAuthStore();
  const userId = user?.id ?? '';
  const [cvs, setCvs] = useState<CV[]>([]);
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestCv = cvs[0] ?? null;
  const currentKeywordRecord = keywords[0] ?? null;

  const { status, progress, startScraping } = useScraperSSE({
    onDone: () => {
      setError(null);
    },
    onError: (err) => {
      setError(err);
    },
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    Promise.all([getUserCVs(userId), getKeywords(userId)])
      .then(([cvData, keywordData]) => {
        setCvs(cvData);
        setKeywords(keywordData);
      })
      .catch((value: Error) => setError(value.message));
  }, [userId]);

  const selectedCvId = useMemo(() => currentKeywordRecord?.cv_id ?? latestCv?.id ?? '', [currentKeywordRecord, latestCv]);

  async function handleSave() {
    if (!currentKeywordRecord || !userId) {
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateKeywords(currentKeywordRecord.id, currentKeywordRecord.queries, userId);
      setKeywords([updated]);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Failed to save keywords.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleScrape() {
    if (!currentKeywordRecord || !userId || currentKeywordRecord.queries.length === 0) {
      return;
    }

    setError(null);
    startScraping(currentKeywordRecord.queries[0], 'glints');
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-blue-600">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Keyword generation</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Generate, edit, and save job-search queries before triggering the scraper.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <KeywordGenerateButton
          cvId={selectedCvId}
          userId={userId}
          onGenerated={async (result) => {
            const refreshed = await getKeywords(userId);

            if (refreshed.length > 0) {
              setKeywords(refreshed);
              return;
            }

            if (selectedCvId) {
              setKeywords([
                {
                  id: `local-${selectedCvId}`,
                  user_id: userId,
                  cv_id: selectedCvId,
                  queries: result.keywords,
                  generation_notes: result.reasoning,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ]);
            }
          }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-950">Editable queries</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentKeywordRecord ? (
              <KeywordEditor
                isSaving={isSaving}
                keywords={currentKeywordRecord.queries}
                onChange={(queries) => setKeywords([{ ...currentKeywordRecord, queries }])}
                onSave={handleSave}
              />
            ) : (
              <p className="text-sm text-slate-500">Analyze a CV to create your first keyword set.</p>
            )}
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleScrape}
              disabled={status === 'scraping' || !currentKeywordRecord}
            >
              {status === 'scraping' ? 'Starting scraper...' : 'Start scraping'}
            </button>
            <ScraperProgress
              status={status}
              progress={progress}
              onRetry={handleScrape}
            />
          </CardContent>
        </Card>
        <KeywordAnalysisNotes notes={currentKeywordRecord?.generation_notes ?? null} />
      </div>
    </div>
  );
}
