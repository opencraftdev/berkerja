'use client';

import { useState, useEffect } from 'react';
import { KeywordEditor } from '@/components/keywords/keyword-editor';
import { KeywordGenerateButton } from '@/components/keywords/keyword-generate-button';
import { getKeywords, updateKeywords } from '@/features/keyword-generation/api/generate';
import { Keyword } from '@/features/keyword-generation/types/keyword';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual auth user ID from Supabase auth
    const userId = 'demo-user';
    getKeywords(userId)
      .then(setKeywords)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const currentKeywords = keywords[0];

  const handleSave = async () => {
    if (!currentKeywords) return;
    setIsSaving(true);
    try {
      await updateKeywords(currentKeywords.id, currentKeywords.queries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Keyword Generation</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generated Keywords</h2>
        {currentKeywords ? (
          <KeywordEditor
            keywords={currentKeywords.queries}
            onChange={(queries) =>
              setKeywords([{ ...currentKeywords, queries }])
            }
            onSave={handleSave}
            isSaving={isSaving}
          />
        ) : (
          <p className="text-gray-500">
            Upload a CV first to generate keywords
          </p>
        )}
      </div>

      <KeywordGenerateButton
        cvId={currentKeywords?.cv_id || ''}
        onGenerated={(result) => {
          // console.log('Generated:', result);
        }}
      />
    </div>
  );
}