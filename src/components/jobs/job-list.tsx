'use client';

import { useState, useEffect } from 'react';
import { JobCard } from './job-card';
import { JobFilters } from './job-filters';
import { getJobs, updateJobStatus } from '@/features/job-dashboard/api/jobs';
import { Job, JobStatus } from '@/features/job-scraping/types/job';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState('demo-user');

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filters: { platform?: string; status?: string } = {};
        if (platform !== 'all') filters.platform = platform;
        if (status !== 'all') filters.status = status;
        const data = await getJobs(userId, filters);
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [platform, status, userId]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateJobStatus(jobId, newStatus as JobStatus, userId);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus as JobStatus } : j)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) return <p>Loading jobs...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <JobFilters
        platform={platform}
        status={status}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
      />

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}