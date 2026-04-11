import type { KeywordRecord } from '@/types/keyword';

export async function getKeywords(userId: string): Promise<KeywordRecord[]> {
  const response = await fetch('/api/keywords', {
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to fetch keywords');
  }

  return response.json();
}

export async function updateKeywords(
  keywordId: string,
  queries: string[],
  userId: string,
): Promise<KeywordRecord> {
  const response = await fetch('/api/keywords', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ keywordId, queries }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to update keywords');
  }

  return response.json();
}
