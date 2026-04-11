import type { JobStatus } from '@/types/job';

import { Badge } from '@/components/ui/badge';

const statusClasses: Record<JobStatus, string> = {
  new: 'bg-blue-50 text-blue-700',
  clicked: 'bg-amber-50 text-amber-700',
  pending: 'bg-orange-50 text-orange-700',
  applied: 'bg-emerald-50 text-emerald-700',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
}
