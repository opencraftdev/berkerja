'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@/features/job-scraping/types/job';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: string) => void;
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const handleApply = () => {
    window.open(job.url, '_blank');
    onStatusChange(job.id, 'clicked');
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    clicked: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-orange-100 text-orange-800',
    applied: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.company}</p>
          </div>
          <Badge className={statusColors[job.status] || 'bg-gray-100'}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-2">{job.location}</p>
        {job.description_snippet && (
          <p className="text-sm mb-4 line-clamp-2">{job.description_snippet}</p>
        )}
        <div className="flex justify-between items-center">
          <Badge variant="outline">{job.platform}</Badge>
          <Button onClick={handleApply} size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}