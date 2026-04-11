'use client';

import { useEffect, useState } from 'react';

import { JobCard } from '@/components/jobs/job-card';
import { JobFilters } from '@/components/jobs/job-filters';
import { getJobs, updateJobStatus } from '@/features/job-dashboard/api/jobs';
import { useAuthStore } from '@/stores/auth-store';
import type { Job, JobStatus } from '@/types/job';

export function JobList() {
  const { user, hydrate } = useAuthStore();
  const userId = user?.id ?? '';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    getJobs(userId, { platform, status })
      .then(setJobs)
      .catch((value: Error) => setError(value.message));
  }, [platform, status, userId]);

  async function handleStatusChange(jobId: string, nextStatus: JobStatus) {
    if (!userId) return;
    const updated = await updateJobStatus(jobId, nextStatus, userId);
    setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
  }

  if (!userId) {
    return <p className="text-sm text-slate-500">Set a user id in the header to load jobs.</p>;
  }

  return (
    <div className="space-y-4">
      <JobFilters
        platform={platform}
        status={status}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />
        ))}
      </div>
      {jobs.length === 0 && !error ? <p className="text-sm text-slate-500">No jobs found yet.</p> : null}
    </div>
  );
}
