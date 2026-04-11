'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface JobFiltersProps {
  platform: string;
  status: string;
  onPlatformChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function JobFilters({
  platform,
  status,
  onPlatformChange,
  onStatusChange,
}: JobFiltersProps) {
  return (
    <div className="flex gap-4">
      <Select value={platform} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="glints">Glints</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="jobstreet">JobStreet</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="clicked">Clicked</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="applied">Applied</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}