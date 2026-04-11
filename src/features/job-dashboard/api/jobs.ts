import type { Job, JobStatus } from '@/types/job';

export async function getJobs(
  userId: string,
  filters?: { platform?: string; status?: string },
): Promise<Job[]> {
  const params = new URLSearchParams();

  if (filters?.platform && filters.platform !== 'all') {
    params.set('platform', filters.platform);
  }

  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  const response = await fetch(`/api/jobs?${params.toString()}`, {
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to fetch jobs');
  }

  return response.json();
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  userId: string,
): Promise<Job> {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).error ?? 'Failed to update job');
  }

  return response.json();
}
