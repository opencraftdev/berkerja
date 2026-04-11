import { JobList } from '@/components/jobs/job-list';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-blue-600">Phase 4</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Job dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Review jobs from every source, update statuses, and jump straight to applications.
        </p>
      </div>
      <JobList />
    </div>
  );
}
