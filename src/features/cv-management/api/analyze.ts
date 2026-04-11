import type { KeywordResult } from '@/lib/deepagents/cv-agent';

export async function analyzeCV(cvId: string, userId: string): Promise<KeywordResult> {
  const response = await fetch('/api/cv/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ cvId, userId }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Analysis failed');
  }

  return response.json();
}
