'use client';

import { Select } from '@/components/ui/select';

interface JobFiltersProps {
  platform: string;
  status: string;
  onPlatformChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function JobFilters({ platform, status, onPlatformChange, onStatusChange }: JobFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <Select value={platform} onChange={(event) => onPlatformChange(event.target.value)}>
        <option value="all">All platforms</option>
        <option value="glints">Glints</option>
        <option value="linkedin">LinkedIn</option>
        <option value="jobstreet">JobStreet</option>
      </Select>
      <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="all">All statuses</option>
        <option value="new">New</option>
        <option value="clicked">Clicked</option>
        <option value="pending">Pending</option>
        <option value="applied">Applied</option>
      </Select>
    </div>
  );
}
