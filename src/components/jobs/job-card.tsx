'use client';

import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import type { Job, JobStatus } from '@/types/job';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: JobStatus) => Promise<void>;
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  async function handleApply() {
    await onStatusChange(job.id, 'clicked');
    window.open(job.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{job.title}</h3>
            <p className="text-sm text-slate-500">{job.company}</p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
        <div className="text-sm text-slate-500">{job.location || 'Location not listed'}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">{job.description_snippet || 'No description snippet available.'}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{job.platform}</span>
          <Button type="button" onClick={handleApply}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
