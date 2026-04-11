'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { analyzeCV } from '@/features/cv-management/api/analyze';
import type { KeywordResult } from '@/lib/deepagents/cv-agent';

interface KeywordGenerateButtonProps {
  cvId: string;
  userId: string;
  onGenerated: (result: KeywordResult) => void;
}

export function KeywordGenerateButton({ cvId, userId, onGenerated }: KeywordGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);

    try {
      onGenerated(await analyzeCV(cvId, userId));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" onClick={handleGenerate} disabled={!cvId || !userId || isLoading}>
      <Sparkles className="mr-2 h-4 w-4" />
      {isLoading ? 'Analyzing CV...' : 'Generate keywords'}
    </Button>
  );
}
