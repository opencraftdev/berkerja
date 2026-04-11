import { JobList } from '@/components/jobs/job-list';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Dashboard</h1>
      <JobList />
    </div>
  );
}