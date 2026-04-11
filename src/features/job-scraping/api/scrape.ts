import type { JobPlatform } from '@/types/job';

export async function scrapeJobs(userId: string, keyword: string, platform: JobPlatform) {
  const response = await fetch('/api/jobs/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ userId, keyword, platform }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to scrape jobs');
  }

  return response.json();
}
