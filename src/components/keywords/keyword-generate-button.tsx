'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeywordGenerateButtonProps {
  cvId: string;
  onGenerated: (result: { keywords: string[]; reasoning: string }) => void;
}

export function KeywordGenerateButton({ cvId, onGenerated }: KeywordGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      onGenerated(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading}>
      <Sparkles className="mr-2 h-4 w-4" />
      {isLoading ? 'Analyzing CV...' : 'Generate Keywords'}
    </Button>
  );
}
