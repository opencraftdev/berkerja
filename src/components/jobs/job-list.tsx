'use client';

import { useState, useEffect } from 'react';
import { JobCard } from './job-card';
import { JobFilters } from './job-filters';
import { getJobs, updateJobStatus } from '@/features/job-dashboard/api/jobs';
import { Job, JobStatus } from '@/features/job-scraping/types/job';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Search } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 font-medium mb-2">Failed to load jobs</p>
          <p className="text-sm text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <JobFilters
        platform={platform}
        status={status}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
      />

      {jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-600 mb-1">No jobs found</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Try adjusting your filters or scrape more jobs with different keywords
            </p>
          </CardContent>
        </Card>
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
